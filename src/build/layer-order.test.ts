/**
 * layer-order.test.ts — every HTML entry declares the cascade-layer order before any
 * stylesheet loads (2026-10-08).
 *
 * THE BUG. Cascade layers rank in the order their names FIRST appear. Under
 * `DEBUG=1`, a component chunk shared by the LO page and the debug pages
 * (`ModalProvider-*.css`) is linked before `main-*.css`, and it opens with
 * `@layer components`. So `components` was named before Tailwind's `base`, ranked
 * below it, and base's reset (`margin: 0`, `padding: 0`, …) beat every component rule
 * that set the same property: memory-match's `margin: 0 auto` deck sat left-aligned.
 * The plain build links `main-*.css` first and was unaffected, which is how it hid.
 *
 * THE FIX. One inline `@layer` statement first in each entry's <head>, in Tailwind
 * v4's own order, so no stylesheet's load order can reorder the layers.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../..');
const ORDER = '@layer properties, theme, base, components, utilities;';

describe.each(['index.html', 'exercise-showcase.html', 'debug-sandbox.html'])('%s', (file) => {
  const html = readFileSync(path.join(ROOT, file), 'utf8');
  const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));

  // Prettier lays the statement out over three lines; whitespace is not significant.
  test('declares the layer order in an inline style', () => {
    expect(head).toMatch(new RegExp(`<style>\\s*${ORDER}\\s*</style>`));
  });

  test('before any stylesheet or script', () => {
    const order = head.indexOf(ORDER);
    for (const tag of ['<link rel="stylesheet"', '<script']) {
      const at = head.indexOf(tag);
      if (at !== -1) expect(order).toBeLessThan(at);
    }
  });
});
