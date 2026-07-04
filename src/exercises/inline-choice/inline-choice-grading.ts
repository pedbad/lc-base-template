/**
 * inline-choice-grading.ts — pure grading for the inline radio-pill blank engine
 * (#2). Extracted from InlineChoiceExercise's handleCheck / handleShowAnswers so the
 * compute is testable without a DOM. Same blank-grading family as select (#1): a
 * blank is correct when the selected option index equals its `winner`. Kept as its
 * own engine module (not shared with select) so the two engines stay decoupled.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §7, §8.
 */
import type { ChoiceMeta } from '@/exercises/lib/parsing';

/**
 * Grade selected option indices against each blank's winner. Blanks with no
 * selection (undefined or '') are skipped — only attempted blanks appear.
 */
export function gradeInlineChoice(
  blanksMeta: readonly ChoiceMeta[],
  values: Record<number, string>,
  nToSolve: number,
): Record<number, boolean> {
  const checkedResults: Record<number, boolean> = {};
  for (let i = 0; i < nToSolve; i += 1) {
    const value = values[i];
    if (value === undefined || value === '') continue;
    checkedResults[i] = Number(value) === blanksMeta[i]?.winner;
  }
  return checkedResults;
}

/** Reveal every answer: set each blank to its winner index (string) and mark correct. */
export function fillInlineChoiceAnswers(
  blanksMeta: readonly ChoiceMeta[],
  nToSolve: number,
): { values: Record<number, string>; checkedResults: Record<number, boolean> } {
  const values: Record<number, string> = {};
  const checkedResults: Record<number, boolean> = {};
  for (let i = 0; i < nToSolve; i += 1) {
    values[i] = String(blanksMeta[i]?.winner ?? -1);
    checkedResults[i] = true;
  }
  return { values, checkedResults };
}
