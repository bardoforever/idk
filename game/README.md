# The Corner Shop — Godot project

Slice 1: **walk and sort**. One shop, one thumb, a three-minute clock.
No economy yet — this slice exists to answer whether moving around the shop
feels good on a phone, and how much shop a phone can actually hold.

## Running it

Open `game/project.godot` in Godot 4.6 and press play.

## Headless, without a phone or the editor

```bash
godot --headless --import .
godot --headless --autopilot --fixed-fps 60
```

`--autopilot` steers the player the way a competent human would — fill your
arms from the nearest pile, walk the load to the aisle that wants it — and
prints a shift report. It is a **perfect-router upper bound**, not a
prediction: it never has to read an item or remember where anything lives,
which is the actual skill of the game. Use it to check the loop still works
and to compare tuning changes against each other, never as a human benchmark.

## Building for phones

```bash
godot --headless --export-release "Web" ../build/web/index.html
```

Web is the delivery route for iPhone, since a native iOS build needs a Mac
with Xcode. The export must stay single-threaded (`thread_support=false`): a
threaded build demands `SharedArrayBuffer` and cross-origin isolation headers
that most hosts, including the artifact host, do not send.

To repackage that export as one self-contained page:

```bash
python3 ../tools/build_web_artifact.py ../build/web ../build/play
```

The engine is a single 37MB `.wasm` and the artifact host caps any one binary
file at 15MB, so the script splits it into pieces, publishes them as `.wasm`
files, and glues them back together with a `fetch` interceptor before the
loader sees it. The `.pck` rides inside the page as base64, since only
standard web media types are served.

It reads the engine config and the threads flag **out of Godot's own generated
`index.html`** rather than having them copied by hand. That is not fussiness:
hand-copying them once shipped a build that called
`Engine.getMissingFeatures(config)` instead of
`Engine.getMissingFeatures({threads: false})` — and since that argument
defaults to `threads: true`, the page demanded cross-origin isolation from a
build that never needed it, and refused to start on a phone.

## Layout

```
scripts/config.gd    all tuning in one place
scripts/catalog.gd   the 212-item stock, loaded from data/catalog.json
scripts/shop.gd      builds the floor, walls and aisles from a layout spec
scripts/shelf.gd     one aisle: drop zone, highlight ring, visible fill
scripts/pickup.gd    one item: on the floor, in your arms, onto the shelf
scripts/player.gd    top-down character controller
scripts/joystick.gd  floating thumb stick
scripts/hud.gd       clock, cash, combo, what you are carrying, fps probe
scripts/main.gd      wires it together and owns the shift
```

The shop is built in code from `Shop.LAYOUT` rather than hand-placed in the
editor, because a sprawling shop has to be generated to stay maintainable —
and the layout is the thing we will iterate on most.
