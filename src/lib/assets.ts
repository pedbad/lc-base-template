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
