/**
 * lo-slug.ts — LO folder name → URL slug (design spec §15).
 *
 * An LO folder carries an ordinal prefix so authoring order is visible on disk
 * (`lo-00-example`, `lo-01-salutations`); the URL drops it (`example.html`). The
 * folder name stays the single source of truth for identity — the slug is derived,
 * never authored, so it can't drift from the folder it names.
 *
 * Pure string work, no I/O: the Part D prerender pass calls this for every folder
 * `listLoSlugs()` returns, and it must be testable without touching disk.
 */

/**
 * `lo-` + ordinal + `-` + a url-safe kebab-case slug. The slug pattern matches
 * `SECTION_ID_PATTERN` in lo-schema.ts for the same reason: it becomes a URL.
 * Both captures are used: group 1 is the ordinal (course order), group 2 the slug.
 */
const LO_FOLDER_PATTERN = /^lo-(\d+)-([a-z0-9]+(?:-[a-z0-9]+)*)$/;

/** Match `folderName` or throw naming it the way the author sees it on disk. */
function matchLoFolder(folderName: string): RegExpExecArray {
  const match = LO_FOLDER_PATTERN.exec(folderName);
  if (match === null) {
    throw new Error(
      `lo-config/${folderName}: LO folder must be named lo-<ordinal>-<url-safe-kebab-slug>, e.g. lo-00-example`,
    );
  }
  return match;
}

/**
 * Derive the URL slug for an LO folder.
 *
 * @param folderName an LO folder name under `lo-config/`, e.g. `lo-00-example`
 * @returns the slug, e.g. `example`
 * @throws Error naming the folder when it is not `lo-<ordinal>-<kebab-slug>`
 */
export function loSlug(folderName: string): string {
  return matchLoFolder(folderName)[2];
}

/**
 * Derive the course-order ordinal for an LO folder.
 *
 * @param folderName an LO folder name under `lo-config/`, e.g. `lo-01-greetings`
 * @returns the ordinal as a NUMBER, e.g. 1
 * @throws Error naming the folder when it is not `lo-<ordinal>-<kebab-slug>`
 */
export function loOrdinal(folderName: string): number {
  return Number(matchLoFolder(folderName)[1]);
}

/**
 * Order LO folders the way the course runs: by ordinal, ties broken by folder name.
 *
 * The ordinal in the folder name is the SINGLE source of truth for course order
 * (decision B, 2026-08-06) — there is no second list in `course.config.ts` to drift
 * from it. Sorting is NUMERIC, not the alphabetical order `readdirSync` and
 * `import.meta.glob` hand back: alphabetically `lo-10-` sorts before `lo-9-`, which
 * would silently reorder any course that does not zero-pad past nine.
 *
 * Returns a new array; the caller's is untouched.
 *
 * @throws Error naming the folder when any name is malformed
 */
export function sortLoFolders(folderNames: readonly string[]): readonly string[] {
  // Ordinals are read up front so a malformed name throws before any comparison,
  // and so each name is parsed once rather than once per comparison.
  const ordinals = new Map(folderNames.map((name) => [name, loOrdinal(name)]));

  return [...folderNames].sort(
    (a, b) => (ordinals.get(a) ?? 0) - (ordinals.get(b) ?? 0) || a.localeCompare(b),
  );
}

/**
 * Slug every LO folder at once, in the order given, rejecting a collision.
 *
 * The ordinal is what distinguishes `lo-00-example` from `lo-01-example` on disk, and
 * the slug drops it — so two folders CAN name the same page. Silently, that is one LO
 * overwriting another's HTML; hence the check lives here, where the whole set is
 * visible, rather than in the caller that writes the files.
 *
 * @throws Error naming both offenders on a collision, or the malformed folder
 */
export function loSlugsByFolder(folderNames: readonly string[]): ReadonlyMap<string, string> {
  const byFolder = new Map<string, string>();
  const folderBySlug = new Map<string, string>();

  for (const folderName of folderNames) {
    const slug = loSlug(folderName);
    const claimed = folderBySlug.get(slug);
    if (claimed !== undefined) {
      throw new Error(
        `lo-config/${claimed} and lo-config/${folderName} both derive the slug "${slug}" — they would write the same ${slug}.html. Rename one.`,
      );
    }
    folderBySlug.set(slug, folderName);
    byFolder.set(folderName, slug);
  }

  return byFolder;
}
