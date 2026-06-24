import { test, expect } from 'bun:test';
import { EXERCISE_REGISTRY, getExercise } from './lazyRegistry';

// The registry fills one engine at a time (Phase B). `select` (#1) is registered.
test('lazyRegistry: registers the select engine', () => {
  expect(getExercise('select')).toBeDefined();
  expect(Object.keys(EXERCISE_REGISTRY)).toContain('select');
});

// `inline-choice` (#2) is registered.
test('lazyRegistry: registers the inline-choice engine', () => {
  expect(getExercise('inline-choice')).toBeDefined();
  expect(Object.keys(EXERCISE_REGISTRY)).toContain('inline-choice');
});

// `radio-quiz` (#3) is registered.
test('lazyRegistry: registers the radio-quiz engine', () => {
  expect(getExercise('radio-quiz')).toBeDefined();
  expect(Object.keys(EXERCISE_REGISTRY)).toContain('radio-quiz');
});

// A type whose engine is not ported yet resolves to undefined (callers handle it).
test('lazyRegistry: getExercise returns undefined for an unported type', () => {
  expect(getExercise('dictation')).toBeUndefined();
});
