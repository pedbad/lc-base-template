/**
 * token-contrast.ts — resolve a token file's colours and measure WCAG contrast, so
 * `token-contrast.test.ts` can hold every semantic pair to AA (TODO §D10).
 *
 * DELIBERATELY SMALL. It understands exactly the value shapes the semantic pairs use:
 * a hex, a `var()` chain into `palette.css`, and an opaque two-colour
 * `color-mix(in oklab, …)`. Anything else — `transparent`, an alpha mix, a colour
 * function — THROWS rather than guessing, so a new shape fails loudly in the test
 * instead of being measured as something it is not.
 *
 * The oklab maths is Björn Ottosson's reference conversion, which is what CSS Color 4
 * specifies for `color-mix(in oklab)`. The test calibrates it against a colour Chromium
 * actually painted, so "the maths agrees with itself" is not the only evidence.
 *
 * Alias-free and DOM-free: plain string work, run in the node test environment.
 */

/** Linear-free sRGB, each channel 0–1. */
export type Rgb = readonly [number, number, number];

/** A token block: custom-property name → its raw declared value. */
export type TokenBlock = ReadonlyMap<string, string>;

const stripComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

function declarations(css: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const match of stripComments(css).matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    found.set(match[1] as string, (match[2] as string).trim());
  }
  return found;
}

/**
 * The declarations in force for one theme: the palette, then the token file's `:root`
 * block, then (for `dark`) its `.dark` block on top. Split on the `.dark` selector, as
 * `token-presets.test.ts` does — these files are flat by construction.
 */
export function readTokenBlock(paletteCss: string, tokensCss: string, block: 'root' | 'dark') {
  const darkAt = tokensCss.search(/^\s*\.dark\s*\{/m);
  if (darkAt < 0) throw new Error('token file has no .dark block');
  const root = declarations(tokensCss.slice(0, darkAt));
  const dark = block === 'dark' ? declarations(tokensCss.slice(darkAt)) : new Map();
  return new Map([...declarations(paletteCss), ...root, ...dark]) as TokenBlock;
}

/** Split on commas that are not inside parentheses. */
function topLevelArgs(inner: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    else if (ch === ',' && depth === 0) {
      args.push(inner.slice(start, i).trim());
      start = i + 1;
    }
  }
  return [...args, inner.slice(start).trim()];
}

const toLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number): number =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
const clamp01 = (c: number): number => Math.min(1, Math.max(0, c));

function toOklab([r, g, b]: Rgb): Rgb {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromOklab([L, a, b]: Rgb): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    clamp01(fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    clamp01(fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    clamp01(fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
  ];
}

function parseHex(value: string): Rgb | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value)?.[1];
  if (!hex) return null;
  const full = hex.length === 3 ? [...hex].map((ch) => ch + ch).join('') : hex;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as unknown as Rgb;
}

/** `var(--x) 80%` → the colour and its percentage, if one was written. */
function mixStop(arg: string, tokens: TokenBlock): { color: Rgb; weight: number | null } {
  const pct = /\s+([\d.]+)%$/.exec(arg);
  const colour = pct ? arg.slice(0, pct.index) : arg;
  return { color: resolveValue(colour.trim(), tokens), weight: pct ? Number(pct[1]) / 100 : null };
}

function resolveMix(inner: string, tokens: TokenBlock): Rgb {
  const [space, first, second] = topLevelArgs(inner);
  if (space !== 'in oklab' || !first || !second) {
    throw new Error(`unsupported color-mix: color-mix(${inner})`);
  }
  const a = mixStop(first, tokens);
  const b = mixStop(second, tokens);
  const wa = a.weight ?? (b.weight === null ? 0.5 : 1 - b.weight);
  const wb = b.weight ?? 1 - wa;
  const [la, lb] = [toOklab(a.color), toOklab(b.color)];
  const total = wa + wb;
  return fromOklab([0, 1, 2].map((i) => (la[i]! * wa + lb[i]! * wb) / total) as unknown as Rgb);
}

function resolveValue(value: string, tokens: TokenBlock): Rgb {
  const hex = parseHex(value);
  if (hex) return hex;
  const ref = /^var\((--[a-z0-9-]+)\)$/.exec(value)?.[1];
  if (ref) return resolveToken(ref, tokens);
  const mix = /^color-mix\((.*)\)$/s.exec(value)?.[1];
  if (mix) return resolveMix(mix, tokens);
  throw new Error(`unsupported colour value: ${value}`);
}

/** A token's colour in this block, following `var()` and `color-mix()`. */
export function resolveToken(name: string, tokens: TokenBlock): Rgb {
  const value = tokens.get(name);
  if (value === undefined) throw new Error(`${name} is not declared`);
  return resolveValue(value, tokens);
}

/** Quantise to the 8-bit hex the browser paints — contrast is judged on that. */
export function toHex(color: Rgb): string {
  return `#${color
    .map((c) =>
      Math.round(clamp01(c) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

function luminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) throw new Error(`not a hex colour: ${hex}`);
  const [r, g, b] = rgb.map(toLinear) as unknown as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two hex colours, order-independent. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
