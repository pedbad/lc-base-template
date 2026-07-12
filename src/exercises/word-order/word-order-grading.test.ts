import { test, expect } from 'vitest';

import {
  buildTokens,
  countCorrectPositions,
  scramble,
  swapById,
  type Token,
} from './word-order-grading';

const ids = (tokens: readonly Token[]): string[] => tokens.map((t) => t.id);

test('buildTokens: maps words to id/label pairs', () => {
  expect(buildTokens(['je', 'suis'])).toEqual([
    { id: 'token-0', label: 'je' },
    { id: 'token-1', label: 'suis' },
  ]);
});

test('swapById: swaps two cards, returns a new array', () => {
  const order = buildTokens(['a', 'b', 'c']);
  const next = swapById(order, 'token-0', 'token-2');
  expect(ids(next)).toEqual(['token-2', 'token-1', 'token-0']);
  expect(next).not.toBe(order); // immutable
  expect(ids(order)).toEqual(['token-0', 'token-1', 'token-2']); // original untouched
});

test('swapById: unknown id is a no-op copy', () => {
  const order = buildTokens(['a', 'b']);
  expect(ids(swapById(order, 'token-0', 'nope'))).toEqual(['token-0', 'token-1']);
});

test('countCorrectPositions: counts tokens in their expected slot', () => {
  const expected = buildTokens(['a', 'b', 'c']);
  const order = swapById(expected, 'token-0', 'token-1'); // b a c
  expect(countCorrectPositions(order, expected)).toBe(1); // only c in place
});

test('countCorrectPositions: full match returns total', () => {
  const expected = buildTokens(['a', 'b', 'c']);
  expect(countCorrectPositions([...expected], expected)).toBe(3);
});

test('scramble: preserves the token set (a permutation)', () => {
  const deck = buildTokens(['a', 'b', 'c', 'd']);
  const result = scramble(deck, () => 0.42);
  expect([...ids(result)].sort()).toEqual([...ids(deck)].sort());
  expect(result.length).toBe(deck.length);
});

test('scramble: length < 2 is returned unchanged', () => {
  expect(ids(scramble(buildTokens(['solo'])))).toEqual(['token-0']);
  expect(scramble([])).toEqual([]);
});

test('scramble: never yields the original order for 2+ cards', () => {
  const deck = buildTokens(['a', 'b']);
  // Guarantee holds regardless of RNG: an identity shuffle is fixed up by swapping.
  for (let i = 0; i < 20; i += 1) {
    expect(ids(scramble(deck))).not.toEqual(['token-0', 'token-1']);
  }
});
