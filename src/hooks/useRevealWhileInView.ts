/**
 * useRevealWhileInView — keep an element marked for as long as it is on screen.
 *
 * WHY AN OBSERVER, AFTER §D4 DELETED ONE. §D4 removed the reference's
 * IntersectionObserver and replaced the fade with a CSS `view()` timeline. That was
 * wrong for this effect, measured 2026-09-10: a view timeline is purely POSITIONAL,
 * so an element already inside the viewport when the page loads sits past
 * `entry 100%` and never animates. On the example LO three of the four buttons are
 * on screen at load, so three of four never faded. The effect actually wanted is
 * "the first time this is seen", which has no positional expression — the reference
 * got that right, whatever else it got wrong.
 *
 * IT TOGGLES BOTH WAYS, and that is the point rather than a detail. A first version
 * revealed once and disconnected, which is a defensible reading of "fade in when
 * scrolled into view" and was WRONG in practice: the fade then happens once, inside
 * the first second of page load, and never again however far you scroll — which reads
 * as no animation at all. The reference sets `setShowButton(entry.isIntersecting)` on
 * every callback, so its buttons fade out as they leave and back in as they return,
 * and THAT is what makes the effect visible. Hence no `disconnect()` on intersect.
 *
 * NO REACT STATE, DELIBERATELY. The reveal is a `data-seen` attribute set straight on
 * the DOM node, so nothing re-renders and there is no client/server state to
 * disagree about. `useState` here would re-render every button on first paint for a
 * value only CSS reads.
 *
 * IT ONLY ARMS IF THE DOCUMENT IS ARMED. index.html adds `js-reveal` to <html>
 * before first paint, and only when IntersectionObserver exists and the reader has
 * not asked for reduced motion. Without that class the stylesheet never hides
 * anything, so this hook has nothing to reveal and returns early.
 *
 * IT REVEALS ON FAILURE, AND "FAILURE" INCLUDES SILENCE. Construction throwing is the
 * easy case. The dangerous one, found in testing: an observer that is created and
 * observes happily but never DELIVERS a callback — delivery needs the frame pipeline,
 * so a background or throttled document can leave every button transparent for ever.
 * That is a worse defect than the one §D4 removed, so it is guarded explicitly.
 *
 * The guard distinguishes "not on screen yet" from "this observer is dead", which a
 * plain timeout cannot: IntersectionObserver always queues an INITIAL callback for
 * each observed element, whether or not it intersects. So receiving any callback at
 * all proves delivery works, and receiving none within FALLBACK_MS means it does not
 * — at which point the button is revealed and the effect abandoned. A bare timeout
 * would instead reveal below-fold buttons early and defeat the effect on every page.
 */
import { useEffect, useRef } from 'react';

/** Matches the reference's observer: 15% visible, discounting the bottom 8%. */
const THRESHOLD = 0.15;
const ROOT_MARGIN = '0px 0px -8% 0px';

/** How long to wait for ANY callback before concluding delivery is broken. The
 *  initial notification is queued at observe() time, so this is generous. */
const FALLBACK_MS = 1000;

/** Ref for an element that should fade in while on screen and out when it leaves. */
export function useRevealWhileInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Not armed (no JS-reveal class) → nothing is hidden → nothing to do.
    if (!document.documentElement.classList.contains('js-reveal')) return;
    // Already revealed, e.g. after a remount.
    if (node.dataset.seen !== undefined) return;

    const reveal = () => {
      node.dataset.seen = '';
    };
    const hide = () => {
      delete node.dataset.seen;
    };

    let observer: IntersectionObserver;
    let delivered = false;

    try {
      observer = new IntersectionObserver(
        (entries) => {
          delivered = true; // proves this observer can deliver; see FALLBACK_MS
          for (const entry of entries) {
            if (entry.isIntersecting) reveal();
            else hide();
          }
        },
        { threshold: THRESHOLD, rootMargin: ROOT_MARGIN },
      );
      observer.observe(node);
    } catch {
      reveal(); // never leave a button hidden because the observer failed
      return;
    }

    // Nothing at all arrived → delivery is broken, not "not yet on screen".
    const fallback = window.setTimeout(() => {
      if (delivered) return;
      reveal();
      observer.disconnect();
    }, FALLBACK_MS);

    return () => {
      window.clearTimeout(fallback);
      observer.disconnect();
    };
  }, []);

  return ref;
}
