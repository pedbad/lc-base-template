/**
 * media-panel-css.test.ts — the transcript's open/close slide (maintainer, 2026-10-08).
 *
 * Plain CSS, not Tailwind utilities: a native `<details>` animates through its
 * `::details-content` box, with `interpolate-size` so `block-size: auto` can be
 * tweened and `content-visibility … allow-discrete` so the content stays painted
 * while it closes. Browsers without `::details-content` open instantly, as before.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const css = readFileSync(path.join(import.meta.dirname, 'media-panel.css'), 'utf8');

describe('media-panel.css transcript slide', () => {
  test('lives in the components layer', () => {
    expect(css).toMatch(/@layer components\s*\{/);
  });

  test('lets the details box tween to and from its auto height', () => {
    expect(css).toContain('interpolate-size: allow-keywords;');
    expect(css).toMatch(/\.media-transcript::details-content\s*\{[^}]*block-size: 0;/);
    expect(css).toMatch(/\.media-transcript\[open\]::details-content\s*\{[^}]*block-size: auto;/);
    expect(css).toMatch(/transition:[^;]*block-size[^;]*content-visibility[^;]*allow-discrete/);
  });

  test('switches the slide off under reduced motion', () => {
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.media-transcript::details-content\s*\{\s*transition: none;/,
    );
  });
});
