/**
 * progress-meter-css.test.ts — how the progress meter is drawn (maintainer, 2026-10-09).
 * Lazy: only the exercise engines import ProgressMeter, so none of it is in
 * main-*.css (the main sheet is all but full; docs/TOOLING.md).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const css = readFileSync(path.join(import.meta.dirname, 'progress-meter.css'), 'utf8');

describe('progress-meter.css', () => {
  test('lives in the components layer', () => {
    expect(css).toMatch(/@layer components\s*\{/);
  });

  test('an empty slot is a clear ring; a filled one is solid success green', () => {
    expect(css).toMatch(/\.progress-meter-slot\s*\{[^}]*var\(--muted-foreground\)/);
    expect(css).toMatch(/\.progress-meter-slot\.is-filled\s*\{[^}]*var\(--success\)/);
  });

  test('a course icon is a mask, so it takes the same two colours', () => {
    expect(css).toMatch(/\.progress-meter-slot\.is-icon\s*\{[^}]*mask:[^;]*var\(--progress-icon\)/);
  });

  test('the celebration runs only for readers who have not asked for less motion', () => {
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: no-preference\)\s*\{\s*\.progress-meter\[data-complete\][^{]*\{[^}]*animation:/,
    );
  });

  test('ProgressMeter imports it', () => {
    const view = readFileSync(path.join(import.meta.dirname, 'ProgressMeter.tsx'), 'utf8');
    expect(view).toContain("import './progress-meter.css';");
  });
});
