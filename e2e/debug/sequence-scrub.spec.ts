/**
 * sequence-scrub.spec.ts — scrubbing the master audio player while it plays (TODO §E12d,
 * from the second review of §E12c). The inline-gap "master playlist" card plays its three
 * clips as one timeline (src/components/audio/SequenceAudioController.tsx). A drag on the
 * scrubber shows the dragged time and, on release, loads the clip that time falls in and
 * seeks it. Several quick drags start several loads of the one audio element, each with a
 * seek waiting on its metadata; when they all settle, the time the controller shows must
 * be the position the element is really at.
 *
 * The clips are WAV, which every browser decodes. AudioManager plays an off-DOM `Audio`
 * element, so an init script keeps every element that plays (as showcase-audio.spec.ts
 * does for its events). The player is paused through the element before it is read: the
 * pause fires a last `timeupdate`, so the shown time and the position stop moving and can
 * be compared without a sleep.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

import { card, openShowcase } from './debug-support';

const CLIPS = ['q1.wav', 'q2.wav', 'q3.wav'].map(
  (name) => `audio/showcase-demo/inline-gap/${name}`,
);
/** Where each quick drag lets go, as a share of the timeline. The last is early on, so the
 *  clips cannot run out before the player is paused. */
const DRAGS = [0.8, 0.3, 0.9, 0.55, 0.15];
/** How far the audio must play on after the last drop before it is read, in seconds: a
 *  time that stayed where it was dropped agrees with the audio only at the drop itself. */
const PLAYED_ON = 0.2;
/** Seconds the shown time may differ from the position: float rounding, nothing more. */
const TOLERANCE = 0.05;

/** Keeps every element the page plays in `window.playedAudio`. */
async function recordPlayedElements(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const played: HTMLMediaElement[] = [];
    Object.assign(window, { playedAudio: played });
    const { play } = HTMLMediaElement.prototype;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      if (!played.includes(this)) played.push(this);
      return play.call(this);
    };
  });
}

/**
 * Where the playing element is on the master timeline: the lengths of the clips before
 * its own plus its `currentTime`. Null until a clip with a known length is loaded.
 */
function playingPosition(page: Page, clips: readonly string[]): Promise<number | null> {
  return page.evaluate(async (urls) => {
    const element = (window as unknown as { playedAudio: HTMLMediaElement[] }).playedAudio[0];
    if (!element) return null;
    const lengths = await Promise.all(
      urls.map(
        (url) =>
          new Promise<number>((resolve) => {
            const probe = new Audio(new URL(url, document.baseURI).href);
            probe.preload = 'metadata';
            probe.addEventListener('loadedmetadata', () => resolve(probe.duration), { once: true });
          }),
      ),
    );
    const index = urls.findIndex((url) => element.currentSrc.endsWith(url));
    if (index < 0) return null;
    return lengths.slice(0, index).reduce((sum, length) => sum + length, 0) + element.currentTime;
  }, clips);
}

/**
 * Presses on the scrubber at `share` of its width, wobbles, lets go, and returns the time
 * the scrubber showed at the drop. Pressed where it ends: WebKit's thumb does not follow a
 * mouse that was pressed elsewhere and moved, so every drag would have dropped at the
 * same point there.
 */
async function drag(page: Page, scrubber: Locator, share: number): Promise<number> {
  const box = await scrubber.boundingBox();
  if (!box) throw new Error('the scrubber has no box');
  const y = box.y + box.height / 2;
  const x = box.x + box.width * share;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 2, y);
  await page.mouse.move(x, y);
  const dropped = Number(await scrubber.inputValue());
  await page.mouse.up();
  return dropped;
}

/** m:ss, as the controller writes it (formatTime in SequenceAudioController.tsx). */
function formatTime(seconds: number): string {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

test('after quick drags while playing, the shown time is where the audio is', async ({ page }) => {
  // Firefox fires one more `input` after `pointerup`, which once pinned the readout to
  // the drop point; and drags a few milliseconds apart once left the first drag's time
  // on the scrubber. Both are fixed and replayed event by event in
  // SequenceAudioController.test.tsx (TODO §E23), so the drags here follow each other
  // with nothing between them.
  await recordPlayedElements(page);
  await openShowcase(page);
  const player = card(page, 'inline-gap-master').locator('.sequence-audio-controller');
  const scrubber = player.getByRole('slider', { name: 'Audio progress' });
  // The clips' lengths are loaded: the scrubber has a range to drag over.
  await expect.poll(() => scrubber.getAttribute('max')).not.toBe('0');

  await player.getByRole('button', { name: 'Play audio' }).click();
  await expect(player.getByRole('button', { name: 'Pause audio' })).toBeVisible();

  const length = Number(await scrubber.getAttribute('max'));
  let target = 0;
  for (const share of DRAGS) {
    target = await drag(page, scrubber, share);
  }

  // The last drop took effect, and the audio has played on from it.
  await expect
    .poll(async () => (await playingPosition(page, CLIPS)) ?? 0)
    .toBeGreaterThanOrEqual(target + PLAYED_ON);
  await page.evaluate(() => {
    (window as unknown as { playedAudio: HTMLMediaElement[] }).playedAudio[0]?.pause();
  });

  await expect
    .poll(async () => {
      const position = (await playingPosition(page, CLIPS)) ?? NaN;
      return Math.abs(Number(await scrubber.inputValue()) - position) <= TOLERANCE;
    }, 'the scrubber and the playing position disagree')
    .toBe(true);
  // The written time is the scrubber's own, to the second.
  await expect(player.getByText(/\d:\d\d \/ \d:\d\d/)).toHaveText(
    `${formatTime(Number(await scrubber.inputValue()))} / ${formatTime(length)}`,
  );
});

test('the keyboard seeks the audio: PageUp forward, an arrow back', async ({ page }) => {
  // A key moves the thumb with no pointer down, so the seek cannot wait for a drop; it
  // was once dropped altogether (second review, TODO §E25). Paused, so nothing moves but
  // the keys: each engine picks its own step for `step="any"`, so only the direction is
  // checked.
  await recordPlayedElements(page);
  await openShowcase(page);
  const player = card(page, 'inline-gap-master').locator('.sequence-audio-controller');
  const scrubber = player.getByRole('slider', { name: 'Audio progress' });
  await expect.poll(() => scrubber.getAttribute('max')).not.toBe('0');

  await player.getByRole('button', { name: 'Play audio' }).click();
  await player.getByRole('button', { name: 'Pause audio' }).click();
  await expect(player.getByRole('button', { name: 'Play audio' })).toBeVisible();
  const start = (await playingPosition(page, CLIPS)) ?? NaN;

  /** The playing position once it has caught up with the scrubber. */
  async function settled(): Promise<number> {
    let position = NaN;
    await expect
      .poll(async () => {
        position = (await playingPosition(page, CLIPS)) ?? NaN;
        return Math.abs(Number(await scrubber.inputValue()) - position) <= TOLERANCE;
      }, 'the audio did not move to the scrubber')
      .toBe(true);
    return position;
  }

  await scrubber.focus();
  await page.keyboard.press('PageUp');
  const forward = await settled();
  expect(forward).toBeGreaterThan(start);

  await page.keyboard.press('ArrowLeft');
  expect(await settled()).toBeLessThan(forward);
});
