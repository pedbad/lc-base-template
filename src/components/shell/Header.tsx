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
import type { ReactNode } from 'react';
import { courseConfig } from '@/config/course.config';
import type { NavSection } from './nav-section';

interface HeaderProps {
  /** Ordered top-level sections; one nav link is derived per entry, in order. */
  sections: readonly NavSection[];
  /** Id of the section currently in view — its link gets aria-current. */
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
            aria-current={section.id === activeSectionId ? 'page' : undefined}
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
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 supports-backdrop-filter:bg-background/80 supports-backdrop-filter:backdrop-blur">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3"
      >
        <a
          href="#content"
          className="mr-auto rounded-sm font-heading text-lg font-semibold tracking-tight text-foreground focus-visible:underline"
        >
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

      <div
        id={MOBILE_PANEL_ID}
        hidden={!isMobileNavOpen}
        className="border-t border-border sm:hidden"
      >
        <NavLinks
          sections={sections}
          activeSectionId={activeSectionId}
          onNavigate={() => setIsMobileNavOpen(false)}
          className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-3"
        />
      </div>
    </header>
  );
}
