/**
 * conjugation-grading.ts — pure grading for the conjugation-table engine (#4.3).
 * Answers are TYPED and graded by answer-feedback's gradeTypedAnswers (accent-strict,
 * capitals ignored by default); mirrors inline-gap-grading. View-free so it is unit-testable without a DOM.
 *
 * Spec: docs/specs/2026-07-03-new-exercise-engines-design.md §5; §7 (blank-grading).
 */
import { gradeTypedAnswers, type TypedGradeResult } from '@/exercises/lib/answer-feedback';
import type { ConjugationRow } from './conjugation-schema';

export type ConjugationGradeResult = TypedGradeResult;

export interface ConjugationFillResult {
  /** rowIndex → the revealed expected form. */
  values: Record<number, string>;
  /** rowIndex → true for every row. */
  checkedResults: Record<number, boolean>;
}

/**
 * Grade each typed form against its row's `answer` (accent-strict, capitals ignored
 * unless `caseSensitive`). Rows left empty are skipped. `misses` carries each row's
 * wrong Checks so far: the first gets a hint, the second the answer (answer-feedback).
 */
export function gradeConjugation(
  rows: readonly ConjugationRow[],
  values: Record<number, string>,
  misses: Readonly<Record<number, number>> = {},
  caseSensitive = false,
): ConjugationGradeResult {
  return gradeTypedAnswers(
    rows.map((row) => row.answer),
    values,
    misses,
    'strict',
    caseSensitive,
  );
}

/** Reveal every form: fill each row with its expected answer and mark all correct. */
export function fillConjugationAnswers(rows: readonly ConjugationRow[]): ConjugationFillResult {
  const values: Record<number, string> = {};
  const checkedResults: Record<number, boolean> = {};
  for (let i = 0; i < rows.length; i += 1) {
    values[i] = rows[i]?.answer ?? '';
    checkedResults[i] = true;
  }
  return { values, checkedResults };
}
