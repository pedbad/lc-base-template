/**
 * outcomes-block-schema.ts — the per-type `content` contract for `type: "outcomes"`,
 * mirroring the per-engine `*-schema.ts` convention the exercises use.
 *
 * `lead` and every `items` entry are INLINE RICH TEXT: the schema transforms each to
 * `RichTextNode[]` so the renderer receives a validated tree, never a string it might
 * inject. This is the reason french-lo-1's outcomes list cannot be ported as-is — it
 * is a raw `informationHTML` blob in all 15 of its LO configs, and an HTML field here
 * would be the first injection point in the codebase.
 *
 * `alt` IS REQUIRED BUT MAY BE THE EMPTY STRING. Required means no image can ship
 * without an alt; empty means "this is decoration", which renders `alt=""` plus
 * `aria-hidden` and keeps it out of the accessibility tree. Forcing non-empty text
 * onto a decorative image is an accessibility regression, not an improvement — the
 * screen reader then announces a sentence carrying no information. This is deliberate
 * opposition to the reference, which defaults to "Learning object introduction
 * illustration" and so puts that sentence into every page.
 *
 * Spec: docs/specs/2026-09-11-intro-outcomes-and-split-design.md §2.
 */
import { z } from 'zod';
import { parseRichText } from '../rich-text/parse-rich-text';

/** The block's illustration. Omit the whole object for a list-only block. */
export const OutcomesImageSchema = z.object({
  /** Project-relative asset path; the renderer resolves it through `resolveAsset()`. */
  src: z.string().min(1),
  /** Required. `""` is the explicit decorative choice — see this file's header. */
  alt: z.string(),
});
export type OutcomesImage = z.infer<typeof OutcomesImageSchema>;

export const OutcomesBlockContentSchema = z.object({
  /** Block-level instructions, read generically by `sectionContent`. */
  instructions: z.string().min(1).optional(),
  /** The lead-in, e.g. "After completing this unit, you will be able to:". */
  lead: z
    .string()
    .min(1)
    .transform((value) => parseRichText(value)),
  /** One entry per outcome. At least one — an empty outcomes block is a bug. */
  items: z
    .array(z.string().min(1))
    .min(1)
    .transform((entries) => entries.map((entry) => parseRichText(entry))),
  image: OutcomesImageSchema.optional(),
});
export type OutcomesBlockContent = z.infer<typeof OutcomesBlockContentSchema>;
