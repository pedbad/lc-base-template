/**
 * radio-quiz-schema.ts — the per-type `content` contract for the `radio-quiz`
 * engine (spec §8.2). Tightens lo-schema's deliberately-loose ExerciseConfigSchema
 * `content` for `type: 'radio-quiz'`, so a malformed exercise fails at load with a
 * precise message rather than breaking only in the browser.
 *
 * Unlike select/inline-choice, radio-quiz is NOT blanks-in-a-sentence: it is
 * multiple-choice QUESTIONS. Each question is a `prompt` (stem) plus an `options[]`
 * array, with exactly ONE option marked correct by a leading `*` — the same `*`
 * convention as `[a|*b|c]`, but applied to a plain option array instead of inline
 * blank syntax. Scoring is still the blank-grading family (spec §7): one gradeable
 * "blank" per question.
 *
 * Content shape:
 *   - questions[]   one multiple-choice question per entry:
 *       - prompt        the question stem (plain text).
 *       - options[]     >=2 choices; exactly one starts with `*` (the answer).
 *       - explanation?  optional note shown after a WRONG check (engine decision).
 *       - audio?        reserved asset ref; accepted but NOT rendered yet.
 *   - footnote      optional plain-text note under the exercise.
 *
 * SINGLE-CORRECT, enforced loud: a `.refine()` rejects any question with 0 or 2+
 * starred options, so bad authoring fails the build, not the browser. (Multi-correct
 * questions and a separate multi-select/checkbox engine are deferred — see the
 * "deferred / future" note in docs/TOOLING.md.)
 *
 * Per-question `audio` mirrors select/inline: accepted now so fixtures/LOs can carry
 * refs without a later schema break, but playback waits for the audio subsystem
 * (dictation, #6). No htmlContent/DOMPurify, no audio render (YAGNI).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §8;
 *       docs/specs/2026-06-15-lc-base-template-design.md §10.
 */
import { z } from 'zod';
import { instructionsField } from '../lib/instructions';
import { ExerciseConfigSchema } from '@/config/lo-schema';

/** The marker a correct option carries as its first character. */
const STAR = '*';

/**
 * Split a raw option array into display labels (with the `*` stripped) and the
 * index of the starred winner (`-1` if none). Pure; the single source of truth for
 * the `*` convention, shared by the schema's refine and the engine's render.
 */
export function parseStarredOptions(options: readonly string[]): {
  labels: string[];
  winnerIndex: number;
} {
  let winnerIndex = -1;
  const labels = options.map((option, index) => {
    if (option.startsWith(STAR)) {
      winnerIndex = index;
      return option.slice(STAR.length);
    }
    return option;
  });
  return { labels, winnerIndex };
}

/** Count how many options are marked correct (used by the single-correct refine). */
const countStarred = (options: readonly string[]): number =>
  options.filter((option) => option.startsWith(STAR)).length;

/**
 * One multiple-choice question. `options` needs >=2 entries (a real choice: the
 * answer plus at least one distractor) and EXACTLY one starred option.
 */
export const RadioQuizQuestionSchema = z
  .object({
    prompt: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    /** Shown after a WRONG check for this question (engine decision); optional. */
    explanation: z.string().min(1).optional(),
    /** Reserved asset ref; playback deferred until the audio subsystem is ported. */
    audio: z.string().min(1).optional(),
  })
  .refine((question) => countStarred(question.options) === 1, {
    message: 'Each radio-quiz question must mark exactly one option correct with a leading "*".',
    path: ['options'],
  });
export type RadioQuizQuestion = z.infer<typeof RadioQuizQuestionSchema>;

/** The `content` block for a radio-quiz exercise. */
export const RadioQuizContentSchema = z.object({
  ...instructionsField,
  questions: z.array(RadioQuizQuestionSchema).min(1),
  footnote: z.string().min(1).optional(),
});
export type RadioQuizContent = z.infer<typeof RadioQuizContentSchema>;

/**
 * The full exercise envelope for a radio-quiz exercise: the shared
 * `type`/`options`/`labels` from ExerciseConfigSchema, with `content` narrowed to
 * RadioQuizContentSchema and `type` pinned to the literal `'radio-quiz'`.
 */
export const RadioQuizExerciseConfigSchema = ExerciseConfigSchema.extend({
  type: z.literal('radio-quiz'),
  content: RadioQuizContentSchema,
});
export type RadioQuizExerciseConfig = z.infer<typeof RadioQuizExerciseConfigSchema>;
