import { test, expect } from 'vitest';
import { WordSpotExerciseConfigSchema, WordSpotContentSchema } from './word-spot-schema';

test('word-spot: accepts a valid config with bracketed targets', () => {
  const parsed = WordSpotExerciseConfigSchema.safeParse({
    type: 'word-spot',
    content: {
      items: [{ text: 'el ch[ic]o com[i]ó' }, { text: 'la cas[a] grande' }],
      footnote: 'Haz clic en el sonido objetivo.',
    },
  });
  expect(parsed.success).toBe(true);
});

test('word-spot: allows optional per-item audio', () => {
  const parsed = WordSpotContentSchema.safeParse({
    items: [{ text: 'h[o]la', audio: 'audio/word-spot/q1.wav' }],
  });
  expect(parsed.success).toBe(true);
});

test('word-spot: rejects content with no bracketed target', () => {
  const parsed = WordSpotContentSchema.safeParse({
    items: [{ text: 'no targets here' }],
  });
  expect(parsed.success).toBe(false);
  if (!parsed.success) {
    expect(parsed.error.issues[0]?.message).toContain('bracketed');
  }
});

test('word-spot: rejects an empty items array', () => {
  const parsed = WordSpotContentSchema.safeParse({ items: [] });
  expect(parsed.success).toBe(false);
});

test('word-spot: rejects the wrong type literal', () => {
  const parsed = WordSpotExerciseConfigSchema.safeParse({
    type: 'select',
    content: { items: [{ text: 'h[o]la' }] },
  });
  expect(parsed.success).toBe(false);
});
