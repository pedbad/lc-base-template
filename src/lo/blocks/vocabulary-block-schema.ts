/**
 * vocabulary-block-schema.ts — the per-type `content` contract for
 * `type: "vocabulary"`, mirroring the per-engine `*-schema.ts` convention.
 */
import { z } from 'zod';
import { parseRichText } from '../rich-text/parse-rich-text';

export const VocabularyItemSchema = z.object({
  /** The target-language word or phrase. */
  term: z.string().min(1),
  /** Its UI-language gloss. */
  gloss: z.string().min(1),
  /**
   * Optional clip of the TERM being said, rendered as a speaker button beside it.
   *
   * Optional because a vocabulary list is useful without audio and a course may not
   * have recordings yet — a required field would make every clone record audio before
   * it could ship a word list. `audio` is a key guard d already sweeps, so a path
   * pointing at a file that is not there fails the build rather than going silent in
   * the browser.
   */
  audio: z.string().min(1).optional(),
});
export type VocabularyItem = z.infer<typeof VocabularyItemSchema>;

/**
 * An info alert above the list (maintainer, 2026-10-08, after french-lo-1): a lead
 * line ("You will learn:") and a ticked list. Both are INLINE RICH TEXT, like the
 * outcomes block's, so a summary can italicise the words it previews.
 */
export const VocabularySummarySchema = z.object({
  lead: z
    .string()
    .min(1)
    .transform((value) => parseRichText(value)),
  items: z
    .array(z.string().min(1))
    .min(1)
    .transform((entries) => entries.map((entry) => parseRichText(entry))),
});

export const VocabularyBlockContentSchema = z.object({
  /** Accordion-level instructions, rendered by LoAccordion's one instructions slot. */
  instructions: z.string().min(1).optional(),
  summary: VocabularySummarySchema.optional(),
  items: z.array(VocabularyItemSchema).min(1),
});
export type VocabularyBlockContent = z.infer<typeof VocabularyBlockContentSchema>;
