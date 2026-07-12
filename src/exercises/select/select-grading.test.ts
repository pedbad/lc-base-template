import { test, expect } from 'vitest';

import type { ChoiceMeta } from '@/exercises/lib/parsing';
import { gradeSelect, fillSelectAnswers } from './select-grading';

const meta = (winner: number, ...options: string[]): ChoiceMeta => ({ options, winner });

test('gradeSelect: selecting the winner is correct', () => {
  const blanks = [meta(1, 'a', 'b', 'c')];
  const results = gradeSelect(blanks, { 0: '1' }, 1);
  expect(results[0]).toBe(true);
});

test('gradeSelect: selecting a non-winner is wrong', () => {
  const blanks = [meta(1, 'a', 'b', 'c')];
  const results = gradeSelect(blanks, { 0: '0' }, 1);
  expect(results[0]).toBe(false);
});

test('gradeSelect: unselected blanks (undefined) are skipped', () => {
  const blanks = [meta(0, 'a', 'b'), meta(1, 'x', 'y')];
  const results = gradeSelect(blanks, { 1: '1' }, 2);
  expect(0 in results).toBe(false);
  expect(results[1]).toBe(true);
});

test('gradeSelect: empty-string selection is skipped', () => {
  const blanks = [meta(0, 'a', 'b')];
  const results = gradeSelect(blanks, { 0: '' }, 1);
  expect(0 in results).toBe(false);
});

test('gradeSelect: grades every attempted blank in a multi-blank row', () => {
  const blanks = [meta(0, 'a', 'b'), meta(1, 'x', 'y'), meta(2, 'p', 'q', 'r')];
  const results = gradeSelect(blanks, { 0: '0', 1: '0', 2: '2' }, 3);
  expect(results).toEqual({ 0: true, 1: false, 2: true });
});

test('gradeSelect: respects nToSolve bound (ignores extra values)', () => {
  const blanks = [meta(0, 'a', 'b')];
  const results = gradeSelect(blanks, { 0: '0', 1: '0' }, 1);
  expect(results).toEqual({ 0: true });
});

test('fillSelectAnswers: reveals each winner as a string value, all correct', () => {
  const blanks = [meta(2, 'a', 'b', 'c'), meta(0, 'x', 'y')];
  const { values, checkedResults } = fillSelectAnswers(blanks, 2);
  expect(values).toEqual({ 0: '2', 1: '0' });
  expect(checkedResults).toEqual({ 0: true, 1: true });
});

test('fillSelectAnswers: missing meta falls back to "-1"', () => {
  const { values } = fillSelectAnswers([], 1);
  expect(values[0]).toBe('-1');
});
