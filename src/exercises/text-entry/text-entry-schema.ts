/**
 * text-entry-schema.ts — the shared `content` contract for the typed-response table
 * engines: typed-transform (#5) and dictation (#6). Both render a table of rows, each
 * with an expected answer the learner types; they differ only in how answers are
 * compared (a runtime behavior, not content), so they share this content shape (spec
 * §9 — port as-is on one runtime, split only if the rules diverge).
 *
 * Content shape:
 *   - rows[]     one gradeable row each:
 *       - prompt?   the cue shown to the learner (a base form to transform); omit for
 *                   audio-only rows (dictation).
 *       - answer    the expected typed response (the transformed form / transcription).
 *       - audio?    optional per-row clip (click-to-play speaker).
 *   - columns?   optional header labels { prompt, answer } for the two text columns.
 *   - footnote?  optional plain-text note under the table.
 *
 * This is the french-lo-1 `phrases` tuple `[prompt, "[answer]", sound]` rewritten as a
 * typed object: the bracket-marking is dropped (answer is its own field, not inline
 * prose), matching the template's object-item convention.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §8, §9.
 */
import { z } from 'zod';

/** One row: an optional cue, the expected typed answer, and an optional clip. */
export const TextEntryRowSchema = z.object({
  prompt: z.string().min(1).optional(),
  answer: z.string().min(1),
  audio: z.string().min(1).optional(),
});
export type TextEntryRow = z.infer<typeof TextEntryRowSchema>;

/** The shared `content` block for a typed-response table exercise. */
export const TextEntryContentSchema = z.object({
  rows: z.array(TextEntryRowSchema).min(1),
  columns: z.object({ prompt: z.string().min(1), answer: z.string().min(1) }).optional(),
  footnote: z.string().min(1).optional(),
});
export type TextEntryContent = z.infer<typeof TextEntryContentSchema>;
