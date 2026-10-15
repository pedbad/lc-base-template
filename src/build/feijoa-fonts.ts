/**
 * feijoa-fonts.ts — puts Feijoa's @font-face rules on a page only when all three
 * licensed files are present (TODO §E5).
 *
 * Feijoa is commercial and never committed (spec §12, decision #18;
 * `public/fonts/feijoa/README.md`), so on a fresh clone, in CI and on a deploy without
 * the fonts the files are absent and headings fall back to Open Sans. The rules used to
 * live in app.css and requested the missing files anyway. Worse, under a sub-path the
 * request escaped the base: Vite rewrites a CSS url() to a public/ file only when that
 * file exists at build time, so `/fonts/feijoa/…` stayed root-absolute and 404'd outside
 * `/course/`. Emitting the rules from here, only when the files exist, means no request
 * for a font that is not there, and every URL carries the real base.
 *
 * An inline <style> in <head> rather than a stylesheet: no extra request. Vite runs
 * transformIndexHtml for every built page, for the dev server's pages (lo-dev-pages
 * calls it too) and for the template the prerender pass reuses, so one hook covers all.
 *
 * Reachable from vite.config.ts, so `node:` imports only — no `@/` alias (AGENTS.md hard
 * constraint 1).
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { HtmlTagDescriptor, Plugin } from 'vite';

/** The three cuts the design uses, in the order the old app.css declared them. */
export const FEIJOA_FACES = [
  { file: 'Feijoa-Medium-Cambridge.otf', weight: 500, style: 'normal' },
  { file: 'Feijoa-MediumItalic-Cambridge.otf', weight: 500, style: 'italic' },
  { file: 'Feijoa-Bold-Cambridge.otf', weight: 700, style: 'normal' },
] as const;

/** Where the files live, relative to Vite's public directory. */
const FONT_SUBDIR = path.join('fonts', 'feijoa');

/** The Feijoa files missing from `fontDir`, in declaration order. */
export function missingFeijoaFiles(fontDir: string): string[] {
  return FEIJOA_FACES.map((face) => face.file).filter(
    (file) => !existsSync(path.join(fontDir, file)),
  );
}

/** The three @font-face rules, every URL under `base` (which ends in a slash). */
export function feijoaFontFaceCss(base: string): string {
  return FEIJOA_FACES.map(
    (face) => `@font-face {
  font-family: Feijoa;
  src: url('${base}fonts/feijoa/${face.file}') format('opentype');
  font-weight: ${face.weight};
  font-style: ${face.style};
  font-display: swap;
}`,
  ).join('\n');
}

/** The Vite plugin. Checks the files on every page transform, so adding them needs no restart. */
export function feijoaFonts(): Plugin {
  let base = '/';
  let fontDir = '';

  return {
    name: 'lc-feijoa-fonts',
    configResolved(config) {
      base = config.base;
      fontDir = path.join(config.publicDir, FONT_SUBDIR);
      const missing = missingFeijoaFiles(fontDir);
      // Some but not all: almost certainly an incomplete copy, and headings would mix
      // Feijoa and Open Sans across weights. Say so rather than half-apply.
      if (missing.length > 0 && missing.length < FEIJOA_FACES.length) {
        config.logger.warn(
          `Feijoa: ${missing.join(', ')} missing from ${fontDir}; using Open Sans for all headings.`,
        );
      }
    },
    transformIndexHtml(): HtmlTagDescriptor[] {
      if (missingFeijoaFiles(fontDir).length > 0) return [];
      return [{ tag: 'style', children: feijoaFontFaceCss(base), injectTo: 'head' }];
    },
  };
}
