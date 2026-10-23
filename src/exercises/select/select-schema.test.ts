/**
 * Tests for the select engine's content + config schemas. These tighten the loose
 * `content` from lo-schema's ExerciseConfigSchema (spec §8.2) for `type: 'select'`.
 */
import { describe, expect, test } from 'vitest';
import { parseChoiceBlank, parseSentence, type ChoiceMeta } from '@/exercises/lib/parsing';
import { fillSelectAnswers, gradeSelect } from './select-grading';
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

  // Audit 2026-10-23 (TODO §E34): each of these passed the build, and no learner could
  // answer it. The fault is named on the sentence that has it.
  test.each([
    ['no correct option', 'Yo [soy|eres|es] de Madrid.'],
    ['two correct options', 'Yo [*soy|*eres|es] de Madrid.'],
    ['an empty option', 'Yo [soy||*es] de Madrid.'],
    ['an unclosed bracket', 'Yo [*soy|eres de Madrid.'],
  ])('rejects a blank with %s, on its own sentence', (_fault, text) => {
    const result = SelectContentSchema.safeParse({ items: [{ text: 'Tú [*eres|es].' }, { text }] });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path)).toEqual([['items', 1, 'text']]);
  });

  test('says which blank has no correct option', () => {
    const result = SelectContentSchema.safeParse({ items: [{ text: 'Yo [soy|eres|es].' }] });
    expect(result.error?.issues[0].message).toContain('[soy|eres|es] has no correct option');
  });

  test('rejects an exercise with no blank at all', () => {
    const result = SelectContentSchema.safeParse({ items: [{ text: 'Vivo en Madrid.' }] });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('no sentence has a blank');
  });

  test('a blank it accepts grades its marked option correct, and only that one', () => {
    const { items } = SelectContentSchema.parse({ items: [{ text: 'Yo [soy|*es|eres] aquí.' }] });
    const blanksMeta: ChoiceMeta[] = [];
    const { nextBlankIndex } = parseSentence(items[0].text, {
      blanksMeta,
      parseBlank: parseChoiceBlank,
    });
    expect(gradeSelect(blanksMeta, { 0: '1' }, nextBlankIndex)).toEqual({ 0: true });
    expect(gradeSelect(blanksMeta, { 0: '0' }, nextBlankIndex)).toEqual({ 0: false });
    expect(fillSelectAnswers(blanksMeta, nextBlankIndex).values).toEqual({ 0: '1' });
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
