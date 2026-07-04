/**
 * radio-quiz.fixture.ts — showcase card(s) for the `radio-quiz` engine.
 *
 * Colocated with the engine; typed against its schema input so fixture/schema drift
 * fails at compile time. Collected by the showcase aggregator (`@/showcase/fixtures`).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §3, §8.
 */
import type { z } from 'zod';
import type { ShowcaseFixture } from '@/showcase/fixture-types';
import type { RadioQuizExerciseConfigSchema } from './radio-quiz-schema';

type RadioQuizConfigInput = z.input<typeof RadioQuizExerciseConfigSchema>;

export const radioQuizFixtures: ShowcaseFixture[] = [
  {
    id: 'radio-quiz',
    title: 'radio-quiz — comprehension questions (shuffled, explanations)',
    type: 'radio-quiz',
    config: {
      type: 'radio-quiz',
      content: {
        // Comprehension QUESTIONS, not fill-in blanks: each `prompt` is a real
        // question and each option is a candidate ANSWER (not a word you slot back
        // into the stem) — the visible contrast with inline-choice. The correct
        // option carries a leading `*`; the explanation shows only after a WRONG
        // check for that question (spec §7, engine decision).
        questions: [
          {
            prompt: '¿Cuál de estos saludos es formal?',
            options: ['¡Hola!', '*Buenos días', '¿Qué tal?'],
            explanation: '«Buenos días» es formal; «¡Hola!» y «¿Qué tal?» son informales.',
          },
          {
            prompt: 'En español, ¿qué palabra NO es un color?',
            options: ['rojo', '*martes', 'verde'],
            explanation: '«Martes» es un día de la semana; «rojo» y «verde» son colores.',
          },
          {
            prompt: '¿Qué significa «gracias» en inglés?',
            options: ['please', 'sorry', '*thank you'],
            explanation: '«Gracias» se traduce como «thank you».',
          },
          {
            prompt: 'Son las 14:00. ¿Cómo se dice la hora?',
            options: ['Es la una', '*Son las dos de la tarde', 'Son las cuatro'],
            explanation: 'Las 14:00 son «las dos de la tarde» (formato de 12 horas).',
          },
        ],
        footnote: 'Demo hint line — each question has one correct answer.',
      },
      // shuffle on: option order randomizes per question and Reset re-shuffles (§5.2).
      options: { shuffle: true },
    } satisfies RadioQuizConfigInput,
  },
];
