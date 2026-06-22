/**
 * Tests for the select engine's content + config schemas. These tighten the loose
 * `content` from lo-schema's ExerciseConfigSchema (spec §8.2) for `type: 'select'`.
 */
import { describe, expect, test } from 'bun:test';
import { SelectContentSchema, SelectExerciseConfigSchema } from './select-schema';

describe('SelectContentSchema', () => {
  test('parses minimal valid content and defaults layoutMode to "rows"', () => {
    const parsed = SelectContentSchema.parse({
      items: [{ text: 'Yo [soy|*es] aquí.' }],
    });
    expect(parsed.layoutMode).toBe('rows');
    expect(parsed.items).toHaveLength(1);
  });

  test('accepts the inline-passage layoutMode', () => {
    const parsed = SelectContentSchema.parse({
      items: [{ text: '[a|*b]' }],
      layoutMode: 'inline-passage',
    });
    expect(parsed.layoutMode).toBe('inline-passage');
  });

  test('rejects an unknown layoutMode', () => {
    expect(() =>
      SelectContentSchema.parse({ items: [{ text: '[a|*b]' }], layoutMode: 'grid' }),
    ).toThrow();
  });

  test('rejects an empty items array', () => {
    expect(() => SelectContentSchema.parse({ items: [] })).toThrow();
  });

  test('rejects an item with empty or missing text', () => {
    expect(() => SelectContentSchema.parse({ items: [{ text: '' }] })).toThrow();
    expect(() => SelectContentSchema.parse({ items: [{}] })).toThrow();
  });

  test('allows optional per-item audio and a footnote', () => {
    const parsed = SelectContentSchema.parse({
      items: [{ text: '[a|*b]', audio: '01-select/q1.mp3' }],
      footnote: 'Tip: gender agreement.',
    });
    expect(parsed.items[0].audio).toBe('01-select/q1.mp3');
    expect(parsed.footnote).toBe('Tip: gender agreement.');
  });
});

describe('SelectExerciseConfigSchema', () => {
  test('parses a full select exercise envelope', () => {
    const parsed = SelectExerciseConfigSchema.parse({
      type: 'select',
      content: { items: [{ text: '[a|*b]' }] },
      options: { shuffle: true },
      labels: { check: 'Comprobar' },
    });
    expect(parsed.type).toBe('select');
    expect(parsed.options?.shuffle).toBe(true);
    expect(parsed.labels?.check).toBe('Comprobar');
  });

  test('rejects a non-select type', () => {
    expect(() =>
      SelectExerciseConfigSchema.parse({
        type: 'dictation',
        content: { items: [{ text: '[a|*b]' }] },
      }),
    ).toThrow();
  });
});
