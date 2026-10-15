/**
 * exercise-flows.spec.ts — the learner's path through an exercise in a real browser
 * (TODO §E12b, spec docs/specs/2026-10-15-exercise-flows-axe-design.md §4): answer,
 * Check, change an answer, Show answers, Reset. State is read the way a learner or a
 * screen reader meets it: aria-checked, button names, the progress line. Both exercises
 * shuffle, so an option is always chosen by its label, never by position.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

import { EXERCISE_HEADINGS, exampleReady, openExercise } from './support';

const button = (scope: Locator, name: string): Locator =>
  scope.getByRole('button', { name, exact: true });
const progress = (scope: Locator): Locator => scope.getByRole('status');

/** Nothing answered: Check disabled, no Reset, no Show answers. */
async function expectFreshStart(exercise: Locator): Promise<void> {
  await expect(button(exercise, 'Check')).toBeDisabled();
  await expect(button(exercise, 'Reset')).toHaveCount(0);
  await expect(button(exercise, 'Show answers')).toHaveCount(0);
}

test.describe('radio-quiz: answer, check, edit, reveal, reset', () => {
  let quiz: Locator;
  const question = (n: number): Locator =>
    quiz.getByRole('radiogroup', { name: `Choose answer for question ${n}` });
  const pick = (n: number, label: string): Promise<void> =>
    question(n).getByRole('radio', { name: label, exact: true }).click();
  const explanation1 = (): Locator => quiz.getByText('«Buenos días» es formal');

  test.beforeEach(async ({ page }) => {
    await page.goto('example.html');
    await exampleReady(page);
    quiz = await openExercise(page, EXERCISE_HEADINGS.radioQuiz);
  });

  test('starts with nothing answered', async () => {
    await expect(quiz.getByRole('radio', { checked: true })).toHaveCount(0);
    await expectFreshStart(quiz);
  });

  test('Check grades, explains the wrong answer and offers Show answers', async () => {
    await pick(1, '¡Hola!');
    await pick(2, 'martes');
    await button(quiz, 'Check').click();
    await expect(progress(quiz)).toHaveText('1 correct out of 2');
    await expect(explanation1()).toBeVisible();
    await expect(quiz.getByText('«Martes» es un día')).toHaveCount(0);
    await expect(button(quiz, 'Show answers')).toBeVisible();
  });

  test('changing the wrong answer clears its verdict, then Check gives full marks', async () => {
    await pick(1, '¡Hola!');
    await pick(2, 'martes');
    await button(quiz, 'Check').click();
    await pick(1, 'Buenos días');
    await expect(explanation1()).toHaveCount(0);
    await button(quiz, 'Check').click();
    await expect(progress(quiz)).toHaveText('2 correct out of 2');
    await expect(button(quiz, 'Show answers')).toHaveCount(0);
  });

  test('Show answers selects every correct option and hides explanations', async () => {
    await pick(1, '¡Hola!');
    await button(quiz, 'Check').click();
    await button(quiz, 'Show answers').click();
    await expect(question(1).getByRole('radio', { name: 'Buenos días' })).toBeChecked();
    await expect(question(2).getByRole('radio', { name: 'martes' })).toBeChecked();
    await expect(explanation1()).toHaveCount(0);
    await expect(button(quiz, 'Show answers')).toHaveCount(0);
  });

  test('Reset returns to the start', async () => {
    await pick(1, '¡Hola!');
    await button(quiz, 'Check').click();
    await button(quiz, 'Reset').click();
    await expect(quiz.getByRole('radio', { checked: true })).toHaveCount(0);
    await expectFreshStart(quiz);
  });

  test('Tab moves between questions, not between pills (roving tab stop)', async ({ page }) => {
    const firstPill = (n: number): Locator => question(n).getByRole('radio').first();
    await quiz.locator('summary').focus();
    // Tab on until focus reaches a pill: anything focusable in the instructions comes
    // first. Bounded, so a broken tab order fails instead of looping.
    for (let presses = 0; presses < 10; presses += 1) {
      await page.keyboard.press('Tab');
      if (await firstPill(1).evaluate((element) => element === document.activeElement)) break;
    }
    await expect(firstPill(1)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(firstPill(2)).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(firstPill(1)).toBeFocused();
  });
});

test.describe('select: answer, check, edit, reveal, reset', () => {
  let page: Page;
  let exercise: Locator;
  /** The blank in the line whose sentence contains `words` (lines shuffle). Each line,
   *  in either layout, is a `div.grid` holding its sentence, its one select and its
   *  result slot (SelectExercise.tsx). */
  const blankIn = (words: string): Locator =>
    exercise.locator('div.grid', { hasText: words }).getByRole('combobox');
  async function choose(words: string, option: string): Promise<void> {
    await blankIn(words).click();
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await listbox.getByRole('option', { name: option, exact: true }).click();
    await expect(listbox).toHaveCount(0);
  }

  test.beforeEach(async ({ page: browserPage }) => {
    page = browserPage;
    await page.goto('example.html');
    await exampleReady(page);
    exercise = await openExercise(page, EXERCISE_HEADINGS.select);
  });

  test('starts with nothing answered', async () => {
    await expectFreshStart(exercise);
  });

  test('Check grades and offers Show answers; fixing the wrong one gives full marks', async () => {
    await choose('de Madrid', 'eres');
    await choose('muy amable', 'eres');
    await choose('profesora de español', 'es');
    await button(exercise, 'Check').click();
    await expect(progress(exercise)).toHaveText('2 correct out of 3');
    await expect(button(exercise, 'Show answers')).toBeVisible();
    await choose('de Madrid', 'soy');
    await button(exercise, 'Check').click();
    await expect(progress(exercise)).toHaveText('3 correct out of 3');
    await expect(button(exercise, 'Show answers')).toHaveCount(0);
  });

  test('Show answers fills every blank correctly', async () => {
    await choose('de Madrid', 'eres');
    await button(exercise, 'Check').click();
    await button(exercise, 'Show answers').click();
    // The shown value is the trigger's `lang` span: the trigger's own text also holds
    // the chevron icon's fallback glyph.
    const shown = (words: string): Locator => blankIn(words).locator('span[lang]');
    await expect(shown('de Madrid')).toHaveText('soy');
    await expect(shown('muy amable')).toHaveText('eres');
    await expect(shown('profesora de español')).toHaveText('es');
  });

  test('Reset returns to the start', async () => {
    await choose('de Madrid', 'eres');
    await button(exercise, 'Check').click();
    await button(exercise, 'Reset').click();
    await expectFreshStart(exercise);
  });
});
