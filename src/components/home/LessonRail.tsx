/**
 * LessonRail — the landing page's permanent left rail (§D · D7).
 *
 * REPLACES LessonSideNav, which it grew out of rather than sits beside: two overlapping
 * nav mechanisms on one page is worse than either alone. The whole open-state behaviour
 * below is that component's, carried across unchanged — see the a11y contract.
 *
 * WHAT CHANGED, AND WHY. The nav used to be a "Lessons" button in the header, sitting
 * BEFORE the course title, which reads as though the button were the page's subject. It
 * is now a thin strip pinned to the left of the content, permanently visible, that
 * expands into the same panel. Ported from french-lo-1's landing page
 * (`page-shell/LandingPage/LandingPage.jsx`), including the collapsed strip's stack of
 * social icons sitting partway down it.
 *
 * HAND-ROLLED, AND NOT shadcn's `Sidebar`, WHICH THIS REPO ALREADY VENDORS. Measured,
 * not assumed: importing `@/components/ui/sidebar` in `collapsible="icon"` mode took
 * main-*.js from 96.83 kB to 117.89 kB gzipped — +21.06 kB, which breaks even the
 * raised < 100 kB budget (docs/TOOLING.md, "Bundle budget"). The cost is its dependency fan-out
 * (Sheet, Tooltip, Button, Input, Separator, Skeleton) rather than the rail itself.
 * Two further problems came off with it:
 *   - it persists open/closed in a COOKIE read on mount, and prerendered markup here
 *     must equal the first client render (handover §3). Nothing below reads a cookie,
 *     measures a viewport, or branches on `useIsHydrated`: the collapsed rail is static
 *     markup, so server and client agree by construction.
 *   - it swaps the rail for a Sheet at a JS-measured breakpoint, which is a second Base
 *     UI dialog and a second mobile nav pattern beside the header's. LessonSideNav's own
 *     header block recorded this as the reason the rail was not ported in Phase D; it is
 *     hand-rolling, not D7, that answers it.
 *
 * ONE MECHANISM, TWO STATES. The rail is fixed to the left edge and always there;
 * expanding ALWAYS
 * overlays, at every width. French's expanded sidebar pushes the content sideways, which
 * would mean pushing on desktop and overlaying on mobile — and branching the focus trap
 * and scroll lock on viewport needs `matchMedia`, i.e. exactly the JS-measured breakpoint
 * above. Overlay everywhere is one code path and one a11y story. The panel covers the
 * rail when open, so the social stack hides itself with no rule to say so.
 *
 * A11Y CONTRACT (inherited from LessonSideNav in full — the bar, not the baseline):
 *   - a real <button> with aria-expanded + aria-controls, and one <nav> landmark
 *   - Escape closes AND returns focus to the toggle
 *   - opening moves focus into the panel; closing restores it to the toggle
 *   - Tab is trapped inside the open panel (it covers the page)
 *   - the page behind is scroll-locked while it is open
 *   - `inert` when closed, so the off-screen links are truly unreachable — NOT
 *     `hidden`, which cannot slide (`display: none` kills the transition)
 *   - motion is CSS-only, so `prefers-reduced-motion` is honoured in home.css
 *
 * NO-JS: the rail renders with its social links live and its panel closed and inert, and
 * the toggle does nothing. Lesson navigation without JavaScript is the card grid, which
 * is the whole list.
 *
 * THE STRIP RENDERS UNCONDITIONALLY; only the LESSON parts are conditional. A course
 * with no LOs has no index to open, so it gets no menu button and no panel — but it
 * still gets a rail, because the rail also carries the theme control and the social
 * links, and a half-built course losing its dark mode would be a strange way to
 * discover that no lessons exist yet. The cards say that instead.
 */
import { useEffect, useRef, useState } from 'react';
import { PanelLeftIcon, XIcon } from 'lucide-react';
import { footerConfig } from '@/config/footer.config';
import ThemeToggleButton from '@/components/shell/ThemeToggleButton';
import { resolveAsset } from '@/lib/assets';
import { spriteHref } from '@/lib/sprite';
import type { LoIndexEntry } from '@/lo/lo-index';
import './home.css';

const PANEL_ID = 'lesson-nav-panel';
/** Set on <html> while the panel is open; home.css locks scrolling off it. */
const SCROLL_LOCK_CLASS = 'lesson-nav-open';

interface LessonRailProps {
  /** Every LO in the course, in course order. */
  lessons: readonly LoIndexEntry[];
}

/** Everything focusable inside the panel, in DOM order. */
function focusables(panel: HTMLElement): readonly HTMLElement[] {
  return [...panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
}

export default function LessonRail({ lessons }: LessonRailProps) {
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

    // An arrow const, not a `function` declaration: a declaration is hoisted, so TS
    // cannot carry the `panel !== null` narrowing above into it.
    const handleKeydown = (event: KeyboardEvent) => {
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
    };

    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.documentElement.classList.remove(SCROLL_LOCK_CLASS);
      // Focus is restored on the way OUT of open, so Escape, the close button, the
      // backdrop and a nav-link click all land back on the toggle by one route.
      toggle?.focus();
    };
  }, [isOpen]);

  const hasLessons = lessons.length > 0;

  return (
    <>
      {/* The strip itself: fixed to the page's left edge at every width down to 320. */}
      <div className="lesson-rail">
        {hasLessons ? (
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={isOpen}
            aria-controls={PANEL_ID}
            onClick={() => setIsOpen((open) => !open)}
            className="lesson-rail-toggle"
          >
            {/* `panel-left`, not a hamburger, matching the reference's SidebarTrigger.
                A hamburger is the convention for a MENU that drops or slides over the
                page; this opens a panel pinned to the left edge, and the panel-left
                glyph says which edge and which shape. */}
            <PanelLeftIcon className="size-5" aria-hidden="true" />
            {/* Icon-only, so the name is visually hidden rather than absent — without
                it the control announces as "button" and nothing else. The reference
                calls this "Toggle Sidebar"; "Lessons" names what the panel CONTAINS,
                which is what a reader needs, not the widget it is implemented as. */}
            <span className="sr-only">Lessons</span>
          </button>
        ) : null}

        {/* Social, as french has it: stacked, centred, sitting partway down the strip
            rather than tucked under the toggle. `role="group"` and not a nav landmark —
            spec §17 allows one per page and the panel below owns it.

            ACCEPTED, NOT OVERLOOKED: these are the same five accounts the footer shows,
            so each name is announced twice on this page. That is ordinary for chrome
            repeated top and bottom, and the alternative — a rail that lists them from
            its own array — is the drift `footer.config.ts` exists to prevent. The DATA
            is single-sourced; only the markup differs, because a horizontal band on a
            dark plate and a vertical strip on the page ground are not one component
            with four class props. */}
        {footerConfig.social.length === 0 ? null : (
          <div className="lesson-rail-social" role="group" aria-label="Follow us">
            {footerConfig.social.map((account) => (
              <a
                key={account.icon}
                href={account.href}
                target="_blank"
                rel="noopener noreferrer"
                className="lesson-rail-social-link"
              >
                {/* The sprite's `brand-*` symbols are `fill="currentColor"`, so the
                    icon follows the rail's text colour in both themes with no
                    dark-mode rules — see FooterSocial.tsx for why that beats the
                    reference's `<img>` + `filter: invert(1)`. */}
                <svg className="lesson-rail-social-icon" aria-hidden="true" focusable="false">
                  <use href={spriteHref(account.icon)} />
                </svg>
                <span className="sr-only">{account.label} (opens in a new tab)</span>
              </a>
            ))}
          </div>
        )}

        {/* Last in the strip, so the flex column reads top-to-bottom as: open the
            lessons, follow us, change the theme. `margin-block: auto` on the social
            stack is what pushes this to the bottom. */}
        <ThemeToggleButton />
      </div>

      {!hasLessons ? null : (
        <>
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
      )}
    </>
  );
}
