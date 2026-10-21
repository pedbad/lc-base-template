/**
 * DebugPageHeader.test.tsx — the one header all three debug pages share (the sandbox,
 * the exercise showcase and the UI showcase), so their navs cannot drift apart.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEBUG_HEADER_HEIGHT_VAR, DebugPageHeader } from './DebugPageHeader';

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

  test('the nav holds exactly five plain links: the other three debug pages, course home, the repo', () => {
    const nav = /<nav[^>]*>.*?<\/nav>/s.exec(html)?.[0] ?? '';
    expect(nav.match(/<a /g)).toHaveLength(5);
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

  test('links to the OTHER debug pages and to course home, through the base', () => {
    expect(html).toContain('href="/exercise-showcase.html"');
    expect(html).toContain('href="/ui-showcase.html"');
    expect(html).toContain('href="/code-style.html"');
    expect(html).not.toContain('href="/debug-sandbox.html"');
    expect(html).toContain('Course home');
  });

  test('lists Code style last of the debug pages, after the UI showcase', () => {
    const order = ['exercise-showcase', 'ui-showcase', 'code-style'].map((page) =>
      html.indexOf(`href="/${page}.html"`),
    );
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(html).toContain('>Code style<');
  });

  test('on the Code style page, links to the other three and not to itself', () => {
    const style = renderToStaticMarkup(
      <DebugPageHeader
        title="Code style"
        description="How the code is written."
        navLabel="Code style sections"
        sections={[]}
        jumpLabel="Jump to section"
        current="style"
      />,
    );
    expect(style).toContain('href="/debug-sandbox.html"');
    expect(style).not.toContain('href="/code-style.html"');
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
