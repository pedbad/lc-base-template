/**
 * Tests for the dictation envelope (spec §8, §9). dictation reuses the shared
 * TextEntryContentSchema but tightens it: every row must carry audio.
 */
import { describe, expect, test } from 'vitest';
import { DictationExerciseConfigSchema } from './dictation-schema';

describe('DictationExerciseConfigSchema', () => {
  test('parses rows that all carry audio', () => {
    const parsed = DictationExerciseConfigSchema.parse({
      type: 'dictation',
      content: {
        rows: [
          { answer: 'Bonjour', audio: 'd/q1.wav' },
          { answer: 'Comment ça va', audio: 'd/q2.wav' },
        ],
      },
    });
    expect(parsed.type).toBe('dictation');
    expect(parsed.content.rows).toHaveLength(2);
  });

  test('rejects a row with no audio (nothing to transcribe)', () => {
    expect(() =>
      DictationExerciseConfigSchema.parse({
        type: 'dictation',
        content: { rows: [{ answer: 'Bonjour', audio: 'd/q1.wav' }, { answer: 'Merci' }] },
      }),
    ).toThrow();
  });

  test('rejects a non-dictation type', () => {
    expect(() =>
      DictationExerciseConfigSchema.parse({
        type: 'typed-transform',
        content: { rows: [{ answer: 'x', audio: 'a.wav' }] },
      }),
    ).toThrow();
  });
});
