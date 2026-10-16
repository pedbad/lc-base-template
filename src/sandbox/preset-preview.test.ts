/**
 * preset-preview.test.ts — the sandbox's preset drop-down (TODO §E18): which presets it
 * offers, what it calls them, and what choosing one does to the page.
 */
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ACTIVE_TOKENS_CSS,
  PRESET_STYLE_ID,
  TOKEN_PRESETS,
  applyTokenPreset,
  matchingPreset,
  presetsFromFiles,
} from './preset-preview';

const STYLES_DIR = path.resolve(import.meta.dirname, '../styles');

describe('presetsFromFiles', () => {
  it('names each preset by its letter and its words, sorted by file name', () => {
    const presets = presetsFromFiles({
      '../styles/tokens-variant-c-warm-blue.css': 'c',
      '../styles/tokens-variant-a-cambridge-blue.css': 'a',
    });
    expect(presets).toEqual([
      { id: 'a-cambridge-blue', label: 'A · Cambridge Blue', css: 'a' },
      { id: 'c-warm-blue', label: 'C · Warm Blue', css: 'c' },
    ]);
  });
});

describe('TOKEN_PRESETS', () => {
  // The drop-down has no list of its own: a new preset file must appear by itself.
  it('offers every tokens-variant-*.css on disk, in file-name order', () => {
    const onDisk = readdirSync(STYLES_DIR)
      .filter((f) => f.startsWith('tokens-variant-') && f.endsWith('.css'))
      .sort()
      .map((f) => f.replace(/^tokens-variant-/, '').replace(/\.css$/, ''));
    expect(TOKEN_PRESETS.map((p) => p.id)).toEqual(onDisk);
  });

  // Format only: a list of names here would be a second list to keep (and a fourth
  // preset would fail it). presetsFromFiles' test pins how a label is made.
  it.each(TOKEN_PRESETS.map((p) => [p.id, p.label] as const))('%s has a label', (_id, label) => {
    expect(label).toMatch(/^[A-Z0-9] · \S/);
  });

  // Light AND dark: the preview must survive the theme switch.
  it.each(TOKEN_PRESETS.map((p) => [p.label, p.css] as const))(
    '%s carries the file itself, both the light and the dark block',
    (_label, css) => {
      expect(css).toMatch(/:root\s*\{/);
      expect(css).toMatch(/\.dark\s*\{/);
    },
  );
});

describe('matchingPreset', () => {
  const presets = presetsFromFiles({
    'tokens-variant-a-x.css': '/* A */ :root { --primary: var(--a); }',
    'tokens-variant-b-y.css': '/* B */ :root { --primary: var(--b); }',
  });

  it('finds the preset tokens.css was copied from, whatever its comments say', () => {
    const active = '/* the active copy */\n:root {\n  --primary: var(--b);\n}\n';
    expect(matchingPreset(active, presets)?.id).toBe('b-y');
  });

  it('finds none when tokens.css matches no preset', () => {
    expect(matchingPreset(':root { --primary: var(--z); }', presets)).toBeUndefined();
  });

  // DESIGNER.md Job 2: tokens.css is only ever a copy of a preset, so the "as built"
  // option can always say which one it is.
  it('finds the real tokens.css among the real presets', () => {
    expect(ACTIVE_TOKENS_CSS).toMatch(/:root\s*\{/);
    expect(matchingPreset(ACTIVE_TOKENS_CSS, TOKEN_PRESETS)).toBeDefined();
  });
});

/** Just enough of `document` for applyTokenPreset, so the test needs no DOM. */
function fakeDocument() {
  const head: { id: string; textContent: string; remove(): void }[] = [];
  const doc = {
    getElementById: (id: string) => head.find((el) => el.id === id) ?? null,
    createElement: () => {
      const el = {
        id: '',
        textContent: '',
        remove: () => void head.splice(head.indexOf(el), 1),
      };
      return el;
    },
    head: {
      append: (el: unknown) => {
        const at = head.indexOf(el as (typeof head)[number]);
        if (at > -1) head.splice(at, 1);
        head.push(el as (typeof head)[number]);
      },
    },
  };
  return { doc: doc as unknown as Document, head };
}

describe('applyTokenPreset', () => {
  it('adds one style element holding the preset, last in <head>', () => {
    const { doc, head } = fakeDocument();
    head.push({ id: 'vite-css', textContent: '', remove: () => {} });
    applyTokenPreset(doc, ':root { --primary: red; }');
    expect(head.map((el) => el.id)).toEqual(['vite-css', PRESET_STYLE_ID]);
    expect(head[1]?.textContent).toBe(':root { --primary: red; }');
  });

  it('replaces the previous preset rather than stacking a second one', () => {
    const { doc, head } = fakeDocument();
    applyTokenPreset(doc, 'first');
    applyTokenPreset(doc, 'second');
    expect(head).toHaveLength(1);
    expect(head[0]?.textContent).toBe('second');
  });

  // A stylesheet added after ours (Vite's HMR does this) would win the cascade, so
  // each choice moves the element back to the end.
  it('moves the element back to the end of <head> on every choice', () => {
    const { doc, head } = fakeDocument();
    applyTokenPreset(doc, 'first');
    head.push({ id: 'later', textContent: '', remove: () => {} });
    applyTokenPreset(doc, 'second');
    expect(head.map((el) => el.id)).toEqual(['later', PRESET_STYLE_ID]);
  });

  it('removes it for "as built", so tokens.css applies again', () => {
    const { doc, head } = fakeDocument();
    applyTokenPreset(doc, 'first');
    applyTokenPreset(doc, null);
    expect(head).toEqual([]);
  });
});
