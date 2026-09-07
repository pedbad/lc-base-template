/**
 * registry-completeness.ts — guard e: every `type` resolves to something that
 * renders it (buildlist 23, spec §e).
 *
 * THE BUG CLASS, AND HOW IT DIFFERS FROM b/c/d. Those three guard SILENT failures —
 * an orphaned folder, an audio 404, a missing file. This one guards a LOUD failure
 * that ships anyway. Both renderers already handle an unknown type explicitly:
 * `ExerciseHost` prints "No engine registered for type <x>" and `lo-page-sections`
 * prints "No renderer registered for block type <x>", each in destructive red. So
 * nothing is hidden — the build succeeds, the suite stays green, and a learner opens
 * the lesson to a red error box. Guard e's job is to move that failure from the
 * learner's screen to the author's terminal.
 *
 * THE RULE HAS TWO HALVES, aimed at the two ways a type goes unresolved.
 *
 * HALF ONE — THE AUTHORING CONTRACT. Adding a new exercise type is three steps, and
 * the spec is explicit that guard e fails if ANY is skipped (design spec §223):
 * register it in `lazyRegistry`, add a showcase fixture, add a Zod content schema.
 * So the contract is checked over `EXERCISE_TYPE_KEYS` — the canonical list — and
 * every skipped step is reported, never just the first, because someone who forgot
 * one step usually forgot two.
 *
 *   engine  → a key with no `EXERCISE_REGISTRY` entry. `Partial<Record<…>>` permits
 *             the hole by design (the registry filled up one engine at a time
 *             through Phase B) and the Zod enum is built from the SAME key list, so
 *             the hole passes validation and reaches the red box. This closes it.
 *   fixture → a key with no `SHOWCASE_FIXTURES` card. The showcase is the only place
 *             an engine is ever seen working; an engine with no card is an engine
 *             nobody reviews, and its rot is found by a learner.
 *   schema  → a key with no per-type content schema. `ExerciseConfigSchema.content`
 *             is deliberately loose, so the per-type shape is the ONLY thing that
 *             checks an author's content. Without it the engine is the validator,
 *             and it validates at render — in front of the reader.
 *
 * WHY THE SCHEMA STEP IS A FILE CHECK, NOT A MAP. A central `type → schema` map
 * would have to live somewhere, and the only place it could live is this guard —
 * making "add your engine to the guard" a FOURTH step, which the guard could not
 * then check. Worse, an author who forgot it would get silence, which is guard d's
 * staleness trap exactly. The convention `src/exercises/<type>/<type>-schema.ts` is
 * already what all fifteen engines follow, so checking the convention needs no
 * registration at all: a new engine is covered the moment its folder exists. The
 * accompanying test then IMPORTS each file and asserts it exports a real Zod schema,
 * because the contract's third step is "add a Zod schema", not "add a file named
 * like one".
 *
 * HALF TWO — AUTHORED TYPES RESOLVE. Every `type` in a `block.json` or
 * `exercise.json` on disk must resolve in its own registry. This is not redundant
 * with half one, and the two kinds are very differently protected:
 *
 *   - An exercise `type` has a Zod enum behind it (`ExerciseConfigSchema`), so a
 *     typo dies at load. The sweep still runs because the enum is built from the key
 *     list, not from the registry — the two can disagree, and half one only proves
 *     they agree TODAY.
 *   - A block `type` is a bare `z.string().min(1)` — no enum, no registry check, no
 *     backstop of any kind. `BLOCK_RENDERERS` is keyed by free string. For blocks
 *     this guard is the only thing standing between a typo and a red box.
 *
 * WHAT IS DELIBERATELY NOT HERE, and why it is not an oversight:
 *
 *   - A registry key outside `EXERCISE_TYPE_KEYS`, or a fixture typed to an unknown
 *     engine. Both are compile errors already — `EXERCISE_REGISTRY` is
 *     `Partial<Record<ExerciseType, …>>` and `ShowcaseFixture.type` is
 *     `ExerciseType`. Same for `EXERCISE_INSTRUCTIONS`, an exhaustive Record. A
 *     runtime assertion would only restate what `tsc -b` already refuses to build.
 *   - Whether a fixture's or an author's `content` actually PARSES against its
 *     engine's schema. That is content validity, guard a's family; guard e checks
 *     that the schema EXISTS. Mixing the two would mean this guard failing for
 *     reasons that have nothing to do with a registry.
 *   - A block renderer no LO uses. Dead code, not a broken page — a cleanup concern,
 *     not a correctness one.
 *
 * STALENESS. Guard d's lesson: a guard that collects by name passes silently once a
 * field is renamed. The accompanying test asserts floors on the key list, on each
 * registry, and on how many authored block and exercise types were found on disk, so
 * a reshape fails loudly instead of quietly switching the guard off.
 *
 * Node reader only — part folders come from guard b's `presentParts`, so "which part
 * folders exist" still has exactly one implementation. Never `load-lo-glob.ts`,
 * whose `import.meta.glob` is Vite syntax and throws under a plain Node runner.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { LO_CONFIG_DIR, listLoSlugs } from '@/lo/lo-folders';
import { CONFIG_FILE_BY_KIND, presentParts } from './render-mirror';

/** The three steps of the authoring contract, in the order an author takes them. */
export const CONTRACT_STEPS = ['engine', 'fixture', 'schema'] as const;
export type ContractStep = (typeof CONTRACT_STEPS)[number];

/** The two kinds of config that carry a `type`, each with its own registry. */
export type TypedConfigKind = 'block' | 'exercise';

/** One authoring step an exercise type skipped. */
export interface ContractGap {
  readonly type: string;
  readonly step: ContractStep;
  /** Where the missing piece belongs, so the fix needs no searching. */
  readonly detail: string;
}

/** One `type` as authored, and the file that authored it. */
export interface AuthoredTypeRef {
  /** Repo-relative path to the config file. */
  readonly source: string;
  readonly kind: TypedConfigKind;
  /** The `type` as written; `''` when the key is absent or not a string. */
  readonly type: string;
}

/** The four lists the contract is checked against. */
export interface ContractInputs {
  /** The canonical key list — `EXERCISE_TYPE_KEYS`. */
  readonly keys: readonly string[];
  /** Keys of `EXERCISE_REGISTRY`. */
  readonly registered: readonly string[];
  /** `type` of every showcase fixture; duplicates are normal and mean nothing. */
  readonly fixtureTypes: readonly string[];
  /** Keys whose per-type schema file is on disk. */
  readonly typesWithSchema: readonly string[];
}

/** Which registry resolves each kind of authored `type`. */
export interface TypeResolvers {
  readonly exercise: readonly string[];
  readonly block: readonly string[];
}

/** The conventional home of one engine's per-type content schema, repo-relative. */
export function schemaFileFor(type: string): string {
  return `src/exercises/${type}/${type}-schema.ts`;
}

/** Whether that file is actually there. */
export function hasSchemaFile(repoRoot: string, type: string): boolean {
  return existsSync(path.join(repoRoot, schemaFileFor(type)));
}

/**
 * Every authoring step skipped, across every canonical exercise type.
 *
 * Pure: takes the four lists, so a deliberately-broken sample needs no repo. All
 * three steps are reported per type — an author who skipped one usually skipped
 * more, and one failure run should show the whole job.
 */
export function findContractGaps(inputs: ContractInputs): ContractGap[] {
  const registered = new Set(inputs.registered);
  const withFixture = new Set(inputs.fixtureTypes);
  const withSchema = new Set(inputs.typesWithSchema);

  const detailFor: Readonly<Record<ContractStep, (type: string) => string>> = {
    engine: () => 'src/exercises/lazyRegistry.ts (EXERCISE_REGISTRY)',
    fixture: (type) =>
      `src/exercises/${type}/${type}.fixture.ts, collected by src/showcase/fixtures.ts`,
    schema: schemaFileFor,
  };
  const tookStep: Readonly<Record<ContractStep, (type: string) => boolean>> = {
    engine: (type) => registered.has(type),
    fixture: (type) => withFixture.has(type),
    schema: (type) => withSchema.has(type),
  };

  return inputs.keys.flatMap((type) =>
    CONTRACT_STEPS.filter((step) => !tookStep[step](type)).map((step) => ({
      type,
      step,
      detail: detailFor[step](type),
    })),
  );
}

/**
 * Which authored `type` values resolve to nothing that could render them.
 *
 * Pure. The two kinds are looked up in their OWN registry and never in each other's:
 * `prose` is a block renderer and must still fail as an exercise type, or the guard
 * would bless a config that renders the red box anyway.
 */
export function findUnresolvedTypes(
  authored: readonly AuthoredTypeRef[],
  resolvers: TypeResolvers,
): AuthoredTypeRef[] {
  const known: Readonly<Record<TypedConfigKind, ReadonlySet<string>>> = {
    exercise: new Set(resolvers.exercise),
    block: new Set(resolvers.block),
  };

  return authored.filter((ref) => !known[ref.kind].has(ref.type));
}

/** The `type` field of a parsed config, or `''` when absent or not a string. */
function typeOf(parsed: unknown): string {
  if (parsed === null || typeof parsed !== 'object') return '';
  const value = (parsed as { type?: unknown }).type;
  return typeof value === 'string' ? value : '';
}

/**
 * Every `type` authored anywhere under `lo-config/`, tagged with its file and kind.
 *
 * Reads what is ON DISK rather than what an assembled LO exposes, for two reasons: a
 * folder the manifest does not reference is still authored content whose type should
 * resolve (guard b is what reports the missing reference), and `loadLo` would run the
 * Zod enum first, so an unknown exercise type would throw before this ever saw it.
 *
 * `modals` are skipped — a modal has no `type`; it is prose with a title.
 */
export function authoredTypeRefs(): AuthoredTypeRef[] {
  const kindOf: Readonly<Record<'blocks' | 'exercises', TypedConfigKind>> = {
    blocks: 'block',
    exercises: 'exercise',
  };

  return listLoSlugs().flatMap((folder) => {
    const loDir = path.join(LO_CONFIG_DIR, folder);
    const present = presentParts(loDir);

    return (['blocks', 'exercises'] as const).flatMap((kind) =>
      present[kind]
        .filter((part) => part.hasConfig)
        .map((part) => {
          const file = path.join(loDir, kind, part.ref, CONFIG_FILE_BY_KIND[kind]);
          return {
            source: `lo-config/${folder}/${kind}/${part.ref}/${CONFIG_FILE_BY_KIND[kind]}`,
            kind: kindOf[kind],
            type: typeOf(JSON.parse(readFileSync(file, 'utf-8'))),
          };
        }),
    );
  });
}
