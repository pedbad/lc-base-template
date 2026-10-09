import { test, expect } from 'vitest';
import {
  getInitialScoringState,
  countCorrect,
  commitCheck,
  commitReveal,
  countOwnCorrect,
} from './scoring';

test('scoring: initial state is empty, unchecked, zero correct', () => {
  expect(getInitialScoringState()).toEqual({
    checkedResults: {},
    hasChecked: false,
    nCorrect: 0,
    revealed: [],
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

// TODO §D18 (maintainer, 2026-10-09): Show answer must not fill the progress meter.
// The meter counts only the student's own correct answers; a revealed one never
// counts until Reset, even if it is edited and checked again.
test('scoring: commitCheck leaves the revealed keys out, so a merge keeps them', () => {
  expect(commitCheck({ 0: true })).not.toHaveProperty('revealed');
});

test('scoring: commitReveal records the keys the reveal filled, not those already right', () => {
  const before = { ...getInitialScoringState(), ...commitCheck({ 0: true, 1: false }) };
  expect(commitReveal(before, { 0: true, 1: true, 2: true })).toEqual({
    checkedResults: { 0: true, 1: true, 2: true },
    hasChecked: true,
    nCorrect: 3,
    revealed: ['1', '2'],
  });
});

test('scoring: a second reveal adds to the keys of the first', () => {
  const first = commitReveal(
    { ...getInitialScoringState(), ...commitCheck({ a: true, b: false, c: true }) },
    { a: true, b: true, c: true },
  );
  const edited = { ...first, ...commitCheck({ a: true, b: true, c: false }) };
  expect(commitReveal(edited, { a: true, b: true, c: true }).revealed).toEqual(['b', 'c']);
});

test('scoring: countOwnCorrect counts right answers the reveal did not fill', () => {
  expect(countOwnCorrect({ checkedResults: { 0: true, 1: true, 2: false }, revealed: [] })).toBe(2);
  expect(
    countOwnCorrect({ checkedResults: { 0: true, 1: true, 2: true }, revealed: ['1', '2'] }),
  ).toBe(1);
});
