/**
 * course.config.ts — the rules for course identity; the values are in `course.json`.
 *
 * WHAT: One Zod-validated object describing the whole course (title, language,
 * deploy base path, landing copy, logo/favicon). Course ORDER is deliberately absent —
 * see the note on the schema below.
 *
 * SPLIT (TODO §E45): this file is core (the template's, code-owned); the course's own
 * values live in `course.json` at the repo root, which CODEOWNERS leaves to the
 * course's author. So an author changes their course's title without review, and a
 * template update that changes these rules no longer edits the file every course has
 * edited. A new setting is added here as optional, with a default, so no course has to
 * touch its `course.json` to take the update.
 *
 * WHY Zod (spec decision #2 + §8): configs are validated AT LOAD. `parse()` runs
 * the moment this module is imported, so a missing/blank/misshapen field fails the
 * dev server and the production build with a precise message — instead of shipping
 * a broken course that only breaks in the browser (the class of drift bug that hurt
 * french-lo-1). Config drift fails fast and loud.
 *
 * Feeds the static pre-render (page titles, <head>, per-LO meta) and centralizes
 * the deploy `basePath` (kills the favicon-on-subpath bug #28).
 *
 * Spec: docs/specs/2026-06-15-lc-base-template-design.md §8, decision #12.
 */
import { z } from 'zod';
import courseJson from '../../course.json';

/** The contract: what a valid course identity MUST look like. Exported so its rules
    are tested directly, not only against today's values. */
export const CourseConfigSchema = z.strictObject({
  /** Course display name. Accents/umlauts fine; blank rejected. */
  courseTitle: z.string().min(1),
  /** ISO-ish language code, e.g. "es", "de". */
  languageCode: z.string().min(2),
  /** Deploy subpath (made env-driven in a later step). Defaults to root. */
  basePath: z.string().default('/'),
  /** Hero copy for the landing page. */
  landingCopy: z.strictObject({
    heading: z.string().min(1),
    /** Omit the key entirely when there is no subheading. */
    subheading: z.string().min(1).optional(),
  }),
  /** %BASE_URL%-relative asset paths. */
  logo: z.string().min(1),
  favicon: z.string().min(1),
  /** The progress meter's icon under every exercise (ProgressMeter), %BASE_URL%-relative
      like the logo: an SVG drawn as a mask, so it takes the meter's own colours. Omit
      it for a plain dot. */
  progressIcon: z
    .string()
    .min(1)
    .refine((value) => !value.startsWith('/'), { message: 'relative to %BASE_URL%' })
    .optional(),
  // NO loOrder field: course order is the `lo-NN-` ordinal in each LO's folder name,
  // and nothing else (decision B, 2026-08-06 — see the Phase D handover §5). A list
  // here would be a SECOND source for a fact the folder already states, free to drift
  // from it silently — the exact class of bug this config exists to prevent. Ordering
  // lives in `sortLoFolders()` (src/lo/lo-slug.ts); reorder a course by renaming.
});

/** Type is INFERRED from the schema — one source of truth, never drifts apart. */
export type CourseConfig = z.infer<typeof CourseConfigSchema>;

/**
 * Validate a course's values, or throw a message an author can act on: the file, then
 * each fault with its field (`✖ Too small … → at courseTitle`). Strict, so a misspelt
 * key is named rather than silently ignored.
 */
export function parseCourseConfig(raw: unknown): CourseConfig {
  const result = CourseConfigSchema.safeParse(raw);
  if (!result.success) throw new Error(`course.json is invalid:\n${z.prettifyError(result.error)}`);
  return result.data;
}

/** Validate at load. An invalid `course.json` throws here → dev/build dies immediately. */
export const courseConfig: CourseConfig = parseCourseConfig(courseJson);
