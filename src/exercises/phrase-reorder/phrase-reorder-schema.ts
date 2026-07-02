/**
 * phrase-reorder-schema.ts — the per-type `content` contract for the
 * `phrase-reorder` engine (#11). Sequence/placement scoring family (spec §7): the
 * learner reorders whole phrase cards (not single words) back into the correct
 * sequence — each slot also carries a FIXED, non-draggable `prompt`/`audio` pair
 * (e.g. an L1 gloss or a clip), ported from french-lo-1's row-per-phrase table.
 *
 * Content shape:
 *   - rows[]      one entry per slot, IN THE CORRECT ORDER — this array IS the
 *                 answer key. `phrase` is the draggable answer text; `prompt` and
 *                 `audio` stay pinned to their slot (they never move) and are both
 *                 optional per row.
 *   - footnote?   optional plain-text note.
 *
 * `allowShowAnswers` applies (§5.3); `shuffle`/`sampleSize` do not (§5.2:
 * order-is-the-answer, always scrambled). At least two rows are required — one row
 * has no order to solve.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2, §5.2, §7, §8.
 */
import { z } from 'zod';
import { instructionsField } from '../lib/instructions';
import { ExerciseConfigSchema } from '@/config/lo-schema';

export const PhraseReorderRowSchema = z.object({
  phrase: z.string().min(1),
  prompt: z.string().min(1).optional(),
  audio: z.string().min(1).optional(),
});
export type PhraseReorderRow = z.infer<typeof PhraseReorderRowSchema>;

export const PhraseReorderContentSchema = z.object({
  ...instructionsField,
  rows: z.array(PhraseReorderRowSchema).min(2),
  footnote: z.string().min(1).optional(),
});
export type PhraseReorderContent = z.infer<typeof PhraseReorderContentSchema>;

export const PhraseReorderExerciseConfigSchema = ExerciseConfigSchema.extend({
  type: z.literal('phrase-reorder'),
  content: PhraseReorderContentSchema,
});
export type PhraseReorderExerciseConfig = z.infer<typeof PhraseReorderExerciseConfigSchema>;
