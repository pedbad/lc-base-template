/**
 * Header — the shell's one primary navigation landmark (Phase C · Part A, step 1).
 * DOM mirrors docs/specs/lo-semantic-structure.md §1:
 *
 *   <header>
 *     <nav aria-label="Main navigation">           ← the ONE nav landmark
 *       <a href="#content">{site title}</a>        ← doubles as skip-to-main
 *       …one <a href="#section-id"> per section…   ← derived from `sections`
 *       {themeToggle}                              ← Switch slot (step 6)
 *       <button aria-controls="mobile-nav-panel">  ← mobile toggle
 *     </nav>
 *     <div id="mobile-nav-panel" hidden>…</div>    ← real focus removal when closed
 *   </header>
 *
 * Nav text is `navLabel ?? label` (LO decision D3, 2026-08-04): the section's `label`
 * is its `<h2>`, and a section whose heading is too long for a nav bar supplies the
 * shorter `navLabel` instead. Nothing here is hardcoded — including the introduction,
 * which is an ordinary declared section like any other.
 *
 * A11y contract (spec §5): the closed mobile panel uses the `hidden` attribute
 * (not aria-hidden + CSS), so its links are truly unfocusable; Escape closes the
 * panel AND returns focus to the toggle button.
 */
import { useEffect, useRef, useState } from 'react';
import { Menu } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { courseConfig } from '@/config/course.config';
import { resolveAsset, resolveHomeHref } from '@/lib/assets';
import type { NavSection } from './nav-section';

interface HeaderProps {
  /** Ordered top-level sections; one nav link is derived per entry, in order. */
  sections: readonly NavSection[];
  /**
   * Id of the section the reader is AT, whose link carries `aria-current="location"`;
   * `''` or absent marks no link.
   *
   * `PageLayout` drives it from `useScrollSpy`
   * (docs/specs/2026-10-06-header-scroll-spy-design.md): it is the section on screen
   * as the reader scrolls, except that a followed link wins at once and holds until
   * its smooth scroll settles, so the highlight does not flicker through the sections
   * in between. Above the first section — on the hero — it is `''`.
   *
   * `location`, not `page`: `page` claims the whole document, and this marks a place
   * within it.
   */
  activeSectionId?: string;
  /** Site/course title for the brand link (defaults to the course config title). */
  siteTitle?: string;
  /** Dark-mode Switch slot (wired in step 6); rendered inside the nav. */
  themeToggle?: ReactNode;
}

const MOBILE_PANEL_ID = 'mobile-nav-panel';

/** The section links, shared verbatim by the desktop nav and the mobile panel so
 *  the entries are authored exactly once (spec §1). */
function NavLinks({
  sections,
  activeSectionId,
  onNavigate,
  className,
}: {
  sections: readonly NavSection[];
  activeSectionId?: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <ul className={className}>
      {sections.map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            aria-current={section.id === activeSectionId ? 'location' : undefined}
            onClick={onNavigate}
            className="rounded-sm px-2 py-1 font-medium text-foreground/80 underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:text-foreground aria-[current]:text-primary aria-[current]:underline"
          >
            {section.navLabel ?? section.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function Header({
  sections,
  activeSectionId,
  siteTitle = courseConfig.courseTitle,
  themeToggle,
}: HeaderProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Escape closes the mobile panel and returns focus to the toggle (spec §5).
  useEffect(() => {
    if (!isMobileNavOpen) return;
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isMobileNavOpen]);

  return (
    // `bg-card`, not `bg-background`: the page ground is `--paper`, an off-white
    // chosen to cut glare for dyslexic readers, and a header painted the same colour
    // as the page dissolves into it. Card is the surface token that means "a plane
    // above the page" — white in the light theme, the lifted dark surface in the dark
    // one — so the bar reads as a bar in both without hardcoding a colour in either.
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 supports-backdrop-filter:bg-card/80 supports-backdrop-filter:backdrop-blur">
      <nav aria-label="Main navigation" className="flex items-center gap-3 px-4 py-3">
        {/* The brand links HOME, to the course landing page (Phase D) — not to
            #content as it once did. That was a second skip link, and PageLayout
            already renders a real one as the page's first focusable element; mean-
            while an LO page had no route back to the course at all. Through
            resolveHomeHref() so it survives a non-root base (anti-pattern #28). */}
        <a
          href={resolveHomeHref()}
          className="mr-auto flex items-center gap-2 rounded-sm font-heading text-lg font-semibold tracking-tight text-foreground focus-visible:underline"
        >
          {/* The course's mark, named by `courseConfig.logo`. DECORATIVE: this link
              already has the course title as its accessible name, so announcing the
              mark too would say the same thing twice. `resolveAsset` because a bare
              `logo.svg` resolves against the CURRENT page URL, which breaks on an LO
              page under a sub-path base (anti-pattern #28).

              3rem square (size-12), doubled from 1.5rem at the maintainer's request
              2026-10-05; mask-size: contain keeps any square-ish replacement mark
              inside that box without distortion.
              Masked, not <img>: `currentColor` inside an <img>-loaded SVG resolves
              against that file's own document and comes out black in both themes.
              See the .course-mark rule in shell.css. */}
          <span
            className="course-mark size-12"
            style={{ '--course-mark': `url(${resolveAsset(courseConfig.logo)})` } as CSSProperties}
            aria-hidden="true"
          />
          {siteTitle}
        </a>

        <NavLinks
          sections={sections}
          activeSectionId={activeSectionId}
          className="hidden items-center gap-1 sm:flex"
        />

        {themeToggle}

        <button
          ref={toggleRef}
          type="button"
          aria-expanded={isMobileNavOpen}
          aria-controls={MOBILE_PANEL_ID}
          aria-label="Toggle navigation menu"
          onClick={() => setIsMobileNavOpen((open) => !open)}
          className="inline-flex size-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </nav>

      {/* A DISCLOSURE, NOT A DIALOG — and the difference is the whole design.
          `LessonRail`'s panel traps Tab, moves focus in, scroll-locks the page and uses
          `inert`; this panel deliberately does NONE of that, and the two being
          compared as "inconsistent a11y" is comparing a dialog with a disclosure.

          It is an in-flow <div> immediately after the toggle in DOM order, with no
          backdrop and nothing inert behind it. The page stays visible and usable.
          So:

          - NO Tab trap. Trapping Tab here would STRAND a keyboard user: the content
            behind is not inert, they can legitimately want to reach it, and a trap
            takes that away unless they happen to discover Escape. APG traps focus
            for MODAL dialogs precisely because the rest of the page is inert.
          - NO focus-move-in. The panel is the very next thing in DOM order, so Tab
            already walks into it. Forcing focus in is modal behaviour, and it would
            punish opening the menu and deciding not to use it.
          - NO scroll lock, for the same reason: nothing is covering the page.
          - `hidden`, NOT `inert`. `LessonRail`'s panel needs `inert` because `hidden`
            (`display: none`) cannot slide, and it animates. This panel does not, so
            `hidden` removes the links from the tree AND from focus order, which is
            the stronger guarantee of the two.

          What it DOES owe, and has: `aria-expanded` + `aria-controls` on the toggle,
          and Escape to close with focus returned there (the effect above). */}
      <div
        id={MOBILE_PANEL_ID}
        hidden={!isMobileNavOpen}
        className="border-t border-border sm:hidden"
      >
        <NavLinks
          sections={sections}
          activeSectionId={activeSectionId}
          onNavigate={() => setIsMobileNavOpen(false)}
          className="flex flex-col gap-1 px-4 py-3"
        />
      </div>
    </header>
  );
}
