/**
 * word-spot-schema.ts — the per-type `content` contract for the `word-spot` engine
 * (#8). The learner reads a phrase and CLICKS the part-words that carry a target
 * feature (a sound, a spelling pattern). Correct part-words are authored inside
 * square brackets; everything else is a distractor that scores a miss when clicked.
 * Scoring family: own model (click-mark) — spec §7.
 *
 * Content shape:
 *   - items[]   one phrase line each:
 *       - text     the phrase. Wrap each correct part-word in brackets:
 *                  "el ch[ic]o com[i]ó" → `ic` and `i` are the clickable targets;
 *                  all other words are distractors (a click on them = a miss).
 *                  Brackets may sit mid-word, so a single word can hold a target.
 *       - audio?   optional clip to hear the phrase (click-to-play speaker).
 *   - footnote?  optional plain-text instruction/note.
 *
 * `options.shuffle` / `sampleSize` are N/A here: the phrase order IS the content,
 * so nothing is shuffled or sampled. Only `options.allowShowAnswers` applies.
 *
 * At least one item must contain a `[bracketed]` target, otherwise there is nothing
 * to spot and the exercise can never complete — a build-time authoring error.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2, §7, §8.
 */
import { z } from 'zod';
import { ExerciseConfigSchema } from '@/config/lo-schema';

/** A `[bracketed]` target somewhere in the text. */
const WORD_SPOT_TARGET_REGEX = /\[[^\]]+\]/;

export const WordSpotItemSchema = z.object({
  text: z.string().min(1),
  audio: z.string().min(1).optional(),
});
export type WordSpotItem = z.infer<typeof WordSpotItemSchema>;

export const WordSpotContentSchema = z
  .object({
    items: z.array(WordSpotItemSchema).min(1),
    footnote: z.string().min(1).optional(),
  })
  .refine((content) => content.items.some((item) => WORD_SPOT_TARGET_REGEX.test(item.text)), {
    message: 'word-spot needs at least one [bracketed] target part-word to click.',
    path: ['items'],
  });
export type WordSpotContent = z.infer<typeof WordSpotContentSchema>;

export const WordSpotExerciseConfigSchema = ExerciseConfigSchema.extend({
  type: z.literal('word-spot'),
  content: WordSpotContentSchema,
});
export type WordSpotExerciseConfig = z.infer<typeof WordSpotExerciseConfigSchema>;
