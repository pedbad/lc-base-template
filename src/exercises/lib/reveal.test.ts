import { test, expect } from 'vitest';
import { canRevealAfterFails, canRevealAnswers, FAILED_CHECKS_BEFORE_REVEAL } from './reveal';

test('reveal: hidden before any attempt', () => {
  expect(canRevealAnswers({ hasAttempted: false, total: 4, nCorrect: 0 })).toBe(false);
});

test('reveal: hidden when all answers are correct', () => {
  expect(canRevealAnswers({ hasAttempted: true, total: 4, nCorrect: 4 })).toBe(false);
});

test('reveal: shown after an attempt with at least one wrong', () => {
  expect(canRevealAnswers({ hasAttempted: true, total: 4, nCorrect: 2 })).toBe(true);
});

test('reveal: never shown when allowShowAnswers is false', () => {
  expect(
    canRevealAnswers({ hasAttempted: true, total: 4, nCorrect: 0, allowShowAnswers: false }),
  ).toBe(false);
});

test('reveal: allowShowAnswers undefined behaves as allowed', () => {
  expect(canRevealAnswers({ hasAttempted: true, total: 2, nCorrect: 1 })).toBe(true);
});

// Maintainer, 2026-10-12, after french-lo-1: the ordering and drag engines (word-order,
// phrase-reorder, drag-fill-gaps) offer Show answers after two failed Checks, not one.
test('canRevealAfterFails: not after one failed Check', () => {
  expect(canRevealAfterFails({ failCount: 1, total: 4, nCorrect: 1 })).toBe(false);
});

test('canRevealAfterFails: from two failed Checks, while something is wrong', () => {
  expect(FAILED_CHECKS_BEFORE_REVEAL).toBe(2);
  expect(canRevealAfterFails({ failCount: 2, total: 4, nCorrect: 1 })).toBe(true);
  expect(canRevealAfterFails({ failCount: 2, total: 4, nCorrect: 4 })).toBe(false);
});

test('canRevealAfterFails: never when the author turns it off', () => {
  expect(
    canRevealAfterFails({ allowShowAnswers: false, failCount: 5, total: 4, nCorrect: 0 }),
  ).toBe(false);
});
