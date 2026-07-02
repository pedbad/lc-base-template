/**
 * line-match-schema.ts — the per-type `content` contract for the `line-match` engine
 * (#7). The learner matches each picture to its word. Scoring family: blank-grading
 * (one gradeable match per picture).
 *
 * Content shape:
 *   - items[]   one picture↔word pair each:
 *       - id?            stable key used to pair picture with its word; falls back
 *                        to `label`. Provide `id` when two items could share a label.
 *       - label          the word the learner picks/connects (the answer).
 *       - image          the picture asset path.
 *       - audio?         optional clip (e.g. hear the word).
 *       - alt?           accessibility alt text. IMPORTANT: never the `label` — a
 *                        screen-reader user would hear the answer. Describe the image
 *                        ("a red circle") or omit (decorative).
 *       - localLanguage? a translation/hint shown beside the picture (not the answer).
 *   - footnote?  optional plain-text note.
 *
 * The word bank is always shuffled (the matching IS the exercise, so `options.shuffle`
 * is N/A — spec §5.2); `options.sampleSize` picks a random N of M pairs.
 *
 * Keys must be unique: a duplicate id/label would make two pictures indistinguishable
 * when grading the match, so it fails the build.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §8.
 */
import { z } from 'zod';
import { instructionsField } from '../lib/instructions';
import { ExerciseConfigSchema } from '@/config/lo-schema';

export const LineMatchItemSchema = z.object({
  id: z.string().min(1).optional(),
  label: z.string().min(1),
  image: z.string().min(1),
  audio: z.string().min(1).optional(),
  alt: z.string().min(1).optional(),
  localLanguage: z.string().min(1).optional(),
});
export type LineMatchItem = z.infer<typeof LineMatchItemSchema>;

/** The key that pairs a picture with its word: explicit `id`, else the `label`. */
export const lineMatchItemKey = (item: LineMatchItem): string => item.id ?? item.label;

export const LineMatchContentSchema = z
  .object({
    ...instructionsField,
    items: z.array(LineMatchItemSchema).min(2),
    footnote: z.string().min(1).optional(),
  })
  .refine(
    (content) => {
      const keys = content.items.map(lineMatchItemKey);
      return new Set(keys).size === keys.length;
    },
    {
      message:
        'Each line-match item needs a unique id or label (it pairs a picture with its word).',
      path: ['items'],
    },
  );
export type LineMatchContent = z.infer<typeof LineMatchContentSchema>;

export const LineMatchExerciseConfigSchema = ExerciseConfigSchema.extend({
  type: z.literal('line-match'),
  content: LineMatchContentSchema,
});
export type LineMatchExerciseConfig = z.infer<typeof LineMatchExerciseConfigSchema>;
