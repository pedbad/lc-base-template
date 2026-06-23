/**
 * lazyRegistry.ts — maps an exercise `type` key to its lazily-loaded engine.
 *
 * The single place that says "this `type` is rendered by this component". Engines
 * register here as they are ported (Phase B, one at a time), each behind React
 * `lazy()` so a page only downloads the engines it actually uses. The showcase and
 * (later) the LO renderer both resolve components through `getExercise(type)`.
 *
 * Guard e (registry completeness, later step) will assert every `type` used in a
 * config is registered here, and every registered type has a showcase fixture.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §8;
 *       docs/specs/2026-06-15-lc-base-template-design.md §5 (guard e).
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { ExerciseType } from '@/config/exercise-types';

/**
 * Props every engine receives. `config` is the validated exercise config
 * (`type` + `content` + optional `options`/`labels`). It is `unknown` here and
 * narrowed by each engine against its own per-type content schema — the registry
 * stays type-agnostic so all 12 engines can share one map.
 */
export interface ExerciseComponentProps {
  config: unknown;
}

/** A lazily-loaded exercise engine component. */
export type ExerciseComponent = LazyExoticComponent<ComponentType<ExerciseComponentProps>>;

/**
 * The registry. `Partial` because it fills up one engine at a time — an
 * unregistered `type` resolves to `undefined`, which callers handle explicitly.
 */
export const EXERCISE_REGISTRY: Partial<Record<ExerciseType, ExerciseComponent>> = {
  select: lazy(() => import('./select/SelectExercise')),
  'inline-choice': lazy(() => import('./inline-choice/InlineChoiceExercise')),
};

/** Resolve an engine by type, or `undefined` if not yet registered. */
export function getExercise(type: ExerciseType): ExerciseComponent | undefined {
  return EXERCISE_REGISTRY[type];
}

// `lazy` is re-exported so engine registrations above read tersely without each
// engine file needing to import it just to register.
export { lazy };
