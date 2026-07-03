/**
 * exercise-types.ts — the canonical set of exercise engine keys.
 *
 * The 12 interactive exercise types ported from french-lo-1, in kebab-case
 * (spec §2), plus new engines added in Phase C. This is the single source of
 * truth for valid exercise `type` values: `lo-schema.ts` builds its Zod enum
 * from it, and the `lazyRegistry` (Phase B) keys its engine map by it. Adding an
 * engine = add its key here.
 *
 * Adding a key here makes `EXERCISE_INSTRUCTIONS` (an exhaustive Record over these
 * keys) fail to compile until its copy is added — an intentional guard, not a bug.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2;
 *       docs/specs/2026-07-03-new-exercise-engines-design.md §4 (flashcards).
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
  // Phase C — new engines (docs/specs/2026-07-03-new-exercise-engines-design.md).
  'flashcards',
] as const;

/** A valid exercise engine key. */
export type ExerciseType = (typeof EXERCISE_TYPE_KEYS)[number];
