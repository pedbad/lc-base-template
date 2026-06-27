/**
 * inline-gap-schema.ts — the per-type `content` contract for the `inline-gap`
 * engine (spec §8.2, engine #4). Tightens lo-schema's deliberately-loose
 * ExerciseConfigSchema `content` for `type: 'inline-gap'`, so a malformed exercise
 * fails at load with a precise message rather than only in the browser.
 *
 * inline-gap is a TYPED cloze: the learner types into inline blanks inside flowing
 * prose. Blanks use `[expected::placeholder]` — the text before `::` is the answer,
 * the optional text after it is a placeholder hint. Grading is the blank-grading
 * family (spec §7), but answers are TYPED (compared via normalizeAnswer), not picked.
 *
 * Content shape:
 *   - items[]    one sentence per entry:
 *       - text       the sentence; blanks are `[expected::placeholder]`.
 *       - prompt?    optional instruction shown above the sentence.
 *       - audio?     reserved asset ref; accepted now (so fixtures/LOs carry refs
 *                    without a schema break) but NOT rendered until M4b wires audio.
 *   - footnote   optional plain-text note under the exercise.
 *
 * `options.shuffle`/`sampleSize` are accepted by the shared envelope but are N/A here
 * (spec §5.2): there are no choices to reorder and cloze prose order is meaningful, so
 * the engine ignores them. Only `allowShowAnswers` applies.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §8;
 *       docs/specs/2026-06-15-lc-base-template-design.md §10.
 */
import { z } from 'zod';
import { ExerciseConfigSchema } from '@/config/lo-schema';

/** One sentence in an inline-gap exercise. `text` carries `[expected::placeholder]` blanks. */
export const InlineGapItemSchema = z.object({
  text: z.string().min(1),
  /** Optional instruction shown above the sentence. */
  prompt: z.string().min(1).optional(),
  /** Optional per-row audio clip (rendered as a click-to-play speaker). */
  audio: z.string().min(1).optional(),
});
export type InlineGapItem = z.infer<typeof InlineGapItemSchema>;

/** The `content` block for an inline-gap exercise. */
export const InlineGapContentSchema = z.object({
  items: z.array(InlineGapItemSchema).min(1),
  /**
   * When true, the rows' audio is played as one continuous playlist by a master
   * SequenceAudioController (play/pause, scrubber, volume, auto-advance), and each
   * row's speaker becomes a display driven by it. When false/omitted, each row's
   * audio is an independent click-to-play clip. No-op if no item carries audio.
   */
  useSequenceAudioController: z.boolean().optional(),
  /** Optional "listen first" intro: a label + a single clip above the items. */
  listenDescriptionText: z.string().min(1).optional(),
  soundFile: z.string().min(1).optional(),
  footnote: z.string().min(1).optional(),
});
export type InlineGapContent = z.infer<typeof InlineGapContentSchema>;

/**
 * The full exercise envelope for an inline-gap exercise: the shared
 * `type`/`options`/`labels` from ExerciseConfigSchema, with `content` narrowed to
 * InlineGapContentSchema and `type` pinned to the literal `'inline-gap'`.
 */
export const InlineGapExerciseConfigSchema = ExerciseConfigSchema.extend({
  type: z.literal('inline-gap'),
  content: InlineGapContentSchema,
});
export type InlineGapExerciseConfig = z.infer<typeof InlineGapExerciseConfigSchema>;
