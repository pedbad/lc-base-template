/**
 * course.config.ts — single source of truth for course identity.
 *
 * WHAT: One Zod-validated object describing the whole course (title, language,
 * deploy base path, landing copy, logo/favicon, LO order). Filled out first when
 * cloning the template.
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

/** The contract: what a valid course identity MUST look like. */
const CourseConfigSchema = z.object({
  /** Course display name. Accents/umlauts fine; blank rejected. */
  courseTitle: z.string().min(1),
  /** ISO-ish language code, e.g. "es", "de". */
  languageCode: z.string().min(2),
  /** Deploy subpath (made env-driven in a later step). Defaults to root. */
  basePath: z.string().default('/'),
  /** Hero copy for the landing page. */
  landingCopy: z.object({
    heading: z.string().min(1),
    /** Omit the key entirely when there is no subheading. */
    subheading: z.string().min(1).optional(),
  }),
  /** %BASE_URL%-relative asset paths. */
  logo: z.string().min(1),
  favicon: z.string().min(1),
  /** LO slugs in display order. Auto-discovery fills the real list later. */
  loOrder: z.array(z.string()).default([]),
});

/** Type is INFERRED from the schema — one source of truth, never drifts apart. */
export type CourseConfig = z.infer<typeof CourseConfigSchema>;

/** The actual course values (out-of-box example: a Cambridge Spanish course). */
const raw = {
  courseTitle: 'Cambridge Spanish — Level 1',
  languageCode: 'es',
  landingCopy: {
    heading: 'Bienvenido',
    subheading: 'Start your Spanish journey',
  },
  logo: 'logo.svg',
  favicon: 'favicon.svg',
  loOrder: [],
};

/** Validate at load. Invalid `raw` throws here → dev/build dies immediately. */
export const courseConfig: CourseConfig = CourseConfigSchema.parse(raw);
