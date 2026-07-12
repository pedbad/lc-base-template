/**
 * Tests for the radio-quiz engine's content + config schemas. These tighten the
 * loose `content` from lo-schema's ExerciseConfigSchema (spec §8.2) for
 * `type: 'radio-quiz'`. Unlike select/inline-choice, radio-quiz is NOT
 * blanks-in-a-sentence: it is multiple-choice QUESTIONS, each a `prompt` plus an
 * `options[]` array where exactly ONE option is marked correct with a `*` prefix
 * (the same `*` convention as `[a|*b|c]`, but on a plain option array).
 *
 * The single-correct invariant is enforced loud at load: a question with 0 or 2+
 * starred options is rejected, so bad authoring fails the build, not the browser.
 */
import { describe, expect, test } from 'vitest';
import {
  RadioQuizContentSchema,
  RadioQuizExerciseConfigSchema,
  parseStarredOptions,
} from './radio-quiz-schema';

describe('parseStarredOptions', () => {
  test('strips the `*` and reports the winner index', () => {
    const { labels, winnerIndex } = parseStarredOptions(['uno', '*dos', 'tres']);
    expect(labels).toEqual(['uno', 'dos', 'tres']);
    expect(winnerIndex).toBe(1);
  });

  test('reports winnerIndex -1 when no option is starred', () => {
    const { labels, winnerIndex } = parseStarredOptions(['uno', 'dos']);
    expect(labels).toEqual(['uno', 'dos']);
    expect(winnerIndex).toBe(-1);
  });
});

describe('RadioQuizContentSchema', () => {
  test('parses a question with exactly one starred option', () => {
    const parsed = RadioQuizContentSchema.parse({
      questions: [{ prompt: '¿Cómo se dice "hello"?', options: ['adiós', '*hola', 'gracias'] }],
    });
    expect(parsed.questions).toHaveLength(1);
    expect(parsed.questions[0].options).toEqual(['adiós', '*hola', 'gracias']);
  });

  test('rejects a question with no starred option', () => {
    expect(() =>
      RadioQuizContentSchema.parse({
        questions: [{ prompt: 'Pick one', options: ['a', 'b', 'c'] }],
      }),
    ).toThrow();
  });

  test('rejects a question with two or more starred options', () => {
    expect(() =>
      RadioQuizContentSchema.parse({
        questions: [{ prompt: 'Pick one', options: ['*a', '*b', 'c'] }],
      }),
    ).toThrow();
  });

  test('rejects an empty questions array', () => {
    expect(() => RadioQuizContentSchema.parse({ questions: [] })).toThrow();
  });

  test('rejects a question with fewer than two options', () => {
    expect(() =>
      RadioQuizContentSchema.parse({ questions: [{ prompt: 'Solo', options: ['*a'] }] }),
    ).toThrow();
    expect(() =>
      RadioQuizContentSchema.parse({ questions: [{ prompt: 'Empty', options: [] }] }),
    ).toThrow();
  });

  test('rejects a question with an empty prompt', () => {
    expect(() =>
      RadioQuizContentSchema.parse({ questions: [{ prompt: '', options: ['*a', 'b'] }] }),
    ).toThrow();
  });

  test('allows optional per-question explanation and audio, and a footnote', () => {
    const parsed = RadioQuizContentSchema.parse({
      questions: [
        {
          prompt: '¿Cuál es correcto?',
          options: ['*soy', 'eres'],
          explanation: '«Yo soy» — first person.',
          audio: '03-radio-quiz/q1.mp3',
        },
      ],
      footnote: 'Conjugación del verbo «ser».',
    });
    expect(parsed.questions[0].explanation).toBe('«Yo soy» — first person.');
    expect(parsed.questions[0].audio).toBe('03-radio-quiz/q1.mp3');
    expect(parsed.footnote).toBe('Conjugación del verbo «ser».');
  });
});

describe('RadioQuizExerciseConfigSchema', () => {
  test('parses a full radio-quiz exercise envelope', () => {
    const parsed = RadioQuizExerciseConfigSchema.parse({
      type: 'radio-quiz',
      content: { questions: [{ prompt: 'Q', options: ['*a', 'b'] }] },
      options: { shuffle: true },
      labels: { check: 'Comprobar' },
    });
    expect(parsed.type).toBe('radio-quiz');
    expect(parsed.options?.shuffle).toBe(true);
    expect(parsed.labels?.check).toBe('Comprobar');
  });

  test('rejects a non-radio-quiz type', () => {
    expect(() =>
      RadioQuizExerciseConfigSchema.parse({
        type: 'select',
        content: { questions: [{ prompt: 'Q', options: ['*a', 'b'] }] },
      }),
    ).toThrow();
  });
});
