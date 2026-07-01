/**
 * memory-match-schema.ts — the per-type `content` contract for the `memory-match`
 * engine (#9). A pairs game: the learner flips cards to pair each picture with its
 * word. Scoring family: own model (card flips, tries vs pairs) — spec §7.
 *
 * Content shape:
 *   - items[]   one picture↔word PAIR each (becomes two cards in the deck):
 *       - text           the word shown on the text card (the foreign-language term).
 *       - image          the picture asset path for the image card.
 *       - audio?         optional clip played when the pair is matched (hear the word).
 *       - alt?           image alt text. Never the answer word — describe the picture.
 *       - localLanguage? a translation/hint (used as the image alt fallback).
 *   - footnote?  optional plain-text note.
 *
 * The deck is always shuffled (matching IS the exercise, so `options.shuffle` is N/A —
 * spec §5.2); `options.sampleSize` plays a random N of M pairs. `allowShowAnswers`
 * applies (§5.3). A pairs game needs at least two pairs.
 *
 * Keys must be unique: a duplicate text/id would make two pairs indistinguishable,
 * so it fails the build.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2, §5.2, §7, §8.
 */
import { z } from 'zod';
import { ExerciseConfigSchema } from '@/config/lo-schema';

export const MemoryMatchItemSchema = z.object({
  id: z.string().min(1).optional(),
  text: z.string().min(1),
  image: z.string().min(1),
  audio: z.string().min(1).optional(),
  alt: z.string().min(1).optional(),
  localLanguage: z.string().min(1).optional(),
});
export type MemoryMatchItem = z.infer<typeof MemoryMatchItemSchema>;

/** The key that identifies a pair: explicit `id`, else the `text`. */
export const memoryMatchItemKey = (item: MemoryMatchItem): string => item.id ?? item.text;

export const MemoryMatchContentSchema = z
  .object({
    items: z.array(MemoryMatchItemSchema).min(2),
    footnote: z.string().min(1).optional(),
  })
  .refine(
    (content) => {
      const keys = content.items.map(memoryMatchItemKey);
      return new Set(keys).size === keys.length;
    },
    {
      message: 'Each memory-match item needs a unique id or text (it identifies a pair).',
      path: ['items'],
    },
  );
export type MemoryMatchContent = z.infer<typeof MemoryMatchContentSchema>;

export const MemoryMatchExerciseConfigSchema = ExerciseConfigSchema.extend({
  type: z.literal('memory-match'),
  content: MemoryMatchContentSchema,
});
export type MemoryMatchExerciseConfig = z.infer<typeof MemoryMatchExerciseConfigSchema>;
