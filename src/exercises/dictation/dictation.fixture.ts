/**
 * dictation.fixture.ts — showcase card for the `dictation` engine.
 *
 * Colocated with the engine; typed against its schema input so fixture/schema drift
 * fails at compile time. Collected by the showcase aggregator (`@/showcase/fixtures`).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §3, §8.
 */
import type { z } from 'zod';
import type { ShowcaseFixture } from '@/showcase/fixture-types';
import type { DictationExerciseConfigSchema } from './dictation-schema';

type DictationConfigInput = z.input<typeof DictationExerciseConfigSchema>;

export const dictationFixtures: ShowcaseFixture[] = [
  {
    id: 'dictation',
    title: 'dictation — listen and transcribe',
    type: 'dictation',
    config: {
      type: 'dictation',
      content: {
        // Audio-only rows (no prompt cue): the learner plays the clip and types what
        // they hear. Graded in dictation mode (normalizeForDictation): accents count,
        // punctuation and quotes are forgiven. Every row carries audio (schema-enforced).
        rows: [
          { answer: 'Buenos días', audio: 'audio/inline-gap/q1.wav' },
          { answer: '¿Cómo estás?', audio: 'audio/inline-gap/q2.wav' },
          { answer: 'Hasta luego', audio: 'audio/inline-gap/q3.wav' },
        ],
        footnote: 'Demo hint line — type what you hear (demo clips).',
      },
    } satisfies DictationConfigInput,
  },
];
