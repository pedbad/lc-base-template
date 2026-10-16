/**
 * PaletteSection.test.tsx — the Colour section as a brand board (§E19), as the
 * a server render writes it: three parts in order, and no colour value it cannot know.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import PaletteSection from './PaletteSection';
import { PRIMITIVE_SWATCHES } from './sandbox-catalog';

const html = renderToStaticMarkup(<PaletteSection />);

describe('PaletteSection', () => {
  it('keeps its id and heading, so the jump menu still lands on it', () => {
    expect(html).toMatch(/<section[^>]*id="palette"/);
    expect(html).toMatch(/<h2[^>]*id="palette-heading"[^>]*>Colour<\/h2>/);
  });

  it('reads at a glance, then the colours, then the colours in use', () => {
    const parts = [...html.matchAll(/<h3[^>]*>([^<]*)<\/h3>/g)].map((m) => m[1]);
    expect(parts).toEqual(['At a glance', 'The colours', 'In use']);
  });

  it('has a card for every primitive', () => {
    const count = PRIMITIVE_SWATCHES.flatMap((g) => g.colours).length;
    expect(html.match(/<h5/g)).toHaveLength(count);
  });

  // Hard constraint 4: a server render cannot know a colour, so it must not print one.
  it('prints no colour value in a server render', () => {
    expect(html).not.toMatch(/#[0-9A-F]{6}\b|RGB \d/);
    expect(html).toContain('—');
  });
});
