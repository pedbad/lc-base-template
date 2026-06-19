/**
 * ui-strings.ts — UI-chrome strings, two-layer (spec §9, decision #13).
 *
 * WHAT: the words the exercise chrome shows ("Check", "Next", "Correct!", audio
 * controls). They must NOT be hardcoded in components — components read these keys.
 *
 * TWO LAYERS:
 *   Layer 1 — global `uiStrings` (this file). Flat key→string map, the course-wide
 *     default. Zod: ALL keys required → build fails on any missing key, so no
 *     half-translated chrome can ship.
 *   Layer 2 — per-exercise `labels` override, lives in the LO JSON (validated later
 *     with `UiStringsOverrideSchema`). Optional + partial: one exercise can say
 *     "See answer" while the rest fall back to the global "Show answer". Keys must be
 *     real and values strings — a typo like `chekc` fails the build.
 *
 * RESOLUTION: `resolveLabel(key, overrides)` → override wins, global always exists.
 *
 * NOT a runtime i18n framework — each clone is one language, set once. The chrome is
 * English by default (UI language ≠ the course's content language). Seed values are
 * grounded in french-lo-1's real strings.
 *
 * Spec: docs/specs/2026-06-15-lc-base-template-design.md §9, decision #13.
 */
import { z } from 'zod';

/**
 * The key set. `strictObject` → an unrecognized key (typo) is an error, not silently
 * stripped, on BOTH the global map and the per-exercise override.
 */
export const UiStringsSchema = z.strictObject({
  // Exercise chrome
  check: z.string().min(1),
  next: z.string().min(1),
  previous: z.string().min(1),
  reset: z.string().min(1),
  continue: z.string().min(1),
  showAnswer: z.string().min(1),
  hideAnswer: z.string().min(1),
  correct: z.string().min(1),
  incorrect: z.string().min(1),
  showHints: z.string().min(1),
  // Audio controls (listening / dictation exercises)
  play: z.string().min(1),
  pause: z.string().min(1),
  listen: z.string().min(1),
  audioVolume: z.string().min(1),
  audioProgress: z.string().min(1),
});

/** Full required map (Layer 1). */
export type UiStrings = z.infer<typeof UiStringsSchema>;
/** Every valid chrome key. */
export type UiStringKey = keyof UiStrings;

/**
 * Layer 2 schema: partial (any subset) but still strict (typo keys rejected).
 * The LO JSON's optional `labels` block is validated against this.
 */
export const UiStringsOverrideSchema = UiStringsSchema.partial();
export type UiStringsOverride = z.infer<typeof UiStringsOverrideSchema>;

/** Out-of-box English chrome. */
const raw: UiStrings = {
  check: 'Check',
  next: 'Next',
  previous: 'Previous',
  reset: 'Reset',
  continue: 'Continue',
  showAnswer: 'Show answer',
  hideAnswer: 'Hide answer',
  correct: 'Correct!',
  incorrect: 'Incorrect',
  showHints: 'Show hints',
  play: 'Play',
  pause: 'Pause',
  listen: 'Listen',
  audioVolume: 'Audio volume',
  audioProgress: 'Audio progress',
};

/** Validate at load. A missing/blank/typo key throws here → build dies immediately. */
export const uiStrings: UiStrings = UiStringsSchema.parse(raw);

/**
 * Resolve a chrome label: per-exercise override wins, global default always exists.
 * @example resolveLabel('check', config.labels) // "See answer" if overridden, else "Check"
 */
export function resolveLabel(key: UiStringKey, overrides?: UiStringsOverride): string {
  return overrides?.[key] ?? uiStrings[key];
}
