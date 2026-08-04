/**
 * vocabulary-block-schema.ts — the per-type `content` contract for
 * `type: "vocabulary"`, mirroring the per-engine `*-schema.ts` convention.
 */
import { z } from 'zod';

export const VocabularyItemSchema = z.object({
  /** The target-language word or phrase. */
  term: z.string().min(1),
  /** Its UI-language gloss. */
  gloss: z.string().min(1),
});
export type VocabularyItem = z.infer<typeof VocabularyItemSchema>;

export const VocabularyBlockContentSchema = z.object({
  /** Accordion-level instructions, rendered by LoAccordion's one instructions slot. */
  instructions: z.string().min(1).optional(),
  items: z.array(VocabularyItemSchema).min(1),
});
export type VocabularyBlockContent = z.infer<typeof VocabularyBlockContentSchema>;
