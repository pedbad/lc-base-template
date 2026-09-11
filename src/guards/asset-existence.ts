/**
 * asset-existence.ts — guard d: every authored asset path has a file behind it
 * (buildlist 22, spec §d).
 *
 * THE OTHER HALF OF GUARD C. Guard c proves a path is BUILT so it resolves at any page
 * depth; this proves the file is actually on disk. To a learner the two failures are
 * identical — an audio button that does nothing, an image that never appears — but the
 * causes are unrelated, so one guard cannot cover both. c catches a path that only
 * breaks once deployed under a sub-path; d catches a typo'd or never-added file, which
 * breaks everywhere including locally.
 *
 * WHAT COUNTS AS AN AUTHORED PATH. Values under a known asset KEY (`ASSET_KEYS`) in LO
 * config JSON or a showcase fixture. Keys, not string-shape: an author's prose can
 * easily read like a filename, and `title: "audio/x.mp3"` is a title, not a request.
 * Guard c makes the opposite call — it requires a URL SINK — because it is looking at
 * code building a URL, while this looks at data describing one. Same question, two
 * sides, and the answer differs on each.
 *
 * WHY BOTH UNICODE FORMS ARE ACCEPTED. Mac-authored filenames are usually NFD (an
 * accent stored as a separate codepoint), which is why `resolveAsset()` NFD-normalises
 * every request. A guard that only tried the author's literal spelling would fail an
 * accented filename that works perfectly in the browser, so both forms are tried.
 *
 * STALENESS IS THE REAL RISK HERE. A guard that collects by key silently passes if a
 * schema renames its field — it just finds nothing and reports success. The test
 * therefore asserts a floor on how many paths were found, so a rename fails loudly
 * rather than disabling the guard.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { SHOWCASE_FIXTURES } from '@/showcase/fixtures';

/**
 * Config keys whose value is an asset path resolved against `public/`.
 *
 * Adding an asset field to a schema means adding its key here. The repo sweep asserts
 * a minimum find count so that omission surfaces as a failure, not as silence.
 *
 * `src` is here because an image that carries alt text cannot be a bare string: the
 * outcomes block authors `image: { src, alt }`, and the walker only collects a STRING
 * sitting directly under an asset key. Without `src` the nested path is walked past
 * and the guard reports green having checked nothing — the precise staleness this
 * file's header warns about. Nothing else in `lo-config/` or the showcase fixtures
 * uses the key, so it collects exactly the paths intended.
 */
export const ASSET_KEYS = ['audio', 'image', 'src'] as const;

/** Directory names never worth walking. */
const SKIPPED_DIRS = ['node_modules', 'dist', '.git'] as const;

/** One authored path and where it was authored, so a failure needs no searching. */
export interface AuthoredAsset {
  /** Repo-relative JSON path, or `fixture:<id>` for a showcase fixture. */
  readonly source: string;
  readonly value: string;
}

/** An authored path with nothing behind it. */
export interface MissingAsset extends AuthoredAsset {
  /** Absolute path that was looked for, to make the failure obvious. */
  readonly expected: string;
}

/** Absolute URLs point at another server — never this repo's `public/`. */
function isExternal(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('//');
}

/**
 * Every asset path anywhere in a config tree, collected by key.
 *
 * @param value Any parsed JSON value or fixture config.
 */
export function collectAssetPaths(value: unknown, found: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectAssetPaths(entry, found));
    return found;
  }
  if (value === null || typeof value !== 'object') return found;

  for (const [key, entry] of Object.entries(value)) {
    const isAssetKey = (ASSET_KEYS as readonly string[]).includes(key);
    if (isAssetKey && typeof entry === 'string') {
      if (entry !== '' && !isExternal(entry)) found.push(entry);
      continue;
    }
    collectAssetPaths(entry, found);
  }
  return found;
}

/**
 * Which of `paths` have no file under `publicDir`.
 *
 * Both NFC and NFD spellings are tried — see the header on unicode normalisation.
 */
export function findMissingAssets(
  paths: readonly string[],
  publicDir: string,
  source = '<config>',
): MissingAsset[] {
  const missing: MissingAsset[] = [];

  for (const value of paths) {
    const relative = value.startsWith('/') ? value.slice(1) : value;
    const candidates = [relative, relative.normalize('NFD'), relative.normalize('NFC')];
    const expected = path.join(publicDir, relative);
    if (candidates.some((candidate) => existsSync(path.join(publicDir, candidate)))) continue;
    missing.push({ source, value, expected });
  }

  return missing;
}

/** Every `.json` under `lo-config/`, repo-relative. */
function loConfigFiles(repoRoot: string): string[] {
  const root = path.join(repoRoot, 'lo-config');
  const found: string[] = [];

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!(SKIPPED_DIRS as readonly string[]).includes(entry.name)) walk(full);
        continue;
      }
      if (entry.name.endsWith('.json')) found.push(full);
    }
  };

  if (existsSync(root)) walk(root);
  return found;
}

/**
 * Every authored asset path in the repo, from LO config on disk and from the showcase
 * fixtures, each tagged with where it came from.
 *
 * LO config is read with `readFileSync`, never through `load-lo-glob.ts` — that reader
 * uses `import.meta.glob`, which is Vite syntax and throws under a plain Node runner.
 */
export function authoredAssetPaths(repoRoot: string): AuthoredAsset[] {
  const authored: AuthoredAsset[] = [];

  for (const file of loConfigFiles(repoRoot)) {
    const source = path.relative(repoRoot, file);
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf-8'));
    for (const value of collectAssetPaths(parsed)) authored.push({ source, value });
  }

  for (const fixture of SHOWCASE_FIXTURES) {
    const source = `fixture:${fixture.id}`;
    for (const value of collectAssetPaths(fixture.config)) authored.push({ source, value });
  }

  return authored;
}
