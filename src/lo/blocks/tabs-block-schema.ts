/**
 * tabs-block-schema.ts — the per-type `content` contract for `type: "tabs"`,
 * mirroring the per-engine `*-schema.ts` convention.
 *
 * `label` NAMES THE TAB SET and is required. A tablist without an accessible name
 * fails WAI-ARIA, and a `plain` block has no heading of its own to borrow one from.
 *
 * AT LEAST TWO TABS: one tab is not a choice, it is a panel with a button on top.
 *
 * LABELS ARE UNIQUE within the block: the label is the only thing a learner tells
 * tabs apart by, so two "Tu" tabs is an authoring mistake, caught here.
 *
 * EVERY TAB OPENS WITH INSTRUCTIONS (maintainer, 2026-10-07): `instructions` is
 * required, plain text like an accordion's, and renders first in the panel in the
 * same `InstructionsCallout` the accordions use. Required rather than optional so a
 * tab can never ship without telling the learner what to do in it.
 *
 * `text` is exactly a grammar block's `text` — reused, not copied — so a tab accepts
 * paragraphs, lists, tables, the audio player, inline audio and popup links.
 *
 * `media` is OPTIONAL: an image and/or a long audio player with its transcript,
 * rendered after the instruction box and before the text. Its rules live in
 * `media-schema.ts` (spec docs/specs/2026-10-07-tabs-media-design.md §3).
 *
 * STRICT, so a misspelt key (`tabz`) fails at build time instead of silently
 * rendering nothing.
 *
 * Spec: docs/specs/2026-10-07-tabs-block-design.md §3.
 */
import { z } from 'zod';
import { MediaSchema } from './media-schema';
import { TextBlockContentSchema } from './text-block-schema';

/** One authored rich-text entry array, parsed to `RichTextEntry[]`. */
const RichTextEntriesSchema = TextBlockContentSchema.shape.text;

export const TabSchema = z.strictObject({
  /** The tab's visible text. Also its accessible name. */
  label: z.string().min(1),
  /** What to do in this tab. Shown first in the panel, in the instruction box. */
  instructions: z.string().min(1),
  /** Optional image and/or audio with transcript, after the instructions. */
  media: MediaSchema.optional(),
  /** The panel body: one entry per paragraph or block. */
  text: RichTextEntriesSchema,
});
export type Tab = z.infer<typeof TabSchema>;

export const TabsBlockContentSchema = z
  .strictObject({
    /** Block-level instructions, read generically by `sectionContent`. */
    instructions: z.string().min(1).optional(),
    /** The tab set's accessible name (`aria-label` on the tablist). */
    label: z.string().min(1),
    /** Optional rich text above the tabs. */
    intro: RichTextEntriesSchema.optional(),
    /** The tabs, in order. */
    tabs: z.array(TabSchema).min(2),
  })
  .superRefine((content, ctx) => {
    const seen = new Set<string>();
    content.tabs.forEach((tab, index) => {
      if (seen.has(tab.label)) {
        ctx.addIssue({
          code: 'custom',
          message: `duplicate tab label "${tab.label}" — learners tell tabs apart by label`,
          path: ['tabs', index, 'label'],
        });
      }
      seen.add(tab.label);
    });
  });
export type TabsBlockContent = z.infer<typeof TabsBlockContentSchema>;
