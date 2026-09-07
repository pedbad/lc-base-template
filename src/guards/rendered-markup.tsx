/**
 * rendered-markup.tsx — the 26 documents guard h validates (buildlist 26, spec §17, §95).
 *
 * WHY THIS FILE EXISTS AT ALL, rather than guard h reading `dist/`. Guard h is the only
 * one of the eight whose subject is a built artefact, so the obvious implementation opens
 * `dist/index.html` and `dist/example.html` — and then a fresh clone has no `dist/`, and
 * the guard either fails for a reason that has nothing to do with accessibility or, far
 * worse, quietly skips and reports green. Rendering the same component trees in process
 * removes the question: there is nothing to be absent.
 *
 * IT IS NOT AN APPROXIMATION OF THE PRERENDERED PAGES — IT IS THE SAME MARKUP.
 * `scripts/prerender.tsx` renders `<App lo={loadLo(folder)} />` per LO and
 * `<CourseHome lessons={buildLoIndex(…)} />` for the landing page, then injects the result
 * into the built `index.html`. This file makes the identical calls with the identical
 * inputs, read off disk by the identical loader. Verified during the survey rather than
 * assumed: the body extracted from `dist/example.html` and `dist/index.html` is
 * BYTE-IDENTICAL to what this produces (23007 and 7324 bytes). Reading `dist/` would in
 * fact be strictly worse even when it exists, because a stale `dist/` validates last
 * week's markup and passes. The only thing `dist/` adds is the `<head>` Vite assembled,
 * which carries no §17 surface — `<html lang>` lives in the source `index.html`, and guard
 * h checks it there.
 *
 * WHY ALL 15 ENGINES AND NOT THE TWO THE PAGES USE (TODO §A-h decision 3). A default
 * build prerenders `select` and `radio-quiz` — the only two types the example LO happens
 * to author. The other thirteen engines' markup appears in no built page at all; they
 * live in the showcase, behind `SHOWCASE=1`. A guard over the two pages would therefore
 * have covered 2 of 15 while reading as though it covered the lot, which is precisely the
 * staleness failure guard d exists to teach. So every showcase fixture is rendered too:
 * 24 fixtures across all 15 engines, plus the 2 pages.
 *
 * THE ENGINE MAP IS EXPLICIT, AND THAT IS THE POINT. `EXERCISE_REGISTRY` holds every
 * engine behind React `lazy()`, which cannot resolve during a static render — that is
 * exactly why `ExerciseHost` renders "This exercise needs JavaScript to run" on a static
 * page, so going through the host would validate that sentence 24 times and no engine at
 * all. Reaching inside a lazy component's internals to force it would be a private React
 * field this guard would break on come the next upgrade. So the components are imported
 * eagerly here, and the second list that creates is closed the way guard e closes the
 * registry: the sweep asserts the map's keys are exactly `EXERCISE_TYPE_KEYS`. A new
 * engine that forgets this file fails the guard rather than silently dropping out of it.
 *
 * Test-only. Nothing in the app imports this, so its eager imports never reach a bundle.
 */
import { StrictMode, type ComponentType } from 'react';
import { renderToString } from 'react-dom/server';
import App from '@/App';
import CourseHome from '@/components/home/CourseHome';
import { type ExerciseType } from '@/config/exercise-types';
import { buildLoIndex } from '@/lo/lo-index';
import { listLoSlugs, loadLo } from '@/lo/load-lo-disk';
import { loSlugsByFolder, sortLoFolders } from '@/lo/lo-slug';
import { SHOWCASE_FIXTURES } from '@/showcase/fixtures';
import ConjugationExercise from '@/exercises/conjugation/ConjugationExercise';
import DictationExercise from '@/exercises/dictation/DictationExercise';
import DragFillGapsExercise from '@/exercises/drag-fill-gaps/DragFillGapsExercise';
import FlashcardsExercise from '@/exercises/flashcards/FlashcardsExercise';
import InlineChoiceExercise from '@/exercises/inline-choice/InlineChoiceExercise';
import InlineTypedGapExercise from '@/exercises/inline-gap/InlineTypedGapExercise';
import LineMatchExercise from '@/exercises/line-match/LineMatchExercise';
import MemoryMatchExercise from '@/exercises/memory-match/MemoryMatchExercise';
import PhraseReorderExercise from '@/exercises/phrase-reorder/PhraseReorderExercise';
import RadioQuizExercise from '@/exercises/radio-quiz/RadioQuizExercise';
import ReadingExercise from '@/exercises/reading/ReadingExercise';
import SelectExercise from '@/exercises/select/SelectExercise';
import TypedTransformExercise from '@/exercises/typed-transform/TypedTransformExercise';
import WordOrderExercise from '@/exercises/word-order/WordOrderExercise';
import WordSpotExercise from '@/exercises/word-spot/WordSpotExercise';

/** One rendered document for guard h to validate. */
export interface RenderedDocument {
  /** What to call it in a failure message: a page filename or `<engine>/<fixture id>`. */
  readonly document: string;
  readonly kind: 'page' | 'fragment';
  readonly html: string;
  /** Which engine produced it; `undefined` for a page. */
  readonly engine?: ExerciseType;
}

/**
 * Every engine, eagerly. The lazy registry cannot be used here — see the header — so the
 * sweep asserts these keys against `EXERCISE_TYPE_KEYS` instead.
 */
const ENGINES: Record<ExerciseType, ComponentType<{ config: unknown }>> = {
  select: SelectExercise,
  'inline-choice': InlineChoiceExercise,
  'radio-quiz': RadioQuizExercise,
  'inline-gap': InlineTypedGapExercise,
  'typed-transform': TypedTransformExercise,
  dictation: DictationExercise,
  'word-order': WordOrderExercise,
  'phrase-reorder': PhraseReorderExercise,
  'drag-fill-gaps': DragFillGapsExercise,
  'line-match': LineMatchExercise,
  'memory-match': MemoryMatchExercise,
  'word-spot': WordSpotExercise,
  flashcards: FlashcardsExercise,
  conjugation: ConjugationExercise,
  reading: ReadingExercise,
};

/**
 * The course landing page plus one page per LO folder — the same set, rendered the same
 * way, that `scripts/prerender.tsx` writes into `dist/`.
 *
 * Named by their built filenames (`index.html`, `<slug>.html`) so a failure points at the
 * page an author would open.
 */
export function renderGuardedPages(): RenderedDocument[] {
  const folders = sortLoFolders(listLoSlugs());
  if (folders.length === 0) {
    throw new Error('guard h: no LO folders found under lo-config/ — nothing to validate');
  }

  const pages: RenderedDocument[] = [
    {
      document: 'index.html',
      kind: 'page',
      html: renderToString(
        <StrictMode>
          <CourseHome lessons={buildLoIndex(folders, loadLo)} />
        </StrictMode>,
      ),
    },
  ];

  for (const [folder, slug] of loSlugsByFolder(folders)) {
    pages.push({
      document: `${slug}.html`,
      kind: 'page',
      html: renderToString(
        <StrictMode>
          <App lo={loadLo(folder)} />
        </StrictMode>,
      ),
    });
  }

  return pages;
}

/**
 * Every showcase fixture, rendered through its engine directly.
 *
 * Directly, not through `ExerciseHost`: the host's lazy boundary renders the
 * JavaScript-required notice under a static render, which is correct for a page and
 * useless for a guard — it would validate that sentence 24 times and no engine markup.
 */
export function renderGuardedFixtures(): RenderedDocument[] {
  return SHOWCASE_FIXTURES.map((fixture) => {
    const Engine = ENGINES[fixture.type];
    if (Engine === undefined) {
      throw new Error(
        `guard h: no eager component for engine "${fixture.type}" — add it to ENGINES in rendered-markup.tsx`,
      );
    }
    return {
      document: `${fixture.type}/${fixture.id}`,
      kind: 'fragment' as const,
      html: renderToString(
        <StrictMode>
          <Engine config={fixture.config} />
        </StrictMode>,
      ),
      engine: fixture.type,
    };
  });
}
