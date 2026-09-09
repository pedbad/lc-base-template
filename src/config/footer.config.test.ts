/**
 * Tests for footer.config.ts (§D · D1 — spec docs/specs/2026-09-09-footer-colophon-design.md).
 *
 * THE LOAD-BEARING TEST IS THE `#` REJECTION. Before this config existed, Footer.tsx
 * carried a FOOTER_LINKS array in which Accessibility and Privacy were both `href: '#'`
 * — a link a screen reader announces, the user activates, and nothing happens. That is
 * an accessibility defect, and the fix is not nicer styling around it: the schema now
 * makes the value unrepresentable, so the defect cannot come back.
 *
 * SCOPE OF THAT GUARANTEE, stated so it is not oversold: this proves a link has a
 * DESTINATION, not that the destination exists. A well-formed URL that 404s still
 * passes. Catching that needs the network; `src/docs/md-links.ts` makes the same trade
 * for prose and records the same reasoning.
 */
import { test, expect } from 'vitest';
import { FooterConfigSchema, footerConfig } from './footer.config';

// Importing footerConfig runs FooterConfigSchema.parse() at module load, exactly as
// course.config.ts does — so invalid values fail the dev server and the build rather
// than shipping a broken footer that only breaks in the browser.
test('footer.config: validates and loads at import', () => {
  expect(footerConfig).toBeDefined();
});

test('footer.config: rejects a bare "#" href — the defect this config exists to kill', () => {
  const result = FooterConfigSchema.safeParse({
    links: [{ href: '#', label: 'Accessibility' }],
  });
  expect(result.success).toBe(false);
});

test('footer.config: rejects any in-page fragment, not just the bare "#"', () => {
  const result = FooterConfigSchema.safeParse({
    links: [{ href: '#content', label: 'Back to top' }],
  });
  expect(result.success).toBe(false);
});

test('footer.config: the rejection message says what is wrong, not just "invalid"', () => {
  const result = FooterConfigSchema.safeParse({ links: [{ href: '#', label: 'Privacy' }] });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0].message).toMatch(/must go somewhere/i);
  }
});

test('footer.config: accepts an absolute external URL', () => {
  const result = FooterConfigSchema.safeParse({
    links: [{ href: 'https://www.cam.ac.uk/accessibility', label: 'Accessibility' }],
  });
  expect(result.success).toBe(true);
});

test('footer.config: accepts a base-relative in-repo path', () => {
  const result = FooterConfigSchema.safeParse({
    links: [{ href: 'accessibility.html', label: 'Accessibility' }],
  });
  expect(result.success).toBe(true);
});

// Every block is optional or defaults to empty, which is what makes a fork that strips
// the Cambridge marks get a SHORTER footer rather than a broken one.
test('footer.config: an empty object is valid — every block is optional', () => {
  const result = FooterConfigSchema.safeParse({});
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.marks).toEqual([]);
    expect(result.data.social).toEqual([]);
    expect(result.data.links).toEqual([]);
    expect(result.data.lockup).toBeUndefined();
    expect(result.data.licence).toBeUndefined();
  }
});

// The © year is read from the clock at render time. An authored year is a fact that
// goes stale on 1 January and nothing notices — the same drift class the guards exist
// to prevent, so the schema has no slot for it.
test('footer.config: carries no authored year — the © year is computed', () => {
  expect(footerConfig).not.toHaveProperty('year');
  expect(footerConfig).not.toHaveProperty('copyrightYear');
});

// A logo without intrinsic dimensions is a layout shift when the footer scrolls into
// view (spec §4.2). Required, not optional, so a fork supplying its own mark must
// state its size.
test('footer.config: a logo without width/height is rejected', () => {
  const result = FooterConfigSchema.safeParse({
    lockup: { href: 'https://example.org', src: 'images/footer/x.png', alt: 'X' },
  });
  expect(result.success).toBe(false);
});
