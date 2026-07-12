import { test, expect } from 'vitest';
import {
  FlashcardsExerciseConfigSchema,
  FlashcardsContentSchema,
  FlashcardsOptionsSchema,
} from './flashcards-schema';

test('flashcards: accepts a valid config with one or more cards', () => {
  const parsed = FlashcardsExerciseConfigSchema.safeParse({
    type: 'flashcards',
    content: {
      cards: [
        { target: 'el perro', native: 'the dog' },
        { target: 'el gato', native: 'the cat' },
      ],
    },
  });
  expect(parsed.success).toBe(true);
});

test('flashcards: rejects an empty deck', () => {
  const parsed = FlashcardsContentSchema.safeParse({ cards: [] });
  expect(parsed.success).toBe(false);
});

test('flashcards: rejects a card missing target or native', () => {
  const noTarget = FlashcardsContentSchema.safeParse({ cards: [{ native: 'the dog' }] });
  const noNative = FlashcardsContentSchema.safeParse({ cards: [{ target: 'el perro' }] });
  expect(noTarget.success).toBe(false);
  expect(noNative.success).toBe(false);
});

test('flashcards: options default to Spanish→English, unlocked, no SRS', () => {
  const options = FlashcardsOptionsSchema.parse({});
  expect(options.direction).toBe('target-native');
  expect(options.lockDirection).toBe(false);
  expect(options.srs).toBe(false);
  expect(options.shuffle).toBe(false);
});

test('flashcards: options accept an author direction lock', () => {
  const parsed = FlashcardsOptionsSchema.safeParse({
    direction: 'native-target',
    lockDirection: true,
    shuffle: true,
  });
  expect(parsed.success).toBe(true);
  if (parsed.success) {
    expect(parsed.data.direction).toBe('native-target');
    expect(parsed.data.lockDirection).toBe(true);
  }
});

test('flashcards: rejects an unknown direction', () => {
  const parsed = FlashcardsOptionsSchema.safeParse({ direction: 'sideways' });
  expect(parsed.success).toBe(false);
});

test('flashcards: rejects the wrong type literal', () => {
  const parsed = FlashcardsExerciseConfigSchema.safeParse({
    type: 'memory-match',
    content: { cards: [{ target: 'a', native: 'b' }] },
  });
  expect(parsed.success).toBe(false);
});

test('flashcards: allows optional per-card image and audio', () => {
  const parsed = FlashcardsContentSchema.safeParse({
    cards: [
      { target: 'la casa', native: 'the house', image: 'images/x.svg', audio: 'audio/x.m4a' },
    ],
  });
  expect(parsed.success).toBe(true);
});
