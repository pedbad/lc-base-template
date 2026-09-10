/**
 * BackToTopButton — the in-flow "back to top" control (§D · D4).
 *
 * IT IS NOT A FLOATING BUTTON, in the reference either: `top-button-container`
 * matched zero CSS rules there, and the element was `mt-3 flex justify-end` — inline,
 * right-aligned, in normal flow. It renders once per static block, never inside an
 * accordion (collapsing one already returns the reader upward, and inside a closed one
 * the button is unreachable because Radix unmounts the content).
 *
 * WHAT WAS DELETED, AND WHY THAT WAS THE FIX. The reference faded this in with an
 * IntersectionObserver watching its OWN container, so `isIntersecting` meant "I am on
 * screen" — machinery re-implementing scrolling for an element that is visible when
 * you scroll to it. Deleting it removed two defects outright rather than fixing them:
 * a `duration-[3600ms]` reveal, and an `opacity-0` + `pointer-events-none` +
 * `tabIndex={-1}` hidden state that stayed in the accessibility tree the whole time.
 * It also removed the `inert` question, the `useState`/`useEffect`, and the prerender
 * question. `useIsHydrated` is deliberately NOT used: with the observer gone there is
 * no client-only state to gate.
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
  return (
    <button
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
