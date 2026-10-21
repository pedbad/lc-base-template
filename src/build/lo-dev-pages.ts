/**
 * lo-dev-pages.ts — serve each LO's page on the DEV server (Phase D, decision A
 * revised 2026-08-06).
 *
 * THE PROBLEM. `<slug>.html` files are written by the post-build prerender pass, so
 * under `bun run dev` they do not exist. Vite's SPA fallback answers a request for a
 * missing `.html` with `index.html` — which is the UNSTAMPED landing template — so
 * clicking a lesson card in dev silently re-rendered the landing page. Not a 404: no
 * error, no clue, just a card that appeared to do nothing.
 *
 * THE FIX. A serve-only middleware: a GET for `/<slug>.html`, where `<slug>` is one an
 * LO folder actually derives, is answered with the dev `index.html` — run through
 * Vite's own transform, so HMR and the React refresh preamble are intact — with that
 * LO's folder stamped on the root div. `main.tsx` then renders that LO, exactly as it
 * does on a built page.
 *
 * WHY THIS IS NOT A THIRD RENDERING PATH (the objection that first ruled it out):
 * nothing is rendered here. The middleware picks a folder and calls `injectRootDiv()`
 * — the same function the prerender pass uses for the same purpose — so there is one
 * implementation of "how an LO page is mounted" and dev cannot disagree with the build
 * about it. The list of LOs is read from disk PER REQUEST, so there is no entry list
 * to keep in sync: add a folder and its page is live on the next reload.
 *
 * IT DOES VALIDATE (review 2026-10-21, concern 1). Before stamping, the middleware loads
 * the LO through `load-lo-disk.ts`, the reader the prerender uses, so a bad exercise
 * fails the dev page with the same message, naming the file and the field, that fails
 * the build. It is loaded through `server.ssrLoadModule`, by path, never imported: that
 * reader reaches the schemas by `@/…` alias, which this file cannot import (below).
 *
 * WHAT DEV STILL DOES NOT DO: it does not prerender. A dev LO page arrives with an
 * empty root div and is client-rendered, so the dev server proves content, layout and
 * behaviour — not the no-JS static page. That is what `bun run build && bun run
 * preview` is for, and it stays the check before shipping.
 *
 * Node-side reader by requirement: `load-lo-disk.ts`, never `load-lo-glob.ts` —
 * `import.meta.glob` is Vite syntax and throws under the config's own runtime.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { injectRootDiv } from './prerender-html';
// RELATIVE imports, and deliberately the two LEANEST modules that answer "which LOs
// exist" and "what is this folder's slug": vite.config.ts imports this file, and the
// config is bundled before its own `resolve.alias` exists, so anything reached from
// here must be free of `@/…` imports. `load-lo-disk` is not — `assembleLo` pulls the
// schemas in by alias — hence `lo-folders.ts`, which it re-exports from.
import { listLoSlugs } from '../lo/lo-folders';
import { loSlugsByFolder, sortLoFolders } from '../lo/lo-slug';

/** The Node LO reader, by its project path: loaded by Vite, so its `@/…` imports resolve. */
const LOAD_LO_DISK_MODULE = '/src/lo/load-lo-disk.ts';

/** The one export the middleware calls on that module. */
interface LoDiskReader {
  loadLo: (folder: string) => unknown;
}

/** A page lives at the root of the site: `/example.html`, never `/nested/example.html`. */
const LO_PAGE_PATH_PATTERN = /^\/([a-z0-9]+(?:-[a-z0-9]+)*)\.html$/;

/**
 * Which LO folder, if any, renders the page at `pathname`.
 *
 * Base-relative: the caller strips the dev server's base first, so this sees `/x.html`
 * whether the course is served from `/` or `/course/`.
 *
 * @param pathname a request path with no query or hash
 * @param loFolders LO folder names under `lo-config/`
 * @returns the folder whose slug matches, or undefined — undefined means "not ours",
 *   so the request falls through to the middleware that owns it (a real 404 included)
 * @throws Error naming the folder when an LO folder name is malformed, or its slug is
 *   taken by another folder or by one of the course's own pages
 */
export function devLoFolderForPath(
  pathname: string,
  loFolders: readonly string[],
): string | undefined {
  const match = LO_PAGE_PATH_PATTERN.exec(pathname);
  if (pathname !== '/' && match === null) return undefined;

  // The build's own check on the whole set, on every page request: a duplicate slug or
  // one of the course's own page names (`index`, a debug page) fails here, naming the
  // folder, instead of only when someone runs `bun run build`. Reserved slugs never
  // reach the map, so `/index.html` stays Vite's own landing page.
  const slugsByFolder = loSlugsByFolder(loFolders);
  if (match === null) return undefined;

  const slug = match[1];
  return [...slugsByFolder].find(([, folderSlug]) => folderSlug === slug)?.[0];
}

/**
 * The dev-server plugin. Its middleware runs only under `vite` (configureServer); the
 * build has the prerender pass for pages. On `vite build` it does one thing: check
 * the lesson folders' page names in `buildStart`, before Vite writes any output, so a
 * lesson named `index` or after a debug page stops the build before `dist/` is touched
 * (review 2026-10-21). The prerender checks again; this is the earlier of the two.
 */
export function loDevPages(): Plugin {
  let isBuild = false;
  return {
    name: 'lc-lo-dev-pages',
    config(_config, { command }) {
      isBuild = command === 'build';
    },
    buildStart() {
      if (isBuild) loSlugsByFolder(sortLoFolders(listLoSlugs()));
    },
    configureServer(server) {
      // Registered inside configureServer (not in a returned function), so it runs
      // BEFORE Vite's internal middlewares — the SPA fallback would otherwise take
      // the request first and hand back the landing page.
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();

        const url = req.url ?? '/';
        const pathname = url.split(/[?#]/)[0];
        const { base } = server.config;
        const basePath = pathname.startsWith(base) ? `/${pathname.slice(base.length)}` : pathname;

        let loFolder: string | undefined;
        try {
          loFolder = devLoFolderForPath(basePath, listLoSlugs());
        } catch (error) {
          // A malformed folder name fails the build; failing the dev request the same
          // way is how an author meets it early, with the folder named.
          return next(error);
        }
        if (loFolder === undefined) return next();
        const folder = loFolder;

        const template = readFileSync(path.resolve(server.config.root, 'index.html'), 'utf-8');
        server
          .ssrLoadModule(LOAD_LO_DISK_MODULE)
          .then((reader) => {
            // Throws naming the file on any invalid part, exactly as the build would.
            (reader as LoDiskReader).loadLo(folder);
            return server.transformIndexHtml(url, template, req.originalUrl);
          })
          .then((transformed) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            res.end(injectRootDiv(transformed, { loFolder: folder }));
          })
          .catch(next);
      });
    },
  };
}
