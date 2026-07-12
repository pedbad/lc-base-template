/**
 * Tests for the typed-transform envelope + the shared TextEntryContentSchema it uses
 * (spec §8, §9). typed-transform is a typed-response table: rows of an optional
 * prompt cue, an expected `answer`, and an optional audio clip.
 */
import { describe, expect, test } from 'vitest';
import { TextEntryContentSchema } from '../text-entry/text-entry-schema';
import { TypedTransformExerciseConfigSchema } from './typed-transform-schema';

describe('TextEntryContentSchema', () => {
  test('parses rows with prompt + answer', () => {
    const parsed = TextEntryContentSchema.parse({
      rows: [
        { prompt: 'el gato (singular)', answer: 'los gatos' },
        { prompt: 'la casa (singular)', answer: 'las casas' },
      ],
    });
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0].answer).toBe('los gatos');
  });

  test('allows audio-only rows (no prompt), column labels, and a footnote', () => {
    const parsed = TextEntryContentSchema.parse({
      rows: [{ answer: 'los gatos', audio: 'tt/q1.wav' }],
      columns: { prompt: 'Singular', answer: 'Plural' },
      footnote: 'Escribe el plural.',
    });
    expect(parsed.rows[0].prompt).toBeUndefined();
    expect(parsed.rows[0].audio).toBe('tt/q1.wav');
    expect(parsed.columns?.answer).toBe('Plural');
    expect(parsed.footnote).toBe('Escribe el plural.');
  });

  test('rejects an empty rows array', () => {
    expect(() => TextEntryContentSchema.parse({ rows: [] })).toThrow();
  });

  test('rejects a row with no answer', () => {
    expect(() => TextEntryContentSchema.parse({ rows: [{ prompt: 'x' }] })).toThrow();
  });
});

describe('TypedTransformExerciseConfigSchema', () => {
  test('parses a full typed-transform envelope', () => {
    const parsed = TypedTransformExerciseConfigSchema.parse({
      type: 'typed-transform',
      content: { rows: [{ prompt: 'el gato', answer: 'los gatos' }] },
      options: { allowShowAnswers: false },
      labels: { check: 'Comprobar' },
    });
    expect(parsed.type).toBe('typed-transform');
    expect(parsed.options?.allowShowAnswers).toBe(false);
    expect(parsed.labels?.check).toBe('Comprobar');
  });

  test('rejects a non-typed-transform type', () => {
    expect(() =>
      TypedTransformExerciseConfigSchema.parse({
        type: 'select',
        content: { rows: [{ answer: 'x' }] },
      }),
    ).toThrow();
  });
});
