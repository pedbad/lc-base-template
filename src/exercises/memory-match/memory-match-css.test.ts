/**
 * memory-match-css.test.ts — the deck centres in its column (maintainer, 2026-10-07).
 *
 * `margin: 0 auto` did not centre it on the DEBUG=1 build, where a shared chunk's
 * stylesheet named `@layer components` before Tailwind's `base` (fixed 2026-10-08,
 * src/build/layer-order.test.ts). `align-self` stays: base never sets it, so the deck
 * centres in `.memory-match`'s flex column whatever the layer order.
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

  test('keeps its 32rem cap', () => {
    expect(deck).toContain('max-width: 32rem;');
  });
});
