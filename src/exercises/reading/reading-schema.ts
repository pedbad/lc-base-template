/**
 * reading-schema.ts — the per-type `content` contract for the `reading` engine
 * (reading comprehension, design §6, engine #4.4). Tightens lo-schema's
 * deliberately-loose ExerciseConfigSchema `content` for `type: 'reading'`, so a
 * malformed exercise fails at load with a precise message rather than only in the
 * browser.
 *
 * reading is COMPOSITE (blank-grading family, spec §7): a lang-tagged `passage`
 * plus a set of comprehension `questions`, each a self-contained multiple-choice
 * unit. Scoring aggregates one gradeable "blank" per question across the set.
 *
 * QUESTION TYPES (v1 = MCQ + true/false ONLY — short-answer/typed is parked, since
 * fair auto-grading of free text is harder):
 *   - `radio`      an MCQ: `options[]` (>=2 choices) + `answer` (the correct one,
 *                  which MUST be one of `options`).
 *   - `true-false` a statement judged True/False: no `options` (the engine supplies
 *                  the two), `answer` is a boolean.
 *   A `true-false` question is modelled as a two-option radio, NOT a new widget —
 *   the view reuses radio-quiz's ChoicePillGroup for both types.
 *
 * TRUE/FALSE LABELS are TARGET-LANGUAGE content (a Spanish course wants
 * «Verdadero»/«Falso»), so they live in `content` (`trueLabel`/`falseLabel`,
 * defaulting to English), lang-tagged at render — not in the English UI chrome.
 *
 * Content shape:
 *   - passage      the reading text (plain; newlines become paragraph breaks).
 *   - questions[]  one comprehension question each (discriminated on `type`).
 *   - trueLabel?   label for the "true" option (default "True").
 *   - falseLabel?  label for the "false" option (default "False").
 *   - footnote?    optional plain-text note under the exercise.
 *
 * `options.shuffle`/`sampleSize` from the shared envelope are N/A here (question and
 * option order are authored deliberately — true/false must read True-then-False);
 * only `allowShowAnswers` applies.
 *
 * Spec: docs/specs/2026-07-03-new-exercise-engines-design.md §6; §7 (blank-grading).
 */
import { z } from 'zod';
import { instructionsField } from '../lib/instructions';
import { ExerciseConfigSchema } from '@/config/lo-schema';

/** Default option labels when the author omits `trueLabel`/`falseLabel`. */
export const DEFAULT_TRUE_LABEL = 'True';
export const DEFAULT_FALSE_LABEL = 'False';

/**
 * An MCQ question: a stem (`prompt`) with `options[]` (>=2 choices) and the correct
 * `answer` (validated to be one of the options by ReadingContentSchema's refine).
 */
export const ReadingRadioQuestionSchema = z.object({
  type: z.literal('radio'),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  answer: z.string().min(1),
  /** Shown after a WRONG check for this question (engine decision); optional. */
  explanation: z.string().min(1).optional(),
});

/**
 * A true/false question: a statement (`prompt`) judged against a boolean `answer`.
 * The engine supplies the two options (trueLabel/falseLabel) — none are authored.
 */
export const ReadingTrueFalseQuestionSchema = z.object({
  type: z.literal('true-false'),
  prompt: z.string().min(1),
  answer: z.boolean(),
  explanation: z.string().min(1).optional(),
});

/** One comprehension question, discriminated on `type`. */
export const ReadingQuestionSchema = z.discriminatedUnion('type', [
  ReadingRadioQuestionSchema,
  ReadingTrueFalseQuestionSchema,
]);
export type ReadingQuestion = z.infer<typeof ReadingQuestionSchema>;
export type ReadingRadioQuestion = z.infer<typeof ReadingRadioQuestionSchema>;
export type ReadingTrueFalseQuestion = z.infer<typeof ReadingTrueFalseQuestionSchema>;

/** The `content` block for a reading exercise. */
export const ReadingContentSchema = z
  .object({
    ...instructionsField,
    passage: z.string().min(1),
    questions: z.array(ReadingQuestionSchema).min(1),
    trueLabel: z.string().min(1).optional(),
    falseLabel: z.string().min(1).optional(),
    footnote: z.string().min(1).optional(),
  })
  // A radio question's `answer` must be one of its `options` — otherwise no option
  // can ever grade correct. Caught at load with a precise path, not in the browser.
  .superRefine((content, ctx) => {
    content.questions.forEach((question, index) => {
      if (question.type === 'radio' && !question.options.includes(question.answer)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A radio question’s answer must be one of its options.',
          path: ['questions', index, 'answer'],
        });
      }
    });
  });
export type ReadingContent = z.infer<typeof ReadingContentSchema>;

/**
 * The full exercise envelope for a reading exercise: the shared
 * `type`/`options`/`labels` from ExerciseConfigSchema, with `content` narrowed to
 * ReadingContentSchema and `type` pinned to the literal `'reading'`.
 */
export const ReadingExerciseConfigSchema = ExerciseConfigSchema.extend({
  type: z.literal('reading'),
  content: ReadingContentSchema,
});
export type ReadingExerciseConfig = z.infer<typeof ReadingExerciseConfigSchema>;
