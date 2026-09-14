/**
 * mulberry32 - small, fast, seedable. The generator state lives inside
 * ShiftState so a shift is fully deterministic and serializable, which is what
 * lets the server replay a client's shift later to verify it.
 */
export type RngState = number;

export function nextRandom(state: RngState): [number, RngState] {
  let t = (state + 0x6d2b79f5) | 0;
  let x = t;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  const value = ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  return [value, t];
}

export function nextInt(state: RngState, maxExclusive: number): [number, RngState] {
  const [value, next] = nextRandom(state);
  return [Math.floor(value * maxExclusive), next];
}

/** Turns an arbitrary string into a seed, so shifts can be keyed by id. */
export function seedFrom(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
