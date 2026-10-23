/**
 * claude-skills.spec.ts — the Claude skills debug page (claude-skills.html): a card per
 * skill in .claude/skills/, its recipe behind a disclosure, then the folder's README of
 * shared steps (TODO §E40). It loads with no console errors or failed requests and
 * passes axe in both themes, with a recipe open.
 */
import { expect, test } from '@playwright/test';

import { expectNoAxeViolations, watchForProblems } from '../support';
import { requireDebugBuild } from './debug-support';

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme });

    test('lists the skills, cleanly and accessibly', async ({ page }) => {
      requireDebugBuild();
      const problems = watchForProblems(page);
      await page.goto('claude-skills.html');

      await expect(page.getByRole('heading', { level: 1, name: 'Claude skills' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: 'add-lo' })).toBeVisible();
      await page.locator('#skill-add-lo').getByText('Read the recipe').click();
      await expect(
        page.getByRole('heading', { name: 'Add a lesson (Learning Object)' }),
      ).toBeVisible();
      await expectNoAxeViolations(page);
      expect(problems).toEqual([]);
    });
  });
}

test("a recipe's link to the shared steps lands on them, on this page", async ({ page }) => {
  requireDebugBuild();
  await page.goto('claude-skills.html');
  const recipe = page.locator('#skill-add-exercise-engine');
  await recipe.getByText('Read the recipe').click();
  await recipe.locator('a[href="#skills--where-am-i"]').first().click();
  await expect(page).toHaveURL(/claude-skills\.html#skills--where-am-i$/);
  await expect(page.locator('#skills--where-am-i')).toBeInViewport();
});
