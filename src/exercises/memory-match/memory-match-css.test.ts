/**
 * memory-match-css.test.ts — the deck centres in its column (maintainer, 2026-10-07).
 *
 * `margin: 0 auto` did not centre it on the DEBUG=1 build, where a shared chunk's
 * stylesheet named `@layer components` before Tailwind's `base` (fixed 2026-10-08,
 * src/build/layer-order.test.ts). `align-self` stays: base never sets it, so the deck
 * centres in `.memory-match`'s flex column whatever the layer order.
 *
 * CARD SIZE (maintainer, 2026-10-08). The deck was capped at 32rem at every width and
 * went from 2 to 4 columns at a 48rem viewport, so cards SHRANK as the screen grew:
 * ≈ 250px on a mid-size screen, 119px at 1440. Now the deck is 2 columns only while the
 * exercise is narrower than 30rem (a phone), 4 from there, and capped at 65rem so a
 * card reaches ≈ 250px on a large screen (4 × 250 + 3 × 0.75rem gaps = 1036px). A
 * container query, not a viewport one (as reading.css): an exercise can sit in an
 * accordion or a tab panel.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const css = readFileSync(path.join(import.meta.dirname, 'memory-match.css'), 'utf8');
const deck = /\.memory-match-deck\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';

describe('.memory-match-deck', () => {
  test('centres itself with align-self, not auto margins', () => {
    expect(deck).toContain('align-self: center;');
    expect(deck).not.toMatch(/margin:\s*0 auto/);
  });

  test('is capped at 65rem, so four cards reach about 250px', () => {
    expect(deck).toContain('max-width: 65rem;');
  });

  test('is two columns while narrow', () => {
    expect(deck).toContain('grid-template-columns: repeat(2, 1fr);');
  });
});

describe('four columns from a 30rem exercise width', () => {
  test('the engine root is a named inline-size container', () => {
    const root = /\.memory-match\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(root).toContain('container: memory-match / inline-size;');
  });

  test('the deck switches on the container, not the viewport', () => {
    const wide =
      /@container memory-match \(width >= 30rem\)\s*\{\s*\.memory-match-deck\s*\{([^}]*)\}/.exec(
        css,
      )?.[1] ?? '';
    expect(wide).toContain('grid-template-columns: repeat(4, 1fr);');
    expect(css).not.toMatch(/@media \(width >= 48rem\)/);
  });
});
