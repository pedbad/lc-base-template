/**
 * inline-choice.fixture.ts — showcase card(s) for the `inline-choice` engine.
 *
 * Colocated with the engine; typed against its schema input so fixture/schema drift
 * fails at compile time. Collected by the showcase aggregator (`@/showcase/fixtures`).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §3, §8.
 */
import type { z } from 'zod';
import type { ShowcaseFixture } from '@/showcase/fixture-types';
import type { InlineChoiceExerciseConfigSchema } from './inline-choice-schema';

type InlineChoiceConfigInput = z.input<typeof InlineChoiceExerciseConfigSchema>;

export const inlineChoiceFixtures: ShowcaseFixture[] = [
  {
    id: 'inline-choice',
    title: 'inline-choice — radio pills (shuffled)',
    type: 'inline-choice',
    config: {
      type: 'inline-choice',
      content: {
        items: [
          { text: 'Nosotros [*somos|sois|son] estudiantes.' },
          { text: 'Vosotros [somos|*sois|son] de México.' },
          { text: 'Ellas [somos|sois|*son] muy simpáticas.' },
        ],
        footnote: 'Demo hint line — choose the correct option.',
      },
      // shuffle on: pill order randomizes and Reset re-shuffles (spec §5.2).
      options: { shuffle: true },
    } satisfies InlineChoiceConfigInput,
  },
];
