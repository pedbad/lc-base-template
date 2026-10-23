/**
 * culp-syllabi.spec.ts — the CULP syllabi debug page (culp-syllabi.html), the folder's
 * README rendered: how docs/culp-syllabi/ is laid out, and the skill that reads it. It
 * loads with no console errors or failed requests and passes axe in both themes (its
 * tables and its tree are scrollable regions a keyboard must reach).
 */
import { expect, test } from '@playwright/test';

import { expectNoAxeViolations, watchForProblems } from '../support';
import { requireDebugBuild } from './debug-support';

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme });

    test('renders the README, cleanly and accessibly', async ({ page }) => {
      requireDebugBuild();
      const problems = watchForProblems(page);
      await page.goto('culp-syllabi.html');

      await expect(page.getByRole('heading', { level: 1, name: 'CULP syllabi' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Finding the right note' })).toBeVisible();
      await expect(
        page.getByRole('region', { name: /docs\/culp-syllabi\/README\.md code sample 1/ }),
      ).toBeVisible();
      await expectNoAxeViolations(page);
      expect(problems).toEqual([]);
    });
  });
}

test('its link to CONTRIBUTING opens the sandbox at that doc', async ({ page }) => {
  requireDebugBuild();
  await page.goto('culp-syllabi.html');
  await page
    .locator('main')
    .getByRole('link', { name: /How a change reaches/ })
    .click();
  await expect(page).toHaveURL(/debug-sandbox\.html#contributing--how-a-change-reaches-main/);
  await expect(page.locator('#contributing--how-a-change-reaches-main')).toBeVisible();
});
