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
    current="sandbox"
  />,
);

describe('DebugPageHeader', () => {
  test('renders the page title as the one <h1>, and the description', () => {
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>Debug page<\/h1>/);
    expect(html).toContain('What this page is for.');
  });

  test('is a named nav holding one in-page link per section, in order', () => {
    expect(html).toMatch(/<nav[^>]*aria-label="Debug page sections"/);
    expect(html.indexOf('href="#one"')).toBeLessThan(html.indexOf('href="#two"'));
  });

  test('links to the OTHER debug page and to course home, through the base', () => {
    expect(html).toContain('href="/exercise-showcase.html"');
    expect(html).not.toContain('href="/debug-sandbox.html"');
    expect(html).toContain('Course home');
  });

  test('carries the theme switch', () => {
    expect(html).toContain('role="switch"');
  });
});
