import { describe, expect, test } from 'vitest';

import { createExerciseReducer, seedFromId, type ExercisePatch } from './exerciseScaffold';

describe('seedFromId', () => {
  test('is deterministic — the same id always yields the same seed', () => {
    expect(seedFromId('r-abc')).toBe(seedFromId('r-abc'));
    expect(seedFromId(':r1:')).toBe(seedFromId(':r1:'));
  });

  test('the empty string yields the FNV-1a offset basis', () => {
    expect(seedFromId('')).toBe(2166136261);
  });

  test('distinct ids yield distinct seeds (spot check)', () => {
    const seeds = [':r0:', ':r1:', ':r2:', 'select-1', 'radio-quiz-2'].map(seedFromId);
    expect(new Set(seeds).size).toBe(seeds.length);
  });

  test('returns a uint32 (non-negative, below 2^32)', () => {
    for (const id of ['', 'x', ':r7:', 'a-much-longer-component-id-value']) {
      const seed = seedFromId(id);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThan(2 ** 32);
    }
  });
});

interface DemoState {
  seed: number;
  count: number;
  label: string;
}

describe('createExerciseReducer', () => {
  const reducer = createExerciseReducer<DemoState>();
  const base: DemoState = { seed: 1, count: 0, label: 'x' };

  test('merges an object patch over the previous state', () => {
    expect(reducer(base, { count: 5 })).toEqual({ seed: 1, count: 5, label: 'x' });
  });

  test('applies a function patch computed from the previous state', () => {
    const patch: ExercisePatch<DemoState> = (prev) => ({ count: prev.count + 3 });
    expect(reducer({ ...base, count: 4 }, patch)).toEqual({ seed: 1, count: 7, label: 'x' });
  });

  test('a null patch is a no-op and returns the same state reference', () => {
    expect(reducer(base, null)).toBe(base);
  });

  test('a function patch returning null is a no-op and returns the same reference', () => {
    expect(reducer(base, () => null)).toBe(base);
  });

  test('does not mutate the previous state', () => {
    const prev: DemoState = { seed: 2, count: 1, label: 'orig' };
    reducer(prev, { count: 99, label: 'next' });
    expect(prev).toEqual({ seed: 2, count: 1, label: 'orig' });
  });

  test('each factory call returns an independent reducer with identical behavior', () => {
    const other = createExerciseReducer<DemoState>();
    expect(other).not.toBe(reducer);
    expect(other(base, { count: 8 })).toEqual(reducer(base, { count: 8 }));
  });
});
