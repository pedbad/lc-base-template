/**
 * PaletteAtAGlance.test.tsx — the proportion bar (§E19): a named list a screen reader
 * hears as "name, percent", one item per primitive with a share, painted from var().
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PaletteAtAGlance } from './PaletteAtAGlance';

const html = renderToStaticMarkup(
  <PaletteAtAGlance
    colours={[
      { token: '--paper', name: 'Paper', job: 'Ground.', partner: '--slate-4', share: 3 },
      { token: '--slate-4', name: 'Slate 4', job: 'Text.', partner: '--paper', share: 1 },
      { token: '--white', name: 'White', job: 'Cards.', partner: '--slate-4' },
    ]}
  />,
);

describe('PaletteAtAGlance', () => {
  it('is a named list with one item per primitive that has a share', () => {
    const list = /<ul[^>]*aria-label="([^"]+)"[^>]*>(.*?)<\/ul>/s.exec(html);
    expect(list?.[1]).toMatch(/at a glance/i);
    expect(list?.[2].match(/<li/g)).toHaveLength(2);
  });

  it('says each name and its percentage to a screen reader', () => {
    expect(html).toMatch(/class="sr-only">Paper, 75%</);
    expect(html).toMatch(/class="sr-only">Slate 4, 25%</);
    expect(html).not.toContain('White');
  });

  it('paints each segment from its token, never a value', () => {
    expect(html).toMatch(/style="[^"]*flex-grow:3;[^"]*background:var\(--paper\)/);
  });
});

// Hand check, 2026-10-16: in catalog order Paper, the largest share, sat mid-bar. A
// brand board leads with what dominates, so the bar runs largest share first.
describe('PaletteAtAGlance order', () => {
  it('runs from the largest share to the smallest, whatever the catalog order', () => {
    const sorted = renderToStaticMarkup(
      <PaletteAtAGlance
        colours={[
          {
            token: '--cam-blue',
            name: 'Cambridge Blue',
            job: 'Brand.',
            partner: '--paper',
            share: 2,
          },
          { token: '--paper', name: 'Paper', job: 'Ground.', partner: '--slate-4', share: 5 },
        ]}
      />,
    );
    expect(sorted.indexOf('>Paper, ')).toBeLessThan(sorted.indexOf('>Cambridge Blue, '));
  });
});
