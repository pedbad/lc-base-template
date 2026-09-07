/**
 * asset-path.ts — guard c: no asset URL is built by hand (buildlist 21, spec §c).
 *
 * THE BUG CLASS. A course deploys under a NON-ROOT base (`…/french-basic/`) and serves
 * deeper slug routes (`…/french-basic/first-contact/`). A relative URL resolves against
 * the CURRENT PAGE, not the base — so it works on the landing page and 404s one level
 * in. That asymmetry is why it shipped TWICE in french-lo-1: #35 (runtime fetch, fixed
 * by `resolveAsset()`) and #28 (static `<head>` asset, fixed by `%BASE_URL%`). Vite
 * rewrites relative URLs inside PROCESSED assets (JS/CSS) but leaves static `<head>`
 * hrefs alone, which is why one fix could not cover both. Full write-up of #28:
 * `docs/process/FUTURE_PROJECTS.md` item 28.
 *
 * WHAT THIS GUARDS. Nothing is broken today — `src/lib/assets.ts` is the choke point and
 * every caller uses it. The rule "never build an asset URL by hand" lived only in a
 * comment, so the next author could write `src="audio/q1.mp3"`, watch all tests pass,
 * and ship a course whose audio 404s on every lesson page.
 *
 * THE MECHANISM IS A SOURCE SCAN, not a render check. A render check only sees pages a
 * test happens to render; a scan sees every file, including an engine nothing renders
 * yet. It is regex-based rather than AST-based deliberately: the sinks are a short,
 * stable list, and a guard has to be cheap enough that nobody minds it running.
 *
 * THE RULE. A violation is an ASSET-LOOKING STRING LITERAL sitting in a URL SINK. Both
 * halves matter, and the second half is what keeps the guard usable:
 *
 *   - Asset-looking = a known media/page extension, or a known asset directory prefix.
 *   - Sink = somewhere the value becomes a URL: a `src`/`href`/`poster`/`srcSet` JSX
 *     attribute, or an `AudioManager.play` / `new Audio` / `fetch` argument.
 *
 * Requiring a sink is what stops the guard flagging AUTHORED paths — the `audio:` and
 * `image:` values in LO JSON and showcase fixtures are DATA, are supposed to be bare,
 * and get resolved at render. A guard that fired on those would flag every fixture in
 * the repo and be switched off within a day, which is worse than no guard.
 *
 * A correct call needs no allow-list: `src={resolveAsset(x)}` is not a string literal,
 * so the literal patterns never match it.
 *
 * SCOPE. Shipped source only — `*.test.*` and `*.fixture.*` are skipped. Tests assert
 * on markup (`expect(html).toContain('src="…"')`) and fixtures are pure data; scanning
 * either produces noise about code no learner ever loads.
 *
 * COMMENTS ARE STRIPPED FIRST. Nothing in a comment is ever fetched, and this file's own
 * header would otherwise trip the guard by quoting the very example it warns about. The
 * stripper is string-aware — a naive one would mangle the `//` inside an `https://` URL
 * and either miss a violation or invent one.
 */
import { readdirSync } from 'node:fs';
import path from 'node:path';

/** JSX attributes whose value is fetched as a URL. */
const SINK_ATTRS = ['src', 'href', 'poster', 'srcSet'] as const;

/** Call expressions whose first argument is fetched as a URL. */
const SINK_CALLS = ['AudioManager.play', 'new Audio', 'fetch'] as const;

/** Extensions that make a string an asset or page reference. */
const ASSET_EXTENSIONS = [
  'mp3',
  'm4a',
  'wav',
  'mp4',
  'ogg',
  'oga',
  'webm',
  'svg',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'avif',
  'gif',
  'ico',
  'html',
  'json',
  'woff',
  'woff2',
  'vtt',
  'pdf',
] as const;

/** Directories under `public/` that hold authored assets. */
const ASSET_DIR_PREFIXES = ['audio/', 'images/', 'img/', 'fonts/', 'icons/'] as const;

/** Directory names never worth walking. */
const SKIPPED_DIRS = ['node_modules', 'dist', '.git'] as const;

/** One hand-built URL, located well enough to fix without searching. */
export interface AssetPathViolation {
  readonly file: string;
  readonly line: number;
  /** The sink that would have fetched it, e.g. `src` or `fetch`. */
  readonly sink: string;
  readonly value: string;
}

/** URLs that must pass through untouched — rewriting them would be the bug. */
function isExemptUrl(value: string): boolean {
  return (
    value === '' ||
    /^[a-z][a-z0-9+.-]*:/i.test(value) || // any scheme: http(s), data, mailto, tel, blob
    value.startsWith('//') || // protocol-relative
    value.startsWith('#') || // in-page anchor, incl. Footer's `#` placeholders
    value.startsWith('%BASE_URL%') // already base-rooted by Vite
  );
}

/** Whether a string reads as a path to an asset or a page, rather than arbitrary text. */
function looksLikeAssetPath(value: string): boolean {
  const bare = value.split(/[?#]/)[0] ?? '';
  const extension = bare.split('.').pop()?.toLowerCase() ?? '';
  if ((ASSET_EXTENSIONS as readonly string[]).includes(extension)) return true;
  const withoutLeadingSlash = bare.startsWith('/') ? bare.slice(1) : bare;
  return ASSET_DIR_PREFIXES.some((prefix) => withoutLeadingSlash.startsWith(prefix));
}

/**
 * Blank out comments, preserving every offset so line numbers stay truthful.
 *
 * Walks the source tracking string and template state, because `//` appears inside URLs
 * far more often than it starts a comment in this codebase.
 */
function stripComments(source: string): string {
  const out = source.split('');
  let index = 0;
  let quote = '';
  let inLine = false;
  let inBlock = false;

  const blankAt = (at: number): void => {
    if (out[at] !== '\n') out[at] = ' ';
  };

  while (index < source.length) {
    const char = source[index] ?? '';
    const next = source[index + 1] ?? '';

    if (inLine) {
      if (char === '\n') inLine = false;
      else blankAt(index);
      index += 1;
      continue;
    }
    if (inBlock) {
      if (char === '*' && next === '/') {
        blankAt(index);
        blankAt(index + 1);
        inBlock = false;
        index += 2;
        continue;
      }
      blankAt(index);
      index += 1;
      continue;
    }
    if (quote) {
      if (char === '\\') {
        index += 2;
        continue;
      }
      if (char === quote) quote = '';
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      index += 1;
      continue;
    }
    if (char === '/' && next === '/') {
      blankAt(index);
      blankAt(index + 1);
      inLine = true;
      index += 2;
      continue;
    }
    if (char === '/' && next === '*') {
      blankAt(index);
      blankAt(index + 1);
      inBlock = true;
      index += 2;
      continue;
    }
    index += 1;
  }

  return out.join('');
}

/** 1-based line number of an offset, for a message someone can act on. */
function lineAt(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

const attrPattern = new RegExp(
  // attr="v" | attr='v' | attr={"v"} | attr={'v'} | attr={`v`}
  String.raw`\b(${SINK_ATTRS.join('|')})\s*=\s*(?:\{\s*)?(["'\`])([^"'\`]*)\2`,
  'g',
);

const callPattern = new RegExp(
  String.raw`(${SINK_CALLS.map((c) => c.replace(/[.\s]/g, String.raw`\$&`)).join('|')})\s*\(\s*(["'\`])([^"'\`]*)\2`,
  'g',
);

/**
 * Every hand-built asset URL in one source file's text.
 *
 * @param source File contents.
 * @param file Label used in the violation, normally a repo-relative path.
 */
export function findRawAssetSinks(source: string, file = '<source>'): AssetPathViolation[] {
  const violations: AssetPathViolation[] = [];
  const code = stripComments(source);

  for (const pattern of [attrPattern, callPattern]) {
    pattern.lastIndex = 0;
    for (const match of code.matchAll(pattern)) {
      const [, sink, , value = ''] = match;
      if (isExemptUrl(value) || !looksLikeAssetPath(value)) continue;
      violations.push({
        file,
        line: lineAt(code, match.index ?? 0),
        sink: sink ?? '',
        value,
      });
    }
  }

  return violations.sort((a, b) => a.line - b.line);
}

/** `<link>` hrefs are NOT processed by Vite, so each must carry `%BASE_URL%` itself. */
const headLinkPattern = /<link\b[^>]*?\bhref\s*=\s*(["'])([^"']*)\1/g;

/**
 * Static `<head>` asset links that ignore the base path — anti-pattern #28.
 *
 * Only `<link>` is checked. A `<script type="module">` entry is rewritten by Vite
 * because Vite processes it, so requiring `%BASE_URL%` there would be wrong.
 */
export function findRelativeHeadAssets(html: string, file = '<html>'): AssetPathViolation[] {
  const violations: AssetPathViolation[] = [];

  for (const match of html.matchAll(headLinkPattern)) {
    const value = match[2] ?? '';
    if (isExemptUrl(value)) continue;
    violations.push({ file, line: lineAt(html, match.index ?? 0), sink: 'link', value });
  }

  return violations;
}

/** Shipped `.ts`/`.tsx` under `src/` — tests and fixtures excluded (see header). */
export function guardedSourceFiles(repoRoot: string): string[] {
  const found: string[] = [];

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!(SKIPPED_DIRS as readonly string[]).includes(entry.name)) {
          walk(path.join(dir, entry.name));
        }
        continue;
      }
      if (!/\.tsx?$/.test(entry.name)) continue;
      if (/\.(test|fixture)\./.test(entry.name)) continue;
      found.push(path.join(dir, entry.name));
    }
  };

  walk(path.join(repoRoot, 'src'));
  return found;
}
