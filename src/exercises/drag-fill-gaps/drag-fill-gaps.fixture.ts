/**
 * drag-fill-gaps.fixture.ts — showcase card for the `drag-fill-gaps` engine.
 *
 * Colocated with the engine; typed against its schema input so fixture/schema drift
 * fails at compile time. Collected by the showcase aggregator (`@/showcase/fixtures`).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §3, §8.
 */
import type { z } from 'zod';
import type { ShowcaseFixture } from '@/showcase/fixture-types';
import type { DragFillGapsExerciseConfigSchema } from './drag-fill-gaps-schema';

type DragFillGapsConfigInput = z.input<typeof DragFillGapsExerciseConfigSchema>;

export const dragFillGapsFixtures: ShowcaseFixture[] = [
  {
    id: 'drag-fill-gaps',
    title: 'drag-fill-gaps — drag word tiles into the blanks',
    type: 'drag-fill-gaps',
    config: {
      type: 'drag-fill-gaps',
      content: {
        // Sequence/placement family (spec §7): each `[bracketed]` blank becomes one
        // draggable tile in the shared bank below. Check locks correct placements
        // and bounces wrong ones back to the bank (spec §11, ported from
        // french-lo-1's DraggableFillGaps `phrases` variant).
        items: [
          { text: 'Yo [soy] de Madrid y ella [vive] en París.' },
          { text: 'Nosotros [tenemos] hambre y vosotros [tenéis] sed.' },
        ],
        footnote: 'Demo hint line — drag each word to its matching gap.',
      },
      // shuffle on: the bank order randomizes and Reset re-shuffles (spec §5.2).
      options: { shuffle: true },
    } satisfies DragFillGapsConfigInput,
  },
];
