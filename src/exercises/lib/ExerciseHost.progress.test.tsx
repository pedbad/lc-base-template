/**
 * ExerciseHost hands an exercise's `progressId` to its engine (E13a). In its own file
 * because it mocks the hydration hook and the registry for the whole module: the real
 * host renders no engine on the server, so the hand-over is only visible this way.
 */
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ExerciseComponentProps } from '@/exercises/lazy-registry';
import { ExerciseHost } from './ExerciseHost';

vi.mock('@/hooks/useIsHydrated', () => ({ useIsHydrated: () => true }));
vi.mock('@/exercises/lazy-registry', () => ({
  getExercise: () =>
    function Echo({ progressId }: ExerciseComponentProps) {
      return <output>{progressId ?? 'none'}</output>;
    },
}));

const CONFIG = { type: 'flashcards', title: 'Deck', content: {} };

describe('ExerciseHost progressId', () => {
  test('passes the progressId through to the engine', () => {
    const html = renderToStaticMarkup(
      <ExerciseHost type="flashcards" config={CONFIG} progressId="lo-03-food/02-flashcards" />,
    );
    expect(html).toContain('<output>lo-03-food/02-flashcards</output>');
  });

  test('passes nothing when the host was given none', () => {
    const html = renderToStaticMarkup(<ExerciseHost type="flashcards" config={CONFIG} />);
    expect(html).toContain('<output>none</output>');
  });
});
