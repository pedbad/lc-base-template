/**
 * flashcards-done.spec.ts — a finished deck leaves a done card in the card's place
 * (TODO §E22), checked by hand until §E12c. The card's place is held from first card to
 * done card, so the Reset button below it never moves: not between turns, not at the end.
 */
import { expect, test, type Locator } from '@playwright/test';

import { card, openShowcase } from './debug-support';

const CARDS = 4;

/**
 * How far `locator`'s top edge sits below its card's (`article`), in whole pixels.
 * Relative to the card, not the viewport (which moves whenever a click scrolls) nor the
 * document (which moves if anything above the card reflows).
 */
function offsetInCard(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const article = element.closest('article');
    if (!article) throw new Error('not inside a showcase card');
    return Math.round(element.getBoundingClientRect().top - article.getBoundingClientRect().top);
  });
}

test('"Got it" on every card shows the done card, and Reset stays put', async ({ page }) => {
  await openShowcase(page);
  const deck = card(page, 'flashcards');
  const reset = deck.getByRole('button', { name: 'Reset', exact: true });
  const resetTop = await offsetInCard(reset);

  for (let turn = 1; turn <= CARDS; turn += 1) {
    await deck.locator('.flashcards-flip-hit').click();
    expect(await offsetInCard(reset), `after turning card ${turn}`).toBe(resetTop);
    await deck.getByRole('button', { name: 'Got it', exact: true }).click();
    expect(await offsetInCard(reset), `after rating card ${turn}`).toBe(resetTop);
  }

  const done = deck.locator('.flashcards-done');
  await expect(done).toBeVisible();
  await expect(done).toContainText('Deck complete');
  await expect(done).toContainText(`${CARDS} cards learned`);
  await expect(deck.locator('.flashcards-flip-hit')).toHaveCount(0);
  expect(await offsetInCard(reset), 'at the done card').toBe(resetTop);
});
