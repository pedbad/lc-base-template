/**
 * debug-css.test.ts — the debug pages' styles stay out of the shipped stylesheet.
 *
 * Tailwind v4 scans files on disk, not the import graph, so any class written only in
 * `src/sandbox/` or `src/showcase/` used to land in `main-*.css` — the sheet every LO
 * page loads — although neither page is ever deployed. Measured 2026-10-07: the
 * sandbox's alert examples alone took `main-*.css` from 17.82 to 17.98 kB.
 *
 * The split: `index.css` stops scanning the two debug folders; `debug.css` builds on
 * the same shared base (`styles/app.css`) WITHOUT that exclusion, and only the two
 * debug entries load it. It cannot import `index.css` instead: an imported
 * `@source not` is not undone by a later `@source`. This test pins every half, because removing any one of them fails silently — either the
 * debug classes return to the shipped sheet, or the debug pages render unstyled.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = path.resolve(import.meta.dirname, '..');
const read = (relative: string): string => readFileSync(path.join(SRC, relative), 'utf-8');

const DEBUG_FOLDERS = ['./sandbox', './showcase'] as const;

describe('debug pages have their own stylesheet', () => {
  it('index.css does not scan the debug folders', () => {
    const indexCss = read('index.css');
    DEBUG_FOLDERS.forEach((folder) => {
      expect(indexCss).toContain(`@source not "${folder}";`);
    });
  });

  it('both sheets share one base, and debug.css does not exclude the debug folders', () => {
    const indexCss = read('index.css');
    const debugCss = read('debug.css');
    [indexCss, debugCss].forEach((sheet) => {
      expect(sheet).toContain("@import 'tailwindcss';");
      expect(sheet).toContain("@import './styles/app.css';");
    });
    expect(debugCss).not.toMatch(/@import ['"]\.\/index\.css['"]/);
    DEBUG_FOLDERS.forEach((folder) => {
      expect(debugCss).not.toContain(`@source not "${folder}"`);
    });
  });

  it.each(['sandbox/main.tsx', 'showcase/main.tsx'])(
    '%s loads debug.css, not index.css',
    (entry) => {
      const source = read(entry);
      expect(source).toContain("import '../debug.css';");
      expect(source).not.toContain("import '../index.css';");
    },
  );
});
