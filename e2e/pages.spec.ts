/**
 * pages.spec.ts — every built page loads clean and passes axe (spec §5.1).
 *
 * "Clean" is three checks in one: no console error and no uncaught error (React 19
 * reports a hydration mismatch as an error, so this is also the hydration check,
 * AGENTS.md hard constraint 4), and no request that failed or answered 4xx/5xx (under
 * BASE_URL=/course/ a root-absolute URL 404s, so this is the base-path check, hard
 * constraint 3).
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** axe rule tags: WCAG 2.0, 2.1 and 2.2, levels A and AA. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

interface PageCase {
  /** Relative to the base URL — never a leading slash. */
  path: string;
  /** Resolves once the page is hydrated and its lazy parts have loaded. */
  ready: (page: Page) => Promise<void>;
}

const PAGES: PageCase[] = [
  { path: 'index.html', ready: async () => {} },
  {
    path: 'example.html',
    // The exercise engines are lazy chunks that render only after hydration
    // (ExerciseHost). A radiogroup in the DOM proves hydration happened and a chunk
    // loaded; no "Loading…" Suspense fallback left proves EVERY engine's chunk rendered
    // (lo-00-example also has a `select` engine, which renders no radiogroup). Attached,
    // not visible: the exercises sit in closed <details>, and role queries skip hidden
    // elements, so the radiogroup is a CSS locator. getByText does not filter by
    // visibility, so it counts fallbacks inside closed <details> too.
    ready: async (page) => {
      await expect(page.locator('[role="radiogroup"]').first()).toBeAttached();
      await expect(page.getByText('Loading…', { exact: true })).toHaveCount(0);
    },
  },
];

/**
 * A request the browser cancelled itself (a media range request superseded by the next
 * one) is not a broken one. Note what the 4xx check can see: `vite preview` answers a
 * missing file INSIDE the base with the landing page and 200 (its SPA fallback), so the
 * check catches requests that escape the base — the base-path mistakes it is for — not
 * every missing file.
 */
const isCancelled = (errorText: string | undefined): boolean =>
  /aborted|cancelled/i.test(errorText ?? '');

/**
 * Firefox reports a web font it cannot use as a console error; Chromium and WebKit stay
 * silent. Feijoa is licensed and never committed (AGENTS.md hard constraint 5), so on a
 * fresh clone and in CI its files are missing and headings fall back to Open Sans by
 * design (src/styles/app.css). Where the files exist, Firefox still discards a table from
 * the Bold cut and uses the font. Both are known and harmless; requesting Feijoa only
 * when its files exist is TODO §E5. Narrow on purpose: any other font, any other error,
 * still fails.
 */
const isKnownFeijoaFontNotice = (text: string): boolean =>
  /downloadable font: .*font-family: "Feijoa"/.test(text);

/** Collects every problem from this moment on. */
function watchForProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !isKnownFeijoaFontNotice(message.text())) {
      problems.push(`console error: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => problems.push(`uncaught: ${error.message}`));
  page.on('requestfailed', (request) => {
    const errorText = request.failure()?.errorText;
    if (!isCancelled(errorText)) problems.push(`request failed: ${request.url()} (${errorText})`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  return problems;
}

/**
 * Waits for entry animations to finish. Mid-flight, a fade-in (LoCard's on the landing
 * page) blends text toward the background and axe measures a contrast the settled page
 * does not have. Only running, finite animations on a rendered element: an endless one
 * (a spinner) never finishes, and WebKit can report CSS transitions inside a closed
 * <details> as "finished" while their `finished` promise never settles — text axe does
 * not measure anyway. An auto-waiting condition, not a sleep.
 */
async function animationsSettled(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => {
          const { effect } = animation;
          const target = effect instanceof KeyframeEffect ? effect.target : null;
          return (
            animation.playState === 'running' &&
            effect?.getTiming().iterations !== Infinity &&
            target?.checkVisibility() !== false
          );
        })
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}

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
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}
