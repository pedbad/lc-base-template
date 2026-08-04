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
import { parseRichText } from '../rich-text/parse-rich-text';

export const TextBlockContentSchema = z.object({
  /** Accordion-level instructions, rendered by LoAccordion's one instructions slot. */
  instructions: z.string().min(1).optional(),
  /**
   * One entry per paragraph, each rendered as its own `<p>`.
   *
   * Each entry is INLINE RICH TEXT: the schema transforms it to `RichTextNode[]` so
   * the renderer receives a validated tree, never a string it might inject. A plain
   * string with no markup yields one text node, so prose authored before rich text
   * existed keeps working untouched (spec §2).
   */
  text: z
    .array(z.string().min(1))
    .min(1)
    .transform((paragraphs) => paragraphs.map((paragraph) => parseRichText(paragraph))),
});
export type TextBlockContent = z.infer<typeof TextBlockContentSchema>;
