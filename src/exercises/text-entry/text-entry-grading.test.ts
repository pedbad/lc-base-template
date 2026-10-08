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

// Maintainer, 2026-10-08 (TODO §D15): capitals no longer count by default; an exercise
// sets `options.caseSensitive` to make them count.
test('gradeTextEntry: strict mode ignores capitals by default', () => {
  const { checkedResults } = gradeTextEntry(rows('Bonjour'), { 0: 'bonjour' }, 'strict');
  expect(checkedResults[0]).toBe(true);
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
  const { checkedResults, feedback } = gradeTextEntry(rows('un', 'deux'), { 0: '' }, 'strict');
  expect(0 in checkedResults).toBe(false);
  expect(0 in feedback).toBe(false);
  expect(1 in checkedResults).toBe(false); // no value supplied → skipped
});

test('gradeTextEntry: whitespace-only rows are skipped (not graded)', () => {
  const { checkedResults, feedback } = gradeTextEntry(rows('un'), { 0: '   ' }, 'strict');
  expect(0 in checkedResults).toBe(false);
  expect(0 in feedback).toBe(false);
});

test('gradeTextEntry: only filled rows appear; others untouched', () => {
  const { checkedResults } = gradeTextEntry(
    rows('un', 'deux', 'trois'),
    { 0: 'un', 2: 'trios' },
    'strict',
  );
  expect(checkedResults).toEqual({ 0: true, 2: false });
});

// TODO §D15: a hint on the first wrong Check, the answer on the second.
test('gradeTextEntry: a wrong row gets a hint, then the answer', () => {
  const first = gradeTextEntry(rows('chat'), { 0: 'chats' }, 'strict');
  expect(first.feedback[0]).toEqual({ kind: 'hint', reason: 'ending' });

  const second = gradeTextEntry(rows('chat'), { 0: 'chats' }, 'strict', first.misses);
  expect(second.feedback[0]?.kind).toBe('reveal');
});

test('gradeTextEntry: a right row gets no feedback line', () => {
  expect(gradeTextEntry(rows('chat'), { 0: 'chat' }, 'strict').feedback).toEqual({});
});

test('gradeTextEntry: capitals count only when the author asks', () => {
  expect(gradeTextEntry(rows('Chat'), { 0: 'chat' }, 'strict').checkedResults[0]).toBe(true);
  expect(gradeTextEntry(rows('Chat'), { 0: 'chat' }, 'strict', {}, true).checkedResults[0]).toBe(
    false,
  );
});

test('fillAnswers: reveals every expected answer, all marked correct', () => {
  const { values, checkedResults } = fillAnswers(rows('un', 'deux'));
  expect(values).toEqual({ 0: 'un', 1: 'deux' });
  expect(checkedResults).toEqual({ 0: true, 1: true });
});

test('fillAnswers: reveals the raw answer verbatim as the value', () => {
  // The revealed *value* is the raw answer (what the learner sees typed in), even
  // though grading compares the normalized form.
  const { values } = fillAnswers(rows('Bonjour, ça va ?'));
  expect(values[0]).toBe('Bonjour, ça va ?');
});
