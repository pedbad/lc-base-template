/**
 * reading.fixture.ts — showcase card(s) for the `reading` engine (comprehension).
 *
 * Colocated with the engine; typed against its schema input so fixture/schema drift
 * fails at compile time. Collected by the showcase aggregator (`@/showcase/fixtures`).
 * Spanish content, matching the rest of the showcase (TARGET_LANG) — passage,
 * questions, and the true/false labels are all Spanish.
 *
 * Spec: docs/specs/2026-07-03-new-exercise-engines-design.md §6.
 */
import type { z } from 'zod';
import type { ShowcaseFixture } from '@/showcase/fixture-types';
import type { ReadingExerciseConfigSchema } from './reading-schema';

type ReadingConfigInput = z.input<typeof ReadingExerciseConfigSchema>;

export const readingFixtures: ShowcaseFixture[] = [
  {
    id: 'reading',
    title: 'reading — comprensión (MCQ + verdadero/falso)',
    type: 'reading',
    config: {
      type: 'reading',
      content: {
        passage:
          'Marta se levanta temprano cada mañana. Desayuna un café con tostadas y sale de casa a las ocho. Va al trabajo en bicicleta porque vive cerca de la oficina.\n\nPor la tarde, después del trabajo, Marta estudia italiano en una academia del centro. Los fines de semana le gusta pasear por el parque con su perro.',
        questions: [
          {
            type: 'radio',
            prompt: '¿Cómo va Marta al trabajo?',
            options: ['En bicicleta', 'En coche', 'En autobús'],
            answer: 'En bicicleta',
            explanation: 'El texto dice que va en bicicleta porque vive cerca de la oficina.',
          },
          {
            type: 'radio',
            prompt: '¿Qué estudia Marta por la tarde?',
            options: ['Francés', 'Italiano', 'Inglés'],
            answer: 'Italiano',
          },
          {
            type: 'true-false',
            prompt: 'Marta se levanta tarde cada mañana.',
            answer: false,
            explanation: 'Se levanta temprano, no tarde.',
          },
          {
            type: 'true-false',
            prompt: 'Los fines de semana Marta pasea con su perro.',
            answer: true,
          },
        ],
        trueLabel: 'Verdadero',
        falseLabel: 'Falso',
        footnote: 'Lee el texto y responde a las preguntas.',
      },
    } satisfies ReadingConfigInput,
  },
];
