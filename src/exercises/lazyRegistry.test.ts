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

// `inline-gap` (#4), `typed-transform` (#5) and `dictation` (#6) are registered.
test('lazyRegistry: registers the ported TextEntry-cluster engines', () => {
  expect(getExercise('inline-gap')).toBeDefined();
  expect(getExercise('typed-transform')).toBeDefined();
  expect(getExercise('dictation')).toBeDefined();
});

// `line-match` (#7) is registered.
test('lazyRegistry: registers the line-match engine', () => {
  expect(getExercise('line-match')).toBeDefined();
});

// `word-spot` (#8) is registered.
test('lazyRegistry: registers the word-spot engine', () => {
  expect(getExercise('word-spot')).toBeDefined();
});

// `memory-match` (#9) is registered.
test('lazyRegistry: registers the memory-match engine', () => {
  expect(getExercise('memory-match')).toBeDefined();
});

// `word-order` (#10) is registered.
test('lazyRegistry: registers the word-order engine', () => {
  expect(getExercise('word-order')).toBeDefined();
});

// A type whose engine is not ported yet resolves to undefined (callers handle it).
test('lazyRegistry: getExercise returns undefined for an unported type', () => {
  expect(getExercise('phrase-reorder')).toBeUndefined();
});
