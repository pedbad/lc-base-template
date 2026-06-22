/**
 * select-schema.ts — the per-type `content` contract for the `select` engine
 * (spec §8.2). Tightens lo-schema's deliberately-loose ExerciseConfigSchema
 * `content` for `type: 'select'`, so a malformed exercise fails at load with a
 * precise message rather than breaking only in the browser.
 *
 * Content shape (matches french-lo-1's real select payload, trimmed to what the
 * template renders today):
 *   - items[]      one sentence per entry; blanks are `[a|*b|c]` (`*` = correct).
 *   - layoutMode   'rows' (each sentence on its own row) | 'inline-passage'
 *                  (sentences flow as a passage with inline dropdowns).
 *   - footnote     optional plain-text note under the exercise.
 *
 * Per-item `audio` is accepted but NOT rendered yet: the audio subsystem
 * (SequenceAudioController et al.) is ported when an audio-centric engine needs
 * it (dictation, #6). Keeping the field now means fixtures/LOs can carry audio
 * refs without a later schema break. `htmlContent`/`footnoteHTML`/`renderInlineChoices`
 * and passage accents from french are intentionally dropped (YAGNI / no DOMPurify).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §8;
 *       docs/specs/2026-06-15-lc-base-template-design.md §10.
 */
import { z } from 'zod';
import { ExerciseConfigSchema } from '@/config/lo-schema';

/** One sentence in a select exercise. `text` carries the `[a|*b|c]` blanks. */
export const SelectItemSchema = z.object({
  text: z.string().min(1),
  /** Reserved asset ref; playback deferred until the audio subsystem is ported. */
  audio: z.string().min(1).optional(),
});
export type SelectItem = z.infer<typeof SelectItemSchema>;

/** The `content` block for a `select` exercise. */
export const SelectContentSchema = z.object({
  items: z.array(SelectItemSchema).min(1),
  layoutMode: z.enum(['rows', 'inline-passage']).default('rows'),
  footnote: z.string().min(1).optional(),
});
export type SelectContent = z.infer<typeof SelectContentSchema>;

/**
 * The full exercise envelope for a select exercise: the shared
 * `type`/`options`/`labels` from ExerciseConfigSchema, with `content` narrowed to
 * SelectContentSchema and `type` pinned to the literal `'select'`.
 */
export const SelectExerciseConfigSchema = ExerciseConfigSchema.extend({
  type: z.literal('select'),
  content: SelectContentSchema,
});
export type SelectExerciseConfig = z.infer<typeof SelectExerciseConfigSchema>;
