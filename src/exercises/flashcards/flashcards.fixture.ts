/**
 * flashcards.fixture.ts — showcase card(s) for the `flashcards` engine.
 *
 * Colocated with the engine; typed against its schema input so fixture/schema drift
 * fails at compile time. Collected by the showcase aggregator (`@/showcase/fixtures`).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §3, §8;
 *       docs/specs/2026-07-03-new-exercise-engines-design.md §4 (flashcards).
 */
import type { z } from 'zod';
import type { ShowcaseFixture } from '@/showcase/fixture-types';
import type { FlashcardsExerciseConfigSchema } from './flashcards-schema';

type FlashcardsConfigInput = z.input<typeof FlashcardsExerciseConfigSchema>;

export const flashcardsFixtures: ShowcaseFixture[] = [
  {
    id: 'flashcards',
    title: 'flashcards — vocab deck (audio, Spanish → English, self-rated)',
    type: 'flashcards',
    config: {
      type: 'flashcards',
      content: {
        // Own-model deck: read the Spanish term, flip, then rate Again/Good. Each
        // card carries a recorded target-language clip (placeholder .m4a for the
        // demo; author-supplied in a real course). No Check/Show-answers footer.
        cards: [
          { target: 'el perro', native: 'the dog', audio: 'audio/flashcards/perro.m4a' },
          { target: 'el gato', native: 'the cat', audio: 'audio/flashcards/gato.m4a' },
          { target: 'la casa', native: 'the house', audio: 'audio/flashcards/casa.m4a' },
          { target: 'el libro', native: 'the book', audio: 'audio/flashcards/libro.m4a' },
        ],
        footnote: 'Demo hint line — flip each card and rate how well you knew it.',
      },
      // shuffle on: the deck order randomizes and Restart re-shuffles.
      // shuffle on + SRS on (Step 2): progress persists to localStorage, the deck
      // loads in due-order (struggled cards first), and a "Reset progress" control
      // appears. Due-order supersedes shuffle once boxes diverge across sessions.
      options: { shuffle: true, srs: true },
    } satisfies FlashcardsConfigInput,
  },
  {
    id: 'flashcards-images-locked',
    title: 'flashcards — with images, locked English → Spanish',
    type: 'flashcards',
    config: {
      type: 'flashcards',
      content: {
        // Image + audio deck. `image` shows on the reveal (back) face as a mnemonic.
        // Reuses the line-match shape SVGs. Direction is locked (no learner toggle):
        // the prompt is always English, the answer always Spanish (production-first).
        cards: [
          {
            target: 'el círculo',
            native: 'the circle',
            image: 'images/line-match/circle.svg',
            audio: 'audio/flashcards/circulo.m4a',
          },
          {
            target: 'el cuadrado',
            native: 'the square',
            image: 'images/line-match/square.svg',
            audio: 'audio/flashcards/cuadrado.m4a',
          },
          {
            target: 'el triángulo',
            native: 'the triangle',
            image: 'images/line-match/triangle.svg',
            audio: 'audio/flashcards/triangulo.m4a',
          },
          {
            target: 'la estrella',
            native: 'the star',
            image: 'images/line-match/star.svg',
            audio: 'audio/flashcards/estrella.m4a',
          },
        ],
      },
      // Author locks the deck to English→Spanish: the direction toggle is hidden.
      options: { direction: 'native-target', lockDirection: true },
    } satisfies FlashcardsConfigInput,
  },
];
