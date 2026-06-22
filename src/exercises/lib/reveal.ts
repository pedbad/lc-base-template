/**
 * reveal.ts — the universal Show-answers gate (spec §5.3).
 *
 * Rule: reveal becomes available after a Check, and ONLY when at least one answer
 * is wrong. Hidden before any attempt; hidden when everything is correct; and
 * removed entirely when the author sets `allowShowAnswers: false`.
 *
 * Family-agnostic. Each scoring family maps its own state onto RevealInput:
 *   - blank-grading: hasAttempted = hasChecked; total/nCorrect from the check.
 *   - sequence/placement: hasAttempted = interacted; nCorrect < total iff not
 *     `complete` (e.g. failCount > 0).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §5.3.
 */
export interface RevealInput {
  /** Author switch from options; undefined = allowed (default true). */
  allowShowAnswers?: boolean;
  /** Has the learner made a gradeable attempt yet (pressed Check / completed a pass)? */
  hasAttempted: boolean;
  /** Total gradeable items. */
  total: number;
  /** How many are currently correct. */
  nCorrect: number;
}

/** True when the Show-answers control should be available. */
export function canRevealAnswers(input: RevealInput): boolean {
  if (input.allowShowAnswers === false) return false;
  if (!input.hasAttempted) return false;
  return input.nCorrect < input.total; // at least one wrong
}
