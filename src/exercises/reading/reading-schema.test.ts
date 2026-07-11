/**
 * Tests for the reading engine's content schema (design §6, engine #4.4). Guards the
 * composite shape: a passage plus a discriminated set of radio / true-false
 * questions, and the refine that a radio question's answer must be one of its options.
 */
import { describe, expect, test } from 'bun:test';
import { ReadingContentSchema, ReadingExerciseConfigSchema } from './reading-schema';

const validContent = {
  passage: 'El gato duerme en el sofá todo el día.',
  questions: [
    {
      type: 'radio',
      prompt: '¿Dónde duerme el gato?',
      options: ['En el sofá', 'En la cama'],
      answer: 'En el sofá',
    },
    { type: 'true-false', prompt: 'El gato duerme mucho.', answer: true },
  ],
};

describe('ReadingContentSchema', () => {
  test('accepts a valid passage + mixed question set', () => {
    expect(ReadingContentSchema.safeParse(validContent).success).toBe(true);
  });

  test('rejects a radio question whose answer is not one of its options', () => {
    const result = ReadingContentSchema.safeParse({
      passage: 'Texto.',
      questions: [{ type: 'radio', prompt: '¿?', options: ['a', 'b'], answer: 'c' }],
    });
    expect(result.success).toBe(false);
  });

  test('rejects a radio question with fewer than two options', () => {
    const result = ReadingContentSchema.safeParse({
      passage: 'Texto.',
      questions: [{ type: 'radio', prompt: '¿?', options: ['a'], answer: 'a' }],
    });
    expect(result.success).toBe(false);
  });

  test('rejects an empty passage', () => {
    expect(
      ReadingContentSchema.safeParse({ passage: '', questions: validContent.questions }).success,
    ).toBe(false);
  });

  test('requires at least one question', () => {
    expect(ReadingContentSchema.safeParse({ passage: 'Texto.', questions: [] }).success).toBe(
      false,
    );
  });

  test('true-false answer must be a boolean, not a string', () => {
    const result = ReadingContentSchema.safeParse({
      passage: 'Texto.',
      questions: [{ type: 'true-false', prompt: 'Afirmación.', answer: 'true' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('ReadingExerciseConfigSchema', () => {
  test('accepts the full envelope with type pinned to "reading"', () => {
    const result = ReadingExerciseConfigSchema.safeParse({
      type: 'reading',
      content: validContent,
    });
    expect(result.success).toBe(true);
  });

  test('rejects a mismatched type literal', () => {
    const result = ReadingExerciseConfigSchema.safeParse({
      type: 'radio-quiz',
      content: validContent,
    });
    expect(result.success).toBe(false);
  });
});
