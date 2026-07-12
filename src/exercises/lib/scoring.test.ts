import { test, expect } from 'vitest';
import { getInitialScoringState, countCorrect, commitCheck } from './scoring';

test('scoring: initial state is empty, unchecked, zero correct', () => {
  expect(getInitialScoringState()).toEqual({
    checkedResults: {},
    hasChecked: false,
    nCorrect: 0,
  });
});

test('scoring: getInitialScoringState returns a fresh object each call', () => {
  const a = getInitialScoringState();
  const b = getInitialScoringState();
  expect(a.checkedResults).not.toBe(b.checkedResults); // not a shared mutable map
});

test('scoring: countCorrect counts only true values', () => {
  expect(countCorrect({ 0: true, 1: false, 2: true })).toBe(2);
  expect(countCorrect({})).toBe(0);
  expect(countCorrect()).toBe(0);
});

test('scoring: commitCheck marks checked and derives nCorrect', () => {
  const results = { 0: true, 1: false };
  expect(commitCheck(results)).toEqual({
    checkedResults: results,
    hasChecked: true,
    nCorrect: 1,
  });
});
