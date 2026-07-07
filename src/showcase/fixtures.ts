/**
 * fixtures.ts — the catalog the exercise showcase renders (thin aggregator).
 *
 * WAS a single 460-line file holding every engine's sample configs; now each engine
 * owns its own `<engine>.fixture.ts` (colocated next to the engine, typed against
 * that engine's schema). This file only COLLECTS them into the ordered array the
 * showcase renders. Adding a new engine no longer touches this file's data — it adds
 * an `<engine>.fixture.ts` and one line to the manifest below.
 *
 * ORDER: the manifest is the single source of card order (top-to-bottom on the
 * showcase page). Each engine's fixture file controls the order of its own cards.
 *
 * `ShowcaseFixture` moved to `./fixture-types` (so engine files can depend on the
 * type without importing this aggregator); it is re-exported here for existing
 * importers.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §3, §8.
 */
import type { ShowcaseFixture } from './fixture-types';
import { selectFixtures } from '@/exercises/select/select.fixture';
import { inlineChoiceFixtures } from '@/exercises/inline-choice/inline-choice.fixture';
import { radioQuizFixtures } from '@/exercises/radio-quiz/radio-quiz.fixture';
import { inlineGapFixtures } from '@/exercises/inline-gap/inline-gap.fixture';
import { typedTransformFixtures } from '@/exercises/typed-transform/typed-transform.fixture';
import { dictationFixtures } from '@/exercises/dictation/dictation.fixture';
import { lineMatchFixtures } from '@/exercises/line-match/line-match.fixture';
import { wordSpotFixtures } from '@/exercises/word-spot/word-spot.fixture';
import { memoryMatchFixtures } from '@/exercises/memory-match/memory-match.fixture';
import { wordOrderFixtures } from '@/exercises/word-order/word-order.fixture';
import { phraseReorderFixtures } from '@/exercises/phrase-reorder/phrase-reorder.fixture';
import { dragFillGapsFixtures } from '@/exercises/drag-fill-gaps/drag-fill-gaps.fixture';
import { flashcardsFixtures } from '@/exercises/flashcards/flashcards.fixture';

export type { ShowcaseFixture } from './fixture-types';

/**
 * Every engine's showcase cards, in display order. To register a new engine, add
 * its fixture import above and one entry here — the data lives in the engine's dir.
 */
export const SHOWCASE_FIXTURES: ShowcaseFixture[] = [
  ...selectFixtures,
  ...inlineChoiceFixtures,
  ...radioQuizFixtures,
  ...inlineGapFixtures,
  ...typedTransformFixtures,
  ...dictationFixtures,
  ...lineMatchFixtures,
  ...wordSpotFixtures,
  ...memoryMatchFixtures,
  ...wordOrderFixtures,
  ...phraseReorderFixtures,
  ...dragFillGapsFixtures,
  ...flashcardsFixtures,
];
