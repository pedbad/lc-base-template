/**
 * fixtures.ts — the catalog the exercise showcase renders.
 *
 * One entry per showcase CARD. Most engines have one card; `select` will have two
 * (rows + inline) to prove both `layoutMode`s (spec §3). Each fixture is a small,
 * realistic, Zod-valid exercise config. As each engine is ported (Phase B) its
 * fixture(s) are appended here, so the showcase grows one card at a time.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §3, §8.
 */
import type { ExerciseType } from '@/config/exercise-types';

/** One showcase card: a titled, ready-to-render exercise config. */
export interface ShowcaseFixture {
  /** Unique card id (also the anchor), e.g. "select-rows". */
  id: string;
  /** Human-readable card title shown above the live exercise. */
  title: string;
  /** Which engine renders it (resolved via lazyRegistry). */
  type: ExerciseType;
  /** The exercise config (content + optional options/labels). Narrowed by the engine. */
  config: unknown;
}

/**
 * Fixtures grow one card at a time as engines are ported. Content is Cambridge
 * Spanish (the example course); blanks use `[a|*b|c]` where `*` marks the correct
 * option. `select` gets two cards to prove both layoutModes (spec §3).
 */
export const SHOWCASE_FIXTURES: ShowcaseFixture[] = [
  {
    id: 'select-rows',
    title: 'select — rows (shuffled)',
    type: 'select',
    config: {
      type: 'select',
      content: {
        layoutMode: 'rows',
        items: [
          { text: 'Yo [*soy|eres|es] de Madrid.' },
          { text: 'Tú [soy|*eres|es] muy amable.' },
          { text: 'Ella [soy|eres|*es] profesora de español.' },
        ],
        footnote: 'El verbo «ser» cambia según la persona.',
      },
      // shuffle on: option order randomizes and Reset re-shuffles (spec §5.2).
      options: { shuffle: true },
    },
  },
  {
    id: 'select-inline',
    title: 'select — inline passage (Spanish chrome)',
    type: 'select',
    config: {
      type: 'select',
      content: {
        layoutMode: 'inline-passage',
        // A narrative passage: order matters, so shuffle stays off (default).
        items: [
          { text: 'Me llamo Ana y [soy|*tengo|tienes] veinte años.' },
          { text: '[*Vivo|Vives|Vive] en Barcelona con mi familia.' },
          { text: 'Mi hermano [*habla|hablo|hablas] inglés y francés.' },
          { text: 'Nos [*gusta|gustan|gusto] mucho viajar juntos.' },
        ],
      },
      // Per-exercise chrome override (ui-strings Layer 2, §9).
      labels: { check: 'Comprobar', reset: 'Reiniciar', showAnswer: 'Ver respuestas' },
    },
  },
  {
    id: 'select-multi-blank',
    title: 'select — multiple blanks per sentence',
    type: 'select',
    config: {
      type: 'select',
      content: {
        layoutMode: 'rows',
        // Two dropdowns in ONE sentence: each blank is graded independently and the
        // row tick turns green only when BOTH are correct (spec §7). Proves the
        // parser/engine already handle several `[...]` blanks per item.
        items: [
          { text: 'Yo [*soy|eres|es] de Madrid y ella [vivo|vives|*vive] en París.' },
          {
            text: 'Nosotros [*tenemos|tienes|tiene] hambre y vosotros [tengo|*tenéis|tienen] sed.',
          },
        ],
        footnote: 'Una frase puede tener varios huecos; cada uno se corrige por separado.',
      },
    },
  },
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
        footnote: 'Elige la forma correcta del verbo «ser».',
      },
      // shuffle on: pill order randomizes and Reset re-shuffles (spec §5.2).
      options: { shuffle: true },
    },
  },
];
