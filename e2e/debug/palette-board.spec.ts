/**
 * palette-board.spec.ts — the sandbox's brand board (TODO §E19, spec-checked by hand until
 * §E12d): `debug-sandbox.html#palette`. The board's colour cards carry only token NAMES
 * in the source; every HEX comes from the page after it loads (useLiveColours reads a
 * hidden probe and a canvas), so a server-style render, a failed read or a broken probe
 * shows "—" on every card. Vitest renders to strings and sees exactly that placeholder,
 * so only a browser can check that the real values arrive, and that axe passes over the
 * board in both themes. Dark follows prefers-color-scheme when nothing is stored
 * (e2e/axe-open-states.spec.ts does the same).
 *
 * The expected Cambridge Blue is the one literal here: `--cam-blue` in
 * src/styles/palette.css, the file that holds every hex.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

import { animationsSettled, expectNoAxeViolations } from '../support';
import { requireDebugBuild } from './debug-support';

const HEX = /^#[0-9A-F]{6}$/;
const CAMBRIDGE_BLUE = { name: 'Cambridge Blue', hex: '#8EE8D8', token: '--cam-blue' };

/** The cards' hex readouts. */
function hexes(page: Page): Locator {
  return page.locator('#palette [data-slot="hex"]');
}

/** One primitive's card, found by its heading. */
function colourCard(page: Page, name: string): Locator {
  return page
    .locator('#palette li')
    .filter({ has: page.getByRole('heading', { level: 5, name, exact: true }) });
}

/** Opens the board in the given theme and waits until its colours have been read. */
async function openBoard(page: Page, theme: 'light' | 'dark' = 'light'): Promise<void> {
  requireDebugBuild();
  await page.goto('debug-sandbox.html#palette');
  await expect(page.locator('#palette')).toBeVisible();
  const html = page.locator('html');
  await (theme === 'dark'
    ? expect(html).toHaveClass(/\bdark\b/)
    : expect(html).not.toHaveClass(/\bdark\b/));
  await expect(hexes(page).first()).toBeVisible();
  // Every card has been read: no placeholder is left among them.
  await expect.poll(async () => (await hexes(page).allTextContents()).length).toBeGreaterThan(0);
  await expect
    .poll(async () => (await hexes(page).allTextContents()).filter((text) => !HEX.test(text)))
    .toEqual([]);
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme });

    test('the cards show real HEX values, Cambridge Blue among them', async ({ page }) => {
      await openBoard(page, colorScheme);

      for (const text of await hexes(page).allTextContents()) {
        expect(text).toMatch(HEX);
        expect(text).not.toBe('—');
      }
      await expect(colourCard(page, CAMBRIDGE_BLUE.name).locator('[data-slot="hex"]')).toHaveText(
        CAMBRIDGE_BLUE.hex,
      );
    });

    test('the board has no axe violations', async ({ page }) => {
      await openBoard(page, colorScheme);
      await animationsSettled(page);
      await expectNoAxeViolations(page, '#palette');
    });
  });
}

test('a card’s Token fold holds its token name', async ({ page }) => {
  await openBoard(page);
  const fold = colourCard(page, CAMBRIDGE_BLUE.name).locator('details');
  await expect(fold.locator('code').first()).toBeHidden();

  await fold.locator('summary', { hasText: 'Token' }).click();

  await expect(fold).toHaveAttribute('open', '');
  await expect(fold.locator('code').first()).toBeVisible();
  await expect(fold.locator('code').first()).toHaveText(CAMBRIDGE_BLUE.token);
});
