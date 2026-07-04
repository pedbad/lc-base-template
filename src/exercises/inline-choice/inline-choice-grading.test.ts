import { test, expect } from 'bun:test';

import type { ChoiceMeta } from '@/exercises/lib/parsing';
import { gradeInlineChoice, fillInlineChoiceAnswers } from './inline-choice-grading';

const meta = (winner: number, ...options: string[]): ChoiceMeta => ({ options, winner });

test('gradeInlineChoice: selecting the winner is correct', () => {
  expect(gradeInlineChoice([meta(1, 'a', 'b')], { 0: '1' }, 1)[0]).toBe(true);
});

test('gradeInlineChoice: selecting a non-winner is wrong', () => {
  expect(gradeInlineChoice([meta(1, 'a', 'b')], { 0: '0' }, 1)[0]).toBe(false);
});

test('gradeInlineChoice: unselected blanks (undefined) are skipped', () => {
  const results = gradeInlineChoice([meta(0, 'a'), meta(1, 'x', 'y')], { 1: '1' }, 2);
  expect(0 in results).toBe(false);
  expect(results[1]).toBe(true);
});

test('gradeInlineChoice: empty-string selection is skipped', () => {
  expect(0 in gradeInlineChoice([meta(0, 'a')], { 0: '' }, 1)).toBe(false);
});

test('gradeInlineChoice: grades a mix across blanks', () => {
  const results = gradeInlineChoice([meta(0, 'a'), meta(1, 'x', 'y')], { 0: '0', 1: '0' }, 2);
  expect(results).toEqual({ 0: true, 1: false });
});

test('fillInlineChoiceAnswers: reveals each winner as string, all correct', () => {
  const { values, checkedResults } = fillInlineChoiceAnswers(
    [meta(2, 'a', 'b', 'c'), meta(0, 'x')],
    2,
  );
  expect(values).toEqual({ 0: '2', 1: '0' });
  expect(checkedResults).toEqual({ 0: true, 1: true });
});

test('fillInlineChoiceAnswers: missing meta falls back to "-1"', () => {
  expect(fillInlineChoiceAnswers([], 1).values[0]).toBe('-1');
});
