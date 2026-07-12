import { test, expect } from 'vitest';

import {
  buildTokens,
  countCorrectPositions,
  scramble,
  swapById,
  type PhraseToken,
} from './phrase-reorder-grading';

const ids = (tokens: readonly PhraseToken[]): string[] => tokens.map((t) => t.id);
const rows = (...phrases: string[]) => phrases.map((phrase) => ({ phrase }));

test('buildTokens: one slot-keyed card per row phrase', () => {
  expect(buildTokens(rows('bonjour', 'au revoir'))).toEqual([
    { id: 'slot-0', phrase: 'bonjour' },
    { id: 'slot-1', phrase: 'au revoir' },
  ]);
});

test('swapById: swaps two cards immutably', () => {
  const order = buildTokens(rows('a', 'b', 'c'));
  const next = swapById(order, 'slot-0', 'slot-2');
  expect(ids(next)).toEqual(['slot-2', 'slot-1', 'slot-0']);
  expect(ids(order)).toEqual(['slot-0', 'slot-1', 'slot-2']);
});

test('swapById: unknown id is a no-op copy', () => {
  const order = buildTokens(rows('a', 'b'));
  expect(ids(swapById(order, 'slot-0', 'nope'))).toEqual(['slot-0', 'slot-1']);
});

test('countCorrectPositions: counts cards in their expected slot', () => {
  const expected = buildTokens(rows('a', 'b', 'c'));
  const order = swapById(expected, 'slot-0', 'slot-1');
  expect(countCorrectPositions(order, expected)).toBe(1);
});

test('countCorrectPositions: full match returns total', () => {
  const expected = buildTokens(rows('a', 'b'));
  expect(countCorrectPositions([...expected], expected)).toBe(2);
});

test('scramble: preserves the token set', () => {
  const deck = buildTokens(rows('a', 'b', 'c'));
  const result = scramble(deck, () => 0.13);
  expect([...ids(result)].sort()).toEqual([...ids(deck)].sort());
});

test('scramble: length < 2 unchanged', () => {
  expect(ids(scramble(buildTokens(rows('solo'))))).toEqual(['slot-0']);
});

test('scramble: never yields the original order for 2+ cards', () => {
  const deck = buildTokens(rows('a', 'b'));
  for (let i = 0; i < 20; i += 1) {
    expect(ids(scramble(deck))).not.toEqual(['slot-0', 'slot-1']);
  }
});
