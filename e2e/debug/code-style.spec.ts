/**
 * code-style.spec.ts — the Code style debug page (code-style.html), docs/STYLE.md
 * rendered with its examples. It loads with no console errors or failed requests,
 * passes axe in both themes (its code samples are scrollable regions a keyboard must
 * reach), and every debug page's nav reaches it.
 */
import { expect, test } from '@playwright/test';

import { expectNoAxeViolations, watchForProblems } from '../support';
import { requireDebugBuild } from './debug-support';

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme });

    test('renders the guide with its examples, cleanly and accessibly', async ({ page }) => {
      requireDebugBuild();
      const problems = watchForProblems(page);
      await page.goto('code-style.html');

      await expect(page.getByRole('heading', { level: 1, name: 'Code style' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Habits nothing enforces' })).toBeVisible();
      await expect(
        page.getByRole('region', { name: /docs\/STYLE\.md code sample 1/ }),
      ).toBeVisible();
      await expectNoAxeViolations(page);
      expect(problems).toEqual([]);
    });
  });
}

test('every other debug page links to it, and its hub links open the sandbox', async ({ page }) => {
  requireDebugBuild();
  for (const other of ['debug-sandbox.html', 'exercise-showcase.html', 'ui-showcase.html']) {
    await page.goto(other);
    await expect(page.getByRole('link', { name: 'Code style' }), other).toHaveAttribute(
      'href',
      /code-style\.html$/,
    );
  }

  await page.goto('code-style.html');
  await page
    .locator('main')
    .getByRole('link', { name: /AGENTS\.md/ })
    .first()
    .click();
  await expect(page).toHaveURL(/debug-sandbox\.html#agents/);
  await expect(page.locator('#agents')).toBeVisible();
});
