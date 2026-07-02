/**
 * inline-choice-schema.ts — the per-type `content` contract for the `inline-choice`
 * engine (spec §8.2). Tightens lo-schema's deliberately-loose ExerciseConfigSchema
 * `content` for `type: 'inline-choice'`, so a malformed exercise fails at load with
 * a precise message rather than breaking only in the browser.
 *
 * Same scoring family as select (blank-grading, §7) and the same `[a|*b|c]` blank
 * syntax (`*` = correct). The engine differs only in HOW each blank renders: an
 * inline radio-pill group instead of a dropdown. The content shape is therefore
 * even simpler than select's — there is NO layoutMode (blanks always flow inline):
 *   - items[]   one sentence per entry; blanks are `[a|*b|c]` (`*` = correct).
 *   - footnote  optional plain-text note under the exercise.
 *
 * Per-item `audio` is accepted but NOT rendered yet (mirrors select): the audio
 * subsystem is ported when an audio-centric engine needs it (dictation, #6).
 * Keeping the field now means fixtures/LOs can carry audio refs without a later
 * schema break.
 *
 * Dropped from french-lo-1's InlineChoiceGroup config: `htmlContent`/`footnoteHTML`
 * (no DOMPurify rich content), `id` (the engine derives ids from useId),
 * `cheatText` (chrome wording → `labels`, §9), `shuffleItems`/`sampleSize` (shared
 * `options`, §6). Those are not per-type content.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §8;
 *       docs/specs/2026-06-15-lc-base-template-design.md §10.
 */
import { z } from 'zod';
import { instructionsField } from '../lib/instructions';
import { ExerciseConfigSchema } from '@/config/lo-schema';

/** One sentence in an inline-choice exercise. `text` carries the `[a|*b|c]` blanks. */
export const InlineChoiceItemSchema = z.object({
  text: z.string().min(1),
  /** Reserved asset ref; playback deferred until the audio subsystem is ported. */
  audio: z.string().min(1).optional(),
});
export type InlineChoiceItem = z.infer<typeof InlineChoiceItemSchema>;

/** The `content` block for an inline-choice exercise. */
export const InlineChoiceContentSchema = z.object({
  ...instructionsField,
  items: z.array(InlineChoiceItemSchema).min(1),
  footnote: z.string().min(1).optional(),
});
export type InlineChoiceContent = z.infer<typeof InlineChoiceContentSchema>;

/**
 * The full exercise envelope for an inline-choice exercise: the shared
 * `type`/`options`/`labels` from ExerciseConfigSchema, with `content` narrowed to
 * InlineChoiceContentSchema and `type` pinned to the literal `'inline-choice'`.
 */
export const InlineChoiceExerciseConfigSchema = ExerciseConfigSchema.extend({
  type: z.literal('inline-choice'),
  content: InlineChoiceContentSchema,
});
export type InlineChoiceExerciseConfig = z.infer<typeof InlineChoiceExerciseConfigSchema>;
