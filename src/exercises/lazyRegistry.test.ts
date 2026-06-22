import { test, expect } from 'bun:test';
import { EXERCISE_REGISTRY, getExercise } from './lazyRegistry';

// The registry starts empty and fills one engine at a time (Phase B).
test('lazyRegistry: starts empty', () => {
  expect(Object.keys(EXERCISE_REGISTRY)).toHaveLength(0);
});

// An unregistered type resolves to undefined (callers handle it explicitly).
test('lazyRegistry: getExercise returns undefined for an unregistered type', () => {
  expect(getExercise('select')).toBeUndefined();
});
