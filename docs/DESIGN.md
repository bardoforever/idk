# THE CORNER SHOP — Design Doc v2

A cozy co-op sorting game for exactly two people. Portrait, touch-first,
2–10 minute sessions, works offline, server-authoritative money.

Status: design approved in part (v2 folds in answers to the five questions).
Open: final theme pick.

---

## 1. Decisions locked

| Question | Answer | Consequence |
|---|---|---|
| Pressure | **Cozy** | Collector caps at 25%, clock pauses when you're both away, shifts can't be failed |
| Fiction | **Art supplies + records** | Sections split her half / your half; Eye and Ear become literal |
| Play pattern | **Same time, most days** | Heavy investment in the live shared board |
| Roles | **Distinct** | The Eye / The Ear asymmetry |
| Length | **Endless** | Infinite mastery tail + optional cozy prestige |

---

## 2. Tech stack

**Expo React Native (TypeScript) + Supabase, single repo.**

Expo puts the game on both phones via a dev build, with EAS Update pushing
changes over the air — no app store, no review, which matters when the install
base is two. The board is taps and short animations, not physics, so Reanimated
+ Gesture Handler suffices and we keep one codebase instead of a Unity project
with two native shells. Supabase over Firebase/Convex specifically because money
must be server-authoritative: Postgres gives real multi-row transactions, so
"pay bill, apply late fee, pick perk, debit balance" is one atomic function that
cannot half-apply or drift between two saves, and an append-only ledger with a
unique idempotency key makes offline replay safe by construction. Firebase's
offline queue is better out of the box but its rules language can't express
transactional economy math; Convex is lovely but its offline story is thinner.
Supabase Realtime covers both needs — Postgres change streams for "partner
bought an upgrade", broadcast + presence channels for the live board. Locally,
expo-sqlite holds the catalog, a store snapshot, and a **mutation outbox**.
Caveat: free-tier Supabase pauses after ~a week idle; a cron ping or the $25
tier fixes it.

Audio (needed for The Ear): `expo-av`, short `.m4a` one-shots bundled in the
content pack, preloaded per shift.

---

## 3. Core loop

Open → **Start Shift** → items drop into the tray → tap an item to pick it up →
tap the right section to shelve it → cash + combo tick up → stamina drains →
shift ends at 0 stamina → payout, contribution logged, note to partner.

- **Layout.** Top 60%: 5 section shelves in a 2-3 grid, large targets. Bottom
  40%: the messy tray, your hands, and the HUD (stamina / combo / cash).
  Everything you tap *first* lives in the bottom third; shelves are a thumb
  stretch. One-handed throughout.
- **Input.** Tap-to-pick, tap-to-place. Drag is supported, never required. With
  Carry Capacity > 1 you hold a stack and one tap dumps all matching items.
- **Items.** Name + icon + exactly one correct section. ~40 per section, ~200 at
  v1. Ambiguity is deliberate at higher tiers — that's the skill.
- **Stamina.** Base pool **120**; each placement costs **2**, a mistake costs
  **4** extra → ~55 placements, ~3 min at start. Fully upgraded: 220 pool,
  ~8–10 min.
- **Break items** (~1 in 12) restore **+12 / +20 / +8** stamina, but only when
  shelved correctly into Break Room. Stamina is downstream of skill, not luck.
- **Shifts cannot be failed.** Stamina zero ends the shift; you always bank what
  you earned.

---

## 4. Economy

| Thing | Value |
|---|---|
| Correct sort | **$3** (rare/premium items **$12**) |
| Wrong sort | **−4 stamina**, combo drops one step. No cash fee. |
| Combo | +0.25× per 5 correct, cap **3.0×** at streak 40 |
| Section shelf goal | 10 into one section in a shift → **$40** |
| Expected shift (start) | **$333 measured** at 90% accuracy, 3.3 min |
| Expected shift (endgame) | ~$1,800, ~8 min |

**Target: bills consume 35–45% of expected income at every stage.** Two people
at 2 shifts/day each ≈ $7k/week early; weekly bill load ≈ $2.7k. The surplus is
the upgrade budget.

Cozy note: the wrong-sort cash fee from v1 is gone. A mistake costs you time and
one step of combo — never money. Losing money for misremembering where the
cadmium yellow goes is the opposite of cozy.

**Measured, not estimated.** `npm run sim` plays the real engine headlessly.
The v2 draft guessed ~45 correct placements per shift; break items actually
stretch a shift to ~68, which put payouts at $503. Base values were cut from
$3/$12 to $2/$8 and the section bonus from $40 to $25 to land inside the band
and keep the bill schedule meaningful. Skill curve as built:

| Accuracy | Cash/shift | Length |
|---|---|---|
| 65% | $64 | 1.9 min |
| 80% | $165 | 2.6 min |
| 90% | $343 | 3.3 min |
| 98% | $617 | 4.4 min |

**Watch in playtest:** a mistake currently costs stamina *and* a combo step
*and* delays the section bonus. That is three compounding penalties, which is
the one place the build may read harsher than "cozy". Streak Forgiveness
(slice 4) is the intended release valve; if it still bites, cut `mistakeCost`
first.

---

## 5. Bills

Issued per store, not per player.

| Bill | Cycle | Base | Miss effect |
|---|---|---|---|
| Restock | 48h | $220 | premium spawn rate halves |
| Power | 72h | $300 | highlighting + auto-pickup off |
| Rent | 7d | $1,200 | — |
| Internet | 7d (tier 2) | $180 | live co-op disabled |

**Bills scale off store tier, not the calendar:**
`amount = base × (1 + 0.15 × tier)`, tier rising with sections unlocked and
upgrades bought. Going away for two weeks must never come back as a wall of
compound rent.

**The Collector (cozy tuning).** Each overdue bill skims **10%** of earnings,
stacking, **capped at 25%**. Paying clears that bill's skim plus a **10%** late
fee. Skim applies server-side at payout.

**Closed for the Weekend.** If neither of you has played in **36h**, all bill
clocks pause and a hand-lettered CLOSED sign goes up in the window. No penalty,
no catch-up burst on return — the shop just waits for you.

**Paying a bill → pick 1 of 3 perks**, each lasting 3 shifts: +20% cash ·
+30 stamina · free section highlight · combo gains doubled · mistakes free ·
double break-item value · next bill −30%.

---

## 6. Roles — The Eye and The Ear

Chosen at pairing, swappable once a week. Both players can sort anything; the
role changes *what comes easily* and what you bring to a shared shift.

### THE EYE
Identifies by sight. Native: **Section Highlight is free and permanent** — the
correct shelf pulses faintly on pickup.
- **Colour Sense** — items carry a hue; sorting a run of the same family chains
  a side-combo worth +$2 each.
- **Big Hands** — Carry Capacity starts at 2, caps at 6 (Ear caps at 4).
- **Curation** — mastery and cosmetic progress accrue 25% faster; the Eye picks
  the shop's cosmetic direction as sections are mastered.

### THE EAR
Identifies by sound. Native: **audio items** — some items play a 1.5s one-shot
instead of showing a name, and are sorted by what you hear.
- **Tempo** — combo builds every 4 correct instead of 5, and decays a step
  slower.
- **Soundcheck** — each shift runs at a BPM; placements landing on the beat pay
  **+50%**. Optional, visible as a pulsing ring, ignorable if you're not feeling
  it.
- **The Mix** — can spend a charge to hand the Eye a 10-second 2× multiplier.

### Together
- **Call & Response** — the Ear taps an item to *tag* it; if the Eye shelves a
  tagged item correctly, both get **+0.5×** for 5s.
- **Mixed media** items (a paint-splattered record sleeve, a sampler pad) can
  only be resolved by one of each: one identifies, the other shelves.
- Solo play is never blocked — a solo Eye gets audio items rendered with their
  name visible, a solo Ear gets colour runs auto-detected. You lose the bonus,
  not the ability.

---

## 7. Skill tree (shared)

Ranks cost **$150 → $400 → $1k → $2.5k → $6k**, then continue infinitely at
×1.9 per rank with +2% effect each — the incremental tail.

- **HANDS** — Carry Capacity · Auto-Pickup · Place Speed · Bulk Dump
- **EYES** — Section Highlight · Label Zoom · Luck · Recall (shows where you
  last shelved this item)
- **HEART** — Stamina Pool · Streak Forgiveness · Second Wind · Barista ·
  Shared Nerve (co-op: partner's correct sort refunds you 1 stamina)

One shared bank, one shared tree. There are no personal upgrades.

---

## 8. Progression (endless)

5 starting sections — **Pigments · Brushes & Blades · Paper & Canvas · Vinyl &
Tape · Cables & Gear** — plus an always-present **Back Room** for break items,
filling the 2×3 shelf grid. Shelving **250** correct items into a section **masters**
it, which unlocks the next and visibly upgrades that corner of the shop —
crates become shelves become lit displays.

- **Mastery is infinite.** Each section levels 1 → ∞ on a slow curve, each level
  a small permanent bonus. There is always a number moving.
- **Seasons.** Roughly every two weeks, a themed stock drop adds items and a
  limited section. Content, never a reset.
- **Renovation** (optional cozy prestige). At tier 5+ you may choose to
  renovate: keep every cosmetic, mastery level, and section unlock; reset cash
  and upgrade ranks; gain a permanent multiplier and one new section. Never
  forced, never loses anything you can see.

---

## 9. Co-op sync model

One **store**, two members, hard max. Pairing by 6-character join code, burned
on use. One bank, one tree, one bill ledger, one history.

**The rule that makes it safe: clients never write state, they submit events.**
No client says "balance is now $4,320." It says "event `uuid-7`: shift payout,
+$312." The server appends to a ledger and recomputes.

- **Offline.** Every action lands in a local SQLite outbox with a
  client-generated UUID. On reconnect the batch POSTs; the server dedupes on
  that UUID (unique index), so replaying is a no-op. Earnings are additive
  deltas — two people playing offline simultaneously simply both get paid.
- **Spends** are the only conflict surface. Transactional compare-and-set
  against live balance. Offline you may spend up to *(last-synced balance − 20%
  reserve)*. If your partner beat you to it, the server rejects and the client
  rolls back with "she bought Carry Capacity III while you were offline — here's
  your $400 back." Never a silent overwrite.
- **Live board.** Both online → one shared board over a Realtime channel. Items
  carry a **soft claim** (`claimed_by`, 3s TTL) so you never both grab the same
  jar; a claimed item shows your partner's colour and a ghost hand. Combo is a
  **shared pool**; sorting correctly within 2s of each other triggers
  **In Sync: +0.5× for 5s**.
- **Async.** A contribution log records each shift (who, items, cash, best
  combo). Each of you has one 140-character **note** pinned to the shop,
  editable only by its author — last-write-wins per author, so notes cannot
  conflict either.

---

## 10. Data schema

Static content pack: `sections(key, name, tier, unlock_req)` ·
`items(key, name, icon, audio, hue, section_key, base_value, rarity,
stamina_restore, mixed_media)`.

Live tables:

- `users(id, display_name, avatar)`
- `stores(id, name, join_code, tier, balance_cents, cosmetics jsonb)`
- `store_members(store_id, user_id, role['eye'|'ear'], joined_at)` — trigger
  enforces **max 2**
- `ledger(id, store_id, user_id, kind, amount_cents, ref_id,
  client_event_id UNIQUE, server_seq, created_at)` — **append-only, the single
  source of truth for money**; `stores.balance_cents` is a trigger-maintained
  cache
- `shifts(id, store_id, mode, started_at, ended_at, items_sorted, wrong,
  best_combo, gross_cents, net_cents, client_event_id UNIQUE)`
- `shift_participants(shift_id, user_id, correct, wrong, best_combo, cash_cents)`
- `bills(id, store_id, type, amount_cents, issued_at, due_at, status, cycle_n,
  paid_by, paid_at, late_fee_cents)`
- `perks(id, store_id, bill_id, key, chosen_by, shifts_remaining)`
- `upgrades(store_id, key, rank, purchased_by, purchased_at)` — PK
  `(store_id, key)`
- `section_progress(store_id, section_key, correct_total, mastery, unlocked_at)`
- `notes(store_id, author_id, body, updated_at)` — PK `(store_id, author_id)`
- `boards(id, store_id, seed, state jsonb, active)` — claims are broadcast-only,
  never persisted

Client SQLite: catalog cache, store snapshot,
`outbox(client_event_id, kind, payload, attempts, status)`.

Server RPCs — all `SECURITY DEFINER`, all idempotent on `client_event_id`, all
balance-checked in-transaction: `submit_shift` · `pay_bill` · `choose_perk` ·
`buy_upgrade` · `redeem_join_code` · `roll_bills` (cron). RLS: you can only
touch rows for a store you belong to.

---

## 11. Build order

1. **Playable solo sorting loop** — board, tray, stamina, combo, payout. Local
   only, no backend. ✅ **built** — see the repo README to run it.
2. **Economy + bills** — ledger, bill cycle, perk picks, Collector.
3. **Sync / co-op** — Supabase, outbox, join code, live board, roles.
4. **Skill tree** — upgrades, mastery, section unlocks.
5. **Polish** — cosmetics, audio, animation, Seasons.
