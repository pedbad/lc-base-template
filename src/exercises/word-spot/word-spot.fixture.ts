/**
 * word-spot.fixture.ts — showcase card for the `word-spot` engine.
 *
 * Colocated with the engine; typed against its schema input so fixture/schema drift
 * fails at compile time. Collected by the showcase aggregator (`@/showcase/fixtures`).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §3, §8.
 */
import type { z } from 'zod';
import type { ShowcaseFixture } from '@/showcase/fixture-types';
import type { WordSpotExerciseConfigSchema } from './word-spot-schema';

type WordSpotConfigInput = z.input<typeof WordSpotExerciseConfigSchema>;

export const wordSpotFixtures: ShowcaseFixture[] = [
  {
    id: 'word-spot',
    title: 'word-spot — click the part-words with the target sound',
    type: 'word-spot',
    config: {
      type: 'word-spot',
      content: {
        // Spanish phonics: click every part-word containing the "ch" sound. The
        // bracketed runs are the targets; clicking any other word scores a miss.
        // Own scoring model — no Check button, each click is graded live (spec §7).
        items: [
          { text: 'El [ch]ico [ch]ileno comió [ch]ocolate.' },
          { text: 'La [ch]ica escu[ch]a la canción.' },
          { text: 'Mu[ch]as gracias por la le[ch]e.' },
        ],
        footnote: 'Demo hint line — click each part that contains the target sound.',
      },
    } satisfies WordSpotConfigInput,
  },
];
