/**
 * Tests for the conjugation engine's pure grading (design §5, engine #4.3). Answers
 * are TYPED and compared with normalizeAnswer (accent-strict, apostrophe/whitespace-
 * tolerant), mirroring inline-gap. gradeConjugation grades only rows the learner
 * filled; fillConjugationAnswers reveals every expected form.
 */
import { describe, expect, test } from 'vitest';
import { fillConjugationAnswers, gradeConjugation } from './conjugation-grading';
import type { ConjugationRow } from './conjugation-schema';

const rows: ConjugationRow[] = [
  { person: 'je', answer: 'suis' },
  { person: 'tu', answer: 'es' },
];

describe('gradeConjugation', () => {
  test('marks a correct typed form right', () => {
    const { checkedResults } = gradeConjugation(rows, { 0: 'suis' });
    expect(checkedResults[0]).toBe(true);
  });

  test('is accent-strict (etes ≠ êtes)', () => {
    const accented: ConjugationRow[] = [{ person: 'vous', answer: 'êtes' }];
    expect(gradeConjugation(accented, { 0: 'etes' }).checkedResults[0]).toBe(false);
    expect(gradeConjugation(accented, { 0: 'êtes' }).checkedResults[0]).toBe(true);
  });

  test('skips rows the learner left blank or whitespace-only', () => {
    const { checkedResults, diffs } = gradeConjugation(rows, { 0: 'suis', 1: '  ' });
    expect(checkedResults[0]).toBe(true);
    expect(checkedResults[1]).toBeUndefined();
    expect(diffs[1]).toBeUndefined();
  });
});

describe('fillConjugationAnswers', () => {
  test('reveals every expected form and marks all correct', () => {
    const { values, checkedResults } = fillConjugationAnswers(rows);
    expect(values[0]).toBe('suis');
    expect(values[1]).toBe('es');
    expect(checkedResults[0]).toBe(true);
    expect(checkedResults[1]).toBe(true);
  });
});
