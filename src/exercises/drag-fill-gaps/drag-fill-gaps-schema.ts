/**
 * drag-fill-gaps-schema.ts — the per-type `content` contract for the
 * `drag-fill-gaps` engine (#12, last of 12). Sequence/placement scoring family
 * (spec §7): the learner drags word tiles from a shared bank into the `[bracketed]`
 * blanks embedded in one or more sentences.
 *
 * Content shape:
 *   - items[]    one sentence per row. Blanks are authored inline as
 *                `[word]` — the SAME `[...]` convention word-spot uses, reusing the
 *                shared `parseSentence` parser (spec §8 "ported once"). Each blank
 *                becomes one draggable tile; a sentence may hold several blanks.
 *       - audio?   optional per-row clip (click-to-play speaker).
 *   - footnote?  optional plain-text note.
 *
 * Ported from french-lo-1's DraggableFillGaps, scoped to its `phrases` variant only
 * (the sentence-with-inline-blanks case — the one the spec's one-line description
 * matches: "drags word tiles into phrase slots"). The other four legacy
 * `blanksType` table variants (table/group-table/questions-answers/pictures-answers)
 * are NOT ported — YAGNI (spec §12): add a variant only when a real LO needs it.
 *
 * `allowShowAnswers` applies (§5.3). `options.shuffle` DOES apply here (§5.2: this is
 * a choice-order tile bank, not an order-is-the-answer engine) — default off, so the
 * bank starts in authored (blank-appearance) order unless an author opts in.
 * At least two blanks are required across all items — one blank is a trivial drop.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2, §5.2, §7, §8.
 */
import { z } from 'zod';
import { instructionsField } from '../lib/instructions';
import { ExerciseConfigSchema } from '@/config/lo-schema';

/** A `[bracketed]` blank somewhere in the text. */
const DRAG_FILL_GAPS_BLANK_REGEX = /\[[^\]]+\]/g;

function countBlanks(text: string): number {
  return text.match(DRAG_FILL_GAPS_BLANK_REGEX)?.length ?? 0;
}

export const DragFillGapsItemSchema = z.object({
  text: z.string().min(1),
  audio: z.string().min(1).optional(),
});
export type DragFillGapsItem = z.infer<typeof DragFillGapsItemSchema>;

export const DragFillGapsContentSchema = z
  .object({
    ...instructionsField,
    items: z.array(DragFillGapsItemSchema).min(1),
    footnote: z.string().min(1).optional(),
  })
  .refine((content) => content.items.reduce((n, item) => n + countBlanks(item.text), 0) >= 2, {
    message: 'drag-fill-gaps needs at least two [bracketed] blanks to place tiles into.',
    path: ['items'],
  })
  // Each blank becomes a tile showing its word, so `[ ]` would be an empty tile
  // (TODO §E42). Repeated words are fine: grading compares what the tiles show.
  .superRefine((content, ctx) => {
    content.items.forEach((item, index) => {
      const blanks = item.text.match(DRAG_FILL_GAPS_BLANK_REGEX) ?? [];
      if (blanks.some((blank) => blank.slice(1, -1).trim() === '')) {
        ctx.addIssue({
          code: 'custom',
          message: `sentence ${index + 1} has an empty blank [ ]: write the word inside the brackets`,
          path: ['items', index, 'text'],
        });
      }
    });
  });
export type DragFillGapsContent = z.infer<typeof DragFillGapsContentSchema>;

export const DragFillGapsExerciseConfigSchema = ExerciseConfigSchema.extend({
  type: z.literal('drag-fill-gaps'),
  content: DragFillGapsContentSchema,
});
export type DragFillGapsExerciseConfig = z.infer<typeof DragFillGapsExerciseConfigSchema>;
