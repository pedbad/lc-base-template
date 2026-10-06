/**
 * DebugPageHeader — the header both debug pages share: the sandbox and the exercise
 * showcase. Title, a one-line description, the theme switch, and a nav holding the
 * page's own section links followed by the way to the OTHER debug page and back to the
 * course. One component, so the two navs cannot drift apart.
 *
 * It lives in `src/sandbox/` because the sandbox had it first; the showcase imports it.
 * Both pages are debug-only (`DEBUG=1`, see build-entries.ts), so neither ships.
 *
 * Cross-page hrefs go through `resolveAsset` / `resolveHomeHref`, never a bare relative
 * path, so they survive a non-root base.
 */
import { resolveAsset, resolveHomeHref } from '@/lib/assets';
import ThemeToggle from '@/components/shell/ThemeToggle';

export interface DebugSection {
  /** The `id` of the element the link lands on. */
  readonly id: string;
  readonly label: string;
}

/** The two debug pages. Each links to the one it is not. */
type DebugPage = 'sandbox' | 'showcase';

const OTHER_PAGE: Readonly<Record<DebugPage, { href: string; label: string }>> = {
  sandbox: { href: 'exercise-showcase.html', label: 'Exercise showcase' },
  showcase: { href: 'debug-sandbox.html', label: 'Debug sandbox' },
};

interface DebugPageHeaderProps {
  title: string;
  description: string;
  /** The nav's accessible name, e.g. "Sandbox sections". */
  navLabel: string;
  sections: readonly DebugSection[];
  /** Which page this is, so the nav links to the other one and not to itself. */
  current: DebugPage;
}

const LINK_CLASS = 'underline underline-offset-4 hover:no-underline';

export function DebugPageHeader({
  title,
  description,
  navLabel,
  sections,
  current,
}: DebugPageHeaderProps) {
  const other = OTHER_PAGE[current];
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <ThemeToggle />
      </div>
      <nav aria-label={navLabel} className="mx-auto max-w-5xl px-6 pb-4">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {sections.map((section) => (
            <li key={section.id}>
              <a className={LINK_CLASS} href={`#${section.id}`}>
                {section.label}
              </a>
            </li>
          ))}
          <li>
            <a className={LINK_CLASS} href={resolveAsset(other.href)}>
              {other.label}
            </a>
          </li>
          <li>
            <a className={LINK_CLASS} href={resolveHomeHref()}>
              Course home
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
