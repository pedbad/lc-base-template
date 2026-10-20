/**
 * build-base.ts — the base path a build writes into its pages, decided in one place.
 *
 * `./` by default: every address in the built site is relative, so one build works
 * copied into any folder on any server (DEPLOY.md, step 4). `BASE_URL=/some/path/`
 * still fixes the address for anyone who wants it, as before.
 *
 * Read by `vite.config.ts` (the bundle) and by `resolveAsset()`'s fallback (the Bun
 * prerender, which sees BASE_URL only when it is set), so the two can never disagree.
 * Node-safe and alias-free, because `vite.config.ts` reaches it (AGENTS.md, hard
 * constraint 1).
 */

/** The base when BASE_URL is not set: relative, one build for any folder. */
export const DEFAULT_BASE = './';

/** BASE_URL when it names a path; `./` when it is unset or empty. */
export function buildBase(env: { BASE_URL?: string }): string {
  return env.BASE_URL || DEFAULT_BASE;
}

/**
 * The folder the browser tests serve the built site from (playwright.config.ts). A
 * fixed BASE_URL works only at that address, so it is served there. A `./` build works
 * anywhere, so SERVE_PATH picks the folder (CI uses a nested one), or `/`.
 */
export function servePath(env: { BASE_URL?: string; SERVE_PATH?: string }): string {
  const base = buildBase(env);
  const folder = base.startsWith('/') ? base : env.SERVE_PATH || '/';
  return folder.endsWith('/') ? folder : `${folder}/`;
}
