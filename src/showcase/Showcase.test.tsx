/**
 * Showcase.test.tsx — the exercise showcase's top nav (shared with the debug sandbox via
 * DebugPageHeader): a link to every card, derived from the fixtures, plus the way back.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Showcase from './Showcase';
import { SHOWCASE_FIXTURES } from './fixtures';

const html = renderToStaticMarkup(<Showcase />);
const nav = /<nav[^>]*aria-label="Showcase sections"[^>]*>.*?<\/nav>/s.exec(html)?.[0] ?? '';

describe('Showcase nav', () => {
  test('has a named nav', () => {
    expect(nav).not.toBe('');
  });

  test('links the rich-text card first, then every engine card, in fixture order', () => {
    const hrefs = [...nav.matchAll(/href="#([^"]+)"/g)].map(([, id]) => id);
    expect(hrefs).toEqual(['rich-text', ...SHOWCASE_FIXTURES.map((fixture) => fixture.id)]);
  });

  test('every in-page link has a card with that id to land on', () => {
    [...nav.matchAll(/href="#([^"]+)"/g)].forEach(([, id]) => {
      expect(html).toContain(`id="${id}"`);
    });
  });

  test('links to the debug sandbox and course home, not to itself', () => {
    expect(nav).toContain('href="/debug-sandbox.html"');
    expect(nav).not.toContain('href="/exercise-showcase.html"');
    expect(nav).toContain('Course home');
  });
});
