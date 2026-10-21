/**
 * The showcase gives each engine card its own progressId, so its flashcards deck keeps
 * demonstrating saved progress (E13a). Mocks as in `ExerciseHost.progress.test.tsx`:
 * the real host renders no engine on the server.
 */
import { expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ExerciseComponentProps } from '@/exercises/lazy-registry';
import Showcase from './Showcase';
import { SHOWCASE_FIXTURES } from './fixtures';

vi.mock('@/hooks/useIsHydrated', () => ({ useIsHydrated: () => true }));
vi.mock('@/exercises/lazy-registry', () => ({
  getExercise: () =>
    function Echo({ progressId }: ExerciseComponentProps) {
      return <output>{progressId ?? 'none'}</output>;
    },
}));

test('every showcase card hands its engine a progressId named after the card', () => {
  const html = renderToStaticMarkup(<Showcase />);
  const ids = [...html.matchAll(/<output>([^<]*)<\/output>/g)].map((match) => match[1]);
  expect(ids).toEqual(SHOWCASE_FIXTURES.map((fixture) => `showcase/${fixture.id}`));
});
