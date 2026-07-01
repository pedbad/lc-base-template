import { test, expect } from 'bun:test';
import {
  PhraseReorderContentSchema,
  PhraseReorderExerciseConfigSchema,
} from './phrase-reorder-schema';

test('phrase-reorder: accepts a valid config', () => {
  const parsed = PhraseReorderExerciseConfigSchema.safeParse({
    type: 'phrase-reorder',
    content: {
      rows: [
        { phrase: 'Buenos días', prompt: 'Good morning' },
        { phrase: '¿Cómo estás?', prompt: 'How are you?' },
        { phrase: 'Hasta luego', prompt: 'See you later' },
      ],
      footnote: 'Ordena las frases.',
    },
  });
  expect(parsed.success).toBe(true);
});

test('phrase-reorder: allows optional audio and omitted prompt', () => {
  const parsed = PhraseReorderContentSchema.safeParse({
    rows: [{ phrase: 'Buenos días', audio: 'audio/phrase-reorder/q1.wav' }, { phrase: 'Adiós' }],
  });
  expect(parsed.success).toBe(true);
});

test('phrase-reorder: rejects fewer than two rows', () => {
  const parsed = PhraseReorderContentSchema.safeParse({ rows: [{ phrase: 'Hola' }] });
  expect(parsed.success).toBe(false);
});

test('phrase-reorder: rejects an empty phrase string', () => {
  const parsed = PhraseReorderContentSchema.safeParse({
    rows: [{ phrase: 'Hola' }, { phrase: '' }],
  });
  expect(parsed.success).toBe(false);
});

test('phrase-reorder: rejects the wrong type literal', () => {
  const parsed = PhraseReorderExerciseConfigSchema.safeParse({
    type: 'word-order',
    content: { rows: [{ phrase: 'Hola' }, { phrase: 'Adiós' }] },
  });
  expect(parsed.success).toBe(false);
});
