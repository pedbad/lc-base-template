/**
 * DebugPageHeader.test.tsx — the one header both debug pages share (the sandbox and the
 * exercise showcase), so their navs cannot drift apart.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DebugPageHeader } from './DebugPageHeader';

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

  test('the nav holds exactly two plain links: the other debug page and course home', () => {
    const nav = /<nav[^>]*>.*?<\/nav>/s.exec(html)?.[0] ?? '';
    expect(nav.match(/<a /g)).toHaveLength(2);
  });

  test('links to the OTHER debug page and to course home, through the base', () => {
    expect(html).toContain('href="/exercise-showcase.html"');
    expect(html).not.toContain('href="/debug-sandbox.html"');
    expect(html).toContain('Course home');
  });

  test('carries the theme switch', () => {
    expect(html).toContain('role="switch"');
  });

  // §D11: the header's inner row and the page's <main> are both `.page-frame`, so the
  // title and the first line of content share one left edge at every width.
  test('its inner row is the shared page frame, with no width or gutter of its own', () => {
    const row = /<header[^>]*><div class="([^"]*)"/.exec(html)?.[1] ?? '';
    expect(row).toMatch(/\bpage-frame\b/);
    expect(row).not.toMatch(/\bmax-w-|\bpx-\d/);
  });
});
