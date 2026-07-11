/**
 * conjugation-schema.ts — the per-type `content` contract for the `conjugation`
 * engine (design §5, engine #4.3). Tightens lo-schema's deliberately-loose
 * ExerciseConfigSchema `content` for `type: 'conjugation'`, so a malformed exercise
 * fails at load with a precise message rather than only in the browser.
 *
 * conjugation is a verb-paradigm grid: each row gives a person/pronoun (read-only)
 * and the expected verb form. Grading is the blank-grading family (spec §7); v1
 * answers are TYPED (compared via normalizeAnswer, accent-strict), matching inline-gap.
 *
 * ANSWER MODE (forward-compatible): `answerMode` selects how the learner supplies a
 * form — `'typed'` (v1, an input per row) or `'choice'` (v2, tap one of `row.options`).
 * The schema accepts both now so authored content and fixtures never need a schema
 * migration when the choice path is wired; the v1 component implements `'typed'` only.
 * `options` is the per-row distractor list used by choice mode (must include the
 * answer); ignored in typed mode.
 *
 * Content shape:
 *   - verb        the infinitive being conjugated (lang={TARGET_LANG} at render).
 *   - tense?      optional tense label (e.g. "présent") shown in the heading.
 *   - prompt?     optional instruction shown above the grid.
 *   - answerMode? 'typed' (default) | 'choice'.
 *   - rows[]      one paradigm row each: { person, answer, options? }.
 *   - footnote?   optional plain-text note under the exercise.
 *
 * `options.shuffle`/`sampleSize` from the shared envelope are N/A here (a paradigm's
 * row order is meaningful); only `allowShowAnswers` applies.
 *
 * Spec: docs/specs/2026-07-03-new-exercise-engines-design.md §5.
 */
import { z } from 'zod';
import { instructionsField } from '../lib/instructions';
import { ExerciseConfigSchema } from '@/config/lo-schema';

/** One paradigm row: a given person/pronoun and its expected verb form. */
export const ConjugationRowSchema = z.object({
  /** The pronoun/person shown read-only on the left (e.g. "je", "nous"). */
  person: z.string().min(1),
  /** The expected verb form the learner must produce (typed) or pick (choice). */
  answer: z.string().min(1),
  /**
   * Choice-mode options for this row (v2): the buttons shown, one of which is the
   * answer. Ignored by the v1 typed component. Two or more to be a meaningful choice.
   */
  options: z.array(z.string().min(1)).min(2).optional(),
});
export type ConjugationRow = z.infer<typeof ConjugationRowSchema>;

/** How the learner supplies each form. `typed` is the v1 default; `choice` is v2. */
export const ConjugationAnswerModeSchema = z.enum(['typed', 'choice']);
export type ConjugationAnswerMode = z.infer<typeof ConjugationAnswerModeSchema>;

/** The `content` block for a conjugation exercise. */
export const ConjugationContentSchema = z.object({
  ...instructionsField,
  verb: z.string().min(1),
  tense: z.string().min(1).optional(),
  prompt: z.string().min(1).optional(),
  answerMode: ConjugationAnswerModeSchema.optional(),
  rows: z.array(ConjugationRowSchema).min(1),
  footnote: z.string().min(1).optional(),
});
export type ConjugationContent = z.infer<typeof ConjugationContentSchema>;

/**
 * The full exercise envelope for a conjugation exercise: the shared
 * `type`/`options`/`labels` from ExerciseConfigSchema, with `content` narrowed to
 * ConjugationContentSchema and `type` pinned to the literal `'conjugation'`.
 */
export const ConjugationExerciseConfigSchema = ExerciseConfigSchema.extend({
  type: z.literal('conjugation'),
  content: ConjugationContentSchema,
});
export type ConjugationExerciseConfig = z.infer<typeof ConjugationExerciseConfigSchema>;
