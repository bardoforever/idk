# CLAUDE.md

Notes to myself for building this project. Written at the start, before any code
exists. Update this file whenever a decision here turns out to be wrong.

## What we're building

A cozy grocery store management game, played in a mobile browser.

Two players — the user and their partner — co-own **one** store. Same money,
same stock, same upgrades, same everything. There is no "my save" and "their
save." Either player can open the game alone and make real progress; the store
keeps earning while both are away.

## Who I'm working with

The user is **not a programmer**. They direct and test; I write all the code.

This changes how I work:

- **Explain tradeoffs in plain language before architectural decisions.** Not
  "should we use optimistic concurrency or CRDTs" — instead, "if you both tap
  buy at the same moment, we can either make one of you lose the tap, or let
  both go through and risk spending money twice. Here's which I'd pick and why."
- Give a recommendation, not a menu. They can override it.
- **Keep the codebase small and readable rather than clever.** The user may read
  this code. Boring, obvious code that they could follow beats compact code that
  needs a paragraph of explanation. No clever one-liners, no metaprogramming, no
  abstraction invented before it's needed twice.
- Describe features by what the player sees, not by what the code does.
- When something is broken, tell them what to tap to reproduce it.

## Design principles (non-negotiable)

These came from the user directly. Treat them as constraints on every feature,
not aspirations.

1. **Automation is earned, never purchased.** Every hands-off improvement — a
   shelf that restocks itself, a clerk who serves customers — comes from doing
   the thing manually enough times, or from an in-game milestone. There is no
   path where money alone skips the work.
2. **No real-money purchases of any kind.** No IAP, no ads, no premium currency,
   no "watch a video to double earnings," no cosmetics-for-cash. Not now, not
   as a "someday." If a design idea only makes sense as a monetization hook,
   it's the wrong idea.
3. **Cozy pacing, no fail state.** You cannot go bankrupt, lose the store, ruin
   a run, or return to a punished store. Absence is never penalized — coming
   back after a week is a pleasant pile of earnings, never spoiled stock and
   debt. Pressure, timers-that-scold, and streak-loss mechanics are banned.
4. **Mobile-first, portrait, thumb-reachable.** Designed for a phone held in one
   hand. Primary controls live in the bottom third of the screen. Desktop is a
   bonus, never the design target.

A useful test for any new mechanic: *does this make you want to check on the
store, or make you afraid not to?* Only the first kind ships.

## Stack

- **Plain HTML / CSS / JavaScript.** No framework, no build step, no bundler, no
  TypeScript, no npm dependencies in the shipped game. ES modules loaded
  directly by the browser.
- **Supabase** for shared state and auth — **added later**. Phase 1 is
  local-only with `localStorage`. I must write the state layer so this swap is
  one module, not a rewrite (see Architecture).
- **Deployed as a web app**, opened from a browser and added to the home screen.
  Not native, no app stores, no wrapper.
- **Everything on free tiers.** Supabase free tier, free static hosting
  (GitHub Pages, Cloudflare Pages, or Netlify — pick when we deploy), CC0 or
  open-licensed art, open-licensed fonts. If a piece of the plan needs a paid
  service, that's a signal to change the plan, and I should raise it before
  building on top of it.

## The game

### Core loop

A blend the user asked for explicitly — ambient first, hands-on second, planning
third and lightest:

- **Mostly it runs itself.** Open the app and the store is alive: customers walk
  in, browse, pay, leave. The default experience is watching it hum and
  collecting what accrued.
- **Tending is optional and satisfying.** Restock a shelf, tidy a display, serve
  someone at the register. Doing it by hand is faster and slightly more
  profitable than letting it ride, but never required.
- **Light planning.** Occasionally spend the pile: a new shelf, a new product
  line, a hire. Kept deliberately small — a few decisions per session, not a
  spreadsheet.

As automation is earned, tending tasks become passive one by one, and the
session naturally shifts toward the ambient/planning end. That progression *is*
the arc of the game.

### Offline earnings

**Calculated from timestamps, never live simulation.** The store does not run in
the background; when a player opens the game we compute what happened while it
was closed.

Rules I'm committing to:

- One pure function: given the saved state and an elapsed duration, return the
  new state plus a human-readable summary of what happened. No DOM, no clock, no
  randomness read from outside — pass time and a seed in. This makes it testable
  and makes the away-summary trivial.
- **Step the simulation in fixed chunks** (e.g. one game-minute per step) rather
  than one giant multiply, so that things which change over time — a shelf
  running out of stock, a queue backing up — resolve correctly. Cap the number
  of steps so a two-week absence doesn't freeze the phone; collapse the
  remainder analytically.
- **Cap offline accrual** at some generous window (start around 8–12 hours of
  full earnings, then taper rather than stop). The cap exists so the game
  rewards checking in, *not* so it punishes not checking in — the taper must
  never read as a loss. Tune with the user.
- **Never rewind.** If the clock reads earlier than the last save (timezone
  change, manual clock change, device weirdness), advance nothing and move on
  quietly. Don't punish, don't accuse, don't show an error.
- Once Supabase is in, **trust the server's timestamp**, not the device's.

### Co-op

The user wants named players, a shared activity log, little notes/gifts, and a
sense of "my part of the store" — but the store must never block on the absent
player. Resolution:

- **Named players.** Each has a name and a small avatar. Actions are attributed.
- **Activity log.** A readable feed on the store screen: "Restocked the bakery,
  3 hours ago." This is the main way the two players feel each other's presence.
  It's the highest-value co-op feature per unit of effort — build it early.
- **Notes and gifts.** Leave a short message at the register; leave an item or
  some money for the other to find. Small, warm, asynchronous.
- **Soft roles only.** Each player has a specialty (say, bakery vs. produce)
  that grants a bonus when they do that work, and flavors the log. **Nothing is
  ever locked to one player.** Hard roles would contradict "either of us can
  play alone" — one player would eventually be stuck waiting. If the user asks
  for exclusive roles later, that's the tradeoff to re-explain.

### Scope and progression

The user wants depth, then breadth, then a gentle long tail — and explicitly
**no ending**. So, in order:

1. **One store, deepening.** Weeks of content in a single shop: more
   departments, better shelves, staff, decor. This is where nearly all the
   design effort goes.
2. **A chain, later.** Additional locations, each with their own stock and
   staff. Big jump in state complexity — don't build any of it until phase 1 is
   genuinely fun, but keep the data model from hard-coding "one store."
3. **Endless, gently.** Some soft continuation past the content — slow numbers,
   new decor, seasonal touches. Explicitly *not* a prestige treadmill; if the
   long tail starts to feel like a grind, it's failed the cozy test.

### Art direction

Target: **stylized, polished, and legibly game-like** — pixel art or hand-drawn
CSS/SVG illustration, whichever we can execute consistently for free.

Working plan (revisit once we see it on a phone):

- Prefer **CC0 / public-domain pixel art packs** (Kenney.nl is the reliable
  first stop) so the look is consistent and costs nothing. Verify the license
  before anything enters the repo, and record it in `ASSETS.md`.
- Where a pack doesn't cover something, **hand-author SVG** in a matching style
  rather than mixing in a second art style.
- Sprites rendered with `image-rendering: pixelated` and integer-ish scaling so
  pixel art stays crisp on high-DPI phones.
- **DOM + CSS transforms for rendering, not canvas.** Easier to debug, easier to
  make accessible, easier for the user to point at something and say "that."
  Move to canvas only if a real device actually drops frames.
- Free fonts only, self-hosted. One display face, one text face, no more.
- Animation carries the cozy: slow customer walks, gentle idles, soft shadows,
  nothing that flashes or demands attention.

## Architecture

Small, flat, obvious. Roughly:

```
index.html          one page, one screen at a time
css/                a few plain stylesheets, CSS custom properties for the palette
js/
  main.js           boot, the tick loop, screen switching
  state.js          the store object + save/load; the ONLY module that persists
  economy.js        pure simulation: (state, elapsed, seed) -> (state, summary)
  actions.js        what the player can do; every mutation goes through here
  render.js         state -> DOM
  data/             items, upgrades, staff — plain data, no logic
assets/             sprites, fonts (license recorded in ASSETS.md)
```

Rules that keep it swappable and debuggable:

- **All game state lives in one plain JavaScript object** — serializable, no
  classes, no functions inside it, no DOM references. It should survive
  `JSON.parse(JSON.stringify(state))` unchanged.
- **Every version of the save carries a `version` number** and there's a
  migration step on load. We will change the shape of this thing constantly and
  the user's store must not die when we do.
- **`state.js` is the only module that touches storage.** Phase 1 it writes
  `localStorage`; phase 2 it writes Supabase. Nothing else in the codebase knows
  which. This is the whole reason local-first is safe.
- **All mutations go through `actions.js`.** No render code changes state. When
  we add multiplayer, actions become the things we send to the server, so
  keeping them named and centralized now saves the rewrite later.
- **`economy.js` is pure.** Same inputs, same outputs, no `Date.now()` inside.
- Comment the *why*, not the *what*. Balance numbers get a comment saying what
  feeling they're aiming for.

## When Supabase goes in

Not yet — but decisions now shouldn't box us in:

- **One row per store**, holding the state object plus a version counter, with
  both players' user IDs on it. Not one row per player.
- **Shared money means concurrent writes are a real problem.** Two phones
  spending the same $50 in the same second must not both succeed. Plan: mutate
  through a Postgres function that applies an action atomically and rejects on a
  stale version counter, with the client retrying. Explain this to the user as
  "we make the server the referee so you two can't accidentally spend the same
  money twice."
- **Server time is the source of truth** for offline accrual.
- Auth: Supabase's simplest option that doesn't require the user to manage
  anything — likely magic link. Two accounts total; this doesn't need to scale.
- Keep the app fully playable offline against `localStorage`, syncing when it
  can. Cozy games shouldn't show a connection error on the subway.

## Deploying

Served free from GitHub Pages off the working branch; the repo is public so that
this costs nothing. Every push is live within a minute or so.

**Bump `VERSION` in `index.html` on every deploy.** The game checks that string
against the server on launch and reloads itself at `?v=<new>` when it has moved.
This exists because a page saved to a phone's home screen will happily serve a
cached copy of itself for days, with no reload button to fix it -- the user hit
exactly this. Forget the bump and they silently test an old build, which is
worse than no auto-update at all, because they will believe the version they
see in front of them.

## Working agreement

- Build in slices the user can actually tap on a phone, not layers. A visibly
  playable ugly thing beats a beautiful state machine with no screen.
- Test on a real phone in portrait early and often. Desktop browser resizing
  lies about thumb reach.
- Before adding a mechanic, check it against the four principles above.
- When I'm unsure between two approaches, ask in plain language, recommend one,
  and keep building the parts that don't depend on the answer.

## Open questions

- Working title for the game (placeholder until then: "the grocery game").
- Names/avatars for the two players.
- The offline cap and taper curve — needs to be felt, so tune it with the user
  once there's something to open.
- Where we deploy (GitHub Pages vs. Cloudflare Pages vs. Netlify). All free;
  decide when there's something to ship.
