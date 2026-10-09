/**
 * placeholder-labels.test.ts — every placeholder image states its own size (maintainer,
 * 2026-10-08), so a designer sees what artwork to supply without opening the code.
 * Each slot has its own file printing the 2× size to SUPPLY, the largest size it is
 * SHOWN at and the file's own path, measured on the built site at 320–2560px. If a layout changes a slot's
 * size, re-measure and update both the artwork and this table.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const PUBLIC = path.resolve(import.meta.dirname, '../../public');

const SLOTS = [
  ['images/lo-placeholder.svg', 'Lesson card image', 'supply 1200 × 800 px', 'up to 557 × 371'],
  [
    'images/lo-00-example/03-outcomes/illustration.svg',
    'Outcomes illustration',
    'supply 1920 × 1280 px',
    'up to 959 × 639',
  ],
  [
    'images/lo-00-example/06-intro/illustration.svg',
    'Grammar intro illustration',
    'supply 1920 × 1280 px',
    'up to 959 × 639',
  ],
  [
    'images/lo-00-example/07-intro/illustration.svg',
    'Exercises intro illustration',
    'supply 1920 × 1280 px',
    'up to 959 × 639',
  ],
  ['images/placeholders/reading.svg', 'Reading image', 'supply 1800 × 1200 px', 'up to 877 × 585'],
  ['images/lo-00-example/hero.svg', 'Hero banner', 'supply 3840 × 896 px', '224–448 tall'],
  [
    'images/lo-00-example/04-tabs/speaker.svg',
    'Tab portrait',
    'supply 680 × 680 px',
    'up to 340 × 340',
  ],
  [
    'images/lo-00-example/04-tabs/chart.svg',
    'Tab figure',
    'supply 2112 × 1188 px',
    'up to 1052 × 593',
  ],
] as const;

/** The info alert's look (Callout `info`), as literals: an <img> cannot read the
 *  page's CSS tokens. Ground = callout-info (cam-light-blue #d1f9f1), border and icon
 *  = primary (cam-dark-blue #133844), text = foreground (slate-4 #232830). */
const INFO_GROUND = '#d1f9f1';
const INFO_BORDER = '#133844';
const INFO_TEXT = '#232830';

describe('placeholder images state their size', () => {
  test.each(SLOTS)('%s', (file, name, supply, shown) => {
    const svg = readFileSync(path.join(PUBLIC, file), 'utf8');

    expect(svg).toContain(name);
    expect(svg).toContain(supply);
    expect(svg).toContain(shown);
    // Where to drop the real file (maintainer, 2026-10-08).
    expect(svg).toContain(`public/${file}`);
    // Discreet, top-right, in the info alert's style (maintainer, 2026-10-08).
    expect(svg).toContain(`fill="${INFO_GROUND}"`);
    expect(svg).toContain(`stroke="${INFO_BORDER}"`);
    expect(svg).toContain(`fill="${INFO_TEXT}"`);
    expect(svg).toContain('data-label-position="top-right"');
    // XML forbids `--` inside a comment, and a browser then refuses the whole image
    // (2026-10-08: a comment naming a CSS token broke all six).
    for (const comment of svg.match(/<!--([\s\S]*?)-->/g) ?? []) {
      expect(comment.slice(4, -3)).not.toContain('--');
    }
  });
});

// The hero is cropped (`object-fit: cover` in a 16:5 box, 224–448px tall), so a label
// drawn in the artwork's own top-right corner falls outside the banner on a phone and
// at wide screens; it used to sit mid-artwork, in the crop-safe area, and did not read
// as top-right (maintainer, 2026-10-08). The file now has no intrinsic size, so it
// fills the banner exactly; the art keeps its cover crop through `slice`, and the
// label is pinned to the BOX's top-right corner, scaled down on a narrow banner.
describe('hero.svg pins its label to the banner, not the artwork', () => {
  const svg = readFileSync(path.join(PUBLIC, 'images/lo-00-example/hero.svg'), 'utf8');
  const root = /<svg\b[^>]*>/.exec(svg)?.[0] ?? '';

  test('the root fills the <img> box: no viewBox, 100% by 100%', () => {
    expect(root).not.toContain('viewBox');
    expect(root).toContain('width="100%"');
    expect(root).toContain('height="100%"');
  });

  test('the artwork keeps the cover crop inside it', () => {
    expect(svg).toMatch(/viewBox="0 0 1600 500"[^>]*preserveAspectRatio="xMidYMid slice"/);
  });

  test('the label hangs from the box’s right edge', () => {
    expect(svg).toMatch(/<svg x="100%"[^>]*>\s*<g[^>]*data-label-position="top-right"/);
  });

  test('a narrow banner scales the label down to fit', () => {
    expect(svg).toMatch(/@media \(max-width: \d+px\)/);
  });

  // TODO §D14 (maintainer, 2026-10-09): top-right, the label ran under the title's first
  // line at 320–375, and at 480 and 768 too (measured: the example title ends at 446px;
  // the label starts left of that until about 860px). Below 1024px it hangs from the
  // bottom-right corner instead, clear of the title. One label, placed twice by <use>.
  test('below 1024px the label hangs from the bottom-right corner', () => {
    expect(svg).toMatch(/<svg x="100%" y="100%"[^>]*>\s*<g[^>]*data-label-position="bottom-right"/);
    expect(svg).toMatch(
      /@media \(max-width: 1023px\)\s*\{\s*\.at-top\s*\{\s*display: none;\s*\}\s*\.at-bottom\s*\{\s*display: inline;/,
    );
    expect(svg.match(/Hero banner · supply/g)).toHaveLength(1);
  });
});
