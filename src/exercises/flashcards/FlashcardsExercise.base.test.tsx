/**
 * The engine keys a deck's save under the course's base path (E13a), so two courses
 * on one site keep apart. Its own file because it mocks `storageScope` (the folder the
 * course is served from; src/lib/assets.ts) for the module: this suite has no page
 * address and no Vite `import.meta.env`, so the scope is always "/" here.
 */
import { afterEach, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import FlashcardsExercise from './FlashcardsExercise';

vi.mock('@/lib/assets', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/assets')>()),
  storageScope: () => '/course/',
}));

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

test('keys the save under the course base path', () => {
  const reads: string[] = [];
  const getItem = (key: string) => {
    reads.push(key);
    return null;
  };
  (globalThis as { window?: unknown }).window = { localStorage: { getItem } };

  renderToStaticMarkup(
    <FlashcardsExercise
      config={{
        type: 'flashcards',
        content: { cards: [{ target: 'uno', native: 'one' }] },
        options: { srs: true },
      }}
      progressId="lo-03-food/02-flashcards"
    />,
  );

  expect(reads).toEqual(['flashcards-srs:v2:/course/lo-03-food/02-flashcards']);
});
