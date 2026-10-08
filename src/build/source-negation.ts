/**
 * source-negation.ts — keeping `index.css`'s `@source not` list honest.
 *
 * THE PROBLEM IT EXISTS FOR. Rollup and Tailwind disagree about what a file is worth.
 * Rollup follows the import graph, so a component nothing imports costs nothing in JS.
 * Tailwind v4 auto-detects its sources (this repo's `index.css` is a bare
 * `@import 'tailwindcss'` with no `@source`), which means it SCANS FILES ON DISK and
 * ignores the import graph entirely — so the same component still emits every utility
 * its class strings mention. Measured at §D5: the eleven unimported shadcn wrappers in
 * `src/components/ui/` were generating 5.30 kB gzipped of CSS that styled nothing.
 * `@source not "…"` removes a path from the scan while leaving the file on disk, which
 * is what keeps the vendored wrappers available without shipping their CSS.
 *
 * WHY THAT NEEDS A CHECK. The list is a SECOND place recording which wrappers are
 * unused, and every first place has already gone stale: §D5 said seven dead files when
 * there were eleven, §D3 said three stylesheets when there were seven, the TODO header
 * said 1007 tests when there were 1008. Each was written correctly and then left behind
 * by a later commit. This list would rot the same way — except rotting here is not
 * cosmetic. Negate a file, then import it, and Tailwind never emits its utilities: the
 * build succeeds, the suite passes, and the component renders unstyled in a browser.
 * There is no error to notice. That is precisely the failure a test has to convert into
 * a red one.
 *
 * WHY IT IS NOT IN `src/guards/`. That folder means "the eight spec guards" and
 * `bun run guards` is that glob. This is a staleness check over a config list, not a
 * clause of spec §17/§136/§138 — the same reasoning that put the docs-freshness test in
 * `src/docs/` rather than making the guard count read as nine. It still runs in
 * `bun run test`, which is the gate.
 *
 * WHY THE DEADNESS WALK IS A FIXED POINT AND NOT A GREP. "Has no importer" is the wrong
 * question, and answering it by grep is exactly how the earlier count reached seven:
 * `sidebar.tsx` has zero importers AND is the only importer of `tooltip`, `sheet`,
 * `separator` and `skeleton`, so all five are dead together. Use has to be traced back
 * to something OUTSIDE the wrapper folder, so the walk starts from app code and grows
 * the live set until it stops growing.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. It does not resolve TypeScript modules properly —
 * it matches import specifiers textually. Every wrapper import in this repo is the
 * aliased `@/components/ui/<name>` form (checked), and relative sibling forms are
 * matched too so a future `./sheet` inside the folder is not read as "unused". A real
 * resolver would be a dependency and a lot of machinery for one folder of flat modules.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { stripComments } from '../guards/asset-path';

/** Repo-relative folder holding the vendored shadcn wrappers. */
export const UI_DIR = 'src/components/ui';

/** Directory names never worth walking, matching the other source readers here. */
const SKIPPED_DIRS = ['node_modules', 'dist', '.git'] as const;

/** Extensions that can carry an import. */
const SOURCE_EXTENSIONS = ['.ts', '.tsx'];

/**
 * Colocated tests, which are NOT use.
 *
 * Two reasons, and the second is why this is in the pure function rather than the
 * reader. On the merits: a wrapper imported only by its own test still ships to nobody,
 * so counting that as use would keep dead CSS alive forever behind a test that exists to
 * describe it. In practice: this module's OWN test carries import statements as fixture
 * STRINGS, and the first run read them as real imports — `sidebar` went live off a
 * fixture and took `sheet`, `tooltip`, `separator` and `skeleton` with it transitively.
 * The walk was right; its input was poisoned.
 */
const TEST_FILE_RE = /\.test\.tsx?$/;

/** One file the walk reads: its repo-relative path and its text. */
export interface SourceFile {
  readonly path: string;
  readonly text: string;
}

/** Repo root, resolved from this module rather than from the process cwd. */
function repoRoot(): string {
  return path.resolve(import.meta.dirname, '..', '..');
}

/** Every wrapper module name in `src/components/ui`, without its extension. */
export function readUiModules(rootDir: string = repoRoot()): string[] {
  return readdirSync(path.join(rootDir, UI_DIR))
    .filter((name) => name.endsWith('.tsx'))
    .map((name) => name.replace(/\.tsx$/, ''))
    .sort();
}

/** Every `.ts`/`.tsx` file under `src/`, as path + text. */
export function readAppSources(rootDir: string = repoRoot()): SourceFile[] {
  const out: SourceFile[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRS.includes(entry.name as (typeof SKIPPED_DIRS)[number])) {
          walk(path.join(dir, entry.name));
        }
        continue;
      }
      if (!SOURCE_EXTENSIONS.includes(path.extname(entry.name))) continue;
      const full = path.join(dir, entry.name);
      out.push({
        path: path.relative(rootDir, full).split(path.sep).join('/'),
        text: readFileSync(full, 'utf8'),
      });
    }
  };
  walk(path.join(rootDir, 'src'));
  return out;
}

/** The stylesheet holding the negation list. */
export function readIndexCss(rootDir: string = repoRoot()): string {
  return readFileSync(path.join(rootDir, 'src/index.css'), 'utf8');
}

/** Drop `/* … *\/` blocks so a commented-out directive does not read as live. */
function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * The ui module names named by `@source not` directives.
 *
 * A bare `@source` ADDS a path and is ignored — reading one as a negation would invert
 * its meaning — as is any negation pointing outside the wrapper folder.
 */
export function parseSourceNegations(css: string): string[] {
  const pattern = /@source\s+not\s+['"]([^'"]+)['"]/g;
  const found: string[] = [];
  for (const match of stripCssComments(css).matchAll(pattern)) {
    const hit = /(?:^|\/)components\/ui\/([A-Za-z0-9_-]+)\.tsx$/.exec(match[1]);
    if (hit) found.push(hit[1]);
  }
  return found.sort();
}

/**
 * Whether `text` imports the wrapper `moduleName` by any specifier form used here.
 *
 * COMMENTS ARE STRIPPED FIRST, which is load-bearing rather than tidy. `LessonRail.tsx`
 * carries the §D7 rejection note — "importing `@/components/ui/sidebar` in
 * collapsible=icon mode took main-*.js from 96.83 kB to 117.89 kB" — in a doc comment.
 * Read literally that is an import, and believing it would mark `sidebar` live and drop
 * five wrappers from the dead set. Today's wording uses backticks and would slip past a
 * quote-anchored match anyway; the stripper is here so a future rewording cannot turn a
 * comment into a silent 5.30 kB regression. Guards c, f and g all turn on the same
 * point, so the stripper is REUSED from guard c rather than rewritten.
 */
function importsUiModule(rawText: string, moduleName: string): boolean {
  const text = stripComments(rawText);
  const name = moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const specifier = String.raw`(?:@/components/ui/${name}|(?:\.{1,2}/)+(?:components/ui/)?${name})`;
  return new RegExp(String.raw`['"]${specifier}(?:\.tsx?)?['"]`).test(text);
}

/**
 * Which wrappers nothing outside the wrapper folder reaches, directly or transitively.
 *
 * Grows the LIVE set to a fixed point rather than asking "who imports this": a wrapper
 * imported only by another dead wrapper is itself dead, which is the case a direct-
 * importer count gets wrong.
 */
export function findUnusedUiModules(input: {
  uiModules: readonly string[];
  sources: readonly SourceFile[];
  /**
   * Repo-relative folders (`src/sandbox/`) that index.css ITSELF keeps out of the main
   * scan. An import there is not use, for the same reason a test's is not: the main
   * sheet never sees that file, so it cannot need the wrapper's classes. The debug
   * pages load `debug.css`, which scans every wrapper, so they keep their styles.
   * Narrowed 2026-10-08, when the sandbox's Images section became badge's only
   * importer and would otherwise have put badge's classes in main-*.css.
   */
  unscannedDirs?: readonly string[];
}): string[] {
  const { uiModules, sources, unscannedDirs = [] } = input;
  const uiPath = (name: string): string => `${UI_DIR}/${name}.tsx`;
  const appSources = sources.filter(
    (file) =>
      !TEST_FILE_RE.test(file.path) &&
      !unscannedDirs.some((dir) => file.path.startsWith(dir)) &&
      !uiModules.some((name) => file.path === uiPath(name)),
  );

  const live = new Set<string>();
  for (const name of uiModules) {
    if (appSources.some((file) => importsUiModule(file.text, name))) live.add(name);
  }

  for (let grew = true; grew; ) {
    grew = false;
    for (const name of uiModules) {
      if (live.has(name)) continue;
      const importedByLive = [...live].some((liveName) => {
        const file = sources.find((candidate) => candidate.path === uiPath(liveName));
        return file !== undefined && importsUiModule(file.text, name);
      });
      if (importedByLive) {
        live.add(name);
        grew = true;
      }
    }
  }

  return uiModules.filter((name) => !live.has(name)).sort();
}

/** The FOLDERS index.css's `@source not` lines remove (files aside), as `src/…/` prefixes. */
export function unscannedDirsFrom(css: string): string[] {
  const paths = [...stripCssComments(css).matchAll(/@source\s+not\s+["']([^"']+)["']/g)].map(
    (match) => match[1] ?? '',
  );
  return paths
    .filter((entry) => entry !== '' && !/\.[a-z]+$/i.test(entry))
    .map((entry) => path.posix.join('src', entry).replace(/\/?$/, '/'));
}
