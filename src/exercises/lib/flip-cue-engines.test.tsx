/**
 * flip-cue-engines.test.tsx — the two flip engines read the cue's phase from the host's
 * FlipCueContext (TODO §E21): no corners once it has gone, and the prerendered page
 * always shows them, whatever the browser saved.
 *
 * The turns themselves are clicks, which this DOM-less suite cannot make, and the
 * example lesson the browser tests open has no flip exercise: they were played by hand
 * in the exercise showcase (TODO §E21).
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, test } from 'vitest';
import FlashcardsExercise from '@/exercises/flashcards/FlashcardsExercise';
import { flashcardsFixtures } from '@/exercises/flashcards/flashcards.fixture';
import MemoryMatchExercise from '@/exercises/memory-match/MemoryMatchExercise';
import { memoryMatchFixtures } from '@/exercises/memory-match/memory-match.fixture';
import { ExerciseHost } from './ExerciseHost';
import { FlipCueContext, STATIC_FLIP_CUE, type FlipCueControl } from './FlipCueContext';
import { flipCueKey } from './flip-cue-store';

const flashcards = flashcardsFixtures[0]?.config;
const memoryMatch = memoryMatchFixtures[0]?.config;

const withPhase = (phase: FlipCueControl['phase'], children: React.ReactNode) =>
  renderToStaticMarkup(
    <FlipCueContext value={{ ...STATIC_FLIP_CUE, phase }}>{children}</FlipCueContext>,
  );

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe.each([
  ['flashcards', () => <FlashcardsExercise config={flashcards} />],
  ['memory-match', () => <MemoryMatchExercise config={memoryMatch} />],
])('%s', (_name, engine) => {
  test('shows the corner while the cue is shown or leaving', () => {
    expect(withPhase('shown', engine())).toContain('class="flip-cue"');
    expect(withPhase('leaving', engine())).toContain('class="flip-cue"');
  });

  test('shows no corner once the cue has gone', () => {
    expect(withPhase('gone', engine())).not.toContain('flip-cue');
  });

  test('shows the corner, still, outside a host', () => {
    expect(renderToStaticMarkup(engine())).toContain('class="flip-cue"');
  });
});

describe('ExerciseHost', () => {
  test('prerenders the pointer even when this browser retired the cue', () => {
    // The static page must equal the first client render, so the saved flag is read
    // only after hydration (useSyncExternalStore's server snapshot is "not retired").
    const saved = new Map([[flipCueKey('/', 'lo-01-a/02-flashcards'), 'retired']]);
    (globalThis as { window?: unknown }).window = {
      localStorage: { getItem: (key: string) => saved.get(key) ?? null },
    };
    const html = renderToStaticMarkup(
      <ExerciseHost type="flashcards" config={flashcards} progressId="lo-01-a/02-flashcards" />,
    );
    expect(html).toContain('lucide-spline-pointer');
  });
});
