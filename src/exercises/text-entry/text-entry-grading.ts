/**
 * text-entry-grading.ts — pure grading for the typed-response table engines
 * (typed-transform #5, dictation #6). Extracted verbatim from TextEntryRuntime's
 * handleCheck / handleShowAnswers so the compute is testable without a DOM: the
 * component keeps the reducer/dispatch and calls these to produce the next state.
 *
 * Both functions normalize per `mode` (strict → normalizeAnswer; dictation →
 * normalizeForDictation) and produce a character diff per graded row via diffChars.
 * gradeTextEntry skips rows the learner left blank; fillAnswers reveals every row.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §7, §8, §9.
 */
import {
  gradeTypedAnswers,
  type ComparisonMode,
  type TypedGradeResult,
} from '@/exercises/lib/answer-feedback';
import type { TextEntryRow } from './text-entry-schema';

export type { ComparisonMode };

export type TextEntryGradeResult = TypedGradeResult;

export interface TextEntryFillResult {
  /** rowIndex → the revealed expected answer. */
  values: Record<number, string>;
  /** rowIndex → true for every row. */
  checkedResults: Record<number, boolean>;
}

/**
 * Grade typed answers against the rows' answers under `mode` (dictation also ignores
 * sentence punctuation), capitals ignored unless `caseSensitive`. Empty rows are
 * skipped. `misses` carries each row's wrong Checks so far: the first gets a hint,
 * the second the answer (answer-feedback).
 */
export function gradeTextEntry(
  rows: readonly TextEntryRow[],
  values: Record<number, string>,
  mode: ComparisonMode,
  misses: Readonly<Record<number, number>> = {},
  caseSensitive = false,
): TextEntryGradeResult {
  return gradeTypedAnswers(
    rows.map((row) => row.answer),
    values,
    misses,
    mode,
    caseSensitive,
  );
}

/** Reveal every answer: fill each row's value with its expected answer, all correct. */
export function fillAnswers(rows: readonly TextEntryRow[]): TextEntryFillResult {
  const values: Record<number, string> = {};
  const checkedResults: Record<number, boolean> = {};
  rows.forEach((row, index) => {
    values[index] = row.answer;
    checkedResults[index] = true;
  });
  return { values, checkedResults };
}
