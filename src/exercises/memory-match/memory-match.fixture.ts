/**
 * memory-match.fixture.ts — showcase cards for the `memory-match` engine.
 *
 * Colocated with the engine; typed against its schema input so fixture/schema drift
 * fails at compile time. Collected by the showcase aggregator (`@/showcase/fixtures`).
 * Two cards: a no-audio pairs game and one with audio-on-match.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §3, §8.
 */
import type { z } from 'zod';
import type { ShowcaseFixture } from '@/showcase/fixture-types';
import type { MemoryMatchExerciseConfigSchema } from './memory-match-schema';

type MemoryMatchConfigInput = z.input<typeof MemoryMatchExerciseConfigSchema>;

export const memoryMatchFixtures: ShowcaseFixture[] = [
  {
    id: 'memory-match',
    title: 'memory-match — flip cards to pair each picture with its word (no audio)',
    type: 'memory-match',
    config: {
      type: 'memory-match',
      content: {
        // Shape vocab as a pairs game: flip cards to match each picture to its
        // Spanish word. Deck is always shuffled; a matched pair stays face-up.
        // Reuses the line-match demo SVGs. Own scoring model (spec §7).
        items: [
          { text: 'el círculo', image: 'images/line-match/circle.svg', localLanguage: 'circle' },
          { text: 'el cuadrado', image: 'images/line-match/square.svg', localLanguage: 'square' },
          {
            text: 'el triángulo',
            image: 'images/line-match/triangle.svg',
            localLanguage: 'triangle',
          },
          { text: 'la estrella', image: 'images/line-match/star.svg', localLanguage: 'star' },
        ],
        footnote: 'Demo hint line — flip the cards and match each picture to its word.',
      },
    } satisfies MemoryMatchConfigInput,
  },
  {
    id: 'memory-match-audio',
    title: 'memory-match — with audio (speaker on match)',
    type: 'memory-match',
    config: {
      type: 'memory-match',
      content: {
        // Audio mode: each item's `audio` clip auto-plays on a correct match, and a
        // click-to-play speaker appears next to the word once its card is face-up.
        // Clips are AAC-in-MP4 (not WAV) — the format used in live deployment.
        items: [
          {
            text: 'el círculo',
            image: 'images/line-match/circle.svg',
            audio: 'audio/memory-match/circulo.mp4',
            localLanguage: 'circle',
          },
          {
            text: 'el cuadrado',
            image: 'images/line-match/square.svg',
            audio: 'audio/memory-match/cuadrado.mp4',
            localLanguage: 'square',
          },
          {
            text: 'el triángulo',
            image: 'images/line-match/triangle.svg',
            audio: 'audio/memory-match/triangulo.mp4',
            localLanguage: 'triangle',
          },
          {
            text: 'la estrella',
            image: 'images/line-match/star.svg',
            audio: 'audio/memory-match/estrella.mp4',
            localLanguage: 'star',
          },
        ],
        footnote: 'Demo hint line — flip the cards; matching a pair plays its audio.',
      },
    } satisfies MemoryMatchConfigInput,
  },
];
