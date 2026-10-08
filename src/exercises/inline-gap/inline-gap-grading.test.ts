import { test, expect } from 'vitest';

import type { InputMeta } from '@/exercises/lib/parsing';
import { gradeInlineGap, fillInlineGapAnswers } from './inline-gap-grading';

const meta = (expected: string): InputMeta => ({ expected, placeholder: '', widthCh: 8 });

test('gradeInlineGap: correct typed answer passes', () => {
  expect(gradeInlineGap([meta('chat')], { 0: 'chat' }, 1).checkedResults[0]).toBe(true);
});

test('gradeInlineGap: wrong typed answer fails', () => {
  expect(gradeInlineGap([meta('chat')], { 0: 'chien' }, 1).checkedResults[0]).toBe(false);
});

test('gradeInlineGap: accent-sensitive (é ≠ e)', () => {
  expect(gradeInlineGap([meta('été')], { 0: 'ete' }, 1).checkedResults[0]).toBe(false);
});

test('gradeInlineGap: tolerates whitespace and apostrophe variants', () => {
  expect(gradeInlineGap([meta("l'eau")], { 0: '  l’eau  ' }, 1).checkedResults[0]).toBe(true);
});

test('gradeInlineGap: empty/whitespace-only blanks are skipped', () => {
  const { checkedResults, feedback } = gradeInlineGap([meta('un'), meta('deux')], { 0: '   ' }, 2);
  expect(0 in checkedResults).toBe(false);
  expect(0 in feedback).toBe(false);
  expect(1 in checkedResults).toBe(false);
});

test('gradeInlineGap: only filled blanks appear', () => {
  const { checkedResults } = gradeInlineGap([meta('un'), meta('deux')], { 1: 'deux' }, 2);
  expect(checkedResults).toEqual({ 1: true });
});

// TODO §D15: a hint on the first wrong Check, the answer on the second.
test('gradeInlineGap: a wrong blank gets a hint, then the answer', () => {
  const first = gradeInlineGap([meta('chat')], { 0: 'chien' }, 1);
  expect(first.feedback[0]?.kind).toBe('hint');
  expect(gradeInlineGap([meta('chat')], { 0: 'chien' }, 1, first.misses).feedback[0]?.kind).toBe(
    'reveal',
  );
});

test('fillInlineGapAnswers: reveals expected answers, all correct', () => {
  const { values, checkedResults } = fillInlineGapAnswers([meta('un'), meta('deux')], 2);
  expect(values).toEqual({ 0: 'un', 1: 'deux' });
  expect(checkedResults).toEqual({ 0: true, 1: true });
});

test('fillInlineGapAnswers: missing meta yields empty-string value', () => {
  expect(fillInlineGapAnswers([], 1).values[0]).toBe('');
});
