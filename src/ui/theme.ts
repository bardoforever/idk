/** Warm paper-and-ink palette: an art shop that also sells records. */
export const C = {
  bg: '#F6F1E7',
  bgDeep: '#EDE5D6',
  card: '#FFFDF8',
  ink: '#2B2620',
  inkSoft: '#6B6055',
  muted: '#9A9083',
  line: '#E2D9C9',
  accent: '#C4553B',
  good: '#5B8C5A',
  bad: '#B4544A',
  gold: '#C9A227',
  stamina: '#C4553B',
  staminaLow: '#B4544A',
} as const;

export const RADIUS = { sm: 8, md: 14, lg: 20 } as const;

export const money = (cents: number): string => {
  const whole = Math.floor(Math.abs(cents) / 100);
  const part = String(Math.abs(cents) % 100).padStart(2, '0');
  return `${cents < 0 ? '-' : ''}$${whole.toLocaleString()}.${part}`;
};

/** Compact form for the running total in the HUD. */
export const moneyShort = (cents: number): string => {
  const dollars = cents / 100;
  if (dollars >= 10000) return `$${(dollars / 1000).toFixed(1)}k`;
  return `$${Math.floor(dollars).toLocaleString()}`;
};
