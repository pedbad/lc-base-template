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

export const TextBlockContentSchema = z.object({
  /** Accordion-level instructions, rendered by LoAccordion's one instructions slot. */
  instructions: z.string().min(1).optional(),
  /** One entry per paragraph, each rendered as its own `<p>`. */
  text: z.array(z.string().min(1)).min(1),
});
export type TextBlockContent = z.infer<typeof TextBlockContentSchema>;
