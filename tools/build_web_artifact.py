#!/usr/bin/env python3
"""Repackage a Godot web export as a single self-contained artifact page.

The artifact host serves only standard web media types and caps any one
binary file at 15MB, while Godot's engine is a single 37MB .wasm and its
data pack is a .pck. So:

  * the .wasm is split into <15MB pieces, published as .wasm files, and
    glued back together by a fetch interceptor before the loader sees it;
  * the .pck rides inside the page as base64 and is served from memory.

Everything Godot decides at export time - the engine config and whether the
build wants threads - is read out of Godot's own generated index.html rather
than copied by hand, because hand-copying it is how the build once shipped
demanding SharedArrayBuffer from a build that did not need it.

    python3 tools/build_web_artifact.py build/web out/play
"""

import base64
import json
import os
import re
import shutil
import sys

CHUNK_BYTES = 9 * 1024 * 1024
COPY = ["index.js", "index.audio.worklet.js", "index.audio.position.worklet.js"]


def extract(pattern, text, what):
    match = re.search(pattern, text)
    if not match:
        sys.exit("could not find %s in the Godot export - did the template change?" % what)
    return match.group(1)


def main(export_dir, out_dir):
    index = open(os.path.join(export_dir, "index.html")).read()

    config = json.loads(extract(r"const GODOT_CONFIG = (\{.*?\});", index, "GODOT_CONFIG"))
    threads = extract(r"const GODOT_THREADS_ENABLED = (true|false);", index, "GODOT_THREADS_ENABLED")
    if threads == "true":
        sys.exit(
            "This export has thread support enabled, which needs cross-origin\n"
            "isolation headers the artifact host does not send. Re-export with\n"
            "variant/thread_support=false."
        )

    os.makedirs(out_dir, exist_ok=True)
    for name in COPY:
        shutil.copy(os.path.join(export_dir, name), out_dir)

    wasm = open(os.path.join(export_dir, "index.wasm"), "rb").read()
    chunks = [wasm[i:i + CHUNK_BYTES] for i in range(0, len(wasm), CHUNK_BYTES)]
    for i, chunk in enumerate(chunks):
        if len(chunk) >= 15 * 1024 * 1024:
            sys.exit("chunk %d is %d bytes, over the 15MB per-file cap" % (i, len(chunk)))
        open(os.path.join(out_dir, "wasm.%d.wasm" % i), "wb").write(chunk)

    pack_b64 = base64.b64encode(open(os.path.join(export_dir, "index.pck"), "rb").read()).decode()

    page = TEMPLATE.replace("__CHUNKS__", json.dumps(["wasm.%d.wasm" % i for i in range(len(chunks))]))
    page = page.replace("__WASM_BYTES__", str(len(wasm)))
    page = page.replace("__CONFIG__", json.dumps(config))
    page = page.replace("__PACK_B64__", pack_b64)
    open(os.path.join(out_dir, "corner-shop.html"), "w").write(page)

    print("engine  %d bytes -> %d chunks" % (len(wasm), len(chunks)))
    print("pack    %d base64 chars inlined" % len(pack_b64))
    print("threads %s" % threads)
    print("wrote   %s/corner-shop.html" % out_dir)


TEMPLATE = r"""<title>The Corner Shop</title>
<style>
  :root { color-scheme: light; }
  html, body { height: 100%; margin: 0; background: #F6F1E7; }
  body { overflow: hidden; touch-action: none; overscroll-behavior: none; }

  #canvas {
    display: block; position: fixed; inset: 0;
    width: 100%; height: 100%;
    border: 0; outline: none; background: #F6F1E7;
  }

  #boot {
    position: fixed; inset: 0; z-index: 10;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 18px; padding: 24px;
    background: #F6F1E7; color: #2B2620;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    text-align: center;
  }
  #boot.gone { display: none; }
  #boot h1 {
    margin: 0; font-size: 15px; font-weight: 800;
    letter-spacing: 0.16em; text-transform: uppercase; color: #9A9083;
  }
  #bar {
    width: min(260px, 70vw); height: 10px;
    border-radius: 6px; background: #EDE5D6; overflow: hidden;
  }
  #bar span {
    display: block; height: 100%; width: 0%;
    border-radius: 6px; background: #C4553B;
    transition: width 0.2s ease-out;
  }
  #boot p { margin: 0; font-size: 13px; color: #6B6055; max-width: 32ch; line-height: 1.5; }
  #boot .err { color: #B4544A; font-weight: 700; }
</style>

<script id="pack" type="text/plain">__PACK_B64__</script>

<canvas id="canvas">Your browser does not support the canvas tag.</canvas>

<div id="boot">
  <h1>Opening up</h1>
  <div id="bar"><span id="bar-fill"></span></div>
  <p id="boot-note">First load pulls about 37&nbsp;MB, so give it a moment on mobile data.</p>
</div>

<script>
  (function () {
    var CHUNKS = __CHUNKS__;
    var TOTAL = __WASM_BYTES__;
    var fill = document.getElementById('bar-fill');
    var nativeFetch = window.fetch.bind(window);
    var packBytes = null;

    function decodePack() {
      if (packBytes) return packBytes;
      var raw = atob(document.getElementById('pack').textContent.trim());
      packBytes = new Uint8Array(raw.length);
      for (var i = 0; i < raw.length; i++) packBytes[i] = raw.charCodeAt(i);
      return packBytes;
    }

    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';

      if (/index\.pck(\?|$)/.test(url)) {
        return Promise.resolve(new Response(decodePack(), {
          status: 200, headers: { 'Content-Type': 'application/octet-stream' },
        }));
      }
      if (!/index\.wasm(\?|$)/.test(url)) return nativeFetch(input, init);

      return (async function () {
        var bytes = new Uint8Array(TOTAL);
        var offset = 0;
        for (var i = 0; i < CHUNKS.length; i++) {
          var res = await nativeFetch(CHUNKS[i]);
          if (!res.ok) throw new Error('Could not load part ' + (i + 1) + ' (' + res.status + ')');
          var part = new Uint8Array(await res.arrayBuffer());
          bytes.set(part, offset);
          offset += part.length;
          fill.style.width = Math.round((offset / TOTAL) * 92) + '%';
        }
        return new Response(bytes.subarray(0, offset), {
          status: 200, headers: { 'Content-Type': 'application/wasm' },
        });
      })();
    };

    // Safari has been picky about instantiateStreaming on a synthesised
    // Response. Fall back to the plain buffer path rather than failing.
    if (WebAssembly.instantiateStreaming) {
      var streaming = WebAssembly.instantiateStreaming;
      WebAssembly.instantiateStreaming = async function (source, imports) {
        try {
          return await streaming(source, imports);
        } catch (e) {
          var res = await source;
          return WebAssembly.instantiate(await res.arrayBuffer(), imports);
        }
      };
    }
  }());
</script>

<script src="index.js"></script>

<script>
  (function () {
    var boot = document.getElementById('boot');
    var note = document.getElementById('boot-note');
    var fill = document.getElementById('bar-fill');

    function fail(message) {
      note.className = 'err';
      note.textContent = String(message);
    }

    if (typeof Engine === 'undefined') {
      fail('The game engine did not load. Try reloading the page.');
      return;
    }

    // This build has no thread support, so it must NOT be checked for
    // SharedArrayBuffer. getMissingFeatures defaults threads to true, and
    // takes its own argument - not the engine config.
    var missing = Engine.getMissingFeatures({ threads: false });
    if (missing.length > 0) {
      fail('This browser is missing: ' + missing.join(' / '));
      return;
    }

    new Engine(__CONFIG__).startGame({
      'onProgress': function (current, total) {
        if (current > 0 && total > 0) {
          fill.style.width = (92 + (current / total) * 8) + '%';
        }
      },
    }).then(function () {
      fill.style.width = '100%';
      boot.className = 'gone';
      document.getElementById('canvas').focus();
    }, function (err) {
      fail(err && err.message ? err.message : err);
    });
  }());
</script>
"""


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
