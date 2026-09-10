/**
 * PageLayout — the page frame every rendered Learning Object lives inside
 * (Phase C · Part A, step 3). DOM mirrors docs/specs/lo-semantic-structure.md §1:
 *
 *   <a class="skip-link" href="#content">        ← first focusable thing on the page
 *   <Header>                                      ← header>nav landmark (step 1)
 *   <main id="content" tabindex="-1">
 *     <h1>{title}</h1>                            ← the ONE h1 (§2)
 *     <section id aria-labelledby>…<h2>…</section> ← one per section
 *   </main>
 *   <Footer>                                      ← footer landmark (step 2)
 *
 * Heading order is strictly h1 → h2 → (h3 inside accordions later) with no skips
 * (§2). In-page navigation MOVES FOCUS to the target section heading (§5), not just
 * scrolls — otherwise keyboard/AT users' focus position doesn't follow the jump.
 */
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { headingId } from '@/lib/headingId';
import BackToTopButton from './BackToTopButton';
import Header from './Header';
import Footer from './Footer';
import type { NavSection } from './nav-section';
import './shell.css';

/** A body section: the nav fields (id/label) plus optional rendered content. */
export interface PageSection extends NavSection {
  content?: ReactNode;
}

interface PageLayoutProps {
  /** The LO title — the page's single <h1>. */
  title: string;
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

export default function PageLayout({ title, sections, themeToggle }: PageLayoutProps) {
  const [activeSectionId, setActiveSectionId] = useState(currentHashId);

  // In-page nav: when the hash changes to a section, mark it active AND move focus
  // to its heading so keyboard/AT focus follows the visual jump (spec §5).
  useEffect(() => {
    function handleHashChange() {
      const id = currentHashId();
      if (!sections.some((section) => section.id === id)) return;
      setActiveSectionId(id);
      document.getElementById(headingId(id))?.focus();
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [sections]);

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to main content
      </a>

      <Header sections={sections} activeSectionId={activeSectionId} themeToggle={themeToggle} />

      <main id="content" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-8 focus:outline-none">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>

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
      </main>

      <Footer />
    </>
  );
}
