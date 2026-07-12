/**
 * Tests for the reading engine's pure grading (design §6, engine #4.4). Covers the
 * reading-specific PREPARE step (radio + true-false → { options, winnerIndex }) and
 * that grade/fill aggregate correctly across the question set via the delegated
 * radio-quiz grader.
 */
import { describe, expect, test } from 'vitest';
import { fillReadingAnswers, gradeReading, prepareReadingQuestions } from './reading-grading';
import type { ReadingQuestion } from './reading-schema';

const questions: ReadingQuestion[] = [
  { type: 'radio', prompt: '¿Color?', options: ['rojo', 'azul', 'verde'], answer: 'verde' },
  { type: 'true-false', prompt: 'Afirmación.', answer: true },
  { type: 'true-false', prompt: 'Otra.', answer: false },
];

describe('prepareReadingQuestions', () => {
  test('maps a radio answer to its option index', () => {
    const [radio] = prepareReadingQuestions(questions, 'Verdadero', 'Falso');
    expect(radio.options).toEqual(['rojo', 'azul', 'verde']);
    expect(radio.winnerIndex).toBe(2);
  });

  test('expands true-false into the two label options with the right winner', () => {
    const [, isTrue, isFalse] = prepareReadingQuestions(questions, 'Verdadero', 'Falso');
    expect(isTrue.options).toEqual(['Verdadero', 'Falso']);
    expect(isTrue.winnerIndex).toBe(0);
    expect(isFalse.winnerIndex).toBe(1);
  });

  test('carries the explanation through preparation', () => {
    const prepared = prepareReadingQuestions(
      [
        {
          type: 'radio',
          prompt: '¿?',
          options: ['a', 'b'],
          answer: 'a',
          explanation: 'Porque sí.',
        },
      ],
      'True',
      'False',
    );
    expect(prepared[0].explanation).toBe('Porque sí.');
  });
});

describe('gradeReading', () => {
  test('aggregates one result per answered question', () => {
    const prepared = prepareReadingQuestions(questions, 'Verdadero', 'Falso');
    // q0 correct (verde=idx2), q1 wrong (picked Falso=idx1 for a true), q2 skipped.
    const results = gradeReading(prepared, { 0: 2, 1: 1 });
    expect(results[0]).toBe(true);
    expect(results[1]).toBe(false);
    expect(results[2]).toBeUndefined();
  });
});

describe('fillReadingAnswers', () => {
  test('selects every winner and marks all correct', () => {
    const prepared = prepareReadingQuestions(questions, 'Verdadero', 'Falso');
    const { values, checkedResults } = fillReadingAnswers(prepared);
    expect(values).toEqual({ 0: 2, 1: 0, 2: 1 });
    expect(Object.values(checkedResults).every(Boolean)).toBe(true);
  });
});
