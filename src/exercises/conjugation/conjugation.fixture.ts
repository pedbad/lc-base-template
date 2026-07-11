/**
 * conjugation.fixture.ts — showcase card(s) for the `conjugation` engine.
 *
 * Colocated with the engine; typed against its schema input so fixture/schema drift
 * fails at compile time. Collected by the showcase aggregator (`@/showcase/fixtures`).
 * Spanish content, matching the rest of the showcase (TARGET_LANG).
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
    title: 'conjugation — ser, presente (typed paradigm)',
    type: 'conjugation',
    config: {
      type: 'conjugation',
      content: {
        verb: 'ser',
        tense: 'presente',
        prompt: 'Conjuga el verbo «ser» en presente.',
        rows: [
          { person: 'yo', answer: 'soy' },
          { person: 'tú', answer: 'eres' },
          { person: 'él/ella', answer: 'es' },
          { person: 'nosotros', answer: 'somos' },
          { person: 'vosotros', answer: 'sois' },
          { person: 'ellos/ellas', answer: 'son' },
        ],
        footnote: 'Escribe la forma correcta para cada persona.',
      },
    } satisfies ConjugationConfigInput,
  },
  {
    id: 'conjugation-ar-verb',
    title: 'conjugation — hablar, presente (regular -ar, accent-strict grading)',
    type: 'conjugation',
    config: {
      type: 'conjugation',
      content: {
        verb: 'hablar',
        tense: 'presente',
        rows: [
          { person: 'yo', answer: 'hablo' },
          { person: 'tú', answer: 'hablas' },
          { person: 'él/ella', answer: 'habla' },
          { person: 'nosotros', answer: 'hablamos' },
          { person: 'vosotros', answer: 'habláis' },
          { person: 'ellos/ellas', answer: 'hablan' },
        ],
        footnote: 'Ojo con la tilde: «habláis» lleva acento.',
      },
    } satisfies ConjugationConfigInput,
  },
];
