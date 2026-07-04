/**
 * fixture-types.ts — the shared shape a showcase card must satisfy.
 *
 * Extracted from the old monolithic `fixtures.ts` so each engine can colocate its
 * own showcase fixture(s) (`<engine>.fixture.ts`) next to the engine and depend on
 * this one small type — without importing the central aggregator (which would be a
 * cycle). The aggregator (`fixtures.ts`) collects every engine's fixtures into the
 * ordered `SHOWCASE_FIXTURES` array the showcase renders.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §3, §8.
 */
import type { ExerciseType } from '@/config/exercise-types';

/** One showcase card: a titled, ready-to-render exercise config. */
export interface ShowcaseFixture {
  /** Unique card id (also the anchor), e.g. "select-rows". */
  id: string;
  /** Human-readable card title shown above the live exercise. */
  title: string;
  /** Which engine renders it (resolved via lazyRegistry). */
  type: ExerciseType;
  /** The exercise config (content + optional options/labels). Narrowed by the engine. */
  config: unknown;
}
