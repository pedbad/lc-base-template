/**
 * axe-open-states.spec.ts — axe with things OPEN, in light and dark (TODO §E12b, spec
 * docs/specs/2026-10-15-exercise-flows-axe-design.md §5). pages.spec.ts checks each page
 * as loaded, where the exercises sit in closed <details> and no overlay exists, so axe
 * never measured them. Dark follows prefers-color-scheme when nothing is stored
 * (index.html's inline script), so colorScheme emulation is enough.
 */
import { expect, test, type Page } from '@playwright/test';

import {
  EXERCISE_HEADINGS,
  animationsInside,
  animationsSettled,
  expectNoAxeViolations,
  openExercise,
} from './support';

/** Rounds of opening before giving up: opening one accordion can reveal another. */
const MAX_ROUNDS = 5;

/**
 * Opens every closed <details> whose summary is visible, round after round, until a round
 * opens nothing: opening one can reveal another (a transcript inside an accordion).
 * Each is addressed by its index, which a click does not change, unlike a
 * `:not([open])` selector. Bounded, so one that will not open fails loudly.
 */
async function openEveryAccordion(page: Page): Promise<void> {
  const all = page.locator('details');
  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    let opened = 0;
    const count = await all.count();
    for (let index = 0; index < count; index += 1) {
      const details = all.nth(index);
      const summary = details.locator(':scope > summary');
      if ((await details.getAttribute('open')) !== null || !(await summary.isVisible())) continue;
      await summary.click();
      await expect(details).toHaveAttribute('open', '');
      await animationsInside(details);
      opened += 1;
    }
    if (opened === 0) return;
  }
  throw new Error(`<details> were still opening after ${MAX_ROUNDS} rounds`);
}

/** Opens a popup from its link. The links sit inside accordions, so open those first. */
async function openPopup(page: Page, linkText: string): Promise<void> {
  await openEveryAccordion(page);
  // ModalLink renders a <button>, not the <a> authors write.
  await page.getByRole('button', { name: linkText }).filter({ visible: true }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await animationsInside(dialog);
}

const OPEN_STATES: { name: string; open: (page: Page) => Promise<void> }[] = [
  { name: 'every accordion open', open: openEveryAccordion },
  { name: 'the example popup open', open: (page) => openPopup(page, 'open the example popup') },
  {
    name: 'the conjugation popup open',
    open: (page) => openPopup(page, 'open the conjugation popup'),
  },
  {
    name: 'a select dropdown open',
    open: async (page) => {
      const exercise = await openExercise(page, EXERCISE_HEADINGS.select);
      await exercise.getByRole('combobox').first().click();
      const listbox = page.getByRole('listbox');
      await expect(listbox).toBeVisible();
      await animationsInside(listbox);
    },
  },
  {
    name: 'the hover card open',
    open: async (page) => {
      // HoverTerm renders the term as a <button aria-expanded>; focus opens its card.
      const term = page.getByRole('button', { name: "Learning Object's JSON" });
      await term.focus();
      await expect(term).toHaveAttribute('aria-expanded', 'true');
      await animationsSettled(page);
    },
  },
];

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme });

    // Both pages as loaded in light are pages.spec.ts's job.
    if (colorScheme === 'dark') {
      for (const path of ['index.html', 'example.html']) {
        test(`${path} as loaded has no axe violations`, async ({ page }) => {
          await page.goto(path);
          await expect(page.locator('html')).toHaveClass(/\bdark\b/);
          await animationsSettled(page);
          await expectNoAxeViolations(page);
        });
      }
    }

    for (const { name, open } of OPEN_STATES) {
      test(`example.html with ${name} has no axe violations`, async ({ page }) => {
        await page.goto('example.html');
        // Hydrated, so the accordions, links and terms respond to input.
        await expect(page.locator('[role="radiogroup"]').first()).toBeAttached();
        await animationsSettled(page);
        await open(page);
        await expectNoAxeViolations(page);
      });
    }
  });
}
