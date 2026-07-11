/**
 * conjugation.fixture.ts — showcase card(s) for the `conjugation` engine.
 *
 * Colocated with the engine; typed against its schema input so fixture/schema drift
 * fails at compile time. Collected by the showcase aggregator (`@/showcase/fixtures`).
 *
 * Spec: docs/specs/2026-07-03-new-exercise-engines-design.md §5.
 */
import type { z } from 'zod';
import type { ShowcaseFixture } from '@/showcase/fixture-types';
import type { ConjugationExerciseConfigSchema } from './conjugation-schema';

type ConjugationConfigInput = z.input<typeof ConjugationExerciseConfigSchema>;

export const conjugationFixtures: ShowcaseFixture[] = [
  {
    id: 'conjugation',
    title: 'conjugation — être, présent (typed paradigm)',
    type: 'conjugation',
    config: {
      type: 'conjugation',
      content: {
        verb: 'être',
        tense: 'présent',
        prompt: 'Conjuguez le verbe « être » au présent.',
        rows: [
          { person: 'je', answer: 'suis' },
          { person: 'tu', answer: 'es' },
          { person: 'il/elle', answer: 'est' },
          { person: 'nous', answer: 'sommes' },
          { person: 'vous', answer: 'êtes' },
          { person: 'ils/elles', answer: 'sont' },
        ],
        footnote: 'Attention aux accents : « êtes » prend un accent circonflexe.',
      },
    } satisfies ConjugationConfigInput,
  },
  {
    id: 'conjugation-er-verb',
    title: 'conjugation — parler, présent (regular -er, accent-strict grading)',
    type: 'conjugation',
    config: {
      type: 'conjugation',
      content: {
        verb: 'parler',
        tense: 'présent',
        rows: [
          { person: 'je', answer: 'parle' },
          { person: 'tu', answer: 'parles' },
          { person: 'il/elle', answer: 'parle' },
          { person: 'nous', answer: 'parlons' },
          { person: 'vous', answer: 'parlez' },
          { person: 'ils/elles', answer: 'parlent' },
        ],
      },
      // Author disables Show-answers to push production recall.
      options: { allowShowAnswers: false },
    } satisfies ConjugationConfigInput,
  },
];
