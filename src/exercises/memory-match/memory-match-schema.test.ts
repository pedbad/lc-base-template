import { test, expect } from 'vitest';
import {
  MemoryMatchExerciseConfigSchema,
  MemoryMatchContentSchema,
  memoryMatchItemKey,
} from './memory-match-schema';

test('memory-match: accepts a valid config with >=2 pairs', () => {
  const parsed = MemoryMatchExerciseConfigSchema.safeParse({
    type: 'memory-match',
    content: {
      items: [
        { text: 'el círculo', image: 'images/line-match/circle.svg', localLanguage: 'circle' },
        { text: 'el cuadrado', image: 'images/line-match/square.svg', localLanguage: 'square' },
      ],
      footnote: 'Empareja cada figura con su palabra.',
    },
  });
  expect(parsed.success).toBe(true);
});

test('memory-match: allows optional per-item audio', () => {
  const parsed = MemoryMatchContentSchema.safeParse({
    items: [
      { text: 'uno', image: 'images/a.svg', audio: 'audio/a.wav' },
      { text: 'dos', image: 'images/b.svg' },
    ],
  });
  expect(parsed.success).toBe(true);
});

test('memory-match: rejects fewer than 2 pairs', () => {
  const parsed = MemoryMatchContentSchema.safeParse({
    items: [{ text: 'solo', image: 'images/a.svg' }],
  });
  expect(parsed.success).toBe(false);
});

test('memory-match: rejects duplicate pair keys', () => {
  const parsed = MemoryMatchContentSchema.safeParse({
    items: [
      { text: 'igual', image: 'images/a.svg' },
      { text: 'igual', image: 'images/b.svg' },
    ],
  });
  expect(parsed.success).toBe(false);
  if (!parsed.success) expect(parsed.error.issues[0]?.message).toContain('unique');
});

test('memory-match: item key falls back from id to text', () => {
  expect(memoryMatchItemKey({ text: 'gato', image: 'x.svg' })).toBe('gato');
  expect(memoryMatchItemKey({ id: 'p1', text: 'gato', image: 'x.svg' })).toBe('p1');
});

test('memory-match: rejects the wrong type literal', () => {
  const parsed = MemoryMatchExerciseConfigSchema.safeParse({
    type: 'select',
    content: {
      items: [
        { text: 'a', image: 'a.svg' },
        { text: 'b', image: 'b.svg' },
      ],
    },
  });
  expect(parsed.success).toBe(false);
});
