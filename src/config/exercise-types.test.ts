import { test, expect } from 'bun:test';
import { EXERCISE_TYPE_KEYS } from './exercise-types';

test('exercise-types: the 12 canonical kebab keys plus Phase C additions', () => {
  expect(EXERCISE_TYPE_KEYS).toEqual([
    'select',
    'inline-choice',
    'radio-quiz',
    'inline-gap',
    'typed-transform',
    'dictation',
    'word-order',
    'phrase-reorder',
    'drag-fill-gaps',
    'line-match',
    'memory-match',
    'word-spot',
    'flashcards',
    'conjugation',
    'reading',
  ]);
});

test('exercise-types: no duplicate keys', () => {
  expect(new Set(EXERCISE_TYPE_KEYS).size).toBe(EXERCISE_TYPE_KEYS.length);
});
