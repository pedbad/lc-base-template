/**
 * colour-math.test.ts — the arithmetic behind the brand board's values and badges
 * (§E19). Pure, so every boundary is pinned here rather than in a browser.
 */
import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  formatRatio,
  relativeLuminance,
  toHex,
  toRgbText,
  verdictFor,
} from './colour-math';

const WHITE = { r: 255, g: 255, b: 255 };
const BLACK = { r: 0, g: 0, b: 0 };

describe('colour text', () => {
  it('writes HEX in upper case with two digits a channel', () => {
    expect(toHex({ r: 142, g: 232, b: 216 })).toBe('#8EE8D8');
    expect(toHex({ r: 1, g: 2, b: 3 })).toBe('#010203');
  });

  it('writes RGB as three plain numbers', () => {
    expect(toRgbText({ r: 142, g: 232, b: 216 })).toBe('RGB 142 232 216');
  });
});

describe('WCAG contrast', () => {
  it('gives black 0 and white 1 for luminance', () => {
    expect(relativeLuminance(BLACK)).toBe(0);
    expect(relativeLuminance(WHITE)).toBeCloseTo(1, 10);
  });

  it('gives 21 for white on black, either way round, and 1 for a colour on itself', () => {
    expect(contrastRatio(WHITE, BLACK)).toBeCloseTo(21, 10);
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 10);
    expect(contrastRatio(WHITE, WHITE)).toBe(1);
  });

  // #767676 on white is the textbook "just passes AA" grey, 4.54:1.
  it('puts the classic AA grey just over 4.5 on white', () => {
    const ratio = contrastRatio({ r: 118, g: 118, b: 118 }, WHITE);
    expect(ratio).toBeGreaterThan(4.5);
    expect(ratio).toBeLessThan(4.6);
  });
});

describe('verdicts', () => {
  it.each([
    [21, 'AAA'],
    [7, 'AAA'],
    [6.99, 'AA'],
    [4.5, 'AA'],
    [4.49, 'AA large'],
    [3, 'AA large'],
    [2.99, 'Decorative only'],
    [1, 'Decorative only'],
  ] as const)('%s:1 is %s', (ratio, verdict) => {
    expect(verdictFor(ratio)).toBe(verdict);
  });

  // Rounding up would print 4.5 for a pair that fails AA.
  it('prints the ratio to one decimal, rounded down', () => {
    expect(formatRatio(4.49)).toBe('4.4');
    expect(formatRatio(21)).toBe('21.0');
    expect(formatRatio(8.76)).toBe('8.7');
  });
});
