import { test, expect } from 'vitest';

import { gradeTextEntry, fillAnswers } from './text-entry-grading';
import type { TextEntryRow } from './text-entry-schema';

const rows = (...answers: string[]): TextEntryRow[] => answers.map((answer) => ({ answer }));

test('gradeTextEntry: correct answer passes', () => {
  const { checkedResults } = gradeTextEntry(rows('bonjour'), { 0: 'bonjour' }, 'strict');
  expect(checkedResults[0]).toBe(true);
});

test('gradeTextEntry: wrong answer fails', () => {
  const { checkedResults } = gradeTextEntry(rows('bonjour'), { 0: 'bonsoir' }, 'strict');
  expect(checkedResults[0]).toBe(false);
});

test('gradeTextEntry: strict mode is case-sensitive', () => {
  const { checkedResults } = gradeTextEntry(rows('Bonjour'), { 0: 'bonjour' }, 'strict');
  expect(checkedResults[0]).toBe(false);
});

test('gradeTextEntry: strict mode is accent-sensitive (é ≠ e)', () => {
  const { checkedResults } = gradeTextEntry(rows('élève'), { 0: 'eleve' }, 'strict');
  expect(checkedResults[0]).toBe(false);
});

test('gradeTextEntry: strict mode tolerates whitespace and apostrophe variants', () => {
  // normalizeAnswer collapses runs of whitespace, trims, and folds curly → straight '.
  const { checkedResults } = gradeTextEntry(rows("j'ai  faim"), { 0: '  j’ai   faim  ' }, 'strict');
  expect(checkedResults[0]).toBe(true);
});

test('gradeTextEntry: dictation mode ignores sentence punctuation and quotes', () => {
  const { checkedResults } = gradeTextEntry(
    rows('Bonjour, ça va ?'),
    { 0: 'Bonjour ça va' },
    'dictation',
  );
  expect(checkedResults[0]).toBe(true);
});

test('gradeTextEntry: dictation mode still fails on accent differences', () => {
  const { checkedResults } = gradeTextEntry(rows('ça va'), { 0: 'ca va' }, 'dictation');
  expect(checkedResults[0]).toBe(false);
});

test('gradeTextEntry: strict mode does NOT ignore punctuation (comma is significant)', () => {
  const { checkedResults } = gradeTextEntry(rows('oui, merci'), { 0: 'oui merci' }, 'strict');
  expect(checkedResults[0]).toBe(false);
});

test('gradeTextEntry: empty rows are skipped (not graded)', () => {
  const { checkedResults, diffs } = gradeTextEntry(rows('un', 'deux'), { 0: '' }, 'strict');
  expect(0 in checkedResults).toBe(false);
  expect(0 in diffs).toBe(false);
  expect(1 in checkedResults).toBe(false); // no value supplied → skipped
});

test('gradeTextEntry: whitespace-only rows are skipped (not graded)', () => {
  const { checkedResults, diffs } = gradeTextEntry(rows('un'), { 0: '   ' }, 'strict');
  expect(0 in checkedResults).toBe(false);
  expect(0 in diffs).toBe(false);
});

test('gradeTextEntry: only filled rows appear; others untouched', () => {
  const { checkedResults } = gradeTextEntry(
    rows('un', 'deux', 'trois'),
    { 0: 'un', 2: 'trios' },
    'strict',
  );
  expect(checkedResults).toEqual({ 0: true, 2: false });
});

test('gradeTextEntry: diff parts are produced for graded rows', () => {
  const { diffs } = gradeTextEntry(rows('chat'), { 0: 'chien' }, 'strict');
  expect(Array.isArray(diffs[0])).toBe(true);
  expect(diffs[0].length).toBeGreaterThan(0);
  // A mismatch yields at least one non-'same' part.
  expect(diffs[0].some((part) => part.kind !== 'same')).toBe(true);
});

test('gradeTextEntry: correct row diff is all "same" parts', () => {
  const { diffs } = gradeTextEntry(rows('chat'), { 0: 'chat' }, 'strict');
  expect(diffs[0].every((part) => part.kind === 'same')).toBe(true);
  expect(diffs[0].map((part) => part.char).join('')).toBe('chat');
});

test('fillAnswers: reveals every expected answer, all marked correct', () => {
  const { values, checkedResults } = fillAnswers(rows('un', 'deux'), 'strict');
  expect(values).toEqual({ 0: 'un', 1: 'deux' });
  expect(checkedResults).toEqual({ 0: true, 1: true });
});

test('fillAnswers: produces an all-"same" diff for every row', () => {
  const { diffs } = fillAnswers(rows('un', 'deux'), 'strict');
  expect(diffs[0].every((part) => part.kind === 'same')).toBe(true);
  expect(diffs[1].every((part) => part.kind === 'same')).toBe(true);
});

test('fillAnswers: dictation mode reveals raw answer verbatim as the value', () => {
  // The revealed *value* is the raw answer (what the learner sees typed in), even
  // though the diff is computed on the normalized form.
  const { values } = fillAnswers(rows('Bonjour, ça va ?'), 'dictation');
  expect(values[0]).toBe('Bonjour, ça va ?');
});
