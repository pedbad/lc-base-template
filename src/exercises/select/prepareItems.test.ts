/**
 * Tests for prepareSelectItems / shuffleItemChoices — the pure ordering layer for
 * the select engine's `options.shuffle` + `options.sampleSize` (spec §5.2, §6).
 * RNG is injected (mulberry32) so order is deterministic and assertable.
 */
import { describe, expect, test } from 'bun:test';
import { mulberry32 } from '@/exercises/lib/shuffle';
import { prepareSelectItems, shuffleItemChoices } from './prepareItems';
import type { SelectItem } from './select-schema';

const ITEMS: SelectItem[] = [
  { text: 'Yo [soy|*es|eres] aquí.' },
  { text: 'Tú [*tienes|tiene|tengo] razón.' },
  { text: 'Ella [come|*comes|comen].' },
  { text: 'Nosotros [vamos|*van|voy].' },
];

const optionSet = (text: string): string[] =>
  [...text.matchAll(/\[([^\]]+)\]/g)].flatMap((m) =>
    m[1].split('|').map((o) => o.replace('*', '').trim()),
  );

describe('shuffleItemChoices', () => {
  test('preserves the option set and the *-marked winner', () => {
    const out = shuffleItemChoices('Yo [soy|*es|eres] aquí.', mulberry32(5));
    const inner = out.match(/\[([^\]]+)\]/)![1];
    expect(
      inner
        .split('|')
        .map((o) => o.replace('*', '').trim())
        .sort(),
    ).toEqual(['eres', 'es', 'soy']);
    expect((out.match(/\*/g) || []).length).toBe(1);
    expect(out.includes('*es')).toBe(true);
  });

  test('leaves text without blanks untouched', () => {
    expect(shuffleItemChoices('Hola mundo', mulberry32(1))).toBe('Hola mundo');
  });

  test('is deterministic for a given seed', () => {
    const a = shuffleItemChoices('[a|b|*c|d|e]', mulberry32(99));
    const b = shuffleItemChoices('[a|b|*c|d|e]', mulberry32(99));
    expect(a).toBe(b);
  });
});

describe('prepareSelectItems', () => {
  test('shuffle off: returns the authored order, content unchanged', () => {
    const out = prepareSelectItems(ITEMS, { shuffle: false }, mulberry32(1));
    expect(out).toEqual(ITEMS);
  });

  test('shuffle off + sampleSize: takes the first N in authored order', () => {
    const out = prepareSelectItems(ITEMS, { shuffle: false, sampleSize: 2 }, mulberry32(1));
    expect(out).toEqual([ITEMS[0], ITEMS[1]]);
  });

  test('sampleSize larger than length returns all items', () => {
    const out = prepareSelectItems(ITEMS, { shuffle: false, sampleSize: 99 }, mulberry32(1));
    expect(out).toHaveLength(ITEMS.length);
  });

  test('shuffle on: same count, same overall option pool preserved', () => {
    const out = prepareSelectItems(ITEMS, { shuffle: true }, mulberry32(7));
    expect(out).toHaveLength(ITEMS.length);
    const poolBefore = ITEMS.flatMap((i) => optionSet(i.text)).sort();
    const poolAfter = out.flatMap((i) => optionSet(i.text)).sort();
    expect(poolAfter).toEqual(poolBefore);
  });

  test('shuffle on is deterministic for a given seed', () => {
    const a = prepareSelectItems(ITEMS, { shuffle: true }, mulberry32(42));
    const b = prepareSelectItems(ITEMS, { shuffle: true }, mulberry32(42));
    expect(a).toEqual(b);
  });

  test('does not mutate the input items or array', () => {
    const snapshot = JSON.parse(JSON.stringify(ITEMS));
    prepareSelectItems(ITEMS, { shuffle: true, sampleSize: 2 }, mulberry32(3));
    expect(ITEMS).toEqual(snapshot);
  });
});
