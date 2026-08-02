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
 *   - No JS / reduced motion: native instant open/close. The CSS
 *     `details[open] .details-content { grid-template-rows: 1fr }` rule shows the
 *     body with no script — the no-JS path is never broken.
 *   - With JS: we intercept the <summary> click so CLOSING also animates
 *     (native close would snap). Opening animates via the [open] CSS rule; closing
 *     keeps `open` until the grid-rows 1fr→0fr transition ends, then removes it.
 *
 * Every id comes from the shared headingId helper (§5) — never a second scheme.
 */
import { useRef, useState } from 'react';
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

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
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
  const [isClosing, setIsClosing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Intercept the summary toggle so we control `open` and can animate closing.
  // Without JS this handler never runs and native <details> toggling takes over.
  function handleSummaryClick(event: React.MouseEvent<HTMLElement>) {
    event.preventDefault();

    if (prefersReducedMotion()) {
      setIsClosing(false);
      setIsOpen((open) => !open);
      return;
    }

    if (!isOpen) {
      setIsOpen(true); // opening: [open] rule animates rows 0fr → 1fr
    } else {
      setIsClosing(true); // closing: is-closing animates rows 1fr → 0fr, then close
    }
  }

  function handleTransitionEnd(event: React.TransitionEvent<HTMLDivElement>) {
    if (isClosing && event.propertyName === 'grid-template-rows') {
      setIsClosing(false);
      setIsOpen(false);
    }
  }

  return (
    <article aria-labelledby={hid} className="lo-accordion rounded-lg border border-border">
      {/* `open` stays true during the close animation so the body is visible while
          the grid-rows transition plays; handleTransitionEnd then flips it false. */}
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

        <div
          ref={contentRef}
          onTransitionEnd={handleTransitionEnd}
          className={`details-content${isClosing ? ' is-closing' : ''}`}
        >
          {/* .details-inner is the collapsing grid item: overflow-hidden + min-h-0,
              and NO padding of its own (padding on this element would leak past a
              0fr track). The padding lives on the nested wrapper it clips. */}
          <div className="details-inner">
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
