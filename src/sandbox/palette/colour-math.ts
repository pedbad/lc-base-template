/**
 * colour-math.ts — pure colour arithmetic for the sandbox's brand board (§E19): sRGB
 * bytes to the text a client reads (HEX, RGB), and the WCAG 2.2 contrast between two
 * colours with its verdict. No DOM and no values: the bytes come from live-colours.ts,
 * read off the page, so this file cannot hold a stale colour.
 */

/** One colour as sRGB bytes, 0–255 a channel. */
export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** WCAG 2.2 levels, for normal text; "AA large" is ≥ 18.66px bold or 24px. */
export type Verdict = 'AAA' | 'AA' | 'AA large' | 'Decorative only';

const AAA_RATIO = 7;
const AA_RATIO = 4.5;
const AA_LARGE_RATIO = 3;

const byteHex = (byte: number) => byte.toString(16).padStart(2, '0').toUpperCase();

export function toHex({ r, g, b }: Rgb): string {
  return `#${byteHex(r)}${byteHex(g)}${byteHex(b)}`;
}

export function toRgbText({ r, g, b }: Rgb): string {
  return `RGB ${r} ${g} ${b}`;
}

/** sRGB byte → linear light, the WCAG 2.2 formula. */
function linear(byte: number): number {
  const channel = byte / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance, 0 for black to 1 for white. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** Contrast ratio, 1 to 21, the same whichever colour is the text. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
  const darker = Math.min(relativeLuminance(a), relativeLuminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

export function verdictFor(ratio: number): Verdict {
  if (ratio >= AAA_RATIO) return 'AAA';
  if (ratio >= AA_RATIO) return 'AA';
  if (ratio >= AA_LARGE_RATIO) return 'AA large';
  return 'Decorative only';
}

/** One decimal, rounded DOWN: a 4.49 pair must never read as 4.5 and seem to pass. */
export function formatRatio(ratio: number): string {
  return (Math.floor(ratio * 10) / 10).toFixed(1);
}
