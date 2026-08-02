/**
 * sections.ts — the ordered top-level section list that drives BOTH the nav
 * (Header links) and the page body (PageLayout <section>s). ONE source, so nav
 * entries are never hand-authored twice (spec §1: "generated FROM the section
 * list — not hand-authored separately").
 *
 * For Part A this is a small local constant. In later Phase C parts it comes from
 * the LO manifest (lo.json → blocks/exercises → section order).
 */

/** One top-level section: its `id` is the in-page anchor target (`#id`) and its
 *  `label` is the visible nav text + `<h2>`. */
export interface NavSection {
  readonly id: string;
  readonly label: string;
}

/** Placeholder section list for the Part A shell (spec §1 order). */
export const DEFAULT_SECTIONS: readonly NavSection[] = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'grammar', label: 'Grammar' },
  { id: 'vocabulary', label: 'Vocabulary' },
  { id: 'exercises', label: 'Exercises' },
];
