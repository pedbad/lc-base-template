/**
 * flip-cue.spec.ts — the "Tap to flip" corner retires after three turns (TODO §E21, spec
 * docs/specs/2026-10-16-flip-cue-retire-design.md), checked by hand until §E12c.
 * Flashcards count a turn from front to back and play the exit on the next front;
 * memory-match counts every card turned face up and retires all its corners at once.
 * Retirement is saved per exercise; flashcards' Clear saved progress brings it back.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

import { card, flipCueKey, openShowcase, showcaseReady, stored } from './debug-support';

const RETIRE_AFTER_TURNS = 3;
const EXITS = /^(peel|pop|wave|tuck)$/;

/** Turns `deck`'s current card to its back, then rates it "Again": one turn. */
async function turnAndRateAgain(deck: Locator): Promise<void> {
  await deck.locator('.flashcards-flip-hit').click();
  await deck.getByRole('button', { name: 'Again', exact: true }).click();
}

/**
 * Records the first animation each flip cue starts: its name and duration as computed
 * then. A reduced-motion fade lasts 0.4 s, too short to catch by polling the element.
 */
async function recordCueAnimations(page: Page): Promise<void> {
  await page.evaluate(() => {
    const seen: { name: string; duration: string }[] = [];
    Object.assign(window, { cueAnimations: seen });
    document.addEventListener('animationstart', (event) => {
      const { target } = event;
      if (target instanceof HTMLElement && target.classList.contains('flip-cue')) {
        seen.push({
          name: event.animationName,
          duration: getComputedStyle(target).animationDuration,
        });
      }
    });
  });
}

function cueAnimations(page: Page): Promise<{ name: string; duration: string }[]> {
  return page.evaluate(
    () =>
      (window as unknown as { cueAnimations: { name: string; duration: string }[] }).cueAnimations,
  );
}

test.describe('flashcards', () => {
  const FIXTURE = 'flashcards';

  test('three turns retire the cue and the pointer, for good', async ({ page }) => {
    await openShowcase(page);
    const deck = card(page, FIXTURE);
    const cue = deck.locator('.flip-cue');
    await expect(cue).toHaveCount(1);
    await expect(cue).not.toHaveAttribute('data-exit');

    for (let turn = 1; turn <= RETIRE_AFTER_TURNS; turn += 1) {
      await turnAndRateAgain(deck);
    }

    await expect(cue).toHaveAttribute('data-exit', EXITS);
    await expect(deck.locator('.flip-cue-glyph-leaving')).toHaveCount(1);
    await expect(cue).toHaveCount(0);
    await expect(deck.locator('.flip-cue-glyph-leaving')).toHaveCount(0);
    expect(await stored(page, flipCueKey(FIXTURE))).toBe('retired');

    await page.reload();
    await showcaseReady(page);
    await expect(deck.locator('.flip-cue')).toHaveCount(0);
  });

  test('two turns and a reload start the count again', async ({ page }) => {
    await openShowcase(page);
    const deck = card(page, FIXTURE);
    await turnAndRateAgain(deck);
    await turnAndRateAgain(deck);
    await page.reload();
    await showcaseReady(page);

    await turnAndRateAgain(deck);
    await expect(deck.locator('.flip-cue')).not.toHaveAttribute('data-exit');
    expect(await stored(page, flipCueKey(FIXTURE))).toBeNull();
  });

  test('Clear saved progress brings the cue back', async ({ page }) => {
    await openShowcase(page);
    const deck = card(page, FIXTURE);
    for (let turn = 1; turn <= RETIRE_AFTER_TURNS; turn += 1) {
      await turnAndRateAgain(deck);
    }
    await expect(deck.locator('.flip-cue')).toHaveCount(0);

    await deck.getByRole('button', { name: 'Clear saved progress' }).click();
    const confirm = deck.getByRole('group', { name: 'Clear saved progress' });
    await confirm.getByRole('button', { name: 'Clear', exact: true }).click();

    await expect(deck.locator('.flip-cue')).toHaveCount(1);
    await expect(deck.locator('.flip-cue')).not.toHaveAttribute('data-exit');
    expect(await stored(page, flipCueKey(FIXTURE))).toBeNull();
  });

  test('under reduced motion the cue leaves with a quiet fade', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openShowcase(page);
    await recordCueAnimations(page);
    const deck = card(page, FIXTURE);

    for (let turn = 1; turn <= RETIRE_AFTER_TURNS; turn += 1) {
      await turnAndRateAgain(deck);
    }

    await expect(deck.locator('.flip-cue')).toHaveCount(0);
    expect(await cueAnimations(page)).toEqual([{ name: 'flip-cue-fade', duration: '0.4s' }]);
  });
});

test.describe('memory-match', () => {
  const FIXTURE = 'memory-match';
  const CARDS = 8;

  test('three cards turned retire all eight corners, for good', async ({ page }) => {
    await openShowcase(page);
    const deck = card(page, FIXTURE);
    const cues = deck.locator('.flip-cue');
    await expect(cues).toHaveCount(CARDS);

    const cards = deck.locator('button.memory-card');
    for (let turn = 0; turn < RETIRE_AFTER_TURNS; turn += 1) {
      // A non-matching pair turns back down before the next card can be turned.
      await cards.nth(turn).click();
    }

    await expect(deck.locator('.flip-cue[data-exit]')).toHaveCount(CARDS);
    await expect(cues).toHaveCount(0);
    expect(await stored(page, flipCueKey(FIXTURE))).toBe('retired');

    await page.reload();
    await showcaseReady(page);
    await expect(deck.locator('button.memory-card')).toHaveCount(CARDS);
    await expect(deck.locator('.flip-cue')).toHaveCount(0);
  });
});
