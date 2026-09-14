import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { GAME, comboMultiplier } from '../src/game/config';
import { multiplierOf, reduce, startShift, summarize } from '../src/game/shift';
import { itemByKey } from '../src/content';

const seeded = () => startShift({ seed: 12345 });

/** Picks the first tray item belonging to `section`, placing it correctly. */
function sortOneCorrectly(state = seeded()) {
  const instance = state.tray[0];
  const item = itemByKey(instance.itemKey);
  const picked = reduce(state, { type: 'pick', instanceId: instance.id });
  return reduce(picked, { type: 'place', section: item.section });
}

test('a fresh shift is full of stamina and a full tray', () => {
  const state = seeded();
  assert.equal(state.status, 'running');
  assert.equal(state.stamina, GAME.baseStamina);
  assert.equal(state.tray.length, GAME.traySize);
  assert.equal(state.hands.length, 0);
  assert.equal(multiplierOf(state), 1);
});

test('the same seed always produces the same tray', () => {
  assert.deepEqual(
    startShift({ seed: 999 }).tray.map((i) => i.itemKey),
    startShift({ seed: 999 }).tray.map((i) => i.itemKey),
  );
});

test('a correct placement pays out, costs stamina, and refills the tray', () => {
  const before = seeded();
  const after = sortOneCorrectly(before);

  assert.equal(after.correct, 1);
  assert.equal(after.wrong, 0);
  assert.equal(after.tray.length, GAME.traySize);
  assert.equal(after.hands.length, 0);
  assert.ok(after.cashCents > 0);

  const item = itemByKey(before.tray[0].itemKey);
  const expectedStamina = Math.min(
    before.maxStamina,
    before.stamina - GAME.placementCost + item.stamina,
  );
  assert.equal(after.stamina, expectedStamina);
});

test('a wrong placement costs extra time but never money', () => {
  const state = seeded();
  const instance = state.tray[0];
  const item = itemByKey(instance.itemKey);
  const wrongSection = item.section === 'pigments' ? 'gear' : 'pigments';

  const after = reduce(reduce(state, { type: 'pick', instanceId: instance.id }), {
    type: 'place',
    section: wrongSection,
  });

  assert.equal(after.wrong, 1);
  assert.equal(after.cashCents, 0, 'mistakes must not cost cash');
  assert.equal(after.stamina, GAME.baseStamina - GAME.placementCost - GAME.mistakeCost);
  assert.equal(after.hands.length, 0, 'the item leaves your hands');
});

test('five correct in a row steps the combo up; a mistake steps it back down', () => {
  let state = seeded();
  for (let i = 0; i < GAME.comboStep; i++) state = sortOneCorrectly(state);

  assert.equal(state.streak, GAME.comboStep);
  assert.equal(multiplierOf(state), comboMultiplier(1));

  const instance = state.tray[0];
  const wrong = itemByKey(instance.itemKey).section === 'vinyl' ? 'paper' : 'vinyl';
  state = reduce(reduce(state, { type: 'pick', instanceId: instance.id }), {
    type: 'place',
    section: wrong,
  });

  assert.equal(state.streak, 0);
  assert.equal(multiplierOf(state), 1, 'one step down, not a full reset');
});

test('the combo is capped at 3.0x', () => {
  let state = startShift({ seed: 7, maxStamina: 100000 });
  for (let i = 0; i < 300; i++) state = sortOneCorrectly(state);
  assert.equal(multiplierOf(state), 3);
});

test('filling a section pays its bonus exactly once', () => {
  let state = startShift({ seed: 4242, maxStamina: 100000 });
  const paid = () => state.bonusesEarned.length;

  while (paid() === 0) state = sortOneCorrectly(state);
  const section = state.bonusesEarned[0];
  assert.ok(state.sectionCounts[section] >= GAME.sectionGoal);

  const cashAtBonus = state.cashCents;
  for (let i = 0; i < 20; i++) state = sortOneCorrectly(state);
  assert.equal(
    state.bonusesEarned.filter((s) => s === section).length,
    1,
    'a section bonus never pays twice',
  );
  assert.ok(state.cashCents > cashAtBonus);
});

test('break items shelved in the back room restore stamina', () => {
  let state = startShift({ seed: 31337, maxStamina: 100000 });
  // Break items are a 1-in-12 draw, so sort until one surfaces in the tray.
  let drink = state.tray.find((i) => itemByKey(i.itemKey).stamina > 0);
  let guard = 0;
  while (!drink && guard++ < 500) {
    state = sortOneCorrectly(state);
    drink = state.tray.find((i) => itemByKey(i.itemKey).stamina > 0);
  }
  assert.ok(drink, 'expected a break item to turn up in the tray');
  const breakItem = drink;

  // Spend enough stamina that a restore is actually observable.
  state = { ...state, stamina: 50 };

  const before = state.stamina;
  const item = itemByKey(breakItem.itemKey);
  state = reduce(reduce(state, { type: 'pick', instanceId: breakItem.id }), {
    type: 'place',
    section: 'backroom',
  });

  assert.equal(state.stamina, before - GAME.placementCost + item.stamina);
  assert.equal(state.staminaRestored, item.stamina);
});

test('stamina never exceeds the shift pool', () => {
  let state = seeded();
  const drink = state.tray.find((i) => itemByKey(i.itemKey).stamina > 0);
  if (drink) {
    state = reduce(reduce(state, { type: 'pick', instanceId: drink.id }), {
      type: 'place',
      section: 'backroom',
    });
    assert.ok(state.stamina <= state.maxStamina);
  }
});

test('picking with full hands swaps rather than doing nothing', () => {
  const state = seeded();
  const first = reduce(state, { type: 'pick', instanceId: state.tray[0].id });
  assert.equal(first.hands.length, 1);

  const second = reduce(first, { type: 'pick', instanceId: first.tray[0].id });
  assert.equal(second.hands.length, 1, 'capacity 1 means one item in hand');
  assert.notEqual(second.hands[0].id, first.hands[0].id);
  assert.equal(second.tray.length, GAME.traySize);
});

test('returning to the tray empties your hands without penalty', () => {
  const state = seeded();
  const picked = reduce(state, { type: 'pick', instanceId: state.tray[0].id });
  const returned = reduce(picked, { type: 'returnToTray' });

  assert.equal(returned.hands.length, 0);
  assert.equal(returned.stamina, GAME.baseStamina);
  assert.equal(returned.wrong, 0);
});

test('the shift ends at zero stamina and stops accepting actions', () => {
  let state = seeded();
  let guard = 0;
  while (state.status === 'running' && guard++ < 1000) state = sortOneCorrectly(state);

  assert.equal(state.status, 'ended');
  assert.equal(state.stamina, 0);

  const cashAtEnd = state.cashCents;
  const after = reduce(state, { type: 'pick', instanceId: state.tray[0].id });
  assert.equal(after.cashCents, cashAtEnd);
  assert.equal(after.hands.length, 0, 'an ended shift ignores input');
});

test('a shift can always be banked - there is no fail state', () => {
  let state = seeded();
  for (let i = 0; i < 30; i++) {
    const instance = state.tray[0];
    state = reduce(state, { type: 'pick', instanceId: instance.id });
    state = reduce(state, { type: 'place', section: 'pigments' });
    if (state.status === 'ended') break;
  }
  const ended = reduce(state, { type: 'endShift' });
  const summary = summarize(ended);

  assert.equal(ended.status, 'ended');
  assert.ok(summary.cashCents >= 0);
  assert.ok(summary.accuracy >= 0 && summary.accuracy <= 1);
});

test('placing with empty hands is a no-op', () => {
  const state = seeded();
  assert.equal(reduce(state, { type: 'place', section: 'pigments' }), state);
});
