/**
 * exerciseScaffold.ts — shared wiring for the blank-grading exercise family
 * (select, inline-choice, radio-quiz, inline-gap, typed-transform, dictation,
 * line-match; spec §7). Each of those engines independently carried the SAME three
 * mechanical pieces around its engine-specific grading + render:
 *
 *   1. seedFromId — FNV-1a hash of the component's useId → a stable per-instance
 *      numeric seed (pure; no Math.random), so a mounted card reproduces its own
 *      shuffle and Reset can bump to a fresh one. Was copy-pasted verbatim into four
 *      engines.
 *   2. createExerciseReducer — the "merge a patch into state" reducer these engines
 *      share. A patch is a partial, a function of prev, or a null no-op that returns
 *      the SAME state reference (line-match relies on the no-op so its
 *      measure-after-render effect settles instead of looping). Six engines carried
 *      a hand-rolled copy of this.
 *   3. useExerciseScaffold — packages seed(useId) + useReducer(buildRound) + a
 *      reset() that rebuilds the round with seed + 1. The engine supplies a
 *      buildRound(seed) closure (capturing its own items/options) and keeps its
 *      grading function and render — grading is owned by the per-engine *-grading
 *      split; render is intrinsically engine-specific.
 *
 * This module owns ONLY the repeated scaffold. It does not grade, and it does not
 * render — those stay in each engine.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §5.2, §7, §8.
 */
import { useId, useReducer, type Dispatch } from 'react';

/**
 * FNV-1a hash → a stable numeric (uint32) seed from a string (the component's
 * useId). Pure and deterministic: the same id always yields the same seed, so a
 * given card reproduces its layout across re-renders, and Reset (seed + 1) gives a
 * fresh but still-deterministic order. No Math.random.
 */
export function seedFromId(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * A patch dispatched to an exercise reducer: a partial to merge, a function of the
 * previous state, or a null no-op. A function patch may itself return null to bail
 * out (return the same state reference).
 */
export type ExercisePatch<S> = Partial<S> | null | ((state: S) => Partial<S> | null);

/**
 * Build the merge reducer shared by the blank-grading engines. A non-null patch is
 * spread over the previous state; a null patch — or a function patch that returns
 * null — returns the SAME state reference. That no-op is intentional: an effect that
 * re-dispatches on every render (line-match's layout measure) must be able to settle
 * without triggering another render, so equal/absent updates keep the reference.
 */
export function createExerciseReducer<S>(): (state: S, patch: ExercisePatch<S>) => S {
  return (state: S, patch: ExercisePatch<S>): S => {
    const update = typeof patch === 'function' ? patch(state) : patch;
    return update ? { ...state, ...update } : state;
  };
}

/** What {@link useExerciseScaffold} hands back to an engine. */
export interface ExerciseScaffold<S> {
  /** The current reducer state. */
  state: S;
  /** Dispatch a partial/function/null patch (see {@link ExercisePatch}). */
  dispatch: Dispatch<ExercisePatch<S>>;
  /** Rebuild the round with the next seed (seed + 1) — the shared Reset behavior. */
  reset: () => void;
}

/**
 * Wire a blank-grading engine's reducer state. Derives a stable seed from useId,
 * initializes the round via `buildRound(seed)`, and exposes `reset()` which rebuilds
 * with seed + 1.
 *
 * `buildRound` must place the seed it was handed onto the returned state (as `seed`)
 * so reset can read and bump it — the same contract every engine's buildState/
 * buildRound already follows.
 */
export function useExerciseScaffold<S extends { seed: number }>(
  buildRound: (seed: number) => S,
): ExerciseScaffold<S> {
  const uid = useId();
  const [state, dispatch] = useReducer(createExerciseReducer<S>(), uid, (id) =>
    buildRound(seedFromId(id)),
  );
  const reset = () => dispatch((prev) => buildRound(prev.seed + 1));
  return { state, dispatch, reset };
}
