/**
 * load-lo-disk.ts — the NODE-side reader: `node:fs` → `assembleLo`.
 *
 * Same LO, same validation, same output as `load-lo-glob.ts`; only the I/O differs.
 * Two readers exist because neither mechanism spans both runtimes (verified
 * 2026-08-04 — see assemble-lo.ts): `import.meta.glob` is Vite-only syntax, and
 * `node:fs` is absent from a browser bundle.
 *
 * This reader is for Node contexts: the on-disk tests, and Part D's post-build
 * `renderToStaticMarkup` pass over every LO folder. NEVER import it from anything the
 * browser bundle reaches — `load-lo-glob.ts` is the app's reader.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { assembleLo, type AssembledLo, type LoFileTree } from './assemble-lo';

/** Repo-root `lo-config/`, resolved from this file so the cwd is irrelevant. */
const LO_CONFIG_DIR = path.resolve(import.meta.dirname, '../../lo-config');

const readJson = (filePath: string): unknown => JSON.parse(readFileSync(filePath, 'utf-8'));

/**
 * Read every part of one kind, keyed by ref (the sub-folder name). A missing kind
 * folder is normal — an LO may have blocks and no exercises, or the reverse — so it
 * yields an empty map; assembleLo is what rejects a ref with no file behind it.
 */
function readParts(
  loDir: string,
  kind: 'blocks' | 'exercises' | 'modals',
): Record<string, unknown> {
  const kindDir = path.join(loDir, kind);
  if (!existsSync(kindDir)) return {};

  // Each kind's folder holds one file per ref, named for the kind (singularised).
  const FILE_NAMES = { blocks: 'block.json', exercises: 'exercise.json', modals: 'modal.json' };
  const fileName = FILE_NAMES[kind];
  return Object.fromEntries(
    readdirSync(kindDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => [entry.name, path.join(kindDir, entry.name, fileName)])
      .filter(([, filePath]) => existsSync(filePath))
      .map(([ref, filePath]) => [ref, readJson(filePath)]),
  );
}

/** Every LO folder name under `lo-config/`, alphabetically. */
export function listLoSlugs(): readonly string[] {
  return readdirSync(LO_CONFIG_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

/**
 * Load and validate one LO by folder name, from disk.
 *
 * @param slug the LO folder name, e.g. `lo-00-example`
 * @throws Error naming the offending file when the LO is missing or invalid
 */
export function loadLo(slug: string): AssembledLo {
  const loDir = path.join(LO_CONFIG_DIR, slug);
  const manifestPath = path.join(loDir, 'lo.json');
  if (!existsSync(manifestPath)) {
    throw new Error(
      `lo-config/${slug}/lo.json not found — known LOs: ${listLoSlugs().join(', ') || '(none)'}`,
    );
  }

  const tree: LoFileTree = {
    manifest: readJson(manifestPath),
    blocks: readParts(loDir, 'blocks'),
    exercises: readParts(loDir, 'exercises'),
    modals: readParts(loDir, 'modals'),
  };
  return assembleLo(slug, tree);
}
