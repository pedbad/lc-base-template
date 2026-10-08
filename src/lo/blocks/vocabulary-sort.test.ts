/**
 * vocabulary-sort.test.ts — Semantic | Alphabetical ordering for the vocabulary block
 * (maintainer, 2026-10-08, after french-lo-1's PhraseTable). Semantic is the authored
 * order; alphabetical sorts by the visible TERM in the course language, ignoring case
 * and accents; a second press reverses it (Z→A), as the reference does.
 */
import { describe, expect, test } from 'vitest';
import { nextSortMode, sortVocabulary } from './vocabulary-sort';

const items = [
  { term: 'Salut', gloss: 'hi' },
  { term: 'Ánimo', gloss: 'cheer up' },
  { term: 'bonjour', gloss: 'hello' },
  { term: 'Coucou', gloss: 'hi there' },
];
const terms = (list: readonly { term: string }[]) => list.map((item) => item.term);

describe('sortVocabulary', () => {
  test('semantic keeps the authored order', () => {
    expect(terms(sortVocabulary(items, 'semantic', 'es'))).toEqual([
      'Salut',
      'Ánimo',
      'bonjour',
      'Coucou',
    ]);
  });

  test('alphabetical sorts by term, ignoring case and accents', () => {
    expect(terms(sortVocabulary(items, 'alphabetical', 'es'))).toEqual([
      'Ánimo',
      'bonjour',
      'Coucou',
      'Salut',
    ]);
  });

  test('reverse is alphabetical backwards', () => {
    expect(terms(sortVocabulary(items, 'reverse', 'es'))).toEqual([
      'Salut',
      'Coucou',
      'bonjour',
      'Ánimo',
    ]);
  });

  test('never reorders the list it was given', () => {
    const copy = [...items];
    sortVocabulary(items, 'alphabetical', 'es');
    expect(items).toEqual(copy);
  });
});

describe('nextSortMode', () => {
  test('Semantic always goes back to the authored order', () => {
    expect(nextSortMode('alphabetical', 'semantic')).toBe('semantic');
    expect(nextSortMode('reverse', 'semantic')).toBe('semantic');
  });

  test('Alphabetical turns it on, then toggles A→Z and Z→A', () => {
    expect(nextSortMode('semantic', 'alphabetical')).toBe('alphabetical');
    expect(nextSortMode('alphabetical', 'alphabetical')).toBe('reverse');
    expect(nextSortMode('reverse', 'alphabetical')).toBe('alphabetical');
  });
});
