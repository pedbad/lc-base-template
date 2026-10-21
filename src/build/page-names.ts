/**
 * page-names.ts — the HTML pages the course writes for itself, and the check that no
 * lesson page lands on one of them (review 2026-10-21, concern 2).
 *
 * THE BUG. A lesson's page is `<slug>.html` at the site root, beside the course's own
 * pages. `lo-01-index` wrote `dist/index.html`, and the prerender then overwrote it with
 * the course home, so the lesson vanished with no error. Git saw nothing: the clash is
 * between OUTPUT files, not source files. A lesson named after a debug page would
 * overwrite that page the same way in a `DEBUG=1` build.
 *
 * THE RULE. The names below are reserved whether or not this build emits the debug
 * pages, so a lesson that works today does not break the day someone builds with
 * `DEBUG=1`. `loSlugsByFolder()` rejects them, and the dev server and the prerender
 * both go through it. The prerender then compares its planned lesson pages with the
 * files Vite actually wrote (a `public/*.html` too) before writing any page.
 *
 * Pure data and string work, with no imports at all: `lo-slug.ts` reads it from the
 * browser bundle, and `build-entries.ts` from `vite.config.ts`, which bans `@/…` imports.
 */

/** Rollup input name → root-level HTML file, for every debug entry (AGENTS.md rule 6). */
export const DEBUG_ENTRY_FILES = {
  showcase: 'exercise-showcase.html',
  sandbox: 'debug-sandbox.html',
  ui: 'ui-showcase.html',
  style: 'code-style.html',
} as const;

/** The course home: Vite's entry, replaced by the prerendered landing page. */
const HOME_PAGE_FILE = 'index.html';

/** Every page name a lesson folder may not derive, without `.html`. */
export const RESERVED_PAGE_SLUGS: readonly string[] = [
  HOME_PAGE_FILE,
  ...Object.values(DEBUG_ENTRY_FILES),
].map((file) => file.replace(/\.html$/, ''));

/**
 * Lesson pages that would overwrite a file: one already in the output, or one planned
 * twice. Empty means every lesson page can be written.
 *
 * @param lessonFiles the lesson pages about to be written, e.g. `example.html`
 * @param existingFiles the files already at the output root
 */
export function findPageCollisions(
  lessonFiles: readonly string[],
  existingFiles: readonly string[],
): readonly string[] {
  const taken = new Set(existingFiles);
  return lessonFiles.filter((file) => {
    if (taken.has(file)) return true;
    taken.add(file);
    return false;
  });
}
