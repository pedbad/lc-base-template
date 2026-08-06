/**
 * lo-folders.ts — where LOs live on disk, and which folders are there.
 *
 * Split out of `load-lo-disk.ts` deliberately (Phase D, decision A revised): the dev
 * server plugin (`src/build/lo-dev-pages.ts`) needs the folder LIST, and that plugin
 * is imported by `vite.config.ts`. The config is bundled before its own
 * `resolve.alias` exists, so anything it reaches must be free of `@/…` imports — which
 * `load-lo-disk` is not, since `assembleLo` pulls in the schemas by alias.
 *
 * So this module holds only what both need, with `node:fs` as its single dependency:
 * no Zod, no aliases, nothing that assumes a bundler. `load-lo-disk` re-exports
 * `listLoSlugs` from here, so there is still ONE implementation of "which LOs exist"
 * and no second copy to drift.
 */
import { readdirSync } from 'node:fs';
import path from 'node:path';

/** Repo-root `lo-config/`, resolved from this file so the cwd is irrelevant. */
export const LO_CONFIG_DIR = path.resolve(import.meta.dirname, '../../lo-config');

/**
 * Every LO folder name under `lo-config/`, alphabetically.
 *
 * Alphabetical is the READ order, not the course order — `lo-10-` sorts before `lo-9-`
 * here. `sortLoFolders()` (lo-slug.ts) is what puts them in course order, and every
 * consumer that shows LOs to a reader goes through it.
 */
export function listLoSlugs(): readonly string[] {
  return readdirSync(LO_CONFIG_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}
