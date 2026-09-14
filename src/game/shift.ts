import { GAME, comboMultiplier } from './config';
import { nextInt, nextRandom, type RngState } from './rng';
import {
  ITEMS_BY_SECTION,
  itemByKey,
  SCORING_SECTIONS,
  type Item,
  type SectionKey,
} from '../content';

export type Instance = {
  /** Unique within a shift, so the UI can key and animate it. */
  id: number;
  itemKey: string;
};

export type FeedEntry =
  | { kind: 'correct'; id: number; itemKey: string; section: SectionKey; cents: number }
  | { kind: 'wrong'; id: number; itemKey: string; section: SectionKey; correctSection: SectionKey }
  | { kind: 'bonus'; id: number; section: SectionKey; cents: number }
  | { kind: 'stamina'; id: number; itemKey: string; amount: number };

export type ShiftState = {
  status: 'running' | 'ended';
  rngState: RngState;
  nextId: number;

  stamina: number;
  maxStamina: number;
  capacity: number;

  tray: Instance[];
  hands: Instance[];

  /** Earned this shift, in cents, before any later bill/collector maths. */
  cashCents: number;
  /** Correct placements since the last mistake. Drives the combo. */
  streak: number;
  comboSteps: number;
  bestComboSteps: number;

  correct: number;
  wrong: number;
  placements: number;
  staminaRestored: number;

  sectionCounts: Record<SectionKey, number>;
  bonusesEarned: SectionKey[];

  /** Newest first, capped. Purely for UI feedback. */
  feed: FeedEntry[];
  /** Exactly what the most recent action produced, oldest first. */
  lastBatch: FeedEntry[];
};

export type Action =
  | { type: 'pick'; instanceId: number }
  | { type: 'returnToTray' }
  | { type: 'place'; section: SectionKey }
  | { type: 'endShift' };

const FEED_LIMIT = 12;

const emptyCounts = (): Record<SectionKey, number> => ({
  pigments: 0,
  brushes: 0,
  paper: 0,
  vinyl: 0,
  gear: 0,
  backroom: 0,
});

/** Weighted draw: a break item now and then, otherwise a shelf item. */
function drawItem(rng: RngState): [Item, RngState] {
  const [roll, afterRoll] = nextRandom(rng);
  if (roll < GAME.breakItemChance) {
    const pool = ITEMS_BY_SECTION.backroom;
    const [idx, after] = nextInt(afterRoll, pool.length);
    return [pool[idx], after];
  }

  const [sectionIdx, afterSection] = nextInt(afterRoll, SCORING_SECTIONS.length);
  const pool = ITEMS_BY_SECTION[SCORING_SECTIONS[sectionIdx]];

  const totalWeight = pool.reduce(
    (sum, item) => sum + (item.rarity === 'premium' ? GAME.premiumWeight : GAME.commonWeight),
    0,
  );
  const [pick, afterPick] = nextRandom(afterSection);
  let target = pick * totalWeight;
  for (const item of pool) {
    target -= item.rarity === 'premium' ? GAME.premiumWeight : GAME.commonWeight;
    if (target <= 0) return [item, afterPick];
  }
  return [pool[pool.length - 1], afterPick];
}

/** Tops the tray back up to traySize. Mutates the draft it is handed. */
function refillTray(draft: ShiftState): void {
  while (draft.tray.length < GAME.traySize) {
    const [item, rng] = drawItem(draft.rngState);
    draft.rngState = rng;
    draft.tray.push({ id: draft.nextId++, itemKey: item.key });
  }
}

export type StartOptions = {
  seed: number;
  maxStamina?: number;
  capacity?: number;
};

export function startShift({
  seed,
  maxStamina = GAME.baseStamina,
  capacity = GAME.baseCapacity,
}: StartOptions): ShiftState {
  const state: ShiftState = {
    status: 'running',
    rngState: seed,
    nextId: 1,
    stamina: maxStamina,
    maxStamina,
    capacity,
    tray: [],
    hands: [],
    cashCents: 0,
    streak: 0,
    comboSteps: 0,
    bestComboSteps: 0,
    correct: 0,
    wrong: 0,
    placements: 0,
    staminaRestored: 0,
    sectionCounts: emptyCounts(),
    bonusesEarned: [],
    feed: [],
    lastBatch: [],
  };
  refillTray(state);
  return state;
}

export const multiplierOf = (state: ShiftState): number => comboMultiplier(state.comboSteps);

function clone(state: ShiftState): ShiftState {
  return {
    ...state,
    tray: [...state.tray],
    hands: [...state.hands],
    sectionCounts: { ...state.sectionCounts },
    bonusesEarned: [...state.bonusesEarned],
    feed: [...state.feed],
    // Every action reports its own outcome, so the UI never diffs the feed.
    lastBatch: [],
  };
}

function pushFeed(draft: ShiftState, entry: FeedEntry): void {
  draft.feed = [entry, ...draft.feed].slice(0, FEED_LIMIT);
  draft.lastBatch = [...draft.lastBatch, entry];
}

export function reduce(state: ShiftState, action: Action): ShiftState {
  if (state.status !== 'running' && action.type !== 'endShift') return state;

  switch (action.type) {
    case 'pick': {
      const index = state.tray.findIndex((i) => i.id === action.instanceId);
      if (index === -1) return state;

      const draft = clone(state);
      const [picked] = draft.tray.splice(index, 1);
      // Hands full: put the oldest item back so a tap always does something.
      if (draft.hands.length >= draft.capacity) {
        const returned = draft.hands.shift();
        if (returned) draft.tray.splice(index, 0, returned);
      }
      draft.hands.push(picked);
      refillTray(draft);
      return draft;
    }

    case 'returnToTray': {
      if (state.hands.length === 0) return state;
      const draft = clone(state);
      draft.tray = [...draft.hands, ...draft.tray];
      draft.hands = [];
      return draft;
    }

    case 'place': {
      if (state.hands.length === 0) return state;
      const draft = clone(state);
      const target = action.section;

      const matching = draft.hands.filter((i) => itemByKey(i.itemKey).section === target);
      let cost = GAME.placementCost;
      let restored = 0;

      if (matching.length > 0) {
        // A correct tap shelves every held item that belongs here.
        draft.hands = draft.hands.filter((i) => itemByKey(i.itemKey).section !== target);

        for (const instance of matching) {
          const item = itemByKey(instance.itemKey);
          draft.streak += 1;
          draft.correct += 1;
          draft.sectionCounts[target] += 1;

          if (draft.streak % GAME.comboStep === 0) {
            draft.comboSteps = Math.min(draft.comboSteps + 1, GAME.comboMaxSteps);
            draft.bestComboSteps = Math.max(draft.bestComboSteps, draft.comboSteps);
          }

          const cents = Math.round(item.value * comboMultiplier(draft.comboSteps));
          draft.cashCents += cents;
          pushFeed(draft, {
            kind: 'correct',
            id: instance.id,
            itemKey: item.key,
            section: target,
            cents,
          });

          if (item.stamina > 0) {
            restored += item.stamina;
            draft.staminaRestored += item.stamina;
            pushFeed(draft, {
              kind: 'stamina',
              id: instance.id,
              itemKey: item.key,
              amount: item.stamina,
            });
          }
        }

        const section = target;
        if (
          section !== 'backroom' &&
          draft.sectionCounts[section] >= GAME.sectionGoal &&
          !draft.bonusesEarned.includes(section)
        ) {
          draft.bonusesEarned.push(section);
          draft.cashCents += GAME.sectionGoalBonus;
          pushFeed(draft, {
            kind: 'bonus',
            id: draft.nextId++,
            section,
            cents: GAME.sectionGoalBonus,
          });
        }
      } else {
        // Nothing in hand belongs here: the first item goes back, you lose time.
        const dropped = draft.hands[0];
        draft.hands = draft.hands.slice(1);
        const item = itemByKey(dropped.itemKey);

        draft.wrong += 1;
        draft.streak = 0;
        draft.comboSteps = Math.max(0, draft.comboSteps - 1);
        cost += GAME.mistakeCost;

        pushFeed(draft, {
          kind: 'wrong',
          id: dropped.id,
          itemKey: item.key,
          section: target,
          correctSection: item.section,
        });
      }

      draft.placements += 1;
      draft.stamina = Math.min(draft.maxStamina, draft.stamina - cost + restored);
      refillTray(draft);

      if (draft.stamina <= 0) {
        draft.stamina = 0;
        draft.status = 'ended';
      }
      return draft;
    }

    case 'endShift': {
      if (state.status === 'ended') return state;
      return { ...clone(state), status: 'ended', stamina: 0 };
    }
  }
}

export type ShiftSummary = {
  cashCents: number;
  correct: number;
  wrong: number;
  placements: number;
  accuracy: number;
  bestMultiplier: number;
  bonuses: SectionKey[];
  staminaRestored: number;
};

export function summarize(state: ShiftState): ShiftSummary {
  const attempts = state.correct + state.wrong;
  return {
    cashCents: state.cashCents,
    correct: state.correct,
    wrong: state.wrong,
    placements: state.placements,
    accuracy: attempts === 0 ? 1 : state.correct / attempts,
    bestMultiplier: comboMultiplier(state.bestComboSteps),
    bonuses: state.bonusesEarned,
    staminaRestored: state.staminaRestored,
  };
}
