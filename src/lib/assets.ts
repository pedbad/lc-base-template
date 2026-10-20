/**
 * assets.ts — resolve an authored asset path (audio, image) to a real URL.
 *
 * Authors reference assets with project-relative paths (e.g. "audio/q1.mp3" or
 * "/audio/q1.mp3"); this resolves them against Vite's `BASE_URL` so a course works
 * whether it is served from the domain root or a sub-path. Absolute `http(s)` URLs
 * pass through untouched. Mac-origin filenames are often NFD-normalized, so requests
 * are NFD-normalized to match the bytes on disk, then URI-encoded.
 *
 * This is the single choke point the asset-path guard (guard c, later step) will
 * point engines at — no engine should build asset URLs by hand.
 *
 * Ported from french-lo-1's utils/assets.js (typed; `resolveAssetHTML` dropped —
 * the template renders no rich-HTML content, so nothing needs it).
 */

/** Read Vite's BASE_URL defensively (undefined under non-Vite runners like `bun test`). */
const readBaseUrl = (): string => {
  const env = (import.meta as { env?: { BASE_URL?: string } }).env;
  return env?.BASE_URL ?? '/';
};

/**
 * The course landing page's URL: the app's base path itself, always ending in `/`.
 *
 * Its own choke point rather than `resolveAsset('')`, which short-circuits on an
 * empty path and would hand back `""` — an href that reloads the current page
 * instead of going home.
 */
export const resolveHomeHref = (): string => {
  const base = readBaseUrl();
  return base.endsWith('/') ? base : `${base}/`;
};

/** The page's own address, or undefined where there is no page (the prerender). */
const currentPageUrl = (): string | undefined =>
  typeof document === 'undefined' ? undefined : document.baseURI;

/**
 * The course's folder as a path, for keys two courses on one server must not share
 * (saved progress). An absolute base is that path already. A `./` build (the default:
 * one build for any folder) learns it from the page's address in the browser, and stays
 * `./` in the prerender, which has no address. The key it builds is never rendered, so
 * that difference cannot reach the markup.
 */
export const storageScope = (
  home: string = resolveHomeHref(),
  pageUrl: string | undefined = currentPageUrl(),
): string => {
  if (home.startsWith('/') || pageUrl === undefined) return home;
  return new URL(home, pageUrl).pathname;
};

/**
 * Resolve `path` to a URL served under the app's base path.
 * @param path Project-relative ("audio/q1.mp3") or root-relative ("/audio/q1.mp3")
 *   asset path, or an absolute `http(s)` URL (returned unchanged).
 */
export const resolveAsset = (path: string = ''): string => {
  if (!path) return path;
  // Absolute URLs are external — never rewrite them.
  if (/^https?:\/\//i.test(path)) return path;

  const base = readBaseUrl();
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  // Mac-origin asset names are often NFD; normalize requests to match on-disk files.
  const normalizedPathNfd = normalizedPath.normalize('NFD');

  // Already resolved against BASE_URL — just NFD-normalize and URI-encode.
  if (path.startsWith(normalizedBase)) return encodeURI(path.normalize('NFD'));
  return encodeURI(`${normalizedBase}${normalizedPathNfd}`);
};
