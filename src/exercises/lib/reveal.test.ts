import { test, expect } from 'vitest';
import { canRevealAnswers } from './reveal';

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
