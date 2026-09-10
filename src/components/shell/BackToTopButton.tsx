/**
 * BackToTopButton — the in-flow "back to top" control (§D · D4).
 *
 * IT IS NOT A FLOATING BUTTON, in the reference either: `top-button-container`
 * matched zero CSS rules there, and the element was `mt-3 flex justify-end` — inline,
 * right-aligned, in normal flow. It renders once per static block, never inside an
 * accordion (collapsing one already returns the reader upward, and inside a closed one
 * the button is unreachable because Radix unmounts the content).
 *
 * IT FADES IN AS IT SCROLLS INTO VIEW, AND NOT ONE LINE OF THAT IS HERE. The
 * reference did it with an IntersectionObserver watching its OWN container, so
 * `isIntersecting` only ever meant "I am on screen" — a script laboriously
 * approximating scroll position. §D4 deleted that; the effect was wanted back
 * (2026-09-10) and now lives in back-to-top.css as a scroll-driven animation on a
 * view timeline. Read that file's header before touching the fade: the hidden state
 * is inside the keyframes on purpose, so that skipping the animation leaves a VISIBLE
 * button rather than an invisible one.
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
