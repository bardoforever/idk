# THE CORNER SHOP — Design Doc v3

A cozy two-player co-op **shop-sorting game you walk around**.
Top-down/isometric, portrait, one thumb, Godot 4.6.

> **v3.1** fixes two mechanics v3 got wrong: it made auto-pickup the default
> and deleted the wrong-sort penalty. Both contradicted the brief — auto-pickup
> and streak forgiveness were listed there as *upgrades*, and "wrong sorts cost
> time and a small fee" was explicit. Restored.
>
> **v3 is a correction, not an iteration.** v1 and v2 described a
> tap-a-tile board game. That was a misread of the references. The real
> genre — Sort Them Ducks, Supermarket Chaos — is *spatial*: you are a person
> in a shop, you physically go and get things and physically put them away.
> The v1/v2 skill tree was already telling me this (carry capacity, move
> speed, auto-pickup are meaningless without a floor to walk on) and I built
> the wrong thing anyway. The Expo app is being replaced.

---

## 1. What the references actually do

| Game | What it is | What we take |
|---|---|---|
| **Sort Them Ducks** | First-person cozy shop. Walk, pick up an armful of ducks, find the shelf, put them away. 4,000+ ducks. No timer, no fail state. Upgrades: carry more, move faster, highlight matches, reveal the shelf, auto-collect nearby. | The entire core verb. The upgrade list. The no-fail cosiness. |
| **Supermarket Chaos** | Same shape, supermarket: 4,668 products, 16 departments. Read the shelf label, match the product. Shelves visibly fill as you work. | Department structure, and *visible* progress as the win condition. |
| **Bills Must Be Paid** | Active incremental. Stamina-limited runs; bills with deadlines; ignore one and a collector skims your earnings; paying unlocks perks; skill tree. | The whole pressure layer, exactly as v2 had it. |

The first two are the loop. The third is the meta. Neither of the first two
is a menu you tap — that was the error.

---

## 2. Core loop

**You are in the shop.** Camera is top-down at an angle, following you.
The shop is bigger than the screen; the camera scrolls with you.

1. **Run** — one thumb. Touch anywhere in the lower half, drag: a floating
   joystick appears under your thumb and you run that way. Nothing else is
   needed to play.
2. **Collect** — run through a pile on the floor and items magnetise into a
   stack you carry, visibly, up to your carry capacity. This is auto-pickup;
   the upgrade widens the magnet radius.
3. **Read** — your stack is listed in the HUD with names. *This* is where
   identification happens: "Acetate Disc — which aisle?"
4. **Deliver** — run into a shelf's drop zone. Every item in your arms that
   belongs there flies onto the shelf, one at a time, each one paying out.
   Items that don't belong stay in your arms.
5. The shelf **visibly fills**. Repeat until the shift meter runs out.

**A wrong shelf costs you.** A fee, a few seconds, and your streak — and the
item lands back on the floor at your feet, so you have made the shop messier
than it was. Nothing is destroyed; you just have to come back for it.

### Combo

A streak of **correct** sorts. Five in a row steps the multiplier up, to a 3.0×
ceiling. A wrong sort breaks it — which is exactly what makes *Streak
Forgiveness* worth buying: it absorbs a number of mistakes per shift without
breaking the run.

### Shift meter

A shift is a timed opening, not an action budget. ~3 minutes at the start,
~8 fully upgraded. Coffee and snacks lie around the shop: run over one and
it's consumed on the spot for extra seconds. No fail state — when the shop
closes you bank everything.

---

## 3. The shop

Portrait, so the floor plan runs vertically:

```
        ┌─────────────────────────┐
        │   BACK ROOM  (coffee)   │   <- unlocks later
        ├─────────────────────────┤
        │  ▓▓▓▓      ░░░░   ▓▓▓▓  │
        │  PIGMENTS  pile   PAPER │
        │                         │
        │  ▓▓▓▓      ░░░░   ▓▓▓▓  │   <- aisles, camera scrolls
        │  BRUSHES   pile   VINYL │
        │                         │
        │      ▓▓▓▓    ░░░░       │
        │       GEAR   pile       │
        ├─────────────────────────┤
        │  COUNTER / TILL  ▣      │   <- you start here, shift ends here
        └─────────────────────────┘
```

Five sections open, roped-off areas beyond them. **Unlocking a section
physically opens the shop**: the rope comes down, a new aisle is yours, new
stock starts appearing in the piles. Progression is something you walk into.

Items are simple shapes carrying an icon, readable from above; the name lives
in the HUD when it's in your arms and on a floating label when you're near it.
**Open question — the first thing to playtest.** Getting "which of these 200
things am I holding" legible at a glance on a phone is the hardest single
problem in this design.

---

## 4. Upgrades — now they mean something

| Branch | Node | What it does on the floor |
|---|---|---|
| **HANDS** | Carry Capacity | Taller visible stack. Fewer trips. |
| | **Auto-Pickup** | Items within a radius come to you untapped. Off until bought. |
| | Fast Hands | Items unload onto the shelf quicker. |
| **FEET** | Move Speed | You cover the shop faster. |
| | Sprint | Burst of speed; costs shift time. |
| | Nimble | You stop snagging on shelf corners. |
| **EYES** | Section Highlight | The right aisle glows for what you carry. |
| | Shelf Labels | Bigger, readable labels at distance. |
| | Luck | More premium stock in the piles. |
| **HEART** | Shift Length | Longer opening hours. |
| | Barista | Coffee gives more back. |
| | Second Wind | One free top-up per shift. |
| | **Streak Forgiveness** | Mistakes per shift that do not break your streak. |
| | Shared Nerve | Co-op: partner's delivery feeds your combo. |

FEET is new and only exists because there's a floor. Auto-Pickup and Streak
Forgiveness are here as **upgrades**, which is what the brief always said they
were — and the reason the base game must ship without either of them.

---

## 5. Bills, economy, co-op sync

**Unchanged from v2** — that layer was never the problem:

- Cozy tuning: collector skims 10% per overdue bill, capped at 25%; 10% late
  fee; **Closed for the Weekend** pauses every clock when neither of you has
  played in 36h.
- Bills scale with shop tier, never with the calendar.
- Paying a bill → pick 1 of 3 perks, 3 shifts each.
- One shared bank, one shared tree, one shared bill ledger, max two accounts,
  join by 6-character code.
- **Clients never write state, they submit events.** Append-only ledger,
  idempotent on a client-generated UUID, offline outbox, spends as
  compare-and-set. Nothing here changes.

**Co-op gets better, not harder.** You're both in the shop. You see her
character running the Vinyl aisle with an armful. That replaces every
abstraction v2 invented — no ghost hands, no "who's sorting what" indicator,
no claimed-item badges. You just look.

Two new sync classes on top of v2's model:

- **Positions** — ~20 Hz, ephemeral, never persisted, dropped frames are fine.
- **Pile authority** — whoever starts the shift hosts item spawns and pickup
  claims, so you can't both grab the same jar. Authority moves if they drop.

Money stays server-authoritative exactly as before.

**Roles survive and get physical.** The Eye sees colour and gets free aisle
highlighting; the Ear hears items and runs on tempo. Mixed-media items need a
handoff — one carries, one shelves.

---

## 6. Tech

**Godot 4.6, GDScript, exporting to Android and Web.**

Chosen over Three.js-in-Expo because this is now a real-time 3D game with a
character controller, spatial audio, physics-ish pickup and a scrolling
camera — that is a game engine's job, and fighting React Native for frame
time to save a language is a bad trade. Godot is free, its scene system suits
a shop built from repeated aisle prefabs, and it exports to both phones.

**The costs, stated plainly:**

- **No over-the-air updates.** Every build has to be installed.
- **Android** is easy: a signed APK, sideloaded.
- **iPhone is genuinely awkward.** A native iOS build needs a Mac with Xcode.
  Without one, the route is the **web export opened in Safari** — which works
  and needs no install, but must be hosted somewhere (GitHub Pages, itch.io);
  it will not fit the artifact host, whose binary cap is 15 MB against a
  37 MB WebAssembly build.
- Supabase has no Godot SDK; it's REST over `HTTPRequest` and Realtime over
  `WebSocketPeer`. Both are plain and well-trodden, just hand-written.

Verified working in this environment: Godot 4.6 headless, project import, and
`--export-release Web` producing a running build. So builds can be produced
here; only delivery to an iPhone needs a host.

---

## 7. What survives from the Expo build

- **The item catalog.** 200 items across five sections plus 12 break items,
  with the deliberate collisions (Vinyl Eraser, Acetate Sheet vs Acetate Disc,
  Record Brush, Gaff Tape). Real content, ported to Godot resources.
- **The bills, ledger and sync design**, whole.
- **The palette** — warm paper and ink still suits the shop.
- **The balance-simulator habit**: tune against a headless run, not a guess.

Deleted: the React Native app, the tap-tap input model, and the economy
constants, which were tuned for an action budget and must be retuned for a
clock.

---

## 8. Slices, re-cut

1. **Walk and sort.** One aisle, one shop, joystick, magnet pickup, carrying
   stack, shelf delivery, shift clock. No economy. The question it answers:
   does moving around this shop feel good on a phone?
2. **The shop.** Five sections, piles, the full catalog, combo, coffee,
   payouts, shelves filling.
3. **Economy + bills.** The v2 layer, retuned to a clock.
4. **Co-op.** Two characters, one shop, shared bank, roles.
5. **Skill tree, unlockable aisles, polish.**

Slice 1 is deliberately small and about *feel*. If running around the shop
isn't fun, nothing above it matters.
