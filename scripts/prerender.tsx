/**
 * prerender.tsx — the post-build pass that turns a built SPA into static per-LO HTML
 * (Phase C · Part D).
 *
 * Runs AFTER `vite build`, because it reuses the built `dist/index.html` as its
 * template — that file already points at the hashed bundles Vite just emitted (see
 * src/build/prerender-html.ts for why that beats reading the Vite manifest).
 *
 * Reads LOs with `load-lo-disk` (`node:fs`), NEVER `load-lo-glob`: `import.meta.glob`
 * is Vite-only syntax and throws outside a Vite transform. Same assembler either way,
 * so validation and ordering are defined once.
 *
 * Fails the build loudly: any malformed LO, missing dist, or reshaped template throws
 * with the offending path named. A half-rendered page is never written.
 *
 * Scope: ONE LO for now (Part D §2 — get the hashed-asset injection right on file one).
 * The loop over `listLoSlugs()` is the next commit.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from '@/App';
import { buildPrerenderedHtml } from '@/build/prerender-html';
import { loadLo } from '@/lo/load-lo-disk';
import { loSlug } from '@/lo/lo-slug';

const DIST_DIR = path.resolve(import.meta.dirname, '../dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');

/** The one LO rendered for now; `listLoSlugs()` replaces this in the next commit. */
const LO_FOLDER = 'lo-00-example';

/**
 * `renderToString`, not `renderToStaticMarkup`: static markup is documented as
 * non-hydratable, and these pages hydrate into the live app.
 */
function renderLoPage(template: string, loFolder: string): { slug: string; html: string } {
  const lo = loadLo(loFolder);
  const appHtml = renderToString(
    <StrictMode>
      <App lo={lo} />
    </StrictMode>,
  );

  return {
    slug: loSlug(loFolder),
    html: buildPrerenderedHtml({
      template,
      appHtml,
      loFolder,
      title: lo.title,
      description: lo.description,
    }),
  };
}

let template: string;
try {
  template = readFileSync(TEMPLATE_PATH, 'utf-8');
} catch {
  throw new Error(`prerender: ${TEMPLATE_PATH} not found — run \`vite build\` first`);
}

const { slug, html } = renderLoPage(template, LO_FOLDER);
const outPath = path.join(DIST_DIR, `${slug}.html`);
writeFileSync(outPath, html, 'utf-8');

// The build's only progress output — one line per generated page.
process.stdout.write(`prerendered ${LO_FOLDER} → dist/${slug}.html\n`);
