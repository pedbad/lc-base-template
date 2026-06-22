/**
 * fixtures.ts — the catalog the exercise showcase renders.
 *
 * One entry per showcase CARD. Most engines have one card; `select` will have two
 * (rows + inline) to prove both `layoutMode`s (spec §3). Each fixture is a small,
 * realistic, Zod-valid exercise config. As each engine is ported (Phase B) its
 * fixture(s) are appended here, so the showcase grows one card at a time.
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

/** Empty until the first engine is ported. */
export const SHOWCASE_FIXTURES: ShowcaseFixture[] = [];
