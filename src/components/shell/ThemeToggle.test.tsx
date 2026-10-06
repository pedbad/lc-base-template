/**
 * Tests for ThemeToggle (Phase C · Part A, step 6 — spec §1). Asserts it renders a
 * switch (role="switch" + aria-checked) with a stable aria-label — not a
 * label-flipping button. Rendered to static markup; the initial state under SSR is
 * light (no window), so aria-checked is "false".
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ThemeToggle from './ThemeToggle';
import { FOCUS_OUTLINE } from './focus-outline';

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

  // Header a11y audit (2026-10-06): the vendored Switch's OFF track is `bg-input`, and
  // on the white light-theme header that measured 1.88:1 track-to-header and 1.8:1
  // thumb-to-track — the thumb's position IS the state, and 1.4.11 wants 3:1 for it.
  // `muted-foreground` measures 6.3:1 and 6.4:1. Overridden here, not in
  // `src/components/ui/`, which the shadcn CLI owns and would silently revert.
  test('the off state draws a track that clears 3:1 in the light theme', () => {
    const html = renderToStaticMarkup(<ThemeToggle />);
    const root = /<[^>]*role="switch"[^>]*>/.exec(html)?.[0] ?? '';

    expect(root).toContain('data-unchecked:bg-muted-foreground');
    expect(root).not.toMatch(/(^|\s)data-unchecked:bg-input(\s|")/);
  });

  // Its own focus ring is a box-shadow over `outline-none`; forced colours strips the
  // shadow and the always-on border no longer CHANGES on focus, so nothing shows.
  test('draws the shared outline focus indicator, not only a shadow ring', () => {
    const html = renderToStaticMarkup(<ThemeToggle />);
    const root = /<[^>]*role="switch"[^>]*>/.exec(html)?.[0] ?? '';

    expect(root).toContain(FOCUS_OUTLINE);
  });

  test('associates the Switch hidden form input with a label (WAVE: no missing form label)', () => {
    const html = renderToStaticMarkup(<ThemeToggle />);
    const inputId = html.match(/<input[^>]*\bid="([^"]+)"/)?.[1];
    expect(inputId, 'Switch should render a hidden input with an id').toBeDefined();
    expect(html, 'a <label for> must target the hidden input id').toContain(`for="${inputId}"`);
  });
});
