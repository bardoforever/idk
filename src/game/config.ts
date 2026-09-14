/**
 * Tuning for the sorting loop. Every number here is from the v2 design doc;
 * later slices (skill tree, perks) override these per-shift rather than
 * editing this file.
 */
export const GAME = {
  /** Starting shift meter. ~55 placements => roughly a 3 minute shift. */
  baseStamina: 120,
  /** Every placement action costs this, whether it holds one item or five. */
  placementCost: 2,
  /** A wrong shelf costs time, never money. Cozy tuning. */
  mistakeCost: 4,
  /** Items you can hold at once. Skill tree raises this. */
  baseCapacity: 1,
  /** How many items sit in the tray waiting to be sorted. */
  traySize: 12,

  /** Correct placements needed to step the combo up. */
  comboStep: 5,
  comboIncrement: 0.25,
  /** 8 steps * 0.25 = 3.0x ceiling. */
  comboMaxSteps: 8,

  /** Correct items into one section during a shift to earn its bonus. */
  sectionGoal: 10,
  sectionGoalBonus: 2500,

  /** Chance any drawn item is a stamina-restoring back room item. */
  breakItemChance: 1 / 12,
  /** Relative draw weight of a premium item against a common one. */
  premiumWeight: 1,
  commonWeight: 10,
} as const;

export const comboMultiplier = (steps: number): number =>
  1 + Math.min(steps, GAME.comboMaxSteps) * GAME.comboIncrement;
