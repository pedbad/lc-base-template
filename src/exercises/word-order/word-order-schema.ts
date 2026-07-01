/**
 * word-order-schema.ts — the per-type `content` contract for the `word-order`
 * engine (#10). Sequence/placement scoring family (spec §7): the learner drags (or
 * click-selects) word cards into the correct sentence order.
 *
 * Content shape:
 *   - words[]    the sentence's words, IN THE CORRECT ORDER — this array IS the
 *                answer key. The engine always scrambles it for display (spec §5.2:
 *                scrambling is the exercise, `options.shuffle` is N/A).
 *   - audio?     optional clip for "listen to the sentence".
 *   - footnote?  optional plain-text note.
 *
 * `allowShowAnswers` applies (§5.3); `shuffle`/`sampleSize` do not (a single fixed
 * sentence, not a choice list). At least two words are required — one word has no
 * order to solve.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2, §5.2, §7, §8.
 */
import { z } from 'zod';
import { ExerciseConfigSchema } from '@/config/lo-schema';

export const WordOrderContentSchema = z.object({
  words: z.array(z.string().min(1)).min(2),
  audio: z.string().min(1).optional(),
  footnote: z.string().min(1).optional(),
});
export type WordOrderContent = z.infer<typeof WordOrderContentSchema>;

export const WordOrderExerciseConfigSchema = ExerciseConfigSchema.extend({
  type: z.literal('word-order'),
  content: WordOrderContentSchema,
});
export type WordOrderExerciseConfig = z.infer<typeof WordOrderExerciseConfigSchema>;
