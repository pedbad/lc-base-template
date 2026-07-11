/**
 * conjugation-grading.ts — pure grading for the conjugation-table engine (#4.3).
 * Answers are TYPED and compared with normalizeAnswer (accent-strict); mirrors
 * inline-gap-grading. View-free so it is unit-testable without a DOM.
 *
 * Spec: docs/specs/2026-07-03-new-exercise-engines-design.md §5; §7 (blank-grading).
 */
import { normalizeAnswer } from '@/exercises/lib/answers';
import { diffChars, type DiffPart } from '@/exercises/lib/charDiff';
import type { ConjugationRow } from './conjugation-schema';

export interface ConjugationGradeResult {
  /** rowIndex → correct? Only filled rows are present. */
  checkedResults: Record<number, boolean>;
  /** rowIndex → character diff parts for each graded row. */
  diffs: Record<number, DiffPart[]>;
}

export interface ConjugationFillResult extends ConjugationGradeResult {
  /** rowIndex → the revealed expected form. */
  values: Record<number, string>;
}

/**
 * Grade each typed form against its row's expected `answer` (normalizeAnswer). Rows
 * whose value is empty or whitespace-only are skipped — only filled rows appear.
 */
export function gradeConjugation(
  rows: readonly ConjugationRow[],
  values: Record<number, string>,
): ConjugationGradeResult {
  const checkedResults: Record<number, boolean> = {};
  const diffs: Record<number, DiffPart[]> = {};
  for (let i = 0; i < rows.length; i += 1) {
    const value = values[i] ?? '';
    if (value.trim() === '') continue; // grade only rows the learner filled
    const normalizedAnswer = normalizeAnswer(value);
    const normalizedExpected = normalizeAnswer(rows[i]?.answer ?? '');
    checkedResults[i] = normalizedAnswer === normalizedExpected;
    diffs[i] = diffChars(normalizedAnswer, normalizedExpected).parts;
  }
  return { checkedResults, diffs };
}

/**
 * Reveal every form: fill each row with its expected answer, mark all correct, and
 * produce the (trivially matching) diff for each row.
 */
export function fillConjugationAnswers(rows: readonly ConjugationRow[]): ConjugationFillResult {
  const values: Record<number, string> = {};
  const checkedResults: Record<number, boolean> = {};
  const diffs: Record<number, DiffPart[]> = {};
  for (let i = 0; i < rows.length; i += 1) {
    const expected = rows[i]?.answer ?? '';
    values[i] = expected;
    checkedResults[i] = true;
    diffs[i] = diffChars(expected, expected).parts; // all 'same'
  }
  return { values, checkedResults, diffs };
}
