/**
 * nav-section.ts — the shape the nav and the page body BOTH read from, so nav
 * entries are never hand-authored twice (spec §1: "generated FROM the section list —
 * not hand-authored separately").
 *
 * There is no default list here on purpose. Sections are declared by the LO's
 * `lo.json` and reach the shell through `src/lo/lo-page-sections.tsx`; a constant
 * list in code would be a second source of truth for what sections exist — exactly
 * the split the french-lo-1 reference has, where the introduction is hardcoded in the
 * nav while every other section comes from config.
 */

/** One top-level section, as the nav and the page frame see it. */
export interface NavSection {
  /** In-page anchor target (`#id`) and the base for `headingId(id)`. */
  readonly id: string;
  /** The section's `<h2>` text, and the nav text unless `navLabel` overrides it. */
  readonly label: string;
  /**
   * Nav-only override for when the heading is too long for a nav bar. Nav text
   * resolves as `navLabel ?? label` — one fallback, honestly named (the reference
   * implementation's `menuText`/`titleText` pair never said which was which).
   */
  readonly navLabel?: string;
}
