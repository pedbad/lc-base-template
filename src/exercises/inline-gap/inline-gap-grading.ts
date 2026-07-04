/**
 * inline-gap-grading.ts — pure grading for the typed inline-cloze engine (#4).
 * Extracted from InlineTypedGapExercise's handleCheck / handleShowAnswers so the
 * compute is testable without a DOM. Answers are TYPED and compared with
 * normalizeAnswer (accent-strict, apostrophe/whitespace-tolerant); a character diff
 * is produced per graded blank via diffChars. gradeInlineGap skips blanks the
 * learner left blank; fillInlineGapAnswers reveals every expected answer.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §7, §8.
 */
import { normalizeAnswer } from '@/exercises/lib/answers';
import { diffChars, type DiffPart } from '@/exercises/lib/charDiff';
import type { InputMeta } from '@/exercises/lib/parsing';

export interface InlineGapGradeResult {
  /** blankIndex → correct? Only filled blanks are present. */
  checkedResults: Record<number, boolean>;
  /** blankIndex → character diff parts for each graded blank. */
  diffs: Record<number, DiffPart[]>;
}

export interface InlineGapFillResult extends InlineGapGradeResult {
  /** blankIndex → the revealed expected answer. */
  values: Record<number, string>;
}

/**
 * Grade typed answers against each blank's expected text (normalizeAnswer). Blanks
 * whose value is empty or whitespace-only are skipped — only filled blanks appear.
 */
export function gradeInlineGap(
  blanksMeta: readonly InputMeta[],
  values: Record<number, string>,
  nToSolve: number,
): InlineGapGradeResult {
  const checkedResults: Record<number, boolean> = {};
  const diffs: Record<number, DiffPart[]> = {};
  for (let i = 0; i < nToSolve; i += 1) {
    const value = values[i] ?? '';
    if (value.trim() === '') continue; // grade only blanks the learner filled
    const normalizedAnswer = normalizeAnswer(value);
    const normalizedExpected = normalizeAnswer(blanksMeta[i]?.expected ?? '');
    checkedResults[i] = normalizedAnswer === normalizedExpected;
    diffs[i] = diffChars(normalizedAnswer, normalizedExpected).parts;
  }
  return { checkedResults, diffs };
}

/**
 * Reveal every answer: fill each blank with its expected text, mark all correct, and
 * produce the (trivially matching) diff for each blank.
 */
export function fillInlineGapAnswers(
  blanksMeta: readonly InputMeta[],
  nToSolve: number,
): InlineGapFillResult {
  const values: Record<number, string> = {};
  const checkedResults: Record<number, boolean> = {};
  const diffs: Record<number, DiffPart[]> = {};
  for (let i = 0; i < nToSolve; i += 1) {
    const expected = blanksMeta[i]?.expected ?? '';
    values[i] = expected;
    checkedResults[i] = true;
    diffs[i] = diffChars(expected, expected).parts; // all 'same'
  }
  return { values, checkedResults, diffs };
}
