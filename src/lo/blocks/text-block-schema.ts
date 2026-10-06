/**
 * text-block-schema.ts — the per-type `content` contract for the prose block bodies
 * (`type: "prose"` and `type: "grammar"`), mirroring the per-engine `*-schema.ts`
 * convention the exercises use.
 *
 * `text` is an ARRAY of paragraphs, not one string the renderer splits: splitting
 * prose on sentence boundaries in code guesses wrong on abbreviations, decimals and
 * quotations, and the author already knows where the breaks belong.
 */
import { z } from 'zod';
import { parseRichTextEntry } from '../rich-text/parse-rich-text-entry';

export const TextBlockContentSchema = z.object({
  /** Accordion-level instructions, rendered by LoAccordion's one instructions slot. */
  instructions: z.string().min(1).optional(),
  /**
   * One entry per paragraph OR per block (a list, table or audio player — spec §14).
   *
   * The schema transforms each entry to a `RichTextEntry` so the renderer receives a
   * validated tree, never a string it might inject. A plain string with no markup
   * yields a one-text-node paragraph, so prose authored before rich text existed keeps
   * working untouched (spec §2).
   */
  text: z
    .array(z.string().min(1))
    .min(1)
    .transform((entries) => entries.map((entry) => parseRichTextEntry(entry))),
});
export type TextBlockContent = z.infer<typeof TextBlockContentSchema>;
