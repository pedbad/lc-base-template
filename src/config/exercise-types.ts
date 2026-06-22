/**
 * exercise-types.ts — the canonical set of exercise engine keys.
 *
 * The 12 interactive exercise types ported from french-lo-1, in kebab-case
 * (spec §2). This is the single source of truth for valid exercise `type`
 * values: `lo-schema.ts` builds its Zod enum from it, and the `lazyRegistry`
 * (Phase B) keys its engine map by it. Adding an engine = add its key here.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2.
 */
export const EXERCISE_TYPE_KEYS = [
  'select',
  'inline-choice',
  'radio-quiz',
  'inline-gap',
  'typed-transform',
  'dictation',
  'word-order',
  'phrase-reorder',
  'drag-fill-gaps',
  'line-match',
  'memory-match',
  'word-spot',
] as const;

/** A valid exercise engine key. */
export type ExerciseType = (typeof EXERCISE_TYPE_KEYS)[number];
