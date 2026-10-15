/**
 * feijoa-fonts.test.ts — Feijoa's @font-face rules reach a page only when all three
 * licensed files are present (TODO §E5). Feijoa is never committed, so on a fresh clone,
 * in CI and on a deploy without the fonts the rules used to request missing files: under
 * a sub-path that URL even escaped the base (Vite rewrites a CSS url() to public/ only
 * when the file exists at build time), and the browser suite failed on the 404.
 *
 * Node only: a temporary folder stands in for `public/`.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { HtmlTagDescriptor, Plugin, ResolvedConfig } from 'vite';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { FEIJOA_FACES, feijoaFontFaceCss, feijoaFonts, missingFeijoaFiles } from './feijoa-fonts';

let publicDir: string;
const fontDir = (): string => path.join(publicDir, 'fonts', 'feijoa');

/** Drops the named font files (empty, the plugin only checks they exist). */
function addFonts(files: readonly string[]) {
  mkdirSync(fontDir(), { recursive: true });
  for (const file of files) writeFileSync(path.join(fontDir(), file), '');
}

const ALL_FILES = FEIJOA_FACES.map((face) => face.file);

beforeEach(() => {
  publicDir = mkdtempSync(path.join(tmpdir(), 'feijoa-'));
});

afterEach(() => {
  rmSync(publicDir, { recursive: true, force: true });
});

describe('missingFeijoaFiles', () => {
  test('lists every file when the folder does not exist', () => {
    expect(missingFeijoaFiles(fontDir())).toEqual(ALL_FILES);
  });

  test('lists only the absent files', () => {
    addFonts(ALL_FILES.slice(0, 2));
    expect(missingFeijoaFiles(fontDir())).toEqual([ALL_FILES[2]]);
  });

  test('is empty when all three are present', () => {
    addFonts(ALL_FILES);
    expect(missingFeijoaFiles(fontDir())).toEqual([]);
  });
});

describe('feijoaFontFaceCss', () => {
  test('one @font-face per cut, each URL under the base', () => {
    const css = feijoaFontFaceCss('/course/');

    expect(css.match(/@font-face/g)).toHaveLength(3);
    for (const face of FEIJOA_FACES) {
      expect(css).toContain(`url('/course/fonts/feijoa/${face.file}') format('opentype')`);
    }
  });

  test('keeps the weights, styles and swap the old app.css rules had', () => {
    const css = feijoaFontFaceCss('/');

    expect(css).toContain("src: url('/fonts/feijoa/Feijoa-MediumItalic-Cambridge.otf')");
    expect(css.match(/font-family: Feijoa;/g)).toHaveLength(3);
    expect(css.match(/font-display: swap;/g)).toHaveLength(3);
    expect(css).toMatch(/Feijoa-Bold-Cambridge\.otf'\) format\('opentype'\);\s*font-weight: 700;/);
    expect(css).toMatch(/Feijoa-MediumItalic[^}]*font-weight: 500;\s*font-style: italic;/);
  });
});

/** Runs the plugin's two hooks the way Vite would: what it injects, and what it warned. */
function runPlugin(base: string): { tags: HtmlTagDescriptor[]; warn: ReturnType<typeof vi.fn> } {
  const warn = vi.fn();
  const plugin: Plugin = feijoaFonts();
  const configResolved = plugin.configResolved as (config: ResolvedConfig) => void;
  configResolved({ base, publicDir, logger: { warn } } as unknown as ResolvedConfig);
  const transform = plugin.transformIndexHtml as (html: string) => HtmlTagDescriptor[];
  return { tags: transform('<html><head></head><body></body></html>'), warn };
}

const injectedTags = (base: string): HtmlTagDescriptor[] => runPlugin(base).tags;

describe('feijoaFonts plugin', () => {
  test('injects the rules into <head> when all three files are present', () => {
    addFonts(ALL_FILES);

    expect(injectedTags('/course/')).toEqual([
      { tag: 'style', children: feijoaFontFaceCss('/course/'), injectTo: 'head' },
    ]);
  });

  test('injects nothing when the files are absent, so no font is ever requested', () => {
    expect(injectedTags('/')).toEqual([]);
  });

  test('injects nothing when only some files are present', () => {
    addFonts(ALL_FILES.slice(0, 1));
    expect(injectedTags('/')).toEqual([]);
  });

  // A partial copy is almost certainly a mistake; none (the normal fresh clone) or all
  // three is not, so only the partial case says anything.
  test('warns, naming the missing files, only when some but not all are present', () => {
    addFonts(ALL_FILES.slice(0, 1));
    const { warn } = runPlugin('/');
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain(ALL_FILES[1]);
    expect(warn.mock.calls[0][0]).toContain(ALL_FILES[2]);

    rmSync(fontDir(), { recursive: true });
    expect(runPlugin('/').warn).not.toHaveBeenCalled();

    addFonts(ALL_FILES);
    expect(runPlugin('/').warn).not.toHaveBeenCalled();
  });
});
