/**
 * Tests for the pure character diff (diffChars). Rendering lives in <TextDiff>;
 * here we assert the data: kinds, order, the `correct` flag, and the edge cases
 * (empty inputs, pure insert, pure delete).
 */
import { expect, test } from 'vitest';
import { diffChars, type DiffKind } from './charDiff';

const kinds = (actual: string, expected: string): DiffKind[] =>
  diffChars(actual, expected).parts.map((p) => p.kind);

const chars = (actual: string, expected: string): string =>
  diffChars(actual, expected)
    .parts.map((p) => p.char)
    .join('');

test('diffChars: identical strings are all "same" and correct', () => {
  const result = diffChars('chat', 'chat');
  expect(result.correct).toBe(true);
  expect(result.parts.map((p) => p.kind)).toEqual(['same', 'same', 'same', 'same']);
});

test('diffChars: empty vs empty is correct with no parts', () => {
  expect(diffChars('', '')).toEqual({ parts: [], correct: true });
});

test('diffChars: empty answer against expected is all inserted, not correct', () => {
  expect(kinds('', 'chat')).toEqual(['inserted', 'inserted', 'inserted', 'inserted']);
  expect(diffChars('', 'chat').correct).toBe(false);
});

test('diffChars: extra typed characters are deleted, not correct', () => {
  expect(kinds('chatx', 'chat')).toEqual(['same', 'same', 'same', 'same', 'deleted']);
  expect(diffChars('chatx', 'chat').correct).toBe(false);
});

test('diffChars: a substitution shows both the wrong and the missing char', () => {
  // "chien" vs "chats": shared "ch", then divergence — must be marked, not correct.
  const result = diffChars('chien', 'chats');
  expect(result.correct).toBe(false);
  expect(
    result.parts
      .filter((p) => p.kind === 'same')
      .map((p) => p.char)
      .join(''),
  ).toBe('ch');
});

test('diffChars: rendered chars reconstruct expected from same+inserted', () => {
  const result = diffChars('cat', 'chat');
  const reconstructed = result.parts
    .filter((p) => p.kind === 'same' || p.kind === 'inserted')
    .map((p) => p.char)
    .join('');
  expect(reconstructed).toBe('chat');
});

test('diffChars: keys are unique within a result', () => {
  const { parts } = diffChars('chien', 'chat');
  const keys = parts.map((p) => p.key);
  expect(new Set(keys).size).toBe(keys.length);
});

test('diffChars: typed chars reconstruct actual from same+deleted', () => {
  const result = diffChars('catx', 'cat');
  const reconstructed = result.parts
    .filter((p) => p.kind === 'same' || p.kind === 'deleted')
    .map((p) => p.char)
    .join('');
  expect(reconstructed).toBe('catx');
  // sanity: the `chars` helper walks every part in order
  expect(chars('catx', 'cat').length).toBe(result.parts.length);
});
