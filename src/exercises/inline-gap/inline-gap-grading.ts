/**
 * inline-gap-grading.ts — pure grading for the typed inline-cloze engine (#4).
 * Extracted from InlineTypedGapExercise's handleCheck / handleShowAnswers so the
 * compute is testable without a DOM. Answers are TYPED and graded by answer-feedback
 * (accent-strict, apostrophe/whitespace-tolerant, capitals ignored by default), which
 * also decides the hint or revealed answer shown under a wrong blank. gradeInlineGap skips blanks the
 * learner left blank; fillInlineGapAnswers reveals every expected answer.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §7, §8.
 */
import { gradeTypedAnswers, type TypedGradeResult } from '@/exercises/lib/answer-feedback';
import type { InputMeta } from '@/exercises/lib/parsing';

export type InlineGapGradeResult = TypedGradeResult;

export interface InlineGapFillResult {
  /** blankIndex → the revealed expected answer. */
  values: Record<number, string>;
  /** blankIndex → true for every blank. */
  checkedResults: Record<number, boolean>;
}

/**
 * Grade the first `nToSolve` blanks against their expected text (accent-strict,
 * capitals ignored unless `caseSensitive`). Empty blanks are skipped. `misses` carries
 * each blank's wrong Checks so far: the first gets a hint, the second the answer.
 */
export function gradeInlineGap(
  blanksMeta: readonly InputMeta[],
  values: Record<number, string>,
  nToSolve: number,
  misses: Readonly<Record<number, number>> = {},
  caseSensitive = false,
): InlineGapGradeResult {
  const expected = Array.from({ length: nToSolve }, (_, i) => blanksMeta[i]?.expected ?? '');
  return gradeTypedAnswers(expected, values, misses, 'strict', caseSensitive);
}

/** Reveal every answer: fill each blank with its expected text, all correct. */
export function fillInlineGapAnswers(
  blanksMeta: readonly InputMeta[],
  nToSolve: number,
): InlineGapFillResult {
  const values: Record<number, string> = {};
  const checkedResults: Record<number, boolean> = {};
  for (let i = 0; i < nToSolve; i += 1) {
    values[i] = blanksMeta[i]?.expected ?? '';
    checkedResults[i] = true;
  }
  return { values, checkedResults };
}
