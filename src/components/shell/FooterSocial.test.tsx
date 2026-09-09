/**
 * Tests for FooterSocial (§D · D1) — the icon-only social row.
 *
 * Two things this pins that are easy to regress:
 *
 * 1. EVERY ICON-ONLY LINK HAS A NAME. The icon is `aria-hidden`, so without the
 *    visually-hidden label each link would announce as "link" and nothing else.
 *
 * 2. THE SPRITE URL GOES THROUGH resolveAsset(). A hand-written `/icons.svg#id`
 *    404s under a non-root base — anti-pattern #28, which guard c exists to catch in
 *    engines and which this asserts locally for the shell.
 *
 * The row is a labelled `role="group"`, NOT a `<nav>`: spec §17 allows exactly one
 * primary nav landmark per page and the header owns it. It carries no heading either
 * (§5) — a labelled group does not need one, which is why the reference's shape ports.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import FooterSocial from './FooterSocial';
import type { FooterSocial as FooterSocialEntry } from '@/config/footer.config';

const accounts: readonly FooterSocialEntry[] = [
  { href: 'https://example.org/fb', label: 'Facebook', icon: 'brand-facebook' },
  { href: 'https://example.org/x', label: 'X (Twitter)', icon: 'brand-x' },
];

describe('FooterSocial', () => {
  test('renders nothing when there are no accounts — not an empty row', () => {
    const html = renderToStaticMarkup(<FooterSocial accounts={[]} />);
    expect(html).toBe('');
  });

  test('is a labelled group, not a nav landmark', () => {
    const html = renderToStaticMarkup(<FooterSocial accounts={accounts} />);
    expect(html).toContain('role="group"');
    expect(html).toMatch(/aria-label="[^"]+"/);
    expect(html).not.toMatch(/<nav/);
  });

  test('one link per account', () => {
    const html = renderToStaticMarkup(<FooterSocial accounts={accounts} />);
    expect((html.match(/<a\b/g) ?? []).length).toBe(2);
  });

  test('every icon-only link carries its label as accessible text', () => {
    const html = renderToStaticMarkup(<FooterSocial accounts={accounts} />);
    expect(html).toContain('Facebook');
    expect(html).toContain('X (Twitter)');
  });

  test('every icon is aria-hidden — the label is the name, not the picture', () => {
    const html = renderToStaticMarkup(<FooterSocial accounts={accounts} />);
    const svgs = html.match(/<svg[^>]*>/g) ?? [];
    expect(svgs.length).toBe(2);
    expect(svgs.filter((svg) => !/aria-hidden="true"/.test(svg))).toEqual([]);
  });

  test('the sprite href is resolved, never a bare path (anti-pattern #28)', () => {
    const html = renderToStaticMarkup(<FooterSocial accounts={accounts} />);
    // resolveAsset() returns a base-prefixed URL; under the test base that is "/".
    expect(html).toContain('icons.svg#brand-facebook');
    expect(html).toMatch(/href="\/[^"]*icons\.svg#brand-x"/);
  });

  test('external links are safe and announced', () => {
    const html = renderToStaticMarkup(<FooterSocial accounts={accounts} />);
    expect((html.match(/rel="noopener noreferrer"/g) ?? []).length).toBe(2);
    expect((html.match(/opens in a new tab/g) ?? []).length).toBe(2);
  });

  test('contains NO heading element (§5 — the footer has none anywhere)', () => {
    const html = renderToStaticMarkup(<FooterSocial accounts={accounts} />);
    expect(html).not.toMatch(/<h[1-6][\s/>]/);
  });
});
