/**
 * render-mirror.ts — guard b: folder name ↔ manifest contents agree
 * (buildlist 20, spec §b).
 *
 * THE BUG CLASS. An LO exists because its FOLDER exists. Its page structure exists
 * because `lo.json` NAMES it — sections, and within each section `blocks[]` and
 * `exercises[]` by folder ref, plus a top-level `modals[]`. That is two independent
 * registries for the same content, so they can drift apart two ways, both silent:
 *
 *   1. The manifest names a ref with no folder (or a folder with no `block.json`)
 *      behind it → the loader has nothing to render and the section comes out short,
 *      with nothing on the page to say why.
 *   2. A folder exists that the manifest never names → the author writes an exercise,
 *      it is valid, it parses, and it simply never appears. This is the nastier one:
 *      nothing fails, so the author assumes the mistake is somewhere else.
 *
 * `assembleLo` already throws on direction 1 — but only for an LO something actually
 * loads, and only once the build or a dev request reaches it. Direction 2 is checked
 * NOWHERE. Guard b makes both a suite failure over every LO folder on disk.
 *
 * THE RULE. For each LO folder, per kind, build two sets and report the symmetric
 * difference:
 *
 *   REFERENCED = the refs `lo.json` names.
 *   PRESENT    = the sub-folders of `blocks/`, `exercises/`, `modals/`.
 *
 *   referenced − present  → `missing`      (also a present folder holding no config)
 *   present    − referenced → `unreferenced`
 *
 * WHY THE SIGNAL IS A SET DIFF, not a pattern. Guard c reads CODE building a URL, so
 * its signal is a URL sink; guard d reads DATA describing one, so its signal is the
 * key. Guard b compares structure on disk against structure in JSON, where neither
 * side is suspicious on its own — a ref is only wrong RELATIVE to the folders, and a
 * folder only wrong relative to the refs. Nothing here can be decided by looking at
 * one file.
 *
 * AN UNREFERENCED FOLDER IS AN ERROR, NOT A WARNING. It is the case for leniency —
 * an author may be part-way through drafting an exercise — and the call still goes
 * the other way, for three reasons:
 *
 *   - The repo already decided this. `modals[]` is declared in the manifest rather
 *     than discovered by globbing the folder precisely so that "an undeclared file is
 *     then a detectable authoring mistake instead of silently-live content"
 *     (lo-schema.ts, decision D1). Sections are declared for the same reason. A guard
 *     that only warned would leave that decision unenforced.
 *   - A warning in a Vitest suite has no reader. CI is pass or fail; a `console.warn`
 *     scrolls past in a green run and is seen by nobody, which is the same silence
 *     the guard exists to break.
 *   - The drafting escape hatch already exists and is cheaper than a folder prefix
 *     convention: declare the ref. A declared block in a closed accordion is one line
 *     of `lo.json`, and it is how the author sees their draft render. Leaving it
 *     undeclared and out of git is the other option. Neither needs the guard relaxed.
 *
 * WHY THE NAMING HALF LIVES HERE. `lo-NN-<slug>` is the ONLY source of course order
 * (decision B, 2026-08-06) — there is no second list to check it against. It is
 * already enforced loudly, not silently: `loOrdinal()` throws, so `buildLoIndex()`,
 * `sortLoFolders()` and the dev-page plugin all fail on a malformed folder. What was
 * missing is WHEN. Every one of those paths runs the build or serves a request; NO
 * test asserts that the folders on disk are nameable, so a malformed folder survives
 * a green `bun run test` and dies at `bun run build`. It belongs in guard b because
 * it is the precondition for guard b's own folder half — you cannot ask where an LO
 * sits in the course if its name will not parse — and because it moves the failure to
 * the cheapest place it can happen.
 *
 * The pattern itself is NOT re-implemented here. `loSlug()` owns it (lo-slug.ts) and
 * is called through; a copy of the regex would be a second contract to drift.
 *
 * STALENESS IS THE FAILURE MODE TO DESIGN AGAINST. Guard d's lesson: a guard that
 * collects by name passes silently once a schema field is renamed — it finds nothing
 * and reports success, which is worse than no guard because it is trusted. So the
 * manifest is read DEFENSIVELY (a reshape yields empty sets, never a crash) and the
 * test asserts a floor on how many LOs, refs and folders were found, so a reshape
 * fails loudly instead of switching the guard off.
 *
 * The manifest is read raw rather than through `LoManifestSchema` for the same
 * one-concern reason: a manifest that fails its schema is guard a's failure to
 * report, and guard b should still be able to state its own finding rather than
 * depend on guard a passing first.
 *
 * Node reader only — `readFileSync`, never `load-lo-glob.ts`, whose
 * `import.meta.glob` is Vite syntax and throws under a plain Node runner.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { LO_CONFIG_DIR, listLoSlugs } from '@/lo/lo-folders';
import { loSlug } from '@/lo/lo-slug';

/** The three kinds of part an LO folder holds, each its own `<kind>/<ref>/` folder. */
export const PART_KINDS = ['blocks', 'exercises', 'modals'] as const;
export type PartKind = (typeof PART_KINDS)[number];

/**
 * The config file a part folder must hold, per kind — the kind name, singularised.
 *
 * Mirrors `FILE_NAMES` in `load-lo-disk.ts`, which is what actually reads them. The
 * repo sweep asserts each kind was found on disk, so a rename here or there surfaces
 * as a failure rather than as an empty, silently-passing guard.
 */
export const CONFIG_FILE_BY_KIND: Readonly<Record<PartKind, string>> = {
  blocks: 'block.json',
  exercises: 'exercise.json',
  modals: 'modal.json',
};

/** One part folder found on disk. */
export interface PresentPart {
  /** The folder name, which IS the ref the manifest would use. */
  readonly ref: string;
  /** Whether it holds its kind's config file — without one it renders nothing. */
  readonly hasConfig: boolean;
}

/** Refs per kind, whichever side they came from. */
export type RefsByKind = Readonly<Record<PartKind, readonly string[]>>;

/** One LO's two registries, ready to compare. */
export interface LoStructure {
  /** The LO folder name, e.g. `lo-00-example`. */
  readonly folder: string;
  /** What `lo.json` names. */
  readonly referenced: RefsByKind;
  /** What is on disk. */
  readonly present: Readonly<Record<PartKind, readonly PresentPart[]>>;
}

/** One drift between manifest and disk, located well enough to fix without searching. */
export interface MirrorViolation {
  readonly folder: string;
  readonly kind: PartKind;
  readonly ref: string;
  /** `missing` = named, nothing behind it. `unreferenced` = there, nothing names it. */
  readonly problem: 'missing' | 'unreferenced';
  /** The repo-relative config file the ref resolves to, present or not. */
  readonly file: string;
}

/** An LO folder whose name will not parse, with the error the author should read. */
export interface MalformedLoFolder {
  readonly folder: string;
  readonly reason: string;
}

/** The repo-relative path a ref resolves to. */
function partFile(folder: string, kind: PartKind, ref: string): string {
  return `lo-config/${folder}/${kind}/${ref}/${CONFIG_FILE_BY_KIND[kind]}`;
}

/** Non-empty strings at `value[key]`, or none — `value` may be anything at all. */
function stringsAt(value: unknown, key: string): string[] {
  if (value === null || typeof value !== 'object') return [];
  const entry = (value as Record<string, unknown>)[key];
  if (!Array.isArray(entry)) return [];
  return entry.filter((item): item is string => typeof item === 'string' && item !== '');
}

/**
 * Every ref one manifest names, per kind, in declared order.
 *
 * Defensive by design (see the header on staleness): any shape that is not what the
 * schema describes yields fewer refs, never a throw, so the guard's own sweep is what
 * reports a reshape rather than an unrelated crash inside it.
 *
 * @param manifest a parsed `lo.json`, of any shape
 */
export function referencedRefs(manifest: unknown): RefsByKind {
  const sections =
    manifest !== null && typeof manifest === 'object'
      ? (manifest as { sections?: unknown }).sections
      : undefined;
  const sectionList = Array.isArray(sections) ? sections : [];

  return {
    blocks: sectionList.flatMap((section) => stringsAt(section, 'blocks')),
    exercises: sectionList.flatMap((section) => stringsAt(section, 'exercises')),
    modals: stringsAt(manifest, 'modals'),
  };
}

/**
 * Every part folder in one LO directory, per kind, alphabetically.
 *
 * An absent kind folder is normal — an LO may have blocks and no exercises — and
 * yields nothing rather than throwing.
 *
 * @param loDir absolute path to one LO folder
 */
export function presentParts(loDir: string): Readonly<Record<PartKind, readonly PresentPart[]>> {
  const readKind = (kind: PartKind): PresentPart[] => {
    const kindDir = path.join(loDir, kind);
    if (!existsSync(kindDir)) return [];

    return readdirSync(kindDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        ref: entry.name,
        hasConfig: existsSync(path.join(kindDir, entry.name, CONFIG_FILE_BY_KIND[kind])),
      }))
      .sort((a, b) => a.ref.localeCompare(b.ref));
  };

  return {
    blocks: readKind('blocks'),
    exercises: readKind('exercises'),
    modals: readKind('modals'),
  };
}

/**
 * The symmetric difference between what one LO's manifest names and what is on disk.
 *
 * Pure: takes an already-read structure, so a deliberately-broken sample needs no
 * files. Every kind and both directions are reported — never just the first — so one
 * failure run shows the whole picture.
 */
export function findMirrorViolations(structure: LoStructure): MirrorViolation[] {
  const violations: MirrorViolation[] = [];

  for (const kind of PART_KINDS) {
    const referenced = structure.referenced[kind];
    const present = structure.present[kind];
    const renderableRefs = new Set(present.filter((part) => part.hasConfig).map((p) => p.ref));
    const referencedRefSet = new Set(referenced);

    // A folder that exists but holds no config file counts as missing, not present:
    // the loader skips it, so the ref resolves to nothing either way.
    for (const ref of referenced) {
      if (renderableRefs.has(ref)) continue;
      violations.push({
        folder: structure.folder,
        kind,
        ref,
        problem: 'missing',
        file: partFile(structure.folder, kind, ref),
      });
    }

    for (const part of present) {
      if (referencedRefSet.has(part.ref)) continue;
      violations.push({
        folder: structure.folder,
        kind,
        ref: part.ref,
        problem: 'unreferenced',
        file: partFile(structure.folder, kind, part.ref),
      });
    }
  }

  return violations;
}

/**
 * Which of `folderNames` are not `lo-<ordinal>-<url-safe-kebab-slug>`.
 *
 * Delegates to `loSlug()` rather than re-testing the pattern, so there is one
 * definition of a legal LO folder name and the author reads the same message the
 * build would have given them.
 */
export function findMalformedLoFolders(
  folderNames: readonly string[],
): readonly MalformedLoFolder[] {
  const malformed: MalformedLoFolder[] = [];

  for (const folder of folderNames) {
    try {
      loSlug(folder);
    } catch (error) {
      malformed.push({ folder, reason: error instanceof Error ? error.message : String(error) });
    }
  }

  return malformed;
}

/**
 * Both registries for every LO folder in the repo, ready to compare.
 *
 * An LO with no `lo.json` at all yields empty refs, so every folder it holds reports
 * as unreferenced — which is the right answer: without a manifest, nothing renders.
 *
 * Takes no repo root, unlike guards c and d: `lo-folders.ts` already owns where LOs
 * live and is the ONE implementation of "which LOs exist", so a second path root here
 * would be a second answer to drift from. Nothing is lost — `findMirrorViolations` is
 * pure, so a deliberately-broken sample needs no fixture tree to point at.
 */
export function readLoStructures(): readonly LoStructure[] {
  return listLoSlugs().map((folder) => {
    const loDir = path.join(LO_CONFIG_DIR, folder);
    const manifestPath = path.join(loDir, 'lo.json');
    const manifest: unknown = existsSync(manifestPath)
      ? JSON.parse(readFileSync(manifestPath, 'utf-8'))
      : null;

    return { folder, referenced: referencedRefs(manifest), present: presentParts(loDir) };
  });
}
