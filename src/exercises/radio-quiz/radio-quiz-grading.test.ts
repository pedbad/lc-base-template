import { test, expect } from 'vitest';

import { gradeRadioQuiz, fillRadioAnswers, type GradableQuestion } from './radio-quiz-grading';

const q = (...winnerIndices: number[]): GradableQuestion[] =>
  winnerIndices.map((winnerIndex) => ({ winnerIndex }));

test('gradeRadioQuiz: selecting the winner is correct', () => {
  const results = gradeRadioQuiz(q(2), { 0: 2 });
  expect(results[0]).toBe(true);
});

test('gradeRadioQuiz: selecting a non-winner is wrong', () => {
  const results = gradeRadioQuiz(q(2), { 0: 1 });
  expect(results[0]).toBe(false);
});

test('gradeRadioQuiz: option index 0 as winner grades correctly (not treated as unanswered)', () => {
  const results = gradeRadioQuiz(q(0), { 0: 0 });
  expect(results[0]).toBe(true);
});

test('gradeRadioQuiz: unanswered questions (undefined) are skipped', () => {
  const results = gradeRadioQuiz(q(0, 1), { 1: 1 });
  expect(0 in results).toBe(false);
  expect(results[1]).toBe(true);
});

test('gradeRadioQuiz: grades a mix of correct and wrong', () => {
  const results = gradeRadioQuiz(q(1, 0, 2), { 0: 1, 1: 1, 2: 2 });
  expect(results).toEqual({ 0: true, 1: false, 2: true });
});

test('fillRadioAnswers: reveals every winnerIndex, all correct', () => {
  const { values, checkedResults } = fillRadioAnswers(q(2, 0, 1));
  expect(values).toEqual({ 0: 2, 1: 0, 2: 1 });
  expect(checkedResults).toEqual({ 0: true, 1: true, 2: true });
});

test('fillRadioAnswers: empty question list yields empty maps', () => {
  const { values, checkedResults } = fillRadioAnswers([]);
  expect(values).toEqual({});
  expect(checkedResults).toEqual({});
});
