/**
 * Tests for the shared sentence parser (parseSentence) and the choice-blank
 * handler (parseChoiceBlank). These power every fill-blank engine; `select` is
 * the first consumer (winner marked by a `*` prefix: `[suis|*es|est]`).
 */
import { describe, expect, test } from 'bun:test';
import { parseChoiceBlank, parseSentence, type ChoiceMeta } from './parsing';

describe('parseChoiceBlank', () => {
  test('splits options and finds the *-marked winner', () => {
    const { meta, segment } = parseChoiceBlank('suis|*es|est', 0);
    expect(meta.options).toEqual(['suis', 'es', 'est']);
    expect(meta.winner).toBe(1);
    expect(segment).toEqual({ blankIndex: 0, key: 'choice-0', type: 'choice' });
  });

  test('trims whitespace and decodes entities in options', () => {
    const { meta } = parseChoiceBlank(' a | *b&apos;c | d ', 0);
    expect(meta.options).toEqual(['a', "b'c", 'd']);
    expect(meta.winner).toBe(1);
  });

  test('winner is -1 when no option is marked', () => {
    const { meta } = parseChoiceBlank('uno|dos|tres', 3);
    expect(meta.winner).toBe(-1);
  });

  test('uses the supplied blankIndex in the segment key', () => {
    const { segment } = parseChoiceBlank('a|*b', 7);
    expect(segment.blankIndex).toBe(7);
    expect(segment.key).toBe('choice-7');
  });
});

describe('parseSentence', () => {
  test('returns a single text segment when there are no blanks', () => {
    const { segments, nextBlankIndex } = parseSentence('Hola mundo', {
      parseBlank: parseChoiceBlank,
    });
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ type: 'text', value: 'Hola mundo' });
    expect(nextBlankIndex).toBe(0);
  });

  test('splits text around a choice blank and emits the choice segment', () => {
    const blanksMeta: ChoiceMeta[] = [];
    const { segments, nextBlankIndex } = parseSentence('Yo [soy|*es] aquí.', {
      blanksMeta,
      parseBlank: parseChoiceBlank,
    });
    expect(segments.map((s) => s.type)).toEqual(['text', 'choice', 'text']);
    expect(segments[0]).toMatchObject({ type: 'text', value: 'Yo ' });
    expect(segments[2]).toMatchObject({ type: 'text', value: ' aquí.' });
    expect(nextBlankIndex).toBe(1);
    expect(blanksMeta[0]).toEqual({ options: ['soy', 'es'], winner: 1 });
  });

  test('numbers multiple blanks and continues from startBlankIndex', () => {
    const blanksMeta: ChoiceMeta[] = [];
    const { segments, nextBlankIndex } = parseSentence('[a|*b] y [*c|d]', {
      startBlankIndex: 2,
      blanksMeta,
      parseBlank: parseChoiceBlank,
    });
    const choices = segments.filter((s) => s.type === 'choice');
    expect(choices.map((s) => (s as { blankIndex: number }).blankIndex)).toEqual([2, 3]);
    expect(nextBlankIndex).toBe(4);
    expect(blanksMeta[2]).toEqual({ options: ['a', 'b'], winner: 1 });
    expect(blanksMeta[3]).toEqual({ options: ['c', 'd'], winner: 0 });
  });

  test('decodes HTML entities in text segments', () => {
    const { segments } = parseSentence('l&apos;agua [es|*está]', {
      parseBlank: parseChoiceBlank,
    });
    expect(segments[0]).toMatchObject({ type: 'text', value: "l'agua " });
  });

  test('emits a trailing text segment after the last blank', () => {
    const { segments } = parseSentence('[a|*b] fin', { parseBlank: parseChoiceBlank });
    expect(segments[segments.length - 1]).toMatchObject({ type: 'text', value: ' fin' });
  });
});
