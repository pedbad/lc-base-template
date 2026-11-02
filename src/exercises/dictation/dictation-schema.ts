/**
 * dictation-schema.ts — the exercise envelope for the `dictation` engine (#6). The
 * learner hears a clip and transcribes it. Content is the shared TextEntryContentSchema
 * (rows of answer + audio), with one dictation-specific constraint: EVERY row must
 * carry an audio clip — there is nothing to transcribe without sound, so a missing
 * clip is an authoring error that fails the build, not the browser.
 *
 * The engine renders the shared TextEntryRuntime in `dictation` comparison mode
 * (normalizeForDictation: accent-strict, but punctuation/quote-tolerant). Per spec §9
 * this shares the runtime with typed-transform (#5) and differs only in that mode —
 * the planned component-split is unnecessary, since normalization is a runtime flag.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §8, §9.
 */
import { z } from 'zod';
import { hasTypedAnswer } from '../lib/answer-checks';
import { normalizeAnswer, normalizeForDictation } from '../lib/answers';
import { ExerciseConfigSchema } from '@/config/lo-schema';
import { TextEntryContentSchema } from '../text-entry/text-entry-schema';

/** Shared content, tightened: every dictation row needs audio (you transcribe what you hear). */
export const DictationContentSchema = TextEntryContentSchema.refine(
  (content) => content.rows.every((row) => Boolean(row.audio)),
  {
    message:
      'Every dictation row must have an audio clip — the learner transcribes what they hear.',
    path: ['rows'],
  },
)
  // Dictation grades with punctuation and quotes ignored, so an answer of only those
  // leaves nothing to type (TODO §E42). A blank answer is already refused above.
  .superRefine((content, ctx) => {
    content.rows.forEach((row, index) => {
      const blank = !hasTypedAnswer(row.answer, normalizeAnswer);
      if (!blank && !hasTypedAnswer(row.answer, normalizeForDictation)) {
        ctx.addIssue({
          code: 'custom',
          message: `row ${index + 1} has nothing to type: dictation ignores punctuation and quotes, so the answer needs words`,
          path: ['rows', index, 'answer'],
        });
      }
    });
  });

export const DictationExerciseConfigSchema = ExerciseConfigSchema.extend({
  type: z.literal('dictation'),
  content: DictationContentSchema,
});
export type DictationExerciseConfig = z.infer<typeof DictationExerciseConfigSchema>;
