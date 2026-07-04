/**
 * phrase-reorder.fixture.ts — showcase card for the `phrase-reorder` engine.
 *
 * Colocated with the engine; typed against its schema input so fixture/schema drift
 * fails at compile time. Collected by the showcase aggregator (`@/showcase/fixtures`).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §3, §8.
 */
import type { z } from 'zod';
import type { ShowcaseFixture } from '@/showcase/fixture-types';
import type { PhraseReorderExerciseConfigSchema } from './phrase-reorder-schema';

type PhraseReorderConfigInput = z.input<typeof PhraseReorderExerciseConfigSchema>;

export const phraseReorderFixtures: ShowcaseFixture[] = [
  {
    id: 'phrase-reorder',
    title: 'phrase-reorder — reorder whole phrases (fixed prompt + audio per slot)',
    type: 'phrase-reorder',
    config: {
      type: 'phrase-reorder',
      content: {
        // Sequence/placement family (spec §7): `rows` order is the answer key. Each
        // slot's `prompt`/`audio` stay fixed in place; only `phrase` slides between
        // slots (spec §11, ported from french-lo-1's PhraseReorderExercise).
        rows: [
          { phrase: 'Buenos días', prompt: 'Good morning', audio: 'audio/inline-gap/q1.wav' },
          { phrase: '¿Cómo estás?', prompt: 'How are you?', audio: 'audio/inline-gap/q2.wav' },
          { phrase: 'Hasta luego', prompt: 'See you later', audio: 'audio/inline-gap/q3.wav' },
        ],
        footnote: 'Demo hint line — order the phrases as in a typical conversation.',
      },
    } satisfies PhraseReorderConfigInput,
  },
];
