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
import { normalizeAnswer, normalizeForDictation } from '@/exercises/lib/answers';
import { diffChars, type DiffPart } from '@/exercises/lib/charDiff';
import type { TextEntryRow } from './text-entry-schema';

export type ComparisonMode = 'strict' | 'dictation';

/** Pick the normalizer for a comparison mode. */
const normalizerFor = (mode: ComparisonMode): ((value?: string) => string) =>
  mode === 'dictation' ? normalizeForDictation : normalizeAnswer;

export interface TextEntryGradeResult {
  /** rowIndex → correct? Only rows the learner filled are present. */
  checkedResults: Record<number, boolean>;
  /** rowIndex → character diff parts for each graded row. */
  diffs: Record<number, DiffPart[]>;
}

export interface TextEntryFillResult extends TextEntryGradeResult {
  /** rowIndex → the revealed expected answer. */
  values: Record<number, string>;
}

/**
 * Grade typed answers against expected row answers under `mode`. Rows whose value
 * is empty or whitespace-only are skipped (not graded) — only rows the learner
 * filled appear in the result.
 */
export function gradeTextEntry(
  rows: readonly TextEntryRow[],
  values: Record<number, string>,
  mode: ComparisonMode,
): TextEntryGradeResult {
  const normalize = normalizerFor(mode);
  const checkedResults: Record<number, boolean> = {};
  const diffs: Record<number, DiffPart[]> = {};
  for (let i = 0; i < rows.length; i += 1) {
    const value = values[i] ?? '';
    if (value.trim() === '') continue; // grade only rows the learner filled
    const normalizedAnswer = normalize(value);
    const normalizedExpected = normalize(rows[i].answer);
    checkedResults[i] = normalizedAnswer === normalizedExpected;
    diffs[i] = diffChars(normalizedAnswer, normalizedExpected).parts;
  }
  return { checkedResults, diffs };
}

/**
 * Reveal every answer: fill each row's value with its expected answer, mark all
 * correct, and produce the (trivially matching) diff for each row.
 */
export function fillAnswers(
  rows: readonly TextEntryRow[],
  mode: ComparisonMode,
): TextEntryFillResult {
  const normalize = normalizerFor(mode);
  const values: Record<number, string> = {};
  const checkedResults: Record<number, boolean> = {};
  const diffs: Record<number, DiffPart[]> = {};
  for (let i = 0; i < rows.length; i += 1) {
    const expected = rows[i].answer;
    values[i] = expected;
    checkedResults[i] = true;
    diffs[i] = diffChars(normalize(expected), normalize(expected)).parts;
  }
  return { values, checkedResults, diffs };
}
