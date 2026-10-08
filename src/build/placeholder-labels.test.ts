/**
 * placeholder-labels.test.ts — every placeholder image states its own size (maintainer,
 * 2026-10-08), so a designer sees what artwork to supply without opening the code.
 * Each slot has its own file printing the 2× size to SUPPLY and the largest size it
 * is SHOWN at, measured on the built site at 320–2560px. If a layout changes a slot's
 * size, re-measure and update both the artwork and this table.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const PUBLIC = path.resolve(import.meta.dirname, '../../public');

const SLOTS = [
  ['images/lo-placeholder.svg', 'Lesson card image', 'Supply 1200 × 800 px', 'up to 557 × 371'],
  [
    'images/lo-00-example/03-outcomes/illustration.svg',
    'Outcomes illustration',
    'Supply 1920 × 1280 px',
    'up to 959 × 639',
  ],
  ['images/placeholders/reading.svg', 'Reading image', 'Supply 1800 × 1200 px', 'up to 877 × 585'],
  ['images/lo-00-example/hero.svg', 'Hero banner', 'Supply 3840 × 896 px', '224–448 tall'],
  [
    'images/lo-00-example/04-tabs/speaker.svg',
    'Tab portrait',
    'Supply 680 × 680 px',
    'up to 340 × 340',
  ],
  [
    'images/lo-00-example/04-tabs/chart.svg',
    'Tab figure',
    'Supply 2112 × 1188 px',
    'up to 1052 × 593',
  ],
] as const;

describe('placeholder images state their size', () => {
  test.each(SLOTS)('%s', (file, name, supply, shown) => {
    const svg = readFileSync(path.join(PUBLIC, file), 'utf8');

    expect(svg).toContain(name);
    expect(svg).toContain(supply);
    expect(svg).toContain(shown);
  });
});
