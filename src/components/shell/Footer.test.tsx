/**
 * Tests for Footer (spec §1/§5, and §D · D1 for the colophon rewrite).
 *
 * Two load-bearing assertions:
 *
 * 1. The §5 rule: NO heading element anywhere inside the footer. A decorative <h2>
 *    there was a french-lo-1 mistake that broke strict heading-outline checks, and it
 *    is deliberately not repeated. Guard h would catch a stray one across all 26 of
 *    its rendered documents, but this is the local, fast statement of the rule.
 *
 * 2. NO `href="#"` in the rendered output. This is the regression test for the actual
 *    shipped defect: Footer.tsx carried a FOOTER_LINKS array with Accessibility and
 *    Privacy both pointing at `'#'`. `footer.config.ts` now makes that value fail the
 *    build, and this proves the rendered markup agrees — a schema and a component can
 *    disagree, so both ends are asserted.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Footer from './Footer';

describe('Footer', () => {
  test('renders exactly one footer landmark', () => {
    const html = renderToStaticMarkup(<Footer />);
    expect((html.match(/<footer/g) ?? []).length).toBe(1);
  });

  test('contains NO heading element (§5 — no h1–h6 inside the footer)', () => {
    const html = renderToStaticMarkup(<Footer />);
    expect(html).not.toMatch(/<h[1-6][\s/>]/);
  });

  test('contains NO dead link — the defect this rewrite fixes', () => {
    const html = renderToStaticMarkup(<Footer />);
    expect(html).not.toMatch(/href="#"/);
  });

  test('contains no in-page fragment href at all', () => {
    const html = renderToStaticMarkup(<Footer />);
    expect(html).not.toMatch(/href="#/);
  });

  // The placeholder copy was user-visible on every page of a live course. A learner
  // read "real links land in a later Phase C part". Asserted gone so it cannot return.
  test('ships no internal build chatter as user-visible copy', () => {
    const html = renderToStaticMarkup(<Footer />);
    expect(html).not.toMatch(/placeholder/i);
    expect(html).not.toMatch(/Phase [A-Z]/);
  });

  test('renders a copyright line carrying the current year', () => {
    const html = renderToStaticMarkup(<Footer />);
    expect(html).toMatch(/©|&copy;/);
    expect(html).toContain(String(new Date().getFullYear()));
  });

  // Not a <nav>: spec §17 allows exactly one primary nav landmark per page and the
  // header already owns it. A second one here would fail guard h on both pages.
  test('is not a nav landmark — the header owns the only one', () => {
    const html = renderToStaticMarkup(<Footer />);
    expect(html).not.toMatch(/<nav/);
  });
});
