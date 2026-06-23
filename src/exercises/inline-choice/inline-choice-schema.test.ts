/**
 * Tests for the inline-choice engine's content + config schemas. These tighten the
 * loose `content` from lo-schema's ExerciseConfigSchema (spec §8.2) for
 * `type: 'inline-choice'`. Unlike select, inline-choice has NO layoutMode — blanks
 * always render as inline radio-pill groups in flowing text.
 */
import { describe, expect, test } from 'bun:test';
import {
  InlineChoiceContentSchema,
  InlineChoiceExerciseConfigSchema,
} from './inline-choice-schema';

describe('InlineChoiceContentSchema', () => {
  test('parses minimal valid content', () => {
    const parsed = InlineChoiceContentSchema.parse({
      items: [{ text: 'Yo [soy|*es] aquí.' }],
    });
    expect(parsed.items).toHaveLength(1);
  });

  test('rejects an empty items array', () => {
    expect(() => InlineChoiceContentSchema.parse({ items: [] })).toThrow();
  });

  test('rejects an item with empty or missing text', () => {
    expect(() => InlineChoiceContentSchema.parse({ items: [{ text: '' }] })).toThrow();
    expect(() => InlineChoiceContentSchema.parse({ items: [{}] })).toThrow();
  });

  test('allows optional per-item audio and a footnote', () => {
    const parsed = InlineChoiceContentSchema.parse({
      items: [{ text: '[a|*b]', audio: '02-inline-choice/q1.mp3' }],
      footnote: 'Tip: subject-verb agreement.',
    });
    expect(parsed.items[0].audio).toBe('02-inline-choice/q1.mp3');
    expect(parsed.footnote).toBe('Tip: subject-verb agreement.');
  });
});

describe('InlineChoiceExerciseConfigSchema', () => {
  test('parses a full inline-choice exercise envelope', () => {
    const parsed = InlineChoiceExerciseConfigSchema.parse({
      type: 'inline-choice',
      content: { items: [{ text: '[a|*b]' }] },
      options: { shuffle: true },
      labels: { check: 'Comprobar' },
    });
    expect(parsed.type).toBe('inline-choice');
    expect(parsed.options?.shuffle).toBe(true);
    expect(parsed.labels?.check).toBe('Comprobar');
  });

  test('rejects a non-inline-choice type', () => {
    expect(() =>
      InlineChoiceExerciseConfigSchema.parse({
        type: 'select',
        content: { items: [{ text: '[a|*b]' }] },
      }),
    ).toThrow();
  });
});
