/**
 * flashcards-schema.ts — the per-type `content` + `options` contract for the
 * `flashcards` engine (Phase C, engine #13). A self-assessed vocab deck: the learner
 * reads one side of a card, flips it, and rates their own recall. Scoring family:
 * own model (like memory-match) — no Check/Show-answers footer (spec §4).
 *
 * Content shape:
 *   - cards[]   one term↔translation card each:
 *       - target    the term in the language being learned (Spanish). Always the
 *                   `lang={TARGET_LANG}` side and the side the audio icon attaches to.
 *       - native    the learner's-language translation (English).
 *       - image?    optional picture asset (mnemonic; shown on the reveal side).
 *       - audio?    optional recorded clip of the `target` term (author-supplied).
 *   - footnote?  optional plain-text note.
 *
 * `target`/`native` are named by ROLE, not by side, so the direction toggle can put
 * either on the front. Audio + `lang={TARGET_LANG}` always follow `target`.
 *
 * Options (extends the shared block with flashcard-only switches):
 *   - shuffle?        randomize card order (Step 1). Restart re-shuffles.
 *   - direction?      which side faces front by default. 'target-native' (default)
 *                     = Spanish→English, recognition-first (spec §4).
 *   - lockDirection?  hide the learner's direction toggle (author locks the deck).
 *   - srs?            reserved for the Step 2 localStorage spaced-repetition layer;
 *                     ignored by the in-memory Step 1 engine.
 *
 * Spec: docs/specs/2026-07-03-new-exercise-engines-design.md §4.
 */
import { z } from 'zod';
import { instructionsField } from '../lib/instructions';
import { ExerciseConfigSchema, ExerciseOptionsSchema } from '@/config/lo-schema';

/** Which card side faces front. `target-native` = Spanish→English (recognition-first). */
export const FLASHCARD_DIRECTIONS = ['target-native', 'native-target'] as const;
export type FlashcardDirection = (typeof FLASHCARD_DIRECTIONS)[number];

export const FlashcardSchema = z.object({
  target: z.string().min(1),
  native: z.string().min(1),
  image: z.string().min(1).optional(),
  audio: z.string().min(1).optional(),
});
export type Flashcard = z.infer<typeof FlashcardSchema>;

export const FlashcardsContentSchema = z.object({
  ...instructionsField,
  cards: z.array(FlashcardSchema).min(1),
  footnote: z.string().min(1).optional(),
});
export type FlashcardsContent = z.infer<typeof FlashcardsContentSchema>;

/**
 * Flashcard options extend the shared block with direction + SRS switches. `sampleSize`
 * and `allowShowAnswers` are inherited but unused (no Show-answers control); keeping the
 * base shape avoids diverging the options contract.
 */
export const FlashcardsOptionsSchema = ExerciseOptionsSchema.extend({
  direction: z.enum(FLASHCARD_DIRECTIONS).default('target-native'),
  lockDirection: z.boolean().default(false),
  srs: z.boolean().default(false),
});
export type FlashcardsOptions = z.infer<typeof FlashcardsOptionsSchema>;

export const FlashcardsExerciseConfigSchema = ExerciseConfigSchema.extend({
  type: z.literal('flashcards'),
  content: FlashcardsContentSchema,
  options: FlashcardsOptionsSchema.optional(),
});
export type FlashcardsExerciseConfig = z.infer<typeof FlashcardsExerciseConfigSchema>;
