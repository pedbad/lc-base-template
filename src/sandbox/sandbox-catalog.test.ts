/**
 * sandbox-catalog.test.ts — the sandbox shows the tokens that actually exist.
 *
 * THE BUG CLASS this closes is the sandbox's own reason for existing turning into a
 * lie. It is a REFERENCE: a designer reads it to learn what may be edited. A swatch
 * naming a token that was renamed or removed renders as a blank square and teaches
 * the wrong name; a token added to `palette.css` that no swatch names is invisible to
 * the person the page is for. Both are silent — CSS custom properties resolve to
 * nothing rather than erroring, so the page still "works".
 *
 * NOT IN src/guards/ ON PURPOSE, for the same reason as `src/docs/`: `bun run guards`
 * means "the eight spec guards (a–h)", and a sandbox-freshness check is not one of
 * them. It runs in `bun run test`, which is the gate and what CI runs.
 *
 * WHY IT READS THE CSS RATHER THAN IMPORTING IT: the catalog must stay browser-safe
 * (it ships in the sandbox bundle), so it holds names only. The files are the source
 * of truth, and this test is the join between them.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PRIMITIVE_SWATCHES,
  SANDBOX_ICON_IDS,
  SEMANTIC_SWATCHES,
  SWATCH_STRIPS,
  TYPE_SPECIMENS,
} from './sandbox-catalog';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const read = (relative: string) => readFileSync(path.join(REPO_ROOT, relative), 'utf-8');

const palette = read('src/styles/palette.css');
const tokens = read('src/styles/tokens.css');
const icons = read('public/icons.svg');

/** Names a CSS file DECLARES, e.g. `--primary: …` — not ones it merely references. */
function declaredTokens(css: string): Set<string> {
  return new Set(Array.from(css.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim), (m) => m[1] as string));
}

const paletteNames = declaredTokens(palette);
const tokenNames = declaredTokens(tokens);
const primitiveNames = PRIMITIVE_SWATCHES.flatMap((group) => group.tokens);
const semanticPairs = SEMANTIC_SWATCHES.flatMap((group) => group.pairs);

describe('primitive swatches', () => {
  it('name only tokens palette.css declares', () => {
    expect(primitiveNames.filter((name) => !paletteNames.has(name))).toEqual([]);
  });

  // The other direction: a colour primitive nobody can see is a colour nobody edits.
  it('cover every colour primitive palette.css declares', () => {
    const colours = Array.from(paletteNames).filter((name) => !name.startsWith('--font-'));
    expect(colours.filter((name) => !primitiveNames.includes(name))).toEqual([]);
  });

  it('list each token once', () => {
    expect(new Set(primitiveNames).size).toBe(primitiveNames.length);
  });
});

describe('semantic swatches', () => {
  it('name only tokens tokens.css declares, on both sides of the pair', () => {
    const named = semanticPairs.flatMap((pair) => [pair.token, pair.on]);
    expect(named.filter((name) => !tokenNames.has(name))).toEqual([]);
  });

  it('list each surface token once', () => {
    const surfaces = semanticPairs.map((pair) => pair.token);
    expect(new Set(surfaces).size).toBe(surfaces.length);
  });
});

describe('swatch strips', () => {
  // Tokens with no `-foreground` partner: lines, focus rings and the data-viz ramp.
  // They are shown as bars rather than text-on-colour, but they are still tokens a
  // designer edits, so they get the same existence check.
  it('name only tokens tokens.css declares', () => {
    const named = SWATCH_STRIPS.flatMap((group) => group.tokens);
    expect(named.filter((name) => !tokenNames.has(name))).toEqual([]);
  });

  it('do not repeat a token already shown as a pair', () => {
    const paired = new Set(semanticPairs.flatMap((pair) => [pair.token, pair.on]));
    const named = SWATCH_STRIPS.flatMap((group) => group.tokens);
    expect(named.filter((name) => paired.has(name))).toEqual([]);
  });
});

describe('type specimens', () => {
  // Only two families exist by decision (DESIGNER.md "Job 3"), both declared in
  // palette.css so a preset switch never touches them.
  it('name only font tokens palette.css declares', () => {
    const families = TYPE_SPECIMENS.map((specimen) => specimen.font);
    expect(families.filter((name) => !paletteNames.has(name))).toEqual([]);
  });
});

describe('icon ids', () => {
  const symbolIds = new Set(
    Array.from(icons.matchAll(/<symbol[^>]*\bid="([^"]+)"/g), (m) => m[1] as string),
  );

  it('name only symbols public/icons.svg defines', () => {
    expect(SANDBOX_ICON_IDS.filter((id) => !symbolIds.has(id))).toEqual([]);
  });

  // The sprite is the whole point of the preview — an added icon should show up
  // without anyone remembering to list it here.
  it('cover every symbol the sprite defines', () => {
    expect(Array.from(symbolIds).filter((id) => !SANDBOX_ICON_IDS.includes(id))).toEqual([]);
  });
});
