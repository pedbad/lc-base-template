/**
 * Tests for LoHero (spec docs/specs/2026-10-05-lo-hero-banner-design.md §4). Rendered
 * to static markup — the hero has no client-only state, so the string IS the page.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { resolveAsset } from '@/lib/assets';
import LoHero from './LoHero';

const count = (html: string, needle: RegExp): number => (html.match(needle) ?? []).length;

describe('LoHero — image variant', () => {
  const html = renderToStaticMarkup(
    <LoHero title="First Contact" hero={{ src: 'images/lo-01/hero.webp' }} />,
  );

  test('marks itself as the image variant', () => {
    expect(html).toMatch(/<div class="lo-hero" data-variant="image"/);
  });

  test('renders one decorative <img> through resolveAsset', () => {
    expect(count(html, /<img/g)).toBe(1);
    expect(html).toContain(`src="${resolveAsset('images/lo-01/hero.webp')}"`);
    expect(html).toContain('alt=""');
  });

  test('loads the image as the LCP element: eager, high priority, async decode', () => {
    expect(html).toContain('loading="eager"');
    expect(html).toMatch(/<img[^>]*fetchpriority="high"/i);
    expect(html).toContain('decoding="async"');
  });

  // React 19 hoists a preload for every non-lazy <img> it server-renders. Pinned so a
  // React upgrade that changes it is noticed rather than silently altering the page.
  test("server render carries React's hoisted preload for the hero image", () => {
    expect(html).toMatch(/<link rel="preload" as="image" href="[^"]*hero\.webp"/);
    expect(html.indexOf('<link rel="preload"')).toBeLessThan(html.indexOf('<div class="lo-hero"'));
  });

  test('holds exactly one <h1> carrying the title, after the image', () => {
    expect(count(html, /<h1/g)).toBe(1);
    expect(html).toMatch(/<h1[^>]*>First Contact<\/h1>/);
    expect(html.indexOf('<img')).toBeLessThan(html.indexOf('<h1'));
  });

  test('uses an authored alt when one is given', () => {
    const withAlt = renderToStaticMarkup(
      <LoHero title="First Contact" hero={{ src: 'images/x.webp', alt: 'A café terrace' }} />,
    );
    expect(withAlt).toContain('alt="A café terrace"');
  });
});

describe('LoHero — band variant (no hero art)', () => {
  const html = renderToStaticMarkup(<LoHero title="First Contact" />);

  test('marks itself as the band variant and renders no <img>', () => {
    expect(html).toMatch(/<div class="lo-hero" data-variant="band"/);
    expect(html).not.toContain('<img');
  });

  test('emits no image preload', () => {
    expect(html).not.toContain('rel="preload"');
  });

  test('still holds exactly one <h1> carrying the title', () => {
    expect(count(html, /<h1/g)).toBe(1);
    expect(html).toMatch(/<h1[^>]*>First Contact<\/h1>/);
  });
});
