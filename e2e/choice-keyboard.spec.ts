/**
 * choice-keyboard.spec.ts — arrow keys move the choice pills' selection AND focus
 * together (TODO §E9, spec §5.2). The bug: ChoicePillGroup's handleKeyDown called
 * onSelect(next) but left focus on the old pill, so the next arrow press started from
 * there again — Right, Right selected the second pill twice. The group is shared by
 * radio-quiz, reading and inline-choice; this drives radio-quiz on example.html.
 *
 * The quiz sets `shuffle: true`, so pills are addressed by POSITION, never by label.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

/** Opens the radio-quiz accordion and returns question 1's three pills, in order. */
async function firstQuestionPills(page: Page): Promise<Locator[]> {
  await page.goto('example.html');
  const quiz = page.locator('details', { has: page.locator('#exercise-02-radio-quiz-heading') });
  await quiz.locator('summary').click();
  const pills = quiz
    .getByRole('radiogroup', { name: 'Choose answer for question 1' })
    .getByRole('radio');
  await expect(pills).toHaveCount(3);
  return [pills.nth(0), pills.nth(1), pills.nth(2)];
}

/** Exactly pill `index` is checked, and it has focus. */
async function expectSelectedAndFocused(pills: Locator[], index: number) {
  for (const [position, pill] of pills.entries()) {
    await expect(pill).toHaveAttribute('aria-checked', position === index ? 'true' : 'false');
  }
  await expect(pills[index]).toBeFocused();
}

test.describe('choice pills: arrow keys move selection and focus together', () => {
  let pills: Locator[];

  test.beforeEach(async ({ page }) => {
    pills = await firstQuestionPills(page);
    // Click selects; focus() as well because a click does not focus a button in every
    // browser (WebKit follows macOS, where it does not). From here on, keys only.
    await pills[0].click();
    await pills[0].focus();
    await expectSelectedAndFocused(pills, 0);
  });

  test('Right, Right lands on the third pill', async ({ page }) => {
    await page.keyboard.press('ArrowRight');
    await expectSelectedAndFocused(pills, 1);
    await page.keyboard.press('ArrowRight');
    await expectSelectedAndFocused(pills, 2);
  });

  test('Right from the last pill wraps to the first', async ({ page }) => {
    await page.keyboard.press('End');
    await page.keyboard.press('ArrowRight');
    await expectSelectedAndFocused(pills, 0);
  });

  test('Left from the first pill wraps to the last, then keeps going', async ({ page }) => {
    await page.keyboard.press('ArrowLeft');
    await expectSelectedAndFocused(pills, 2);
    await page.keyboard.press('ArrowLeft');
    await expectSelectedAndFocused(pills, 1);
  });

  test('Down and Up move like Right and Left', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expectSelectedAndFocused(pills, 2);
    await page.keyboard.press('ArrowUp');
    await expectSelectedAndFocused(pills, 1);
  });

  test('End and Home jump', async ({ page }) => {
    await page.keyboard.press('End');
    await expectSelectedAndFocused(pills, 2);
    await page.keyboard.press('Home');
    await expectSelectedAndFocused(pills, 0);
  });

  test('only the selected pill is a Tab stop after arrowing', async ({ page }) => {
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(pills[0]).toHaveAttribute('tabindex', '-1');
    await expect(pills[1]).toHaveAttribute('tabindex', '-1');
    await expect(pills[2]).toHaveAttribute('tabindex', '0');
  });
});
