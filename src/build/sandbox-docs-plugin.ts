/**
 * sandbox-docs-plugin.ts — carries the rendered markdown docs into the sandbox bundle
 * as a virtual module (buildlist 18, spec §14).
 *
 * WHY A VIRTUAL MODULE. §14 requires the `.md` files to stay the single source, so the
 * sandbox must READ them rather than hold a copy. Three shapes were possible:
 *
 *   - `fetch('DESIGNER.md')` at runtime — needs the docs copied into `public/`, which is
 *     a second copy of the single source, and ships a markdown parser to the browser.
 *   - `import '../../DESIGNER.md?raw'` — no copy, but the raw text lands in the bundle
 *     and the parser still runs client-side.
 *   - THIS: render in Node at dev-server / build time and hand the page finished HTML.
 *     markdown-it stays a devDependency, no parser reaches the browser, and the same
 *     code path serves `bun run dev` and `bun run build`.
 *
 * WHY `addWatchFile` MATTERS. Without it the module has no inputs Vite knows about, so
 * editing `DESIGNER.md` leaves the sandbox showing the previous render until someone
 * restarts the dev server — a stale copy of the single source, which is the exact
 * failure §14 exists to prevent. The watcher below closes the same gap for the docs at
 * the repo root, which sit outside Vite's default watch scope.
 *
 * ALIAS-FREE: `vite.config.ts` imports this file, and the config is bundled before its
 * own `resolve.alias` exists.
 */
import path from 'node:path';
import type { Plugin } from 'vite';
import { readSandboxDocs, sandboxDocPaths } from './docs-markdown';

/** What the sandbox imports. */
export const SANDBOX_DOCS_MODULE_ID = 'virtual:sandbox-docs';

/** Rollup's convention for a module no file backs. */
const RESOLVED_ID = `\0${SANDBOX_DOCS_MODULE_ID}`;

/** Renders the docs hub's markdown into a virtual module. */
export function sandboxDocs(rootDir: string = path.resolve(import.meta.dirname, '../..')): Plugin {
  return {
    name: 'lc-sandbox-docs',

    resolveId(id) {
      return id === SANDBOX_DOCS_MODULE_ID ? RESOLVED_ID : undefined;
    },

    load(id) {
      if (id !== RESOLVED_ID) return undefined;
      // Registered on every load so a re-render after an edit re-registers them too.
      for (const file of sandboxDocPaths(rootDir)) this.addWatchFile(file);
      return `export const SANDBOX_DOC_PAGES = ${JSON.stringify(readSandboxDocs(rootDir))};`;
    },

    configureServer(server) {
      const docs = new Set(sandboxDocPaths(rootDir));
      server.watcher.add([...docs]);
      server.watcher.on('change', (file) => {
        if (!docs.has(path.resolve(file))) return;
        const virtualModule = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (virtualModule) server.moduleGraph.invalidateModule(virtualModule);
        // A full reload rather than an HMR update: the payload is a page of prose, and
        // nothing in the hub holds state worth preserving across an edit.
        server.ws.send({ type: 'full-reload' });
      });
    },
  };
}
