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
  // The progress line under an exercise (ProgressMeter): a template that must name both
  // counts, or a rewording could show a count with no number.
  progressCorrect: z
    .string()
    .min(1)
    .refine((value) => value.includes('{correct}') && value.includes('{total}'), {
      message: 'must contain both {correct} and {total}',
    }),
  // Feedback under a wrong typed answer (AnswerFeedback, TODO §D15): a hint naming the
  // kind of error on the first wrong Check, the answer on the second.
  hintAccent: z.string().min(1),
  hintEnding: z.string().min(1),
  hintMissing: z.string().min(1),
  hintClose: z.string().min(1),
  hintFar: z.string().min(1),
  answerLabel: z.string().min(1),
  answerKey: z.string().min(1),
  // Accessible names for controls with no readable text of their own
  blank: z.string().min(1),
  // Audio controls (listening / dictation exercises)
  play: z.string().min(1),
  pause: z.string().min(1),
  listen: z.string().min(1),
  audioVolume: z.string().min(1),
  audioProgress: z.string().min(1),
  // Screen-reader note after a link that opens in a new tab (rich-text links)
  opensInNewTab: z.string().min(1),
  // Media transcript toggle (tab media, spec 2026-10-07-tabs-media-design §4)
  showTranscript: z.string().min(1),
  hideTranscript: z.string().min(1),
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
  progressCorrect: '{correct} correct out of {total}',
  hintAccent: 'Almost. Check the accents.',
  hintEnding: 'Close. Look at the ending.',
  hintMissing: 'Close. Something is missing.',
  hintClose: 'Close. Check the spelling.',
  hintFar: 'Not quite. Try again.',
  answerLabel: 'Answer:',
  answerKey: 'Highlighted: what differs from yours',
  blank: 'Blank',
  play: 'Play',
  pause: 'Pause',
  listen: 'Listen',
  audioVolume: 'Audio volume',
  audioProgress: 'Audio progress',
  opensInNewTab: '(opens in a new tab)',
  showTranscript: 'Show transcript',
  hideTranscript: 'Hide transcript',
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
