# The Corner Shop

A cozy two-player co-op sorting game. Paint, paper, and records.

Built in vertical slices. **Slice 1 (solo sorting loop) is playable now.**

| Slice | What it adds | Status |
|---|---|---|
| 1 | Playable solo sorting loop | ✅ done |
| 2 | Economy + bills + perks | next |
| 3 | Sync / co-op (shared shop, live board, roles) | — |
| 4 | Skill tree + section unlocks | — |
| 5 | Polish, cosmetics, audio, Seasons | — |

Design doc: [`docs/DESIGN.md`](docs/DESIGN.md).

## Running it on your phone

You both need the **Expo Go** app (App Store / Play Store).

```bash
npm install
npm start
```

Metro prints a QR code. Scan it with the Camera app on iOS or from inside Expo
Go on Android, and the game opens on your phone. Both phones can scan the same
QR code at once — you just need to be on the same Wi-Fi as the computer running
`npm start`.

Not on the same network? Run `npx expo start --tunnel` instead.

## Playing it without a computer

The app also builds to a single static web bundle, which runs in a phone
browser with no Metro server and no Expo Go:

```bash
npm run build:web     # -> dist/
```

`dist/index.html` plus the one JS file in `dist/_expo/` is the whole thing;
host it anywhere static. Haptics are a no-op on web and the till total lives in
that browser's local storage, but the game itself is identical.

## Checking it without a phone

```bash
npm test         # 14 engine tests - rules, combo, stamina, payouts
npm run sim      # plays 200 shifts headlessly and reports the balance
npm run typecheck
```

`npm run sim` is the balance tool. It accepts flags:

```bash
npm run sim -- --accuracy 0.95 --shifts 500 --capacity 3 --stamina 200
```

## Layout

```
src/content/    the shop's catalog - 200 items, 5 sections, 12 break items
src/game/       pure TypeScript rules engine (no React Native imports)
src/ui/         screens and components
src/storage.ts  local shop total (slice 3 replaces this with the server ledger)
tools/simulate.ts   headless balance check
tests/          engine tests, run under node --test
```

The rules engine is deliberately free of React Native imports and fully
deterministic from a seed. That is what lets it run headlessly here, and what
will let the server replay a client's shift in slice 3 to verify the payout.
