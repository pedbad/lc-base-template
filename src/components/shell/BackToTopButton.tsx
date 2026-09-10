/**
 * BackToTopButton — the in-flow "back to top" control (§D · D4).
 *
 * IT IS NOT A FLOATING BUTTON, in the reference either: `top-button-container`
 * matched zero CSS rules there, and the element was `mt-3 flex justify-end` — inline,
 * right-aligned, in normal flow. It renders once per static block, never inside an
 * accordion (collapsing one already returns the reader upward, and inside a closed one
 * the button is unreachable because Radix unmounts the content).
 *
 * IT FADES IN THE FIRST TIME IT IS SEEN, and the only line of that here is the ref.
 * §D4 deleted the reference's IntersectionObserver; the fade was wanted back
 * (2026-09-10) and was first rebuilt as a CSS `view()` timeline, which MEASURABLY did
 * not work for this effect — a view timeline is positional, so the three of four
 * buttons already on screen at load sat past `entry 100%` and never faded. "First
 * time seen" has no positional expression, so the observer came back, in
 * `useRevealOnFirstView`. Read that hook and back-to-top.css before touching this:
 * the hiding is armed in index.html BEFORE first paint and is fail-safe by omission,
 * so every path without it leaves a plainly VISIBLE button.
 *
 * What the observer took with it is still gone, and this is the part worth keeping:
 * the `duration-[3600ms]` reveal (a scroll-linked animation has no duration to get
 * wrong), and the `pointer-events-none` + `tabIndex={-1}` pair that left a control
 * announced but unusable. This button is always focusable and always clickable, at
 * any point in the fade. There is no `useState`, no `useEffect`, no `inert` question
 * and no prerender question, and `useIsHydrated` is deliberately unused: there is no
 * client-only state to gate.
 *
 * THREE MORE DEFECTS CORRECTED HERE:
 *   - `aria-describedby`, because about five of these render per LO and all of them
 *     are named "Back to top". Pointing at the owning section's heading makes them
 *     announce as "Back to top, Exercises". Guard h checks landmarks, labels and
 *     heading order — it does not compare two buttons' names, so nothing would have
 *     caught it. The id comes from `headingId` (§5), which is the same function
 *     `<section aria-labelledby>` consumes, so there is no second id scheme.
 *   - `type="button"`. shadcn `Button` set this; a bare `<button>` defaults to
 *     `submit`.
 *   - No `Tooltip`. Wrapping a button that already carries
 *     `aria-label="Back to top"` in a tooltip saying "Back to top" is redundant for
 *     assistive technology, and a dependency for an arrow icon.
 *
 * The focus ring moves to back-to-top.css: dropping shadcn `Button` drops its ring.
 */
import { ArrowUpIcon } from 'lucide-react';
import { useRevealOnFirstView } from '@/hooks/useRevealOnFirstView';
import { headingId } from '@/lib/headingId';
import { scrollToTop } from '@/lib/scrollToTop';
import './back-to-top.css';

interface BackToTopButtonProps {
  /**
   * Base id of the section this button closes — its heading becomes the button's
   * `aria-describedby`. Required rather than optional so a mount point cannot quietly
   * reintroduce a page of identically-named buttons; guard h fails on a dangling
   * reference, so a wrong id is caught rather than announced as nothing.
   */
  sectionId: string;
}

export default function BackToTopButton({ sectionId }: BackToTopButtonProps) {
  const revealRef = useRevealOnFirstView<HTMLButtonElement>();

  return (
    <button
      ref={revealRef}
      type="button"
      className="back-to-top"
      aria-label="Back to top"
      aria-describedby={headingId(sectionId)}
      onClick={scrollToTop}
    >
      <ArrowUpIcon className="back-to-top-icon" aria-hidden="true" focusable="false" />
    </button>
  );
}
