/**
 * palette-preview.spec.ts — the sandbox's palette preview (TODO §E18, checked by hand
 * until §E12c). A preset picked in debug-sandbox.html recolours every page of a DEBUG=1
 * build, in light and in dark, and the banner's Reset puts the built palette back. Its
 * absence from a normal build is e2e/preset-preview.spec.ts.
 *
 * The expected colour is read from the page, not written here: `--primary` should resolve
 * to the same value as the palette token the preset points it at (Warm Blue in both
 * themes, src/styles/tokens-variant-c-warm-blue.css), so no hex leaves palette.css.
 */
import { expect, test, type Page } from '@playwright/test';

import { requireDebugBuild } from './debug-support';

type Theme = 'light' | 'dark';

const PRESET = { id: 'c-warm-blue', label: 'C · Warm Blue', token: '--cam-warm-blue' };

/** A custom property's computed value on <html>, var() references resolved. */
function cssVar(page: Page, name: string): Promise<string> {
  return page.evaluate(
    (property) => getComputedStyle(document.documentElement).getPropertyValue(property).trim(),
    name,
  );
}

/** Loads index.html in one theme (the stored choice the theme script reads first). */
async function landingIn(page: Page, theme: Theme): Promise<void> {
  await page.evaluate((value) => localStorage.setItem('lc-theme', value), theme);
  await page.goto('index.html');
  const html = page.locator('html');
  await (theme === 'dark'
    ? expect(html).toHaveClass(/\bdark\b/)
    : expect(html).not.toHaveClass(/\bdark\b/));
}

/** `--primary` on index.html in each theme. */
async function primaryByTheme(page: Page): Promise<Record<Theme, string>> {
  await landingIn(page, 'light');
  const light = await cssVar(page, '--primary');
  await landingIn(page, 'dark');
  const dark = await cssVar(page, '--primary');
  return { light, dark };
}

test('a picked preset recolours another page in both themes, and Reset restores it', async ({
  page,
}) => {
  requireDebugBuild();
  await page.goto('debug-sandbox.html');
  const asBuilt = await primaryByTheme(page);
  const target = await cssVar(page, PRESET.token);
  expect(asBuilt.light).not.toBe(target);
  expect(asBuilt.dark).not.toBe(target);

  await page.goto('debug-sandbox.html');
  await page.getByLabel('Preview preset').selectOption(PRESET.id);
  const banner = page.getByRole('complementary', { name: 'Palette preview' });
  await expect(banner).toContainText(`Previewing palette: ${PRESET.label}`);

  expect(await primaryByTheme(page)).toEqual({ light: target, dark: target });
  await expect(page.locator('#sandbox-token-preset')).toHaveCount(1);

  await banner.getByRole('button', { name: 'Reset' }).click();
  await expect(banner).toHaveCount(0);
  await expect(page.locator('#sandbox-token-preset')).toHaveCount(0);
  expect(await primaryByTheme(page)).toEqual(asBuilt);
});
