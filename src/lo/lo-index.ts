/**
 * lo-index.ts — the COURSE index: every LO folder, in course order, reduced to what
 * a landing-page card needs (Phase D).
 *
 * An LO exists because its folder exists, and its card content is its own manifest —
 * `title` is the card heading, `description` the blurb, `image` the illustration.
 * Nothing here enumerates LOs by hand, and nothing re-authors what the manifest
 * already says.
 *
 * Pure, and reader-agnostic BY PARAMETER: the loader arrives as an argument, so the
 * one index builder serves both runtimes — `load-lo-disk` while prerendering under
 * Bun, `load-lo-glob` in the browser bundle (see assemble-lo.ts for why neither
 * mechanism spans both). Same order, same fields, defined once.
 *
 * Order is the `lo-NN-` folder ordinal and nothing else (decision B, 2026-08-06):
 * both readers hand back folders alphabetically, which puts `lo-10-` before `lo-9-`,
 * so the list is re-sorted numerically here rather than trusted as it arrives.
 */
import type { AssembledLo } from './assemble-lo';
import { loSlugsByFolder, sortLoFolders } from './lo-slug';

/** One LO as the landing page sees it: where it lives, and what its card says. */
export interface LoIndexEntry {
  /** The LO folder name (`lo-00-example`) — its identity, and what `loadLo` takes. */
  readonly folder: string;
  /** The URL slug (`example`), so the card can link at `<slug>.html`. */
  readonly slug: string;
  /** The manifest title — the card's heading. */
  readonly title: string;
  /** The manifest description — the card's blurb; absent when unauthored. */
  readonly description?: string;
  /** The manifest's author-relative image path; absent when unauthored. */
  readonly image?: string;
}

/** Load and validate one LO by folder name — `loadLo` from either reader. */
export type LoLoader = (folder: string) => AssembledLo;

/**
 * Build the course index from a set of LO folders.
 *
 * A malformed folder name, a slug collision, or a malformed LO throws — the whole
 * landing page fails loudly rather than quietly shipping a course with a lesson
 * missing from it, which nobody would notice.
 *
 * @param folders LO folder names under `lo-config/`, in any order
 * @param loadLo the reader for this runtime
 * @returns one entry per folder, in course order
 * @throws Error naming the offending folder or file
 */
export function buildLoIndex(
  folders: readonly string[],
  loadLo: LoLoader,
): readonly LoIndexEntry[] {
  const slugsByFolder = loSlugsByFolder(sortLoFolders(folders));

  return [...slugsByFolder].map(([folder, slug]) => {
    const lo = loadLo(folder);
    return {
      folder,
      slug,
      title: lo.title,
      ...(lo.description === undefined ? {} : { description: lo.description }),
      ...(lo.image === undefined ? {} : { image: lo.image }),
    };
  });
}
