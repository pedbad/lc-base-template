/**
 * memory-match-reveal.spec.ts — "Show answers" while the window is resized (TODO §E12d,
 * from the second review of §E12c). Show answers reorders the deck into solved pairs and
 * plays a FLIP animation over about 0.75 s (620 ms plus an 18 ms stagger per card):
 * every card is moved back to where it was with a transform, then eased to zero
 * (src/exercises/lib/reorderAnimation.ts). A resize in that window reflows the grid under
 * the running animation. Whatever happens, once it ends every card must be in the deck in
 * the answer order and none may keep a transform, inline or from an animation that
 * outlived its run. jsdom has no layout, so only a real browser can check it.
 */
import { expect, test, type Locator } from '@playwright/test';

import { card, openShowcase } from './debug-support';

const FIXTURE = 'memory-match';
const WIDE = { width: 1280, height: 800 };
const NARROW = { width: 480, height: 800 };

/**
 * The pairs the `memory-match` showcase card deals (memory-match.fixture.ts): an image's
 * `alt`, which is its `localLanguage`, to its word. Written here, not imported: the
 * fixture's own imports use the `@/` alias, which this folder's tsconfig does not have.
 */
const PAIRS: ReadonlyMap<string, string> = new Map([
  ['circle', 'el círculo'],
  ['square', 'el cuadrado'],
  ['triangle', 'el triángulo'],
  ['star', 'la estrella'],
]);

/** What a card is, read from its markup (the front face is in the DOM face down too). */
async function describe(button: Locator): Promise<{ kind: string; content: string }> {
  const kind = (await button.getAttribute('data-kind')) ?? '';
  const content =
    kind === 'image'
      ? ((await button.locator('img').getAttribute('alt')) ?? '')
      : ((await button.locator('.memory-card-word').textContent()) ?? '');
  return { kind, content };
}

/**
 * Two tries that miss: an image card and a word that belong to different pairs, twice,
 * which opens Show answers (two missed pairs). Each miss waits for both cards to turn
 * face down again, as the game will not take a third card until then.
 */
async function missTwice(deck: Locator): Promise<void> {
  const cards = deck.locator('button.memory-card');
  const found = await Promise.all(
    (await cards.all()).map(async (button) => ({ button, ...(await describe(button)) })),
  );
  const images = found.filter((entry) => entry.kind === 'image');
  const words = found.filter((entry) => entry.kind === 'text');
  for (const index of [0, 1]) {
    const image = images[index];
    const word = words.find((entry) => entry.content !== PAIRS.get(image?.content ?? ''));
    if (!image || !word) throw new Error('the deck has no mismatched pair to turn');
    await image.button.click();
    await word.button.click();
    await expect(image.button).toHaveAttribute('data-revealed', 'false');
    await expect(word.button).toHaveAttribute('data-revealed', 'false');
  }
}

test('a resize during the Show answers reorder leaves every card in place and transform-free', async ({
  page,
}) => {
  await page.setViewportSize(WIDE);
  await openShowcase(page);
  const deck = card(page, FIXTURE);
  await missTwice(deck);

  await deck.getByRole('button', { name: 'Show answers' }).click();
  await page.setViewportSize(NARROW);
  // The resize must have landed inside the reorder, or this tests nothing.
  expect(
    await page.evaluate(() => document.getAnimations().some((a) => a.playState === 'running')),
    'the reorder had already ended when the viewport was resized',
  ).toBe(true);
  // Reflow again, the other way, to move the grid under what is still running.
  await page.setViewportSize(WIDE);

  const cards = deck.locator('ul.memory-match-deck > li > .memory-card-wrap > button.memory-card');
  await expect(cards).toHaveCount(PAIRS.size * 2);
  // The reorder is over once nothing animates under the deck.
  await expect
    .poll(() => deck.evaluate((element) => element.getAnimations({ subtree: true }).length))
    .toBe(0);

  const all = await cards.all();
  for (const button of all) {
    await expect(button).toHaveAttribute('data-state', 'matched');
    await expect(button).not.toHaveAttribute('style', /transform/);
    expect(await button.evaluate((element) => getComputedStyle(element).transform)).toBe('none');
    expect(await button.locator('xpath=ancestor::li').evaluate((li) => li.style.transform)).toBe(
      '',
    );
  }
  // The answer order: each image beside its word, pairs in the deck's own pair order.
  const described = await Promise.all(all.map(describe));
  for (let index = 0; index < described.length; index += 2) {
    const [image, word] = [described[index], described[index + 1]];
    expect(image?.kind).toBe('image');
    expect(word?.kind).toBe('text');
    expect(word?.content).toBe(PAIRS.get(image?.content ?? ''));
  }
});
