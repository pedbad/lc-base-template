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
 * panel AND returns focus to the toggle button. Every link and button draws the
 * shared 2px `--ring` outline (focus-outline.ts says why an outline and not a ring).
 *
 * Styling is plain CSS in header.css (§D6, 2026-10-06), as the footer's is — no
 * Tailwind utilities in this markup.
 */
import { useEffect, useRef, useState } from 'react';
import { Menu } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { courseConfig } from '@/config/course.config';
import { resolveAsset, resolveHomeHref } from '@/lib/assets';
import type { NavSection } from './nav-section';
import './header.css';

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
            className="site-header-link"
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
    // Painted `--card`, not `--background` — header.css says why.
    <header className="site-header">
      <nav aria-label="Main navigation" className="site-header-nav">
        {/* The brand links HOME, to the course landing page (Phase D) — not to
            #content as it once did. That was a second skip link, and PageLayout
            already renders a real one as the page's first focusable element; mean-
            while an LO page had no route back to the course at all. Through
            resolveHomeHref() so it survives a non-root base (anti-pattern #28). */}
        <a href={resolveHomeHref()} className="site-header-brand">
          {/* The course's mark, named by `courseConfig.logo`. DECORATIVE: this link
              already has the course title as its accessible name, so announcing the
              mark too would say the same thing twice. `resolveAsset` because a bare
              `logo.svg` resolves against the CURRENT page URL, which breaks on an LO
              page under a sub-path base (anti-pattern #28).

              3rem square (header.css), doubled from 1.5rem at the maintainer's request
              2026-10-05; mask-size: contain keeps any square-ish replacement mark
              inside that box without distortion.
              Masked, not <img>: `currentColor` inside an <img>-loaded SVG resolves
              against that file's own document and comes out black in both themes.
              See the .course-mark rule in shell.css. */}
          <span
            className="course-mark site-header-mark"
            style={{ '--course-mark': `url(${resolveAsset(courseConfig.logo)})` } as CSSProperties}
            aria-hidden="true"
          />
          {siteTitle}
        </a>

        <NavLinks
          sections={sections}
          activeSectionId={activeSectionId}
          className="site-header-links"
        />

        {themeToggle}

        <button
          ref={toggleRef}
          type="button"
          aria-expanded={isMobileNavOpen}
          aria-controls={MOBILE_PANEL_ID}
          aria-label="Toggle navigation menu"
          onClick={() => setIsMobileNavOpen((open) => !open)}
          className="site-header-toggle"
        >
          <Menu className="site-header-toggle-icon" aria-hidden="true" />
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
      <div id={MOBILE_PANEL_ID} hidden={!isMobileNavOpen} className="site-header-panel">
        <NavLinks
          sections={sections}
          activeSectionId={activeSectionId}
          onNavigate={() => setIsMobileNavOpen(false)}
          className="site-header-panel-links"
        />
      </div>
    </header>
  );
}
