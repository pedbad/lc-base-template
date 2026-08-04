/**
 * lo-schema.ts — Zod contract for a folder-per-LO (spec §6, §9, §15).
 *
 * WHAT: the shape a Learning Object folder must satisfy. An LO ships as a folder
 * under `lo-config/lo-NN-slug/`:
 *
 *   lo-01-salutations/
 *     lo.json                       ← manifest: meta + ORDERED sections + their refs
 *     blocks/01-grammar/block.json
 *     blocks/02-vocabulary/block.json
 *     exercises/01-select/exercise.json
 *     exercises/02-fill-gaps/exercise.json
 *
 * Schemas, one per file kind (plus the section shape inside the manifest):
 *   - LoManifestSchema   → validates `lo.json`
 *   - LoSectionSchema    → validates one entry of the manifest's `sections[]`
 *   - BlockConfigSchema  → validates each content block's `block.json`
 *   - ExerciseConfigSchema → validates each exercise's `exercise.json`
 *   - LoExerciseConfigSchema → the same envelope as referenced BY an LO (title required)
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
 * is a free string — block kinds are not in the exercise registry; it selects a
 * body renderer (`src/lo/blocks/block-renderers.tsx`).
 *
 * `title` is the accordion's `<h3>`. Required: it is human text with no derivable
 * source (the same argument as a section's `label` — a ref like `01-grammar` has
 * already lost capitalisation and accents), and blocks exist ONLY inside an LO, so
 * there is no titleless consumer to spare.
 */
export const BlockConfigSchema = z.object({
  type: z.string().min(1),
  /** Accordion heading (`<h3>` inside `<summary>`). Blank rejected. */
  title: z.string().min(1),
  /**
   * Whether this block's accordion starts open. Accordions default to closed;
   * prose an author expects to be READ on arrival (an introduction) opts in.
   * Exercises deliberately have no equivalent — a page of pre-opened exercises is
   * a wall of controls.
   */
  defaultOpen: z.boolean().default(false),
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
  /**
   * Accordion heading (`<h3>`). OPTIONAL here because the showcase supplies its
   * card title out-of-band (`ShowcaseFixture.title`) — a showcase card is not an
   * LO accordion. Inside an LO it is required; see LoExerciseConfigSchema.
   */
  title: z.string().min(1).optional(),
  labels: UiStringsOverrideSchema.optional(),
  content: z.looseObject({}),
  options: ExerciseOptionsSchema.optional(),
});
export type ExerciseConfig = z.infer<typeof ExerciseConfigSchema>;

/**
 * An exercise AS REFERENCED BY an LO section: the shared envelope with `title`
 * promoted to required, because every LO exercise renders inside an accordion and
 * that accordion needs its `<h3>`. This is what the loader validates; the per-type
 * `content` tightening (SelectContentSchema et al.) stays guard e's job.
 */
export const LoExerciseConfigSchema = ExerciseConfigSchema.extend({
  title: z.string().min(1),
});
export type LoExerciseConfig = z.infer<typeof LoExerciseConfigSchema>;

/**
 * A section `id` doubles as the in-page `#anchor` and feeds `headingId()`
 * (`grammar` → `grammar-heading`), so it must be URL-safe lowercase kebab-case.
 */
const SECTION_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * One top-level section of the page, declared BY the LO (decision D1, 2026-08-04).
 *
 * The manifest owns page structure: there is no code-side `type → section` map and
 * no `section` field duplicated into every block. Order is the ARRAY order — never
 * JS object key insertion order, which the french-lo-1 reference relied on by
 * accident (reorder two keys there and the page silently reorders).
 *
 * Introduction is an ordinary section (decision D2): no hardcoded first nav entry
 * anywhere. A nav entry exists because CONTENT exists — which is why a section with
 * neither blocks nor exercises is rejected rather than emitting a link to nothing.
 *
 * `blocks` / `exercises` stay separate arrays (not one `items[{kind, ref}]` list)
 * because the split mirrors the on-disk folders, so a ref resolves trivially:
 * `blocks/<ref>/block.json` vs `exercises/<ref>/exercise.json`.
 */
export const LoSectionSchema = z
  .object({
    /** In-page anchor + heading-id base. URL-safe kebab-case, e.g. `going-to-a-cafe`. */
    id: z.string().regex(SECTION_ID_PATTERN, 'section id must be url-safe kebab-case'),
    /**
     * The section's `<h2>` text AND its default nav text (decision D3). Required and
     * never derived from `id`: an id is already stripped of accents and case
     * (`going-to-a-cafe` lost the é in *café*; `faq` → "Faq").
     */
    label: z.string().min(1),
    /** Shorter nav-only override; nav text resolves as `navLabel ?? label`. */
    navLabel: z.string().min(1).optional(),
    /** Ordered content-block refs for this section, e.g. ["01-grammar"]. */
    blocks: z.array(z.string().min(1)).default([]),
    /** Ordered exercise refs for this section, e.g. ["01-select", "02-fill-gaps"]. */
    exercises: z.array(z.string().min(1)).default([]),
  })
  .refine((section) => section.blocks.length + section.exercises.length > 0, {
    message: 'section must reference at least one block or exercise',
  });
export type LoSection = z.infer<typeof LoSectionSchema>;

/**
 * Validates an LO folder's `lo.json` manifest: LO meta plus its ORDERED `sections[]`.
 * Ordinal ref prefixes (`01-`, `02-`) stay LO-wide per kind; the array is what orders
 * items WITHIN a section.
 */
export const LoManifestSchema = z
  .object({
    /** LO display title; feeds the per-LO <head>/page heading. Blank rejected. */
    title: z.string().min(1),
    /** Optional meta description for the LO's <head>. Omit the key when unused. */
    description: z.string().min(1).optional(),
    /** The page, in order. At least one — an LO with no sections renders nothing. */
    sections: z.array(LoSectionSchema).min(1),
  })
  .superRefine((manifest, ctx) => {
    // Duplicate ids would collide as BOTH `#anchor` targets and `{id}-heading` ids.
    const seen = new Set<string>();
    manifest.sections.forEach((section, index) => {
      if (seen.has(section.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `duplicate section id "${section.id}"`,
          path: ['sections', index, 'id'],
        });
      }
      seen.add(section.id);
    });
  });
export type LoManifest = z.infer<typeof LoManifestSchema>;
