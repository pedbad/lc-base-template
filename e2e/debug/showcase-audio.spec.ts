/**
 * showcase-audio.spec.ts — a clip plays, and a clip that cannot load says so (TODO
 * §E12c, the failure state from §E13b). The inline-gap card's per-row speakers use WAV,
 * which every browser decodes; the other demo clips are AAC, which Playwright's own
 * Firefox and Chromium builds may not.
 *
 * The clips last under a second, so the speaker's `playing` class is too brief to poll.
 * Instead an init script records the media events of every element the page plays:
 * AudioManager plays off-DOM `Audio` elements, whose events never reach the document.
 */
import { expect, test, type Page } from '@playwright/test';

import { card, openShowcase } from './debug-support';

const CLIP = 'audio/showcase-demo/inline-gap/q1.wav';

/** Every media event of every element the page plays, as `<event> <src>`. */
async function recordPlayback(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const log: string[] = [];
    Object.assign(window, { mediaLog: log });
    const { play } = HTMLMediaElement.prototype;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      for (const type of ['playing', 'ended', 'error']) {
        this.addEventListener(type, () => log.push(`${type} ${this.currentSrc || this.src}`));
      }
      return play.call(this);
    };
  });
}

function mediaLog(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { mediaLog: string[] }).mediaLog);
}

test('a showcase clip plays to its end', async ({ page }) => {
  // Runs in all three browsers. Firefox on the Linux CI runner used to skip it: with no
  // sound device the element fired `error`, never `playing` (seen 2026-10-16). CI now
  // starts a PulseAudio null sink first (ci.yml, "Start a virtual sound device").
  await recordPlayback(page);
  await openShowcase(page);
  // Pinned by position, not name: the name changes while it plays.
  const speaker = card(page, 'inline-gap-audio').locator('button.audio-container').first();
  await expect(speaker).toHaveAccessibleName('Click to play');

  await speaker.click();

  await expect
    .poll(() => mediaLog(page))
    .toEqual([expect.stringMatching(`^playing .*${CLIP}$`), expect.stringMatching(`^ended `)]);
  await expect(speaker).toHaveClass(/\bstopped\b/);
  await expect(speaker).toHaveAccessibleName('Click to play');
});

test('a clip that cannot load shows "Sound unavailable"', async ({ page }) => {
  await page.route(`**/${CLIP}`, (route) => route.abort());
  await openShowcase(page);
  const row = card(page, 'inline-gap-audio');

  await row.getByRole('button', { name: 'Click to play' }).first().click();

  const failed = row.getByRole('button', { name: 'Sound unavailable' });
  await expect(failed).toHaveCount(1);
  await expect(failed).toHaveAttribute('title', 'Sound unavailable');
  await expect(failed).toHaveClass(/\bstopped\b/);
});
