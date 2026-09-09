/**
 * Tests for FooterMarks (§D · D1) — the institutional lockup plus the imprint marks.
 *
 * THE LOAD-BEARING ASSERTION IS width/height ON EVERY IMAGE. The footer is below the
 * fold, so its images are lazy; a lazy image with no intrinsic dimensions shifts the
 * layout the moment the footer scrolls into view. Neither the reference nor the first
 * draft of the spec had them. The schema now requires them and this proves the markup
 * actually emits them — a schema and a component can disagree, so both ends are tested.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import FooterMarks from './FooterMarks';
import type { FooterLogo } from '@/config/footer.config';

const lockup: FooterLogo = {
  href: 'https://example.org/lockup',
  src: 'images/footer/lockup-light.png',
  srcDark: 'images/footer/lockup-dark.png',
  alt: 'Example University',
  width: 1200,
  height: 173,
};

const mark: FooterLogo = {
  href: 'https://example.org/mark',
  src: 'images/footer/mark-black.svg',
  srcDark: 'images/footer/mark-white.svg',
  alt: 'Licence: CC BY-NC 4.0',
  width: 64,
  height: 64,
};

/** A mark with no dark variant — the schema allows it, so the markup must handle it. */
const singleThemeMark: FooterLogo = {
  href: 'https://example.org/single',
  src: 'images/footer/single.svg',
  alt: 'Single',
  width: 32,
  height: 32,
};

describe('FooterMarks', () => {
  test('renders nothing at all when there is no lockup and no marks', () => {
    const html = renderToStaticMarkup(<FooterMarks marks={[]} />);
    expect(html).toBe('');
  });

  test('every rendered image carries width and height — the CLS fix', () => {
    const html = renderToStaticMarkup(<FooterMarks lockup={lockup} marks={[mark, mark]} />);
    const imgs = html.match(/<img[^>]*>/g) ?? [];
    expect(imgs.length).toBeGreaterThan(0);
    expect(imgs.filter((img) => !/\bwidth="\d+"/.test(img))).toEqual([]);
    expect(imgs.filter((img) => !/\bheight="\d+"/.test(img))).toEqual([]);
  });

  test('every rendered image is lazy — the footer is below the fold', () => {
    const html = renderToStaticMarkup(<FooterMarks lockup={lockup} marks={[mark]} />);
    const imgs = html.match(/<img[^>]*>/g) ?? [];
    expect(imgs.filter((img) => !/loading="lazy"/.test(img))).toEqual([]);
  });

  test('renders both theme variants when srcDark is given', () => {
    const html = renderToStaticMarkup(<FooterMarks lockup={lockup} marks={[]} />);
    expect(html).toContain('lockup-light.png');
    expect(html).toContain('lockup-dark.png');
  });

  test('renders one image only when srcDark is absent', () => {
    const html = renderToStaticMarkup(<FooterMarks marks={[singleThemeMark]} />);
    expect((html.match(/<img/g) ?? []).length).toBe(1);
  });

  test('one link per mark, plus one for the lockup', () => {
    const html = renderToStaticMarkup(<FooterMarks lockup={lockup} marks={[mark, mark, mark]} />);
    expect((html.match(/<a\b/g) ?? []).length).toBe(4);
  });

  // The alt text is the LINK's accessible name, so it must survive onto the image that
  // is actually visible in each theme — not just the first one.
  test('both theme variants carry the alt text', () => {
    const html = renderToStaticMarkup(<FooterMarks lockup={lockup} marks={[]} />);
    expect((html.match(/alt="Example University"/g) ?? []).length).toBe(2);
  });

  test('external links are safe and announced', () => {
    const html = renderToStaticMarkup(<FooterMarks lockup={lockup} marks={[]} />);
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
    expect(html).toMatch(/opens in a new tab/);
  });

  test('contains NO heading element (§5 — the footer has none anywhere)', () => {
    const html = renderToStaticMarkup(<FooterMarks lockup={lockup} marks={[mark]} />);
    expect(html).not.toMatch(/<h[1-6][\s/>]/);
  });
});
