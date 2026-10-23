/**
 * debug-nav.spec.ts — every debug page's header lists all five debug pages, course home
 * and the repo in one order, and marks the page you are on: a link with
 * aria-current="page", drawn apart from the others (maintainer, 2026-10-23).
 */
import { expect, test } from '@playwright/test';

import { requireDebugBuild } from './debug-support';

const PAGES = [
  { file: 'exercise-showcase.html', label: 'Exercise showcase' },
  { file: 'debug-sandbox.html', label: 'Debug sandbox' },
  { file: 'ui-showcase.html', label: 'UI showcase' },
  { file: 'code-style.html', label: 'Code style' },
  { file: 'culp-syllabi.html', label: 'CULP syllabi' },
] as const;

const LINKS = [...PAGES.map(({ label }) => label), 'Course home', /^GitHub repo/];

for (const { file, label } of PAGES) {
  test(`${file} lists every debug page and marks itself current`, async ({ page }) => {
    requireDebugBuild();
    await page.goto(file);
    const nav = page.locator('header nav');

    const links = nav.getByRole('link');
    await expect(links).toHaveText(LINKS);
    await expect(nav.locator('[aria-current]')).toHaveCount(1);

    const current = nav.getByRole('link', { name: label, exact: true });
    await expect(current).toHaveAttribute('aria-current', 'page');
    await expect(current).toHaveAttribute('href', new RegExp(`${file.replace('.', '\\.')}$`));

    // The highlight is visible, not only announced: its fill differs from a plain link's.
    const background = (locator: typeof current) =>
      locator.evaluate((element) => getComputedStyle(element).backgroundColor);
    const other = nav.getByRole('link', { name: 'Course home' });
    expect(await background(current)).not.toBe(await background(other));
  });
}
