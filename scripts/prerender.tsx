/**
 * prerender.tsx — the post-build pass that turns a built SPA into static HTML: the
 * course landing page (Phase D) plus one page per LO (Phase C · Part D).
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
 * Every folder under `lo-config/` gets one file, and the landing page lists them all.
 * Nothing here enumerates LOs by hand — an LO exists because its folder exists, and
 * `dist/index.html` gains a card for it with no code change.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from '@/App';
import { buildPrerenderedHtml } from '@/build/prerender-html';
import CourseHome from '@/components/home/CourseHome';
import { courseConfig } from '@/config/course.config';
import { buildLoIndex } from '@/lo/lo-index';
import { listLoSlugs, loadLo } from '@/lo/load-lo-disk';
import { loSlugsByFolder, sortLoFolders } from '@/lo/lo-slug';

const DIST_DIR = path.resolve(import.meta.dirname, '../dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');

/**
 * `renderToString`, not `renderToStaticMarkup`: static markup is documented as
 * non-hydratable, and these pages hydrate into the live app.
 */
function renderLoPage(template: string, loFolder: string): string {
  const lo = loadLo(loFolder);
  const appHtml = renderToString(
    <StrictMode>
      <App lo={lo} />
    </StrictMode>,
  );

  return buildPrerenderedHtml({
    template,
    appHtml,
    loFolder,
    title: lo.title,
    description: lo.description,
  });
}

/**
 * The landing page OVERWRITES `dist/index.html` — the very file being used as the
 * template. Safe because the template is read once, up front, into `template`; and
 * necessary because `/` is the course index, not a copy of the first LO.
 *
 * No `loFolder` goes on the root div: this page is not an LO, so `main.tsx` renders
 * the course index from it. Title and description come from `course.config.ts`.
 */
function renderLandingPage(template: string, loFolders: readonly string[]): string {
  const appHtml = renderToString(
    <StrictMode>
      <CourseHome lessons={buildLoIndex(loFolders, loadLo)} />
    </StrictMode>,
  );

  return buildPrerenderedHtml({
    template,
    appHtml,
    title: courseConfig.courseTitle,
    description: courseConfig.landingCopy.subheading ?? courseConfig.landingCopy.heading,
  });
}

let template: string;
try {
  template = readFileSync(TEMPLATE_PATH, 'utf-8');
} catch {
  throw new Error(`prerender: ${TEMPLATE_PATH} not found — run \`vite build\` first`);
}

// Slug the whole set BEFORE rendering anything, so a malformed folder name or a slug
// collision fails before any file is written. Course order (the folder ordinal) is
// applied here too, so the cards and the lesson nav follow the course.
const loFolders = sortLoFolders(listLoSlugs());
const slugsByFolder = loSlugsByFolder(loFolders);
if (slugsByFolder.size === 0) throw new Error('prerender: no LO folders found under lo-config/');

for (const [loFolder, slug] of slugsByFolder) {
  writeFileSync(path.join(DIST_DIR, `${slug}.html`), renderLoPage(template, loFolder), 'utf-8');
  // The build's only progress output — one line per generated page.
  process.stdout.write(`prerendered ${loFolder} → dist/${slug}.html\n`);
}

// LAST, deliberately: it replaces the template file, so every LO page is written
// from the untouched original first.
writeFileSync(TEMPLATE_PATH, renderLandingPage(template, loFolders), 'utf-8');
process.stdout.write(`prerendered course landing page → dist/index.html\n`);
