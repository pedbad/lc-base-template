/**
 * sources-block-schema.ts — the per-type `content` contract for `type: "sources"`, a
 * references list: citations grouped under optional headings, each marked as a print
 * or a web source, with an optional note on which extract was used.
 *
 * `citation` and `note` are INLINE RICH TEXT, transformed to `RichTextNode[]` like the
 * outcomes block's items, so a journal title can be `<em>` and a web source's link is
 * an ordinary `<a href>` — which already renders as a new-tab link that says so. A
 * separate `link` field would be a second way to author the same thing.
 *
 * `kind` IS A CLOSED SET. A typo fails the build instead of rendering an entry with no
 * icon. A `web` source MUST contain a link: a web citation the learner cannot follow is
 * the one mistake an author cannot see by reading their own JSON. Every object is
 * strict, as in the tabs block: a misspelt key fails rather than vanishing.
 *
 * Plan: docs/process/2026-10-12-sources-block-plan.md.
 */
import { z } from 'zod';
import { parseRichText } from '../rich-text/parse-rich-text';
import type { RichTextNode } from '../rich-text/rich-text-nodes';

/** True when `nodes`, at any depth, holds a plain `<a href>` link. */
function containsLink(nodes: readonly RichTextNode[]): boolean {
  return nodes.some(
    (node) => node.kind === 'link' || ('children' in node && containsLink(node.children)),
  );
}

const richText = z
  .string()
  .min(1)
  .transform((value) => parseRichText(value));

export const SourceItemSchema = z
  .strictObject({
    /** `print` → book icon; `web` → globe icon, and a link is required. */
    kind: z.enum(['print', 'web']),
    /** The reference itself, e.g. "Foley, R. (2003) On Stony Ground… <em>Evol. Anth.</em>". */
    citation: richText,
    /** Which part was used, e.g. "This extract from p120, column 3". */
    note: richText.optional(),
  })
  .superRefine((item, context) => {
    if (item.kind === 'web' && !containsLink(item.citation)) {
      context.addIssue({
        code: 'custom',
        path: ['citation'],
        message: 'A web source needs a link: put an <a href="https://…"> in its citation.',
      });
    }
  });
export type SourceItem = z.infer<typeof SourceItemSchema>;

export const SourceGroupSchema = z.strictObject({
  /** Optional subheading, e.g. the section the extracts were used in. */
  heading: z.string().min(1).optional(),
  /** At least one — an empty group is a bug. */
  items: z.array(SourceItemSchema).min(1),
});
export type SourceGroup = z.infer<typeof SourceGroupSchema>;

export const SourcesBlockContentSchema = z.strictObject({
  /** Block-level instructions, read generically by `sectionContent`. */
  instructions: z.string().min(1).optional(),
  groups: z.array(SourceGroupSchema).min(1),
});
export type SourcesBlockContent = z.infer<typeof SourcesBlockContentSchema>;
