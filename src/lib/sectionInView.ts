/**
 * sectionInView — the scroll-spy's selection rules, kept pure so they are tested
 * without a DOM (header scroll-spy spec §3). `useScrollSpy` measures; this decides.
 */

/** A section's id and its top edge, in viewport px (`getBoundingClientRect().top`). */
export interface SectionTop {
  id: string;
  top: number;
}

/** How close to the end counts as the end — absorbs sub-pixel scroll positions. */
const BOTTOM_TOLERANCE_PX = 2;

/**
 * The section in view: the LAST one, in page order, whose top has reached the trigger
 * line. None reached → `undefined`, which is the hero (S2). At the bottom of the page
 * the last section wins outright (S4): a short final section can never climb to the
 * line, and would otherwise never be active.
 */
export function pickSectionInView(
  sections: readonly SectionTop[],
  triggerLine: number,
  isAtBottom: boolean,
): string | undefined {
  if (isAtBottom) return sections.at(-1)?.id;
  return sections.findLast((section) => section.top <= triggerLine)?.id;
}

/**
 * True when the viewport has reached the end of the document. Requires SOME scrolling
 * first, so a page short enough to fit the viewport does not open with its last
 * section lit.
 */
export function isScrolledToBottom(
  scrollY: number,
  viewportHeight: number,
  documentHeight: number,
): boolean {
  return scrollY > 0 && scrollY + viewportHeight >= documentHeight - BOTTOM_TOLERANCE_PX;
}
