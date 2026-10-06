/**
 * token-contrast.test.ts — every semantic pair the sandbox shows clears WCAG AA text
 * contrast (4.5:1), in both themes, in the active tokens AND every preset.
 *
 * THE BUG THIS CAUGHT. `sandbox-catalog.ts` says of each pair: "the `on` token is the
 * text colour the pair guarantees contrast for". Nothing checked the guarantee. In dark
 * mode `--muted-foreground` on `--muted` measured 4.47:1 — axe flagged 28 nodes on the
 * debug sandbox (2026-10-06, TODO §D10), the swatch card for the pair among them. No
 * shipped page used that pairing yet, so the first lesson to put helper text on a muted
 * surface would have shipped it.
 *
 * WHY HERE AND NOT IN src/guards/: the same reasoning as `token-presets.test.ts` — that
 * glob is `bun run guards`, the eight spec guards. This runs in `bun run test`.
 *
 * The resolver is calibrated against Chromium, not just against itself: the dark
 * `--muted` mix must come out as the `#494d55` axe read off the rendered page.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SEMANTIC_SWATCHES } from '../sandbox/sandbox-catalog';
import { contrastRatio, readTokenBlock, resolveToken, toHex } from './token-contrast';

const STYLES_DIR = path.resolve(import.meta.dirname, '.');
const read = (file: string): string => readFileSync(path.join(STYLES_DIR, file), 'utf8');

/** WCAG 2.x SC 1.4.3, normal-size text. */
const AA_TEXT = 4.5;

const palette = read('palette.css');
const TOKEN_FILES = [
  'tokens.css',
  ...readdirSync(STYLES_DIR)
    .filter((f) => f.startsWith('tokens-variant-') && f.endsWith('.css'))
    .sort(),
];
const PAIRS = SEMANTIC_SWATCHES.flatMap((group) => group.pairs);

describe('the colour maths, calibrated against what Chromium rendered', () => {
  const dark = readTokenBlock(palette, read('tokens.css'), 'dark');

  it('resolves a token through var() to its palette hex', () => {
    expect(toHex(resolveToken('--background', dark))).toBe('#232830');
  });

  it('mixes color-mix(in oklab, …) to the colour the browser painted', () => {
    // `--secondary` and `--muted` share `color-mix(in oklab, var(--slate-4) 80%, var(--white))`;
    // axe read `#494d55` off the page as the muted swatch's background.
    expect(toHex(resolveToken('--secondary', dark))).toBe('#494d55');
  });

  it('computes the WCAG ratio axe reported for the failing pair', () => {
    expect(contrastRatio('#b5bdc8', '#494d55')).toBeCloseTo(4.47, 2);
  });

  it('gives 21:1 for black on white and is symmetric', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });

  it('refuses a colour it cannot resolve instead of guessing', () => {
    expect(() => resolveToken('--no-such-token', dark)).toThrow(/--no-such-token/);
  });
});

describe('every semantic pair clears AA text contrast', () => {
  it('finds the pairs and the four token files it is meant to check', () => {
    expect(PAIRS.length).toBeGreaterThan(10);
    expect(TOKEN_FILES).toHaveLength(4);
  });

  describe.each(TOKEN_FILES)('%s', (file) => {
    const css = read(file);
    describe.each(['root', 'dark'] as const)('%s block', (block) => {
      const tokens = readTokenBlock(palette, css, block);
      it.each(PAIRS.map((pair) => [`${pair.on} on ${pair.token}`, pair] as const))(
        '%s',
        (_name, pair) => {
          const ratio = contrastRatio(
            toHex(resolveToken(pair.on, tokens)),
            toHex(resolveToken(pair.token, tokens)),
          );
          expect(ratio).toBeGreaterThanOrEqual(AA_TEXT);
        },
      );
    });
  });
});
