/**
 * PageLayout — the page frame every rendered Learning Object lives inside
 * (Phase C · Part A, step 3). DOM mirrors docs/specs/lo-semantic-structure.md §1:
 *
 *   <a class="skip-link" href="#content">        ← first focusable thing on the page
 *   <Header>                                      ← header>nav landmark (step 1)
 *   <main id="content" tabindex="-1">
 *     <div class="lo-hero">…<h1>{title}</h1></div>  ← the ONE h1 (§2), in the hero
 *     <div class="lo-content">                       ← the content column
 *       <section id aria-labelledby>…<h2>…</section> ← one per section
 *     </div>
 *   </main>
 *   <Footer>                                      ← footer landmark (step 2)
 *
 * Heading order is strictly h1 → h2 → (h3 inside accordions later) with no skips
 * (§2). In-page navigation MOVES FOCUS to the target section heading (§5), not just
 * scrolls — otherwise keyboard/AT users' focus position doesn't follow the jump.
 */
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { LoHero as LoHeroConfig } from '@/config/lo-schema';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { headingId } from '@/lib/headingId';
import BackToTopButton from './BackToTopButton';
import Header from './Header';
import Footer from './Footer';
import LoHero from './LoHero';
import type { NavSection } from './nav-section';
import './shell.css';

/** A body section: the nav fields (id/label) plus optional rendered content. */
export interface PageSection extends NavSection {
  content?: ReactNode;
}

interface PageLayoutProps {
  /** The LO title — the page's single <h1>. */
  title: string;
  /** Optional hero banner art from lo.json; absent → the hero renders as a band. */
  hero?: LoHeroConfig;
  /** Ordered sections; drives both the nav links and the <section> bodies. */
  sections: readonly PageSection[];
  /** Dark-mode Switch slot, forwarded to the Header nav (wired in step 6). */
  themeToggle?: ReactNode;
}

/** Read the current hash's section id (no-window-safe for SSR). */
function currentHashId(): string {
  if (typeof window === 'undefined') return '';
  return window.location.hash.replace(/^#/, '');
}

/** A plain primary click — the only kind that navigates in place. A modified click
 *  opens a new tab or window and leaves this page where it is. */
function isPlainClick(event: MouseEvent): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export default function PageLayout({ title, hero, sections, themeToggle }: PageLayoutProps) {
  // The section on screen, from the scroll-spy (docs/specs/2026-10-06-header-scroll-
  // spy-design.md). It starts at '' on the server AND on the first client render: the
  // hash is read in the effect below, never during render, so a page loaded with
  // #grammar hydrates against the markup it was prerendered with (AGENTS.md rule 4).
  const sectionIdsKey = sections.map((section) => section.id).join(' ');
  const [activeSectionId, holdSection] = useScrollSpy(sectionIdsKey);

  // A FOLLOWED link wins over the spy: it is marked at once and held until its smooth
  // scroll settles, so the highlight does not flicker through the sections in between.
  // Three ways in — a click on any in-page section link (caught at the click, before
  // the scroll starts), a `hashchange` (Back/Forward), and the hash the page was
  // loaded with. Only `hashchange` moves focus to the heading (spec §5); the spy never
  // touches focus, the hash or history.
  useEffect(() => {
    const isSection = (id: string) => sections.some((section) => section.id === id);

    const loadedWith = currentHashId();
    if (isSection(loadedWith)) holdSection(loadedWith);

    function handleClick(event: MouseEvent) {
      if (!isPlainClick(event) || !(event.target instanceof Element)) return;
      const link = event.target.closest('a[href^="#"]');
      const id = link?.getAttribute('href')?.slice(1) ?? '';
      if (isSection(id)) holdSection(id);
    }

    function handleHashChange() {
      const id = currentHashId();
      if (!isSection(id)) return;
      holdSection(id);
      document.getElementById(headingId(id))?.focus();
    }

    document.addEventListener('click', handleClick);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [sections, holdSection]);

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to main content
      </a>

      <Header sections={sections} activeSectionId={activeSectionId} themeToggle={themeToggle} />

      <main id="content" tabIndex={-1} className="focus:outline-none">
        {/* Hero spec §4: the hero is <main>'s first child and holds the ONE <h1>, so a
            skip-link user lands on the title. It is full-bleed, which is why <main>
            no longer carries the column box — .lo-content below does. */}
        <LoHero title={title} hero={hero} />

        <div className="lo-content page-frame pb-8">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={headingId(section.id)}
              className="mt-12 scroll-mt-20"
            >
              <h2
                id={headingId(section.id)}
                tabIndex={-1}
                className="font-heading text-2xl font-semibold text-foreground focus:outline-none"
              >
                {section.label}
              </h2>
              <div className="mt-4">
                {section.content ?? (
                  <p className="text-muted-foreground">
                    Placeholder content for the {section.label} section.
                  </p>
                )}
              </div>
              {/* §D · D2. Inside the <section>, after its content, so the button's
                  aria-describedby names the heading of the section it closes — five
                  identically-named buttons per page are otherwise indistinguishable.
                  It lands outside every accordion by construction, because the
                  accordions are inside `section.content`. */}
              <BackToTopButton sectionId={section.id} />
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
