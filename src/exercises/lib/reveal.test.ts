import { test, expect } from 'vitest';
import { canRevealAnswers, SHOW_ANSWERS_AFTER, SHOW_ANSWERS_AFTER_SEQUENCE } from './reveal';

test('reveal: hidden before any failed try', () => {
  expect(canRevealAnswers({ failedTries: 0, total: 4, nCorrect: 0 })).toBe(false);
});

test('reveal: hidden when all answers are correct', () => {
  expect(canRevealAnswers({ failedTries: 3, total: 4, nCorrect: 4 })).toBe(false);
});

test('reveal: by default, shown after one failed try with something wrong', () => {
  expect(SHOW_ANSWERS_AFTER).toBe(1);
  expect(canRevealAnswers({ failedTries: 1, total: 4, nCorrect: 2 })).toBe(true);
});

test('reveal: never shown when allowShowAnswers is false', () => {
  expect(canRevealAnswers({ failedTries: 9, total: 4, nCorrect: 0, allowShowAnswers: false })).toBe(
    false,
  );
});

// Maintainer, 2026-10-12, after french-lo-1: word-order, phrase-reorder, drag-fill-gaps
// and memory-match wait for two failed tries by default.
test('reveal: an engine default of two waits for the second failed try', () => {
  expect(SHOW_ANSWERS_AFTER_SEQUENCE).toBe(2);
  const at = (failedTries: number) =>
    canRevealAnswers({ failedTries, total: 4, nCorrect: 1 }, SHOW_ANSWERS_AFTER_SEQUENCE);
  expect(at(1)).toBe(false);
  expect(at(2)).toBe(true);
});

// Maintainer, 2026-10-12: an author tunes the number per exercise
// (`options.showAnswersAfter`), over the engine's default.
test('reveal: the author’s showAnswersAfter overrides the engine default', () => {
  const at = (failedTries: number) =>
    canRevealAnswers(
      { failedTries, total: 4, nCorrect: 1, showAnswersAfter: 3 },
      SHOW_ANSWERS_AFTER_SEQUENCE,
    );
  expect(at(2)).toBe(false);
  expect(at(3)).toBe(true);
});
