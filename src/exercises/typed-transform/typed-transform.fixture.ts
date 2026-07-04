/**
 * typed-transform.fixture.ts — showcase cards for the `typed-transform` engine.
 *
 * Colocated with the engine; typed against its schema input so fixture/schema drift
 * fails at compile time. Collected by the showcase aggregator (`@/showcase/fixtures`).
 * Two cards: a plain transform drill and one with per-row audio.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §3, §8.
 */
import type { z } from 'zod';
import type { ShowcaseFixture } from '@/showcase/fixture-types';
import type { TypedTransformExerciseConfigSchema } from './typed-transform-schema';

type TypedTransformConfigInput = z.input<typeof TypedTransformExerciseConfigSchema>;

export const typedTransformFixtures: ShowcaseFixture[] = [
  {
    id: 'typed-transform',
    title: 'typed-transform — type the transformed form',
    type: 'typed-transform',
    config: {
      type: 'typed-transform',
      content: {
        // A transform drill: read the singular cue, type the plural. Graded in
        // strict mode (normalizeAnswer): accents count, apostrophes/spacing forgive.
        columns: { prompt: 'Singular', answer: 'Plural' },
        rows: [
          { prompt: 'el gato', answer: 'los gatos' },
          { prompt: 'la casa', answer: 'las casas' },
          { prompt: 'el profesor', answer: 'los profesores' },
          { prompt: 'la canción', answer: 'las canciones' },
        ],
        footnote: 'Demo hint line — type the plural; press Enter for the next row.',
      },
    } satisfies TypedTransformConfigInput,
  },
  {
    id: 'typed-transform-audio',
    title: 'typed-transform — with per-row audio',
    type: 'typed-transform',
    config: {
      type: 'typed-transform',
      content: {
        columns: { prompt: 'Escucha', answer: 'Escribe' },
        rows: [
          { prompt: 'masculino', answer: 'alto', audio: 'audio/inline-gap/q1.wav' },
          { prompt: 'femenino', answer: 'alta', audio: 'audio/inline-gap/q2.wav' },
          { prompt: 'plural', answer: 'altos', audio: 'audio/inline-gap/q3.wav' },
        ],
        footnote: 'Demo hint line — tap the speaker to hear each word (demo clips).',
      },
    } satisfies TypedTransformConfigInput,
  },
];
