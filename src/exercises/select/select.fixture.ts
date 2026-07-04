/**
 * select.fixture.ts — showcase cards for the `select` engine (colocated fixture).
 *
 * Each entry is a small, Zod-valid `select` config, typed against the engine's own
 * schema input so a drift between fixture and schema fails at compile time. The
 * showcase aggregator (`@/showcase/fixtures`) collects these into SHOWCASE_FIXTURES.
 * Content is Cambridge Spanish; blanks use `[a|*b|c]` where `*` marks the correct
 * option. `select` gets several cards to prove both layoutModes and overrides (§3).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §3, §8.
 */
import type { z } from 'zod';
import type { ShowcaseFixture } from '@/showcase/fixture-types';
import type { SelectExerciseConfigSchema } from './select-schema';

type SelectConfigInput = z.input<typeof SelectExerciseConfigSchema>;

export const selectFixtures: ShowcaseFixture[] = [
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
        footnote: 'Demo hint line — pick the correct option for each blank.',
      },
      // shuffle on: option order randomizes and Reset re-shuffles (spec §5.2).
      options: { shuffle: true },
    } satisfies SelectConfigInput,
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
    } satisfies SelectConfigInput,
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
        footnote: 'Demo hint line — a sentence can have several blanks; each is graded separately.',
      },
    } satisfies SelectConfigInput,
  },
  {
    id: 'select-instructions-override',
    title: 'select — custom instructions override (info box)',
    type: 'select',
    config: {
      type: 'select',
      content: {
        // Author override: this copy replaces the auto default for `select`, proving
        // the resolveInstructions override path (handover spec §2/§3). Button names
        // still render bold via the `**…**` markers.
        instructions:
          'Read the mini-dialogue and choose the option that fits each gap. Use **Check** to mark, **Reset** to start over, or **Show answers** to reveal.',
        layoutMode: 'rows',
        items: [{ text: '— ¿De dónde [*eres|soy|es]? — [*Soy|Eres|Es] de México.' }],
      },
    } satisfies SelectConfigInput,
  },
];
