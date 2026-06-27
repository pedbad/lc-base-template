/**
 * typed-transform-schema.ts — the exercise envelope for the `typed-transform` engine
 * (#5). The learner reads/hears a prompt and types a transformed form (plural,
 * conjugation, agreement). Content is the shared TextEntryContentSchema (rows of
 * prompt → expected answer, optional audio); the engine compares answers in `strict`
 * mode (normalizeAnswer: accent-strict, apostrophe/whitespace-tolerant).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §8, §9.
 */
import { z } from 'zod';
import { ExerciseConfigSchema } from '@/config/lo-schema';
import { TextEntryContentSchema } from '../text-entry/text-entry-schema';

export const TypedTransformExerciseConfigSchema = ExerciseConfigSchema.extend({
  type: z.literal('typed-transform'),
  content: TextEntryContentSchema,
});
export type TypedTransformExerciseConfig = z.infer<typeof TypedTransformExerciseConfigSchema>;
