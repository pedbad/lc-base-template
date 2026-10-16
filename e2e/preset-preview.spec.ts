/**
 * preset-preview.spec.ts — a normal build carries none of the sandbox's palette preview
 * (TODO §E18). The preview is for the team's DEBUG=1 demo build; a course a learner
 * opens must not contain its code, its preset CSS, or react to a stored choice. The same
 * fail-closed rule as the debug pages themselves (AGENTS.md hard constraint 6).
 *
 * Runs only against a normal build: since TODO §E12c a `DEBUG=1` build runs `e2e/debug/`
 * instead (playwright.config.ts). So a `dist/` holding the debug pages here fails rather
 * than skips: either the build leaked them, or the wrong suite is running.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const DIST = path.resolve(import.meta.dirname, '../dist');

/** Strings only the preview's code holds: its boot module, storage key and style id. */
const MARKERS = ['preset-preview-boot', 'lc-debug-palette-preset', 'sandbox-token-preset'];

/** Every file under `dir`, recursively. */
function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(full) : [full];
  });
}

/** Fails when `dist/` is a DEBUG=1 build: that is a leak, or the debug suite's to test. */
function requireNormalBuild(): void {
  expect(
    existsSync(path.join(DIST, 'debug-sandbox.html')),
    'dist/ holds the debug pages: a leak, or run the suite with DEBUG=1',
  ).toBe(false);
}

test('the built files hold none of the palette preview', () => {
  requireNormalBuild();
  const textFiles = filesUnder(DIST).filter((file) => /\.(html|js|css)$/.test(file));
  const leaks = textFiles.flatMap((file) => {
    const text = readFileSync(file, 'utf8');
    return MARKERS.filter((marker) => text.includes(marker)).map(
      (marker) => `${path.relative(DIST, file)}: ${marker}`,
    );
  });
  expect(textFiles.length).toBeGreaterThan(0);
  expect(leaks).toEqual([]);
});

for (const pagePath of ['index.html', 'example.html']) {
  test(`${pagePath} ignores a stored preview choice`, async ({ page }) => {
    requireNormalBuild();
    await page.addInitScript(() => {
      localStorage.setItem('lc-debug-palette-preset', 'c-warm-blue');
    });
    await page.goto(pagePath, { waitUntil: 'load' });
    await expect(page.locator('#sandbox-token-preset')).toHaveCount(0);
    await expect(page.getByRole('complementary', { name: 'Palette preview' })).toHaveCount(0);
  });
}
