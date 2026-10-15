/**
 * exercise-failure.spec.ts — an engine that fails to load (TODO §E13b). The select
 * engine's chunk is refused, as a dropped connection or a stale deploy would; the
 * learner must see the fallback with a way out, the other exercise must still work, and
 * once the chunk is reachable again the Reload button brings the exercise back. No
 * watchForProblems() here: a failed request and a logged error are expected.
 */
import { expect, test } from '@playwright/test';

import { EXERCISE_HEADINGS, exampleReady, openExercise } from './support';

test('a failed engine load shows a reload notice and leaves the others working', async ({
  page,
}) => {
  await page.route(/\/assets\/SelectExercise-[^/]+\.js$/, (route) => route.abort());
  await page.goto('example.html');

  const select = await openExercise(page, EXERCISE_HEADINGS.select);
  const alert = select.getByRole('alert');
  await expect(alert).toContainText('This exercise could not load.');
  await expect(alert.getByRole('button', { name: 'Reload the page' })).toBeVisible();

  const quiz = await openExercise(page, EXERCISE_HEADINGS.radioQuiz);
  await expect(quiz.getByRole('radiogroup').first()).toBeVisible();

  await page.unrouteAll();
  await Promise.all([
    page.waitForEvent('load'),
    alert.getByRole('button', { name: 'Reload the page' }).click(),
  ]);
  await exampleReady(page);
});
