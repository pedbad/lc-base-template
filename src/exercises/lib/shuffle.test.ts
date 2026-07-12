import { test, expect } from 'vitest';
import { mulberry32, shuffle, sampleN } from './shuffle';

test('shuffle: preserves length and multiset (no items lost or added)', () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffle(input, mulberry32(42));
  expect(out).toHaveLength(5);
  expect([...out].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
});

test('shuffle: does not mutate the input array', () => {
  const input = [1, 2, 3];
  const snapshot = [...input];
  shuffle(input, mulberry32(7));
  expect(input).toEqual(snapshot);
});

test('shuffle: same seed gives the same order (deterministic)', () => {
  const a = shuffle([1, 2, 3, 4, 5], mulberry32(99));
  const b = shuffle([1, 2, 3, 4, 5], mulberry32(99));
  expect(a).toEqual(b);
});

test('sampleN: returns at most n items, all from the input', () => {
  const out = sampleN([1, 2, 3, 4, 5], 3, mulberry32(1));
  expect(out).toHaveLength(3);
  out.forEach((x) => expect([1, 2, 3, 4, 5]).toContain(x));
});

test('sampleN: n larger than length returns all items', () => {
  const out = sampleN([1, 2], 10, mulberry32(1));
  expect(out).toHaveLength(2);
});
