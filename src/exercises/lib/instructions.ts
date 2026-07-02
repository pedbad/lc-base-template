/**
 * instructions.ts — the per-exercise instruction copy and its resolver.
 *
 * Every exercise shows a short info box telling the learner WHAT to do and WHICH
 * buttons to use (Check / Reset / Show answers). The copy is model-driven:
 *
 *   - Each engine `type` has built-in default copy in EXERCISE_INSTRUCTIONS.
 *   - An author may override it per exercise via `content.instructions`.
 *     - `''` (empty) or explicit `null` → render nothing (suppress the box).
 *     - a non-empty string → use it verbatim.
 *     - absent / `undefined` → fall back to the type default.
 *
 * EXERCISE_INSTRUCTIONS is an exhaustive Record over EXERCISE_TYPE_KEYS, so adding
 * a new engine without writing its default copy is a compile error, not a silently
 * blank box.
 *
 * Button-reference caveat (spec §4): copy names only the buttons an engine actually
 * shows. Standard engines list Check / Reset / Show answers; `memory-match`
 * self-checks as cards are flipped, so its copy references only Reset.
 *
 * The button names are wrapped in `**…**` markers so the presentational component
 * (ExerciseInstructions) can bold them; the resolver returns the raw string and
 * never touches markup.
 *
 * Spec: docs/process/2026-07-02-instructions-box-handover.md §2, §3, §6.
 */
import { z } from 'zod';
import { type ExerciseType } from '@/config/exercise-types';

/**
 * Default instruction copy for every engine type. `**word**` marks a button name
 * for bolding at render time. Exhaustive over EXERCISE_TYPE_KEYS by construction.
 */
export const EXERCISE_INSTRUCTIONS: Record<ExerciseType, string> = {
  select:
    'Choose the correct option for each gap from the drop-down menus. Select **Check** to mark your answers, **Reset** to start over, or **Show answers** to reveal the correct choices.',
  'inline-choice':
    'Pick the correct option for each gap. Select **Check** to mark your answers, **Reset** to clear them, or **Show answers** to reveal the correct choices.',
  'radio-quiz':
    'Select one answer for each question. Choose **Check** to mark your answers, **Reset** to clear them, or **Show answers** to reveal the correct choices.',
  'inline-gap':
    'Type your answer into each gap; press Enter to jump to the next one. Select **Check** to mark your answers, **Reset** to clear them, or **Show answers** to reveal the correct answers.',
  'typed-transform':
    'Rewrite each sentence in the box as instructed. Select **Check** to mark your answers, **Reset** to clear them, or **Show answers** to reveal the correct answers.',
  dictation:
    'Play the audio and type what you hear. Select **Check** to mark your answers, **Reset** to clear them, or **Show answers** to reveal the correct text.',
  'word-order':
    'Drag or click the words to arrange them into the correct sentence. Select **Check** to mark your answer, **Reset** to start over, or **Show answers** to reveal the correct order.',
  'phrase-reorder':
    'Put the phrases in the correct order. Select **Check** to mark your answer, **Reset** to start over, or **Show answers** to reveal the correct order.',
  'drag-fill-gaps':
    'Drag each word into the gap where it belongs. Select **Check** to mark your answers, **Reset** to return the words, or **Show answers** to reveal the correct placement.',
  'line-match':
    'Match each item on the left with its pair on the right. Select **Check** to mark your matches, **Reset** to clear them, or **Show answers** to reveal the correct pairs.',
  'memory-match':
    'Flip the cards two at a time to find the matching pairs. Matches are kept automatically; select **Reset** to shuffle and start again.',
  'word-spot':
    'Click every part of the text that matches the target. Select **Check** to mark your selection, **Reset** to clear it, or **Show answers** to reveal the correct parts.',
};

/**
 * Resolve the instruction text for an exercise.
 *
 * @param type     the engine type (selects the default copy).
 * @param override the author's `content.instructions`, if any.
 * @returns the text to show, or `null` to suppress the box entirely.
 */
export function resolveInstructions(type: ExerciseType, override?: string | null): string | null {
  if (override === '' || override === null) return null;
  if (typeof override === 'string' && override.trim() !== '') return override;
  return EXERCISE_INSTRUCTIONS[type];
}

/**
 * Shared Zod fragment for the optional per-exercise `instructions` override.
 * Spread into each engine's `content` schema so all 12 stay consistent. `''` is
 * intentionally allowed — it means "suppress the box" (handled by the resolver).
 */
export const instructionsField = { instructions: z.string().optional() };
