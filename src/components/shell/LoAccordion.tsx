/**
 * LoAccordion — the ONE accordion implementation for Learning Object content
 * (Phase C · Part A, step 5). Structure mirrors spec §1/§4 exactly:
 *
 *   <article aria-labelledby="{id}-heading">
 *     <details>
 *       <summary><h3 id="{id}-heading">{title}</h3></summary>
 *       <div class="details-content">
 *         [optional <div class="instructions">]      ← accordion-level instructions
 *         {children}                                  ← block / exercise body
 *       </div>
 *     </details>
 *   </article>
 *
 * Native semantics only — no aria-expanded/aria-controls bookkeeping and no
 * role="region" (§4: the browser provides disclosure semantics for free, and
 * region-per-panel pollutes SR landmark nav on pages with many small accordions).
 *
 * Animation is progressive enhancement over native <details> (§4):
 *   - No JS / reduced motion: instant open/close. The CSS
 *     `details[open] .details-content { grid-template-rows: 1fr }` rule shows the
 *     body with no script — the no-JS path is never broken.
 *   - With JS: we intercept the <summary> click so BOTH directions animate (native
 *     close would snap), animating the body's height in pixels through the Web
 *     Animations API. Closing keeps `open` set until the animation finishes.
 *
 * WHY pixels and WAAPI, rather than the CSS `grid-template-rows: 0fr → 1fr`
 * transition this component shipped with: in Chrome 148 that transition completes but
 * never fires `transitionend`, so the close handler never ran — `<details>` stayed
 * `open` around a 0px body (a disclosure state that lies to AT), and reopening
 * produced an expanded accordion with no visible content. Verified in-browser
 * 2026-08-04 by clicking through open → close → reopen. An `Animation`'s `finished`
 * promise is a reliable completion signal, and a cancelled animation rejects it —
 * which is exactly the "clicked again mid-close" case.
 *
 * Every id comes from the shared headingId helper (§5) — never a second scheme.
 */
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { headingId } from '@/lib/headingId';
import InstructionsCallout from './InstructionsCallout';

interface LoAccordionProps {
  /** Base id; the summary heading becomes `{id}-heading` and labels the article. */
  id: string;
  /** Accordion title, rendered as the single <h3> inside <summary>. */
  title: string;
  /** Optional accordion-level instructions, shown before the body (§1/§3). */
  instructions?: ReactNode;
  /** Whether the accordion starts open (default closed). */
  defaultOpen?: boolean;
  /** The block / exercise body. */
  children: ReactNode;
}

/** Reveal/collapse timing. Owned here now that the CSS no longer animates (see above). */
const ANIMATION_MS = 250;
const ANIMATION_EASING = 'cubic-bezier(0, 0, 0.2, 1)';

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Animate `element`'s height between two pixel values. */
function animateHeight(element: HTMLElement, fromPx: number, toPx: number): Animation {
  return element.animate([{ height: `${fromPx}px` }, { height: `${toPx}px` }], {
    duration: ANIMATION_MS,
    easing: ANIMATION_EASING,
  });
}

export default function LoAccordion({
  id,
  title,
  instructions,
  defaultOpen = false,
  children,
}: LoAccordionProps) {
  const hid = headingId(id);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const innerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const isFirstRenderRef = useRef(true);

  // Reveal: the body can only be measured once `open` is on the DOM, so opening
  // animates here rather than in the click handler. The first render is skipped, so a
  // `defaultOpen` accordion is simply open — it never animates on arrival.
  useEffect(() => {
    const inner = innerRef.current;
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (!isOpen || !inner || prefersReducedMotion()) return;

    animationRef.current?.cancel();
    animationRef.current = animateHeight(inner, 0, inner.scrollHeight);
  }, [isOpen]);

  // Cancel an in-flight animation on unmount so it cannot resolve into a dead tree.
  useEffect(() => () => animationRef.current?.cancel(), []);

  // Intercept the summary toggle so we control `open` and can animate both ways.
  // Without JS this handler never runs and native <details> toggling takes over.
  function handleSummaryClick(event: React.MouseEvent<HTMLElement>) {
    event.preventDefault();
    const inner = innerRef.current;

    // A click mid-animation cancels it. For a close in flight that is the whole
    // answer: cancelling rejects `finished`, so `open` is never cleared and the body
    // springs back open instead of dead-clicking until the animation ends.
    const wasAnimating = animationRef.current?.playState === 'running';
    animationRef.current?.cancel();
    animationRef.current = null;
    if (wasAnimating && isOpen) return;

    if (!isOpen) {
      setIsOpen(true); // the effect above animates the reveal
      return;
    }

    if (!inner || prefersReducedMotion()) {
      setIsOpen(false);
      return;
    }

    // Collapse first; drop `open` only once the animation has actually finished.
    const closing = animateHeight(inner, inner.scrollHeight, 0);
    animationRef.current = closing;
    closing.finished.then(
      () => {
        animationRef.current = null;
        setIsOpen(false);
      },
      () => {
        /* cancelled by another click — stay open */
      },
    );
  }

  return (
    <article aria-labelledby={hid} className="lo-accordion rounded-lg border border-border">
      {/* `open` stays true during the close animation so the body is visible while the
          height animation plays; the finished promise then flips it false. */}
      <details open={isOpen} className="group">
        <summary
          onClick={handleSummaryClick}
          className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-4 py-3 marker:content-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden"
        >
          <h3 id={hid} className="font-heading text-base font-semibold text-foreground">
            {title}
          </h3>
          <svg
            className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>

        <div className="details-content">
          {/* .details-inner is the collapsing grid item: overflow-hidden + min-h-0,
              and NO padding of its own (padding on this element would leak past a
              0fr track). The padding lives on the nested wrapper it clips. It is also
              the element whose height is animated. */}
          <div ref={innerRef} className="details-inner">
            <div className="px-4 pb-4">
              {instructions ? (
                <InstructionsCallout className="mb-3">{instructions}</InstructionsCallout>
              ) : null}
              {children}
            </div>
          </div>
        </div>
      </details>
    </article>
  );
}
