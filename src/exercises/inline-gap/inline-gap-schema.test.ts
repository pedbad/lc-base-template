/**
 * Tests for the inline-gap engine's content + config schemas (spec §8.2). inline-gap
 * is a TYPED cloze: sentences with `[expected::placeholder]` blanks the learner types
 * into. These assert the content shape and that the envelope pins `type: 'inline-gap'`.
 */
import { describe, expect, test } from 'bun:test';
import { InlineGapContentSchema, InlineGapExerciseConfigSchema } from './inline-gap-schema';

describe('InlineGapContentSchema', () => {
  test('parses items with typed blanks', () => {
    const parsed = InlineGapContentSchema.parse({
      items: [{ text: 'Yo me [llamo::llamarse] Ana.' }],
    });
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].text).toBe('Yo me [llamo::llamarse] Ana.');
  });

  test('allows optional prompt, audio, and footnote', () => {
    const parsed = InlineGapContentSchema.parse({
      items: [
        { text: 'Ella [tiene::tener] 20 años.', prompt: 'Conjuga el verbo.', audio: '04/q1.mp3' },
      ],
      footnote: 'Escribe la forma correcta.',
    });
    expect(parsed.items[0].prompt).toBe('Conjuga el verbo.');
    expect(parsed.items[0].audio).toBe('04/q1.mp3');
    expect(parsed.footnote).toBe('Escribe la forma correcta.');
  });

  test('rejects an empty items array', () => {
    expect(() => InlineGapContentSchema.parse({ items: [] })).toThrow();
  });

  test('rejects an item with an empty text', () => {
    expect(() => InlineGapContentSchema.parse({ items: [{ text: '' }] })).toThrow();
  });
});

describe('InlineGapExerciseConfigSchema', () => {
  test('parses a full inline-gap exercise envelope', () => {
    const parsed = InlineGapExerciseConfigSchema.parse({
      type: 'inline-gap',
      content: { items: [{ text: 'Je [mange::manger] du pain.' }] },
      options: { allowShowAnswers: false },
      labels: { check: 'Vérifier' },
    });
    expect(parsed.type).toBe('inline-gap');
    expect(parsed.options?.allowShowAnswers).toBe(false);
    expect(parsed.labels?.check).toBe('Vérifier');
  });

  test('rejects a non-inline-gap type', () => {
    expect(() =>
      InlineGapExerciseConfigSchema.parse({
        type: 'select',
        content: { items: [{ text: 'x [a::b] y' }] },
      }),
    ).toThrow();
  });
});
