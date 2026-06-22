/**
 * lo-schema.ts — Zod contract for a folder-per-LO (spec §6, §9, §15).
 *
 * WHAT: the shape a Learning Object folder must satisfy. An LO ships as a folder
 * under `lo-config/lo-NN-slug/`:
 *
 *   lo-01-salutations/
 *     lo.json                       ← manifest: meta + ORDERED block/exercise refs
 *     blocks/01-grammar/block.json
 *     blocks/02-vocabulary/block.json
 *     exercises/01-select/exercise.json
 *     exercises/02-fill-gaps/exercise.json
 *
 * Three schemas, one per file kind:
 *   - LoManifestSchema   → validates `lo.json`
 *   - BlockConfigSchema  → validates each content block's `block.json`
 *   - ExerciseConfigSchema → validates each exercise's `exercise.json`
 *
 * WHY (spec decision #2 + §8/§9): validate-at-load. The loader (step 13c) parses
 * every part AND the assembled LO with these schemas, so a malformed manifest or a
 * `chekc` typo in a `labels` override fails the build with a precise message —
 * never a course that only breaks in the browser. Config drift fails fast and loud.
 *
 * SCOPE NOTE (deliberately loose now): `content` is an open object here. Exact
 * per-exercise-type content shapes are explicitly deferred (spec §19) and arrive
 * cluster-by-cluster from step 14, where `type` resolves to an engine via
 * `lazyRegistry`. Ordinal+type ref naming (`01-grammar`) is validated structurally
 * here (non-empty string); the folder↔config render-mirror match is guard b's job
 * (steps 19–26), not pulled forward into the schema. `type` is now a Zod enum of the
 * 12 canonical keys (`exercise-types.ts`).
 *
 * SLUG: not a field. The folder name (`lo-01-salutations`) is the single source of
 * truth; the URL slug strips the `lo-NN-` ordinal prefix (`/salutations.html`) in
 * the build's auto-discovery (step 15). Nothing here carries or derives it.
 *
 * Spec: docs/specs/2026-06-15-lc-base-template-design.md §6, §9, §15.
 */
import { z } from 'zod';
import { UiStringsOverrideSchema } from './ui-strings';
import { EXERCISE_TYPE_KEYS } from './exercise-types';

/**
 * Shared behavior switches for ANY exercise (spec §5/§6). One shape for all 12
 * engines; every field optional; VALUES are set per instance, so two exercises of
 * the same `type` can behave differently (one shuffled, one not). Reset and the
 * show-after-wrong-check reveal are implicit (always on), so they are not fields.
 */
export const ExerciseOptionsSchema = z.object({
  /** Randomize presented choices (default off; author opts in). Reset re-shuffles when on. */
  shuffle: z.boolean().default(false),
  /** Show a random N of M choices; omit = show all. Positive integer. */
  sampleSize: z.number().int().positive().optional(),
  /** false removes the Show-answers control entirely (e.g. a pure game). */
  allowShowAnswers: z.boolean().default(true),
});
export type ExerciseOptions = z.infer<typeof ExerciseOptionsSchema>;

/**
 * Validates one content block's `block.json` (grammar, vocabulary, …). Block `type`
 * is a free string — block kinds are not in the exercise registry.
 */
export const BlockConfigSchema = z.object({
  type: z.string().min(1),
  labels: UiStringsOverrideSchema.optional(),
  content: z.looseObject({}),
});
export type BlockConfig = z.infer<typeof BlockConfigSchema>;

/**
 * Validates one exercise's `exercise.json`. `type` MUST be one of the 12 canonical
 * keys (an unknown key fails the build); `options` is the shared behavior block;
 * `content` stays loose here (per-type shape lands when that engine is ported).
 */
export const ExerciseConfigSchema = z.object({
  type: z.enum(EXERCISE_TYPE_KEYS),
  labels: UiStringsOverrideSchema.optional(),
  content: z.looseObject({}),
  options: ExerciseOptionsSchema.optional(),
});
export type ExerciseConfig = z.infer<typeof ExerciseConfigSchema>;

/**
 * Validates an LO folder's `lo.json` manifest: LO meta plus the two ORDERED ref
 * lists. Lists are section-scoped (decision B, spec §15) — content blocks form one
 * sequence, exercises restart their own — so they are separate arrays, not one.
 * Each ref is a render-mirror folder name like `"01-grammar"` / `"01-select"`.
 */
export const LoManifestSchema = z.object({
  /** LO display title; feeds the per-LO <head>/page heading. Blank rejected. */
  title: z.string().min(1),
  /** Optional meta description for the LO's <head>. Omit the key when unused. */
  description: z.string().min(1).optional(),
  /** Ordered content-block refs, e.g. ["01-grammar", "02-vocabulary"]. */
  blocks: z.array(z.string().min(1)).default([]),
  /** Ordered exercise refs, e.g. ["01-select", "02-fill-gaps"]. */
  exercises: z.array(z.string().min(1)).default([]),
});
export type LoManifest = z.infer<typeof LoManifestSchema>;
