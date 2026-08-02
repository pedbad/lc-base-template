/**
 * Tests for Footer (Phase C · Part A, step 2 — spec §1/§5). A plain <footer>
 * landmark with placeholder links + copyright. The load-bearing assertion is the
 * §5 rule: NO heading element anywhere inside the footer (the french-lo-1 mistake
 * this template deliberately does not repeat).
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

  test('renders placeholder links and a copyright line', () => {
    const html = renderToStaticMarkup(<Footer />);
    expect(html).toMatch(/<a\b/);
    expect(html).toMatch(/©|&copy;|Copyright/i);
  });
});
