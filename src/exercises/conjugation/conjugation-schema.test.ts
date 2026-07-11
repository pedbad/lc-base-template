/**
 * Tests for the conjugation engine's content + config schemas (design §5, engine
 * #4.3). Conjugation is a verb-paradigm grid: a given pronoun per row, a typed (v1)
 * or chosen (v2) verb form. These assert the content shape, the forward-compatible
 * `answerMode` + per-row `options`, and that the envelope pins `type: 'conjugation'`.
 */
import { describe, expect, test } from 'bun:test';
import { ConjugationContentSchema, ConjugationExerciseConfigSchema } from './conjugation-schema';

describe('ConjugationContentSchema', () => {
  test('parses a minimal verb + rows grid', () => {
    const parsed = ConjugationContentSchema.parse({
      verb: 'être',
      rows: [
        { person: 'je', answer: 'suis' },
        { person: 'tu', answer: 'es' },
      ],
    });
    expect(parsed.verb).toBe('être');
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0].answer).toBe('suis');
  });

  test('rejects an empty rows array', () => {
    expect(() => ConjugationContentSchema.parse({ verb: 'être', rows: [] })).toThrow();
  });

  test('rejects a row missing its answer', () => {
    expect(() =>
      ConjugationContentSchema.parse({ verb: 'être', rows: [{ person: 'je' }] }),
    ).toThrow();
  });

  test('accepts answerMode and per-row choice options (v2 forward-compat)', () => {
    const parsed = ConjugationContentSchema.parse({
      verb: 'être',
      answerMode: 'choice',
      rows: [{ person: 'je', answer: 'suis', options: ['suis', 'es', 'est', 'sont'] }],
    });
    expect(parsed.answerMode).toBe('choice');
    expect(parsed.rows[0].options).toEqual(['suis', 'es', 'est', 'sont']);
  });
});

describe('ConjugationExerciseConfigSchema', () => {
  test('parses a full envelope and rejects a non-conjugation type', () => {
    const parsed = ConjugationExerciseConfigSchema.parse({
      type: 'conjugation',
      content: { verb: 'parler', rows: [{ person: 'je', answer: 'parle' }] },
      options: { allowShowAnswers: false },
      labels: { check: 'Vérifier' },
    });
    expect(parsed.type).toBe('conjugation');
    expect(parsed.options?.allowShowAnswers).toBe(false);
    expect(() =>
      ConjugationExerciseConfigSchema.parse({
        type: 'select',
        content: { verb: 'être', rows: [{ person: 'je', answer: 'suis' }] },
      }),
    ).toThrow();
  });
});
