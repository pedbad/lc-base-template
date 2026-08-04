/**
 * load-lo-glob.ts — the BROWSER-side reader: `import.meta.glob` → `assembleLo`.
 *
 * Vite inlines every matched JSON at build time, so an LO reaches the page (dev
 * server and `vite build` alike) with no runtime fetch and no `node:fs`. This is the
 * reader the app uses; `load-lo-disk.ts` is its Node twin for tests and Part D's
 * pre-render (see assemble-lo.ts for why one mechanism cannot serve both).
 *
 * Globs are eager and root-absolute — `lo-config/` sits at the REPO root, not under
 * `src/`, and Vite resolves a leading `/` against the project root.
 *
 * Every LO in `lo-config/` is inlined, not just the requested one. That is the point:
 * the same bundle serves any slug, and later auto-discovery (spec §15) enumerates
 * them from these same maps.
 */
import { assembleLo, type AssembledLo, type LoFileTree } from './assemble-lo';

const MANIFESTS = import.meta.glob('/lo-config/*/lo.json', { eager: true, import: 'default' });
const BLOCKS = import.meta.glob('/lo-config/*/blocks/*/block.json', {
  eager: true,
  import: 'default',
});
const EXERCISES = import.meta.glob('/lo-config/*/exercises/*/exercise.json', {
  eager: true,
  import: 'default',
});

/**
 * Collect the part files belonging to `slug`, keyed by ref. Glob keys look like
 * `/lo-config/<slug>/<kind>/<ref>/<file>.json`, so the slug is segment 2 and the ref
 * is the second-to-last segment.
 */
function partsForSlug(
  parts: Record<string, unknown>,
  slug: string,
): Readonly<Record<string, unknown>> {
  const prefix = `/lo-config/${slug}/`;
  return Object.fromEntries(
    Object.entries(parts)
      .filter(([filePath]) => filePath.startsWith(prefix))
      .map(([filePath, raw]) => {
        const segments = filePath.split('/');
        return [segments[segments.length - 2], raw];
      }),
  );
}

/** Every LO folder name found under `lo-config/`, in glob (alphabetical) order. */
export function listLoSlugs(): readonly string[] {
  return Object.keys(MANIFESTS).map((filePath) => filePath.split('/')[2]);
}

/**
 * Load and validate one LO by folder name.
 *
 * @param slug the LO folder name, e.g. `lo-00-example`
 * @throws Error naming the offending file when the LO is missing or invalid
 */
export function loadLo(slug: string): AssembledLo {
  const manifest = MANIFESTS[`/lo-config/${slug}/lo.json`];
  if (manifest === undefined) {
    throw new Error(
      `lo-config/${slug}/lo.json not found — known LOs: ${listLoSlugs().join(', ') || '(none)'}`,
    );
  }

  const tree: LoFileTree = {
    manifest,
    blocks: partsForSlug(BLOCKS, slug),
    exercises: partsForSlug(EXERCISES, slug),
  };
  return assembleLo(slug, tree);
}
