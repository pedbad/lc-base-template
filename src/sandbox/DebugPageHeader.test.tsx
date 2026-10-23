/**
 * DebugPageHeader.test.tsx — the one header all four debug pages share (the sandbox,
 * the exercise showcase, the UI showcase and the code style guide), so their navs cannot
 * drift apart.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEBUG_HEADER_HEIGHT_VAR, DebugPageHeader, type DebugPage } from './DebugPageHeader';

/** The header as `current` renders it, with no sections of its own. */
function headerFor(current: DebugPage): string {
  return renderToStaticMarkup(
    <DebugPageHeader
      title="Debug page"
      description="What this page is for."
      navLabel="Debug page sections"
      sections={[]}
      jumpLabel="Jump to section"
      current={current}
    />,
  );
}

/** The nav's plain links, in order: [href, aria-current or null, text]. */
function navLinks(markup: string): [string, string | null, string][] {
  const nav = /<nav[^>]*>.*?<\/nav>/s.exec(markup)?.[0] ?? '';
  return [...nav.matchAll(/<a ([^>]*)>(.*?)<\/a>/gs)].map(([, attributes, inner]) => [
    /href="([^"]*)"/.exec(attributes)?.[1] ?? '',
    /aria-current="([^"]*)"/.exec(attributes)?.[1] ?? null,
    inner.replace(/<[^>]*>/g, '').trim(),
  ]);
}

const PAGES: readonly DebugPage[] = ['showcase', 'sandbox', 'ui', 'style'];

const html = renderToStaticMarkup(
  <DebugPageHeader
    title="Debug page"
    description="What this page is for."
    navLabel="Debug page sections"
    sections={[
      { id: 'one', label: 'One' },
      { id: 'two', label: 'Two' },
    ]}
    jumpLabel="Jump to section"
    current="sandbox"
  />,
);

describe('DebugPageHeader', () => {
  test('renders the page title as the one <h1>, and the description', () => {
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>Debug page<\/h1>/);
    expect(html).toContain('What this page is for.');
  });

  // The in-page section links live in a dropdown (a menu button), not a wrapping row
  // of links: the showcase alone has 25 of them. Menu items render only while open, so
  // the static markup holds the trigger, never the items.
  test('is a named nav whose sections sit behind one menu button', () => {
    expect(html).toMatch(/<nav[^>]*aria-label="Debug page sections"/);
    expect(html).toMatch(/<button[^>]*aria-haspopup="menu"[^>]*>[^<]*Jump to section/);
    expect(html).not.toContain('href="#one"');
  });

  // Maintainer, 2026-10-23: every debug page lists all four, in one order, and shows
  // which one you are on, instead of leaving the current page out.
  test('the nav holds six plain links: all four debug pages, course home, the repo', () => {
    expect(navLinks(html).map(([, , text]) => text)).toEqual([
      'Exercise showcase',
      'Debug sandbox',
      'UI showcase',
      'Code style',
      'Course home',
      'GitHub repo (opens in a new tab)',
    ]);
  });

  // Maintainer, 2026-10-13: both debug pages link to the source. An external link, so
  // it opens in a new tab and says so, as a rich-text link does.
  test('links to the GitHub repo in a new tab, and says so', () => {
    const repo = /<a [^>]*href="https:\/\/github\.com\/[^"]+"[^>]*>.*?<\/a>/s.exec(html)?.[0] ?? '';
    expect(repo).toContain('target="_blank"');
    expect(repo).toContain('rel="noopener noreferrer"');
    expect(repo).toContain('GitHub repo');
    expect(repo).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(repo).toMatch(/class="sr-only">[^<]*\(opens in a new tab\)/);
  });

  test('lists the same links in the same order on every debug page', () => {
    const lists = PAGES.map((page) =>
      navLinks(headerFor(page)).map(([href, , text]) => [href, text]),
    );
    lists.forEach((list) => expect(list).toEqual(lists[0]));
  });

  test('links to every debug page through the base, the current one included', () => {
    PAGES.forEach((page) => {
      const markup = headerFor(page);
      ['exercise-showcase', 'debug-sandbox', 'ui-showcase', 'code-style'].forEach((file) => {
        expect(markup, page).toContain(`href="/${file}.html"`);
      });
      expect(markup).toContain('Course home');
    });
  });

  // The current page stays a link, marked aria-current="page": the list keeps one shape,
  // and so one tab order, on every page, and a screen reader announces it as the current
  // page of a set rather than as text that is missing from it.
  test('marks the current page, and only it, with aria-current="page"', () => {
    const expected: Record<DebugPage, string> = {
      showcase: 'Exercise showcase',
      sandbox: 'Debug sandbox',
      ui: 'UI showcase',
      style: 'Code style',
    };
    PAGES.forEach((page) => {
      const current = navLinks(headerFor(page)).filter(([, ariaCurrent]) => ariaCurrent !== null);
      expect(current, page).toEqual([[expect.any(String), 'page', expected[page]]]);
    });
  });

  // The highlight is keyed on the attribute itself, so the look and the semantics cannot
  // disagree, and it uses the theme's accent pair, never a raw colour.
  test('styles the current link from its aria-current attribute, with theme tokens', () => {
    const link = /<a [^>]*aria-current="page"[^>]*>/.exec(html)?.[0] ?? '';
    expect(link).toMatch(/aria-\[current=page\]:bg-accent\b/);
    expect(link).toMatch(/aria-\[current=page\]:text-accent-foreground\b/);
    expect(link).toMatch(/aria-\[current=page\]:no-underline\b/);
  });

  test('carries the theme switch', () => {
    expect(html).toContain('role="switch"');
  });

  // Maintainer, 2026-10-16: the theme switch is back at the top right, in the title's
  // row, and the nav takes a row of its own below. Source order follows that reading
  // order, so tabbing meets the switch before the nav.
  test('puts the theme switch in the top row and the nav on a row of its own below', () => {
    expect(html.indexOf('role="switch"')).toBeLessThan(html.indexOf('<nav'));
    const nav = /<nav[^>]*class="([^"]*)"/.exec(html)?.[1] ?? '';
    expect(nav).toMatch(/\bbasis-full\b/);
  });

  // §E18: the sandbox puts its preset drop-down beside the theme switch; the
  // showcases pass nothing and render nothing extra.
  test('renders page-specific tools just before the theme switch, outside the nav', () => {
    const withTools = renderToStaticMarkup(
      <DebugPageHeader
        title="Debug page"
        description="What this page is for."
        navLabel="Debug page sections"
        sections={[]}
        jumpLabel="Jump to section"
        current="sandbox"
        tools={<p id="tool">A tool</p>}
      />,
    );
    const tool = withTools.indexOf('id="tool"');
    expect(tool).toBeLessThan(withTools.indexOf('role="switch"'));
    expect(withTools.indexOf('role="switch"')).toBeLessThan(withTools.indexOf('<nav'));
    expect(html).not.toContain('id="tool"');
  });

  // §D11: the header's inner row and the page's <main> are both `.page-frame`, so the
  // title and the first line of content share one left edge at every width.
  test('its inner row is the shared page frame, with no width or gutter of its own', () => {
    const row = /<header[^>]*><div class="([^"]*)"/.exec(html)?.[1] ?? '';
    expect(row).toMatch(/\bpage-frame\b/);
    expect(row).not.toMatch(/\bmax-w-|\bpx-\d/);
  });

  // §E18 follow-up (maintainer, 2026-10-16): the bar holding the jump menu, the palette
  // drop-down and the theme switch stays in view while a debug page scrolls.
  test('is pinned to the top of the page, over the content it scrolls past', () => {
    const header = /<header class="([^"]*)"/.exec(html)?.[1] ?? '';
    expect(header).toMatch(/\bsticky\b/);
    expect(header).toMatch(/\btop-0\b/);
    expect(header).toMatch(/\bz-\d+\b/);
    expect(header).toMatch(/\bbg-card\b/);
  });

  // A pinned bar would cover a jump-link target and a focused control (WCAG 2.4.11).
  // The header publishes its measured height; debug.css pads the page's scroll by it.
  test('debug.css keeps anchors and focus clear of the pinned bar', () => {
    const debugCss = readFileSync(path.resolve(import.meta.dirname, '../debug.css'), 'utf8');
    const layered = /@layer base\s*\{([\s\S]*?)\n\}/.exec(debugCss)?.[1] ?? '';
    expect(layered).toMatch(
      new RegExp(`html\\s*\\{[^}]*scroll-padding-top:[^;]*var\\(${DEBUG_HEADER_HEIGHT_VAR}`),
    );
  });
});
