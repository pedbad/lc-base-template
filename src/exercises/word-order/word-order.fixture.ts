/**
 * word-order.fixture.ts — showcase card for the `word-order` engine.
 *
 * Colocated with the engine; typed against its schema input so fixture/schema drift
 * fails at compile time. Collected by the showcase aggregator (`@/showcase/fixtures`).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §3, §8.
 */
import type { z } from 'zod';
import type { ShowcaseFixture } from '@/showcase/fixture-types';
import type { WordOrderExerciseConfigSchema } from './word-order-schema';

type WordOrderConfigInput = z.input<typeof WordOrderExerciseConfigSchema>;

export const wordOrderFixtures: ShowcaseFixture[] = [
  {
    id: 'word-order',
    title: 'word-order — click to select, click to swap',
    type: 'word-order',
    config: {
      type: 'word-order',
      content: {
        // Sequence/placement family (spec §7): `words` is the answer key, in
        // order. The engine always scrambles it for display (shuffle is N/A).
        words: ['Yo', 'como', 'una', 'manzana', 'todos', 'los', 'días'],
        footnote: 'Demo hint line — arrange the words to form the correct sentence.',
      },
    } satisfies WordOrderConfigInput,
  },
];
