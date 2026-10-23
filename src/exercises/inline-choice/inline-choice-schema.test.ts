/**
 * Tests for the inline-choice engine's content + config schemas. These tighten the
 * loose `content` from lo-schema's ExerciseConfigSchema (spec §8.2) for
 * `type: 'inline-choice'`. Unlike select, inline-choice has NO layoutMode — blanks
 * always render as inline radio-pill groups in flowing text.
 */
import { describe, expect, test } from 'vitest';
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

  // Audit 2026-10-23 (TODO §E34): the same `[a|*b|c]` blanks as select, the same check.
  test('rejects a blank with no correct option, on its own sentence', () => {
    const result = InlineChoiceContentSchema.safeParse({
      items: [{ text: 'Tú [*eres|es].' }, { text: 'Yo [soy|eres|es].' }],
    });
    expect(result.error?.issues.map((issue) => issue.path)).toEqual([['items', 1, 'text']]);
    expect(result.error?.issues[0].message).toContain('[soy|eres|es] has no correct option');
  });

  test('rejects an exercise with no blank at all', () => {
    const result = InlineChoiceContentSchema.safeParse({ items: [{ text: 'Vivo en Madrid.' }] });
    expect(result.error?.issues[0].message).toContain('no sentence has a blank');
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
