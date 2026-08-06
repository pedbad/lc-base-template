/**
 * LessonSideNav — the left sliding lesson nav on the course landing page (Phase D).
 *
 * Ported from the French-Basic-2026 landing sidebar (decision C, 2026-08-06): it
 * lists EVERY LO in the course — a course-wide index, the same list the cards show —
 * not the current LO's sections. Section links stay the LO page's own header nav.
 * The reference's icon-collapsing desktop rail is deliberately not ported: it swaps
 * a rail for an overlay at a JS-measured breakpoint, which a prerendered page cannot
 * render identically before hydration. One off-canvas panel at every width instead —
 * one code path, one a11y story, identical server and client markup.
 *
 * A11Y CONTRACT (the bar the reference's docs set, plus this repo's shell rules):
 *   - a real <button> with aria-expanded + aria-controls, and one <nav> landmark
 *   - Escape closes AND returns focus to the toggle
 *   - opening moves focus into the panel; closing restores it to the toggle
 *   - Tab is trapped inside the open panel (it covers the page)
 *   - the page behind is scroll-locked while it is open
 *   - `inert` when closed, so the off-screen links are truly unreachable — NOT
 *     `hidden`, which cannot slide (`display: none` kills the transition)
 *   - motion is CSS-only, so `prefers-reduced-motion` is honoured in home.css
 *
 * NO-JS: the panel renders closed and inert, and the toggle does nothing — inert but
 * harmless. Navigation with JavaScript off is the card grid, which is the whole list.
 */
import { useEffect, useRef, useState } from 'react';
import { MenuIcon, XIcon } from 'lucide-react';
import { resolveAsset } from '@/lib/assets';
import type { LoIndexEntry } from '@/lo/lo-index';
import './home.css';

const PANEL_ID = 'lesson-nav-panel';
/** Set on <html> while the panel is open; home.css locks scrolling off it. */
const SCROLL_LOCK_CLASS = 'lesson-nav-open';

interface LessonSideNavProps {
  /** Every LO in the course, in course order. */
  lessons: readonly LoIndexEntry[];
}

/** Everything focusable inside the panel, in DOM order. */
function focusables(panel: HTMLElement): readonly HTMLElement[] {
  return [...panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
}

export default function LessonSideNav({ lessons }: LessonSideNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // One effect for the whole open lifecycle: it exists only while open, so closing
  // is what tears the listeners and the scroll lock down — including on unmount,
  // which is why the lock can never be left on.
  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    if (panel === null) return;
    // Both nodes are read HERE, not in the cleanup: a ref's `current` may have moved
    // on by teardown time, and the elements this effect started with are the ones it
    // must finish with (react-hooks/exhaustive-deps).
    const toggle = toggleRef.current;

    focusables(panel)[0]?.focus();
    document.documentElement.classList.add(SCROLL_LOCK_CLASS);

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;

      // Trap: the panel covers the page, so Tab must cycle within it rather than
      // walking into content the reader cannot see.
      const items = focusables(panel);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.documentElement.classList.remove(SCROLL_LOCK_CLASS);
      // Focus is restored on the way OUT of open, so Escape, the close button, the
      // backdrop and a nav-link click all land back on the toggle by one route.
      toggle?.focus();
    };
  }, [isOpen]);

  // A course with no LOs has no index to open. The cards say so instead.
  if (lessons.length === 0) return null;

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={PANEL_ID}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <MenuIcon className="size-4" aria-hidden="true" />
        Lessons
      </button>

      {/* Backdrop: a click-to-close surface, and the dimming that says the panel is
          modal. Purely decorative — Escape and the close button are the accessible
          routes out, so it is not a control and carries no role. */}
      <div
        className="lesson-nav-backdrop"
        data-open={isOpen}
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
      />

      <div
        ref={panelRef}
        id={PANEL_ID}
        className="lesson-nav-panel"
        data-open={isOpen}
        inert={!isOpen}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <p className="font-heading text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Lessons
          </p>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close lesson list"
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <XIcon className="size-4" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Lessons" className="overflow-y-auto px-2 py-3">
          <ol className="flex flex-col gap-0.5">
            {lessons.map((lesson, index) => (
              <li key={lesson.folder}>
                <a
                  href={resolveAsset(`${lesson.slug}.html`)}
                  className="flex items-baseline gap-3 rounded-md px-3 py-2 text-sm text-foreground/85 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span aria-hidden="true" className="font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{lesson.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </>
  );
}
