/**
 * DebugPageHeader — the header all four debug pages share: the sandbox, the exercise
 * showcase, the UI showcase and the code style guide. Title, a one-line description, the
 * theme switch, and a nav holding a "jump to" menu of the page's own sections plus five
 * plain links — the three OTHER debug pages, course home and the GitHub repo. The sections sit in a shadcn
 * dropdown because the exercise showcase has 25 of them, and a wrapping row of links
 * that long is noise. One component, so the navs cannot drift apart.
 *
 * It lives in `src/sandbox/` because the sandbox had it first; the showcases import it.
 * All four pages are debug-only (`DEBUG=1`, see build-entries.ts), so none ships.
 *
 * PINNED (§E18 follow-up, maintainer 2026-10-16). The bar stays at the top while the
 * page scrolls, so the jump menu, the palette drop-down and the theme switch are always
 * in reach. A pinned bar would hide a jump-link target or a focused control under it
 * (WCAG 2.4.11), so it publishes its measured height as DEBUG_HEADER_HEIGHT_VAR and
 * `debug.css` pads the page's scrolling by that much. Measured, not fixed: the row wraps
 * on a narrow screen, and a guessed height would be wrong at one width or another.
 *
 * TWO ROWS (maintainer, 2026-10-16): the title, this page's tools and the theme switch
 * share the top row, the switch at its right end; the nav takes the row below. Source
 * order matches, so tabbing reaches the switch before the nav.
 *
 * Cross-page hrefs go through `resolveAsset` / `resolveHomeHref`, never a bare relative
 * path, so they survive a non-root base. The repo link is absolute and external, so it
 * opens in a new tab and says so, as a rich-text link does.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { ChevronDownIcon, ExternalLink } from 'lucide-react';
import { resolveLabel } from '@/config/ui-strings';
import { resolveAsset, resolveHomeHref } from '@/lib/assets';
import { FOCUS_OUTLINE } from '@/components/shell/focus-outline';
import ThemeToggle from '@/components/shell/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface DebugSection {
  /** The `id` of the element the link lands on. */
  readonly id: string;
  readonly label: string;
}

/** The four debug pages. Each links to the three it is not. */
type DebugPage = 'sandbox' | 'showcase' | 'ui' | 'style';

const DEBUG_PAGES: readonly { page: DebugPage; href: string; label: string }[] = [
  { page: 'sandbox', href: 'debug-sandbox.html', label: 'Debug sandbox' },
  { page: 'showcase', href: 'exercise-showcase.html', label: 'Exercise showcase' },
  { page: 'ui', href: 'ui-showcase.html', label: 'UI showcase' },
  { page: 'style', href: 'code-style.html', label: 'Code style' },
];

/**
 * The template's source. When the repo moves to the organisation
 * (docs/ORGANIZATION.md), its `git grep` for the old address finds this line.
 */
const REPO_URL = 'https://github.com/pedbad/lc-base-template';

interface DebugPageHeaderProps {
  title: string;
  description: string;
  /** The nav's accessible name, e.g. "Sandbox sections". */
  navLabel: string;
  /** The page's own sections, offered in the "jump to" menu. */
  sections: readonly DebugSection[];
  /** The menu button's text, e.g. "Jump to card". */
  jumpLabel: string;
  /** Which page this is, so the nav links to the others and not to itself. */
  current: DebugPage;
  /** Controls only this page has, shown in the top row just before the theme switch (§E18). */
  tools?: ReactNode;
}

/** The custom property on `<html>` holding the pinned header's height (debug.css reads it). */
export const DEBUG_HEADER_HEIGHT_VAR = '--debug-header-height';

/** Keeps DEBUG_HEADER_HEIGHT_VAR equal to the element's height, in an effect only. */
function usePublishedHeight() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const root = document.documentElement;
    // A measured length, so px: it is the browser's own unit for it, not a design value.
    const publish = () =>
      root.style.setProperty(DEBUG_HEADER_HEIGHT_VAR, `${element.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.removeProperty(DEBUG_HEADER_HEIGHT_VAR);
    };
  }, []);
  return ref;
}

const LINK_CLASS = `rounded-sm underline underline-offset-4 hover:no-underline ${FOCUS_OUTLINE}`;

/**
 * Styled like shadcn's `DropdownMenuItem`, but Base UI's `LinkItem`: a real `<a>` with
 * the menuitem role, because each entry NAVIGATES (to an in-page card). shadcn's wrapper
 * exposes only the action `Item`, and `src/components/ui/` is the CLI's to own.
 */
const MENU_LINK_CLASS =
  'flex cursor-pointer items-center rounded-md px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground';

export function DebugPageHeader({
  title,
  description,
  navLabel,
  sections,
  jumpLabel,
  current,
  tools,
}: DebugPageHeaderProps) {
  const others = DEBUG_PAGES.filter((entry) => entry.page !== current);
  const headerRef = usePublishedHeight();
  return (
    <header ref={headerRef} className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="page-frame flex flex-wrap items-start gap-x-6 gap-y-3 py-4">
        <div className="min-w-0 flex-1 basis-64">
          <h1 className="font-heading text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {tools}
        <div className="shrink-0 pt-1">
          <ThemeToggle />
        </div>
        <nav
          aria-label={navLabel}
          className="flex basis-full flex-wrap items-center gap-x-5 gap-y-2 text-sm"
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-medium hover:bg-muted ${FOCUS_OUTLINE}`}
            >
              {jumpLabel}
              <ChevronDownIcon className="size-4" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto max-w-[min(90vw,28rem)]">
              {sections.map((section) => (
                <MenuPrimitive.LinkItem
                  key={section.id}
                  href={`#${section.id}`}
                  closeOnClick
                  className={MENU_LINK_CLASS}
                >
                  {section.label}
                </MenuPrimitive.LinkItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {others.map((other) => (
            <a key={other.page} className={LINK_CLASS} href={resolveAsset(other.href)}>
              {other.label}
            </a>
          ))}
          <a className={LINK_CLASS} href={resolveHomeHref()}>
            Course home
          </a>
          <a
            className={`inline-flex items-center gap-1 ${LINK_CLASS}`}
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub repo
            <ExternalLink className="size-3.5" aria-hidden="true" />
            <span className="sr-only"> {resolveLabel('opensInNewTab')}</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
