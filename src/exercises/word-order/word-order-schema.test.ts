import { test, expect } from 'vitest';
import { WordOrderContentSchema, WordOrderExerciseConfigSchema } from './word-order-schema';

test('word-order: accepts a valid config', () => {
  const parsed = WordOrderExerciseConfigSchema.safeParse({
    type: 'word-order',
    content: {
      words: ['Yo', 'como', 'una', 'manzana'],
      footnote: 'Ordena las palabras.',
    },
  });
  expect(parsed.success).toBe(true);
});

test('word-order: allows optional audio', () => {
  const parsed = WordOrderContentSchema.safeParse({
    words: ['Ella', 'vive', 'en', 'Madrid'],
    audio: 'audio/word-order/q1.mp4',
  });
  expect(parsed.success).toBe(true);
});

test('word-order: rejects fewer than two words', () => {
  const parsed = WordOrderContentSchema.safeParse({ words: ['Hola'] });
  expect(parsed.success).toBe(false);
});

test('word-order: rejects an empty word string', () => {
  const parsed = WordOrderContentSchema.safeParse({ words: ['Yo', ''] });
  expect(parsed.success).toBe(false);
});

test('word-order: rejects the wrong type literal', () => {
  const parsed = WordOrderExerciseConfigSchema.safeParse({
    type: 'select',
    content: { words: ['Yo', 'como'] },
  });
  expect(parsed.success).toBe(false);
});
