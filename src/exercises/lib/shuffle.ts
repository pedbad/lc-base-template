/**
 * shuffle.ts — choice ordering for the `options.shuffle` / `options.sampleSize`
 * behavior (spec §5.2, §6). Pure and immutable: returns NEW arrays, never mutates
 * input. RNG is injectable so tests are deterministic and a future reset can
 * reproduce or re-vary order.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §5.2.
 */

/** Small deterministic PRNG (mulberry32). Returns a function yielding [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle into a new array. `rng` defaults to Math.random. */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Shuffle then take the first n (clamped to length). New array. */
export function sampleN<T>(items: readonly T[], n: number, rng: () => number = Math.random): T[] {
  return shuffle(items, rng).slice(0, Math.max(0, Math.min(n, items.length)));
}
