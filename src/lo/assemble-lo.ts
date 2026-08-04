/**
 * assemble-lo.ts — turn one LO's raw files into a single typed, ordered LO.
 *
 * This is the pure half of loading: NO file access. It takes an already-read
 * `LoFileTree` (whatever produced it) and returns an `AssembledLo` — sections in
 * manifest order, each holding its blocks and exercises in their declared order,
 * every part validated against its schema.
 *
 * WHY the I/O is somewhere else: the LO must be readable from BOTH the browser
 * bundle (dev server + `vite build`) and plain Node (Part D pre-renders each LO with
 * `renderToStaticMarkup` in a post-build script). Verified 2026-08-04: neither
 * mechanism spans both — `import.meta.glob` is Vite-only syntax (Bun throws
 * "undefined is not a function"), and `node:fs` does not exist in a browser bundle.
 * So there is one assembler and two thin readers feeding it (`load-lo-glob.ts`,
 * `load-lo-disk.ts`), which keeps validation and ordering defined exactly once.
 *
 * FAIL FAST AND LOUD (spec decision #2): every throw names the offending file the
 * way an author sees it on disk — `lo-config/<slug>/blocks/01-grammar/block.json` —
 * so a bad LO dies at load with a precise message instead of half-rendering.
 *
 * Spec: docs/specs/2026-06-15-lc-base-template-design.md §6, §9, §15;
 *       docs/process/2026-08-04-phase-c-part-c-loader-handover.md §3.
 */
import { z } from 'zod';
import {
  LoManifestSchema,
  BlockConfigSchema,
  LoExerciseConfigSchema,
  type BlockConfig,
  type LoExerciseConfig,
} from '@/config/lo-schema';

/**
 * One LO's files, already read and JSON-parsed but NOT yet validated. `blocks` and
 * `exercises` are keyed by ref (the render-mirror folder name, `"01-grammar"`).
 */
export interface LoFileTree {
  /** The raw `lo.json`. */
  readonly manifest: unknown;
  /** ref → raw `blocks/<ref>/block.json`. */
  readonly blocks: Readonly<Record<string, unknown>>;
  /** ref → raw `exercises/<ref>/exercise.json`. */
  readonly exercises: Readonly<Record<string, unknown>>;
}

/** One resolved part: the ref it was named by, plus its validated config. */
export interface AssembledPart<TConfig> {
  readonly ref: string;
  readonly config: TConfig;
}

/** One section, with its parts resolved in declared order. */
export interface AssembledSection {
  readonly id: string;
  readonly label: string;
  readonly navLabel?: string;
  readonly blocks: readonly AssembledPart<BlockConfig>[];
  readonly exercises: readonly AssembledPart<LoExerciseConfig>[];
}

/** One whole Learning Object, ready to render. */
export interface AssembledLo {
  /** The LO folder name (`lo-00-example`) — the single source of truth for identity. */
  readonly slug: string;
  readonly title: string;
  readonly description?: string;
  readonly sections: readonly AssembledSection[];
}

/** An author-facing path for the LO file at `relative` inside this LO's folder. */
function loPath(slug: string, relative: string): string {
  return `lo-config/${slug}/${relative}`;
}

/** Parse `raw` against `schema`, or throw naming `filePath` and what was wrong. */
function parseFile<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  raw: unknown,
  filePath: string,
): z.output<TSchema> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new Error(`${filePath} is invalid:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

/** Look a ref up in one of the tree's part maps, or throw naming the missing file. */
function requireFile(
  parts: Readonly<Record<string, unknown>>,
  ref: string,
  filePath: string,
): unknown {
  if (!(ref in parts)) {
    throw new Error(`${filePath} is missing — a section references "${ref}" but no such file`);
  }
  return parts[ref];
}

/**
 * Validate and stitch one LO. Sections keep manifest order; within a section, blocks
 * come first and then exercises, each in its declared array order (the two lists are
 * separate because they mirror the two on-disk folders).
 *
 * @param slug the LO folder name, e.g. `lo-00-example`
 * @param tree the LO's already-read files
 * @throws Error naming the offending file when any part is missing or invalid
 */
export function assembleLo(slug: string, tree: LoFileTree): AssembledLo {
  const manifest = parseFile(LoManifestSchema, tree.manifest, loPath(slug, 'lo.json'));

  const sections = manifest.sections.map<AssembledSection>((section) => ({
    id: section.id,
    label: section.label,
    ...(section.navLabel === undefined ? {} : { navLabel: section.navLabel }),
    blocks: section.blocks.map((ref) => {
      const filePath = loPath(slug, `blocks/${ref}/block.json`);
      return {
        ref,
        config: parseFile(BlockConfigSchema, requireFile(tree.blocks, ref, filePath), filePath),
      };
    }),
    exercises: section.exercises.map((ref) => {
      const filePath = loPath(slug, `exercises/${ref}/exercise.json`);
      return {
        ref,
        config: parseFile(
          LoExerciseConfigSchema,
          requireFile(tree.exercises, ref, filePath),
          filePath,
        ),
      };
    }),
  }));

  return {
    slug,
    title: manifest.title,
    ...(manifest.description === undefined ? {} : { description: manifest.description }),
    sections,
  };
}
