/**
 * reveal.ts — the universal Show-answers gate (spec §5.3).
 *
 * Rule: reveal becomes available after a number of failed tries, and ONLY while at
 * least one answer is wrong. The number is the author's `options.showAnswersAfter`, or
 * the engine's default (1; 2 for the sequence engines and memory-match, as
 * french-lo-1; maintainer 2026-10-12). Hidden when everything is correct; removed
 * entirely when the author sets `allowShowAnswers: false`.
 *
 * Family-agnostic. Each scoring family maps its own state onto RevealInput:
 *   - blank-grading: failedTries = failedChecks (commitCheckPress); total/nCorrect
 *     from the check.
 *   - sequence/placement: failedTries = failCount; memory-match: missed pairs;
 *     word-spot: wrong clicks.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §5.3.
 */
export interface RevealInput {
  /** Author switch from options; undefined = allowed (default true). */
  allowShowAnswers?: boolean;
  /** Author's `options.showAnswersAfter`; undefined = the engine's default. */
  showAnswersAfter?: number;
  /** Failed tries so far: Checks with anything wrong, missed pairs, wrong clicks. */
  failedTries: number;
  /** Total gradeable items. */
  total: number;
  /** How many are currently correct. */
  nCorrect: number;
}

/** Failed tries before Show answers, by default (french-lo-1's `hasAnyIncorrect`). */
export const SHOW_ANSWERS_AFTER = 1;

/** The default for word-order, phrase-reorder, drag-fill-gaps and memory-match. */
export const SHOW_ANSWERS_AFTER_SEQUENCE = 2;

/** True when the Show-answers control should be available. */
export function canRevealAnswers(input: RevealInput, defaultAfter = SHOW_ANSWERS_AFTER): boolean {
  if (input.allowShowAnswers === false) return false;
  if (input.failedTries < (input.showAnswersAfter ?? defaultAfter)) return false;
  return input.nCorrect < input.total; // at least one wrong
}
