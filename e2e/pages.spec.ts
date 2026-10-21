/**
 * pages.spec.ts — every built page loads clean and passes axe (spec §5.1).
 *
 * "Clean" is three checks in one: no console error and no uncaught error (React 19
 * reports a hydration mismatch as an error, so this is also the hydration check,
 * AGENTS.md hard constraint 4), and no request that failed or answered 4xx/5xx (served
 * from a folder, a root-absolute URL 404s, and so does a relative one resolved against
 * the wrong file, so this is the base-path check, hard constraint 3).
 */
import { expect, test, type Page } from '@playwright/test';

import { listLoSlugs } from '../src/lo/lo-folders';
import { loSlugsByFolder, sortLoFolders } from '../src/lo/lo-slug';
import {
  animationsSettled,
  exampleReady,
  expectNoAxeViolations,
  lessonReady,
  watchForProblems,
} from './support';

interface PageCase {
  /** Relative to the base URL — never a leading slash. */
  path: string;
  /** Resolves once the page is hydrated and its lazy parts have loaded. */
  ready: (page: Page) => Promise<void>;
}

/**
 * Every lesson page the build wrote, found the way the prerender finds them: one per
 * folder under lo-config/. A hand-written list checked only the example, so a broken
 * lesson of a course's own passed (review 2026-10-21). The example keeps its stricter
 * check; every other lesson gets the generic one.
 */
const LESSON_PAGES: PageCase[] = [...loSlugsByFolder(sortLoFolders(listLoSlugs())).values()].map(
  (slug) => ({ path: `${slug}.html`, ready: slug === 'example' ? exampleReady : lessonReady }),
);

const PAGES: PageCase[] = [{ path: 'index.html', ready: async () => {} }, ...LESSON_PAGES];

for (const { path, ready } of PAGES) {
  test.describe(path, () => {
    test('loads and hydrates with no errors and no failed requests', async ({ page }) => {
      const problems = watchForProblems(page);
      await page.goto(path, { waitUntil: 'load' });
      await ready(page);
      expect(problems).toEqual([]);
    });

    test('has no axe violations (WCAG 2.2 A and AA)', async ({ page }) => {
      await page.goto(path, { waitUntil: 'load' });
      await ready(page);
      await animationsSettled(page);
      await expectNoAxeViolations(page);
    });
  });
}
