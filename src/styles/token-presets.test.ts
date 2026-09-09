/**
 * token-presets.test.ts — every preset declares the same token NAMES as the active
 * `tokens.css`, in both the light and dark blocks.
 *
 * THE BUG THIS CAUGHT, on the day it was written. `tokens.css` declared `--success`
 * and `--success-foreground`; NONE of the three variant files did. Those two tokens
 * are read by ~15 files, including ten exercise engines' correct-answer feedback. So
 * following DESIGNER.md Job 2 exactly as documented —
 *
 *     cp src/styles/tokens-variant-a-cambridge-blue.css src/styles/tokens.css
 *
 * — would have DELETED both, and every correct-answer colour across all 15 engines
 * would have lost its value. Silently: an undefined custom property is not an error,
 * it just resolves to nothing.
 *
 * DESIGNER.md already warned about exactly this ("never hand-edit tokens.css: your
 * edit would be lost the next time anyone switches preset"). The warning was written
 * and then violated, because nothing checked it. Prose is not enforcement.
 *
 * WHY NAMES AND NOT VALUES. The presets are SUPPOSED to differ in value — that is
 * what a preset is, and A/B/C differ deliberately in `--primary` and `--ring`. What
 * must never differ is the SET of roles a component can rely on, because a component
 * naming a role that one preset omits is broken only for that preset, and only in
 * whatever state uses it. So this compares key sets and says nothing about values.
 *
 * WHY NOT IN src/guards/. That glob IS `bun run guards`, which means "the eight spec
 * guards (a-h)". A preset-parity check is not one of them. It runs in `bun run test`,
 * which is the gate and what CI runs — the same reasoning as `src/docs/md-links.ts`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const STYLES_DIR = path.resolve(import.meta.dirname, '.');

/** Read a stylesheet in this folder. */
const read = (file: string): string => readFileSync(path.join(STYLES_DIR, file), 'utf8');

/**
 * The custom-property names declared inside one block of a token file.
 *
 * The two blocks are split on the `.dark` selector rather than brace-matched: these
 * files are flat by construction (`:root { … }` then `.dark { … }` inside one
 * `@layer base`), and a real parser would be more machinery than the shape needs.
 */
function declaredNames(css: string, block: 'root' | 'dark'): ReadonlySet<string> {
  const darkAt = css.search(/^\s*\.dark\s*\{/m);
  expect(darkAt).toBeGreaterThan(-1);
  const slice = block === 'root' ? css.slice(0, darkAt) : css.slice(darkAt);
  return new Set(Array.from(slice.matchAll(/^\s+(--[a-z0-9-]+)\s*:/gm), (m) => m[1] as string));
}

const PRESETS = readdirSync(STYLES_DIR)
  .filter((f) => f.startsWith('tokens-variant-') && f.endsWith('.css'))
  .sort();

const active = read('tokens.css');

describe('token presets', () => {
  // A rename or a new preset should not quietly reduce what is checked.
  it('finds all three presets on disk', () => {
    expect(PRESETS.length).toBe(3);
  });

  describe.each(PRESETS)('%s', (preset) => {
    const css = read(preset);

    it.each(['root', 'dark'] as const)(
      'declares every token tokens.css declares in its %s block',
      (block) => {
        const activeNames = declaredNames(active, block);
        const presetNames = declaredNames(css, block);
        const missing = [...activeNames].filter((name) => !presetNames.has(name)).sort();
        expect(missing).toEqual([]);
      },
    );

    // The reverse direction matters just as much: a token a preset declares and
    // tokens.css does not is a role that appears only after a preset switch, which
    // is the same drift travelling the other way.
    it.each(['root', 'dark'] as const)(
      'declares no token tokens.css lacks in its %s block',
      (block) => {
        const activeNames = declaredNames(active, block);
        const presetNames = declaredNames(css, block);
        const extra = [...presetNames].filter((name) => !activeNames.has(name)).sort();
        expect(extra).toEqual([]);
      },
    );
  });
});
