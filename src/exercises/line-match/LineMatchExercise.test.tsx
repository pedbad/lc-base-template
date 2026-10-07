/**
 * LineMatchExercise.test.tsx — the desktop pairing stage's layout (maintainer,
 * 2026-10-07: full width, balanced). Connector geometry is measured in the browser and
 * cannot be seen from a static render; these pin the grid that produces it.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import LineMatchExercise from './LineMatchExercise';
import { lineMatchFixtures } from './line-match.fixture';

const html = renderToStaticMarkup(<LineMatchExercise config={lineMatchFixtures[0].config} />);
const items = (lineMatchFixtures[0].config as { content: { items: unknown[] } }).content.items;

describe('LineMatchExercise desktop stage', () => {
  // Two equal halves with a 6rem gutter the connector lines run through.
  test('pictures and words get equal columns, a 6rem gap apart', () => {
    expect(html).toContain('grid grid-cols-2 gap-x-24 gap-y-3');
  });

  // One shared row per pair: a word card is as tall as the picture beside it, so both
  // columns end together (they used to stop at about half the picture column's height).
  test('both lists share the stage rows through subgrid', () => {
    expect(html).toContain(`grid-template-rows:repeat(${items.length}, auto)`);
    expect(html.match(/<ol class="row-span-full grid grid-rows-subgrid">/g)).toHaveLength(2);
  });

  test('every card fills its row', () => {
    const buttons = html.match(/<button[^>]*aria-label="(Picture|Word) [^"]*"[^>]*>/g) ?? [];
    expect(buttons.length).toBe(items.length * 2);
    for (const button of buttons) expect(button).toMatch(/class="[^"]*\bh-full\b/);
  });
});
