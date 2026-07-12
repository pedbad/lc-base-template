/**
 * inline-gap.fixture.ts — showcase cards for the `inline-gap` engine.
 *
 * Colocated with the engine; typed against its schema input so fixture/schema drift
 * fails at compile time. Collected by the showcase aggregator (`@/showcase/fixtures`).
 * Three cards: typed cloze, per-row audio, and the master playlist player.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §3, §8.
 */
import type { z } from 'zod';
import type { ShowcaseFixture } from '@/showcase/fixture-types';
import type { InlineGapExerciseConfigSchema } from './inline-gap-schema';

type InlineGapConfigInput = z.input<typeof InlineGapExerciseConfigSchema>;

export const inlineGapFixtures: ShowcaseFixture[] = [
  {
    id: 'inline-gap',
    title: 'inline-gap — typed cloze (type the verb)',
    type: 'inline-gap',
    config: {
      type: 'inline-gap',
      content: {
        // Typed blanks: `[expected::placeholder]`. The text before `::` is graded
        // (accent-strict via normalizeAnswer); the optional hint after `::` becomes
        // the input's placeholder. A wrong Check shows a character diff under the box.
        items: [
          {
            prompt: 'Conjuga «ser» y «llamarse» en presente.',
            text: 'Hola, yo me [llamo::llamarse] Ana y [soy::ser] de Madrid.',
          },
          { text: 'Nosotros [vivimos::vivir] en Barcelona desde 2020.' },
          { text: 'Mi hermana [tiene::tener] veinte años y [estudia::estudiar] medicina.' },
        ],
        footnote: 'Demo hint line — press Enter to jump to the next gap; accents count.',
      },
    } satisfies InlineGapConfigInput,
  },
  {
    id: 'inline-gap-audio',
    title: 'inline-gap — per-row audio (independent clips)',
    type: 'inline-gap',
    config: {
      type: 'inline-gap',
      content: {
        // Each row carries its own clip → an independent click-to-play speaker
        // (AudioClip + useAudioClip). Starting one stops the others (AudioManager).
        items: [
          { text: 'Yo [soy::ser] de Madrid.', audio: 'audio/inline-gap/q1.wav' },
          { text: 'Tú [eres::ser] muy amable.', audio: 'audio/inline-gap/q2.wav' },
          { text: 'Ella [es::ser] profesora de español.', audio: 'audio/inline-gap/q3.wav' },
        ],
        footnote: 'Demo hint line — tap each speaker to hear the phrase (demo clips).',
      },
    } satisfies InlineGapConfigInput,
  },
  {
    id: 'inline-gap-master',
    title: 'inline-gap — master playlist player (sequence)',
    type: 'inline-gap',
    config: {
      type: 'inline-gap',
      content: {
        // useSequenceAudioController → one master player (play/pause, scrubber,
        // volume, auto-advance) plays all clips as a timeline; each row's speaker
        // becomes a display driven by it, highlighting the active row.
        useSequenceAudioController: true,
        listenDescriptionText: 'Escucha la secuencia completa primero:',
        soundFile: 'audio/inline-gap/q1.wav',
        audioTranscript: 'Hace sol hoy. Mañana va a llover. En invierno hace frío.',
        items: [
          { text: 'Hace [sol::el tiempo] hoy.', audio: 'audio/inline-gap/q1.wav' },
          { text: 'Mañana va a [llover::el tiempo].', audio: 'audio/inline-gap/q2.wav' },
          { text: 'En invierno hace [frío::temperatura].', audio: 'audio/inline-gap/q3.wav' },
        ],
        footnote: 'Demo hint line — synthetic demo audio clips (q1–q3).',
      },
    } satisfies InlineGapConfigInput,
  },
];
