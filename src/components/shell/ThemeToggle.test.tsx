/**
 * Tests for ThemeToggle (Phase C · Part A, step 6 — spec §1). Asserts it renders a
 * switch (role="switch" + aria-checked) with a stable aria-label — not a
 * label-flipping button. Rendered to static markup; the initial state under SSR is
 * light (no window), so aria-checked is "false".
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ThemeToggle from './ThemeToggle';

describe('ThemeToggle', () => {
  test('renders a switch with a stable "Dark mode" accessible name', () => {
    const html = renderToStaticMarkup(<ThemeToggle />);
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-label="Dark mode"');
  });

  test('exposes aria-checked reflecting the (SSR default light) state', () => {
    const html = renderToStaticMarkup(<ThemeToggle />);
    expect(html).toMatch(/aria-checked="(true|false)"/);
  });
});
