/**
 * Headless balance check. Plays a batch of shifts at a given accuracy and
 * reports what a real session would earn, so tuning changes can be checked
 * without picking up a phone.
 *
 *   npm run sim -- --accuracy 0.9 --shifts 300
 */
import { GAME } from '../src/game/config';
import { multiplierOf, reduce, startShift, summarize, type ShiftState } from '../src/game/shift';
import { itemByKey, SCORING_SECTIONS, type SectionKey } from '../src/content';

const arg = (name: string, fallback: number): number => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(process.argv[i + 1]);
};

const accuracy = arg('accuracy', 0.9);
const shifts = arg('shifts', 200);
const capacity = arg('capacity', GAME.baseCapacity);
const stamina = arg('stamina', GAME.baseStamina);
/** Seconds a player spends on one pick-and-place, for the duration estimate. */
const secondsPerPlacement = arg('pace', 2.6);

function playShift(seed: number): ReturnType<typeof summarize> {
  let state: ShiftState = startShift({ seed, capacity, maxStamina: stamina });
  let guard = 0;

  while (state.status === 'running' && guard++ < 5000) {
    const instance = state.tray[0];
    state = reduce(state, { type: 'pick', instanceId: instance.id });

    const correct = itemByKey(instance.itemKey).section;
    const missIndex = Math.floor(Math.random() * SCORING_SECTIONS.length);
    const wrong: SectionKey =
      SCORING_SECTIONS[missIndex] === correct
        ? SCORING_SECTIONS[(missIndex + 1) % SCORING_SECTIONS.length]
        : SCORING_SECTIONS[missIndex];

    state = reduce(state, { type: 'place', section: Math.random() < accuracy ? correct : wrong });
  }
  return summarize(state);
}

const runs = Array.from({ length: shifts }, (_, i) => playShift(i * 7919 + 13));
const mean = (pick: (r: (typeof runs)[number]) => number) =>
  runs.reduce((sum, r) => sum + pick(r), 0) / runs.length;

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const avgPlacements = mean((r) => r.placements);

console.log(`\n  THE CORNER SHOP - balance check`);
console.log(`  ${shifts} shifts @ ${(accuracy * 100).toFixed(0)}% accuracy, `
  + `capacity ${capacity}, ${stamina} stamina\n`);
console.log(`  cash per shift      ${money(mean((r) => r.cashCents))}`);
console.log(`  placements          ${avgPlacements.toFixed(1)}`);
console.log(`  correct / wrong     ${mean((r) => r.correct).toFixed(1)} / ${mean((r) => r.wrong).toFixed(1)}`);
console.log(`  best multiplier     ${mean((r) => r.bestMultiplier).toFixed(2)}x`);
console.log(`  section bonuses     ${mean((r) => r.bonuses.length).toFixed(2)}`);
console.log(`  stamina restored    ${mean((r) => r.staminaRestored).toFixed(1)}`);
console.log(`  est. shift length   ${((avgPlacements * secondsPerPlacement) / 60).toFixed(1)} min`);

const perShift = mean((r) => r.cashCents);
console.log(`\n  two players, 2 shifts/day each  ->  ${money(perShift * 4)} / day`);
console.log(`  design target for slice 1        ->  $250.00 - $350.00 / shift\n`);
