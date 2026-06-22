/**
 * scoring.ts — shared scoring helpers for the blank-grading exercise family
 * (select, inline-choice, radio-quiz, inline-gap, typed-transform, dictation,
 * line-match). Ported from french-lo-1's exerciseScoring.js.
 *
 * Grading is modeled as a `checkedResults` map (blank/row key -> correct?) plus
 * `hasChecked` and a derived `nCorrect`. The grading FUNCTION (option-index vs
 * normalized-typed vs identity match) differs per engine and stays in each engine;
 * only these three shared fields + the count derivation live here. The scoring
 * fields stay inside each engine's single merge reducer (atomic updates with
 * input/diff state) — they are not lifted into a separate store.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §7.
 */
export interface ScoringState {
  checkedResults: Record<string | number, boolean>;
  hasChecked: boolean;
  nCorrect: number;
}

/**
 * Fresh baseline for the scoring fields. A FACTORY (not a shared constant) so each
 * reset gets its own `checkedResults` object — a shared constant would hand every
 * exercise the same mutable map.
 */
export const getInitialScoringState = (): ScoringState => ({
  checkedResults: {},
  hasChecked: false,
  nCorrect: 0,
});

/** Number of correct blanks/rows in a checkedResults map. */
export const countCorrect = (checkedResults: Record<string | number, boolean> = {}): number =>
  Object.values(checkedResults).filter(Boolean).length;

/**
 * The "commit a check" patch: record per-blank results, mark checked, derive
 * nCorrect. Callers spread exercise-specific siblings (diffResults, values, …)
 * alongside it in their reducer.
 */
export const commitCheck = (checkedResults: Record<string | number, boolean>): ScoringState => ({
  checkedResults,
  hasChecked: true,
  nCorrect: countCorrect(checkedResults),
});
