/**
 * select-grading.ts — pure grading for the dropdown-blank engine (#1). Extracted
 * from SelectExercise's handleCheck / handleShowAnswers so the compute is testable
 * without a DOM. The component keeps the reducer/dispatch and the render-time
 * `blanksMeta` walk; it passes that metadata (option winners per blank) in here.
 *
 * A blank grades correct when the selected option index equals the blank's `winner`.
 * gradeSelect skips blanks the learner left unselected; fillSelectAnswers reveals
 * every winner.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §7, §8.
 */
import type { ChoiceMeta } from '@/exercises/lib/parsing';

/**
 * Grade selected option indices against each blank's winner. Blanks with no
 * selection (undefined or '') are skipped — only attempted blanks appear.
 */
export function gradeSelect(
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

/**
 * Reveal every answer: set each blank's value to its winner index (as the string
 * value type the Select uses) and mark all correct.
 */
export function fillSelectAnswers(
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
