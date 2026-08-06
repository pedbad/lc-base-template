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
 */
const LO_FOLDER_PATTERN = /^lo-\d+-([a-z0-9]+(?:-[a-z0-9]+)*)$/;

/**
 * Derive the URL slug for an LO folder.
 *
 * @param folderName an LO folder name under `lo-config/`, e.g. `lo-00-example`
 * @returns the slug, e.g. `example`
 * @throws Error naming the folder when it is not `lo-<ordinal>-<kebab-slug>`
 */
export function loSlug(folderName: string): string {
  const match = LO_FOLDER_PATTERN.exec(folderName);
  if (match === null) {
    throw new Error(
      `lo-config/${folderName}: LO folder must be named lo-<ordinal>-<url-safe-kebab-slug>, e.g. lo-00-example`,
    );
  }
  return match[1];
}
