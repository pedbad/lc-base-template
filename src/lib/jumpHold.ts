/**
 * jumpHold — the hold a followed link puts on the scroll-spy (header scroll-spy spec
 * §3, S5).
 *
 * Following a nav link smooth-scrolls PAST the sections in between, and a spy left
 * running would light each in turn. So a followed link holds the highlight on its
 * section, every scroll event during the hold restarts it, and it lapses once
 * SETTLE_MS pass with no scroll at all.
 *
 * A DEBOUNCE, NOT `scrollend`: Safari does not ship `scrollend` within the support
 * floor, so the debounce is needed there anyway, and one mechanism everywhere beats a
 * feature-detected pair.
 */

/** Quiet time after the last scroll event before a jump counts as settled. Smooth
 *  scrolling fires `scroll` every frame, so a gap this long means it has stopped. */
export const SETTLE_MS = 150;

export interface JumpHold {
  /** Start the hold, or restart it if already held. */
  hold(): void;
  isHeld(): boolean;
  /** Release now and clear the timer (effect cleanup). */
  dispose(): void;
}

export function createJumpHold(): JumpHold {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const dispose = () => {
    clearTimeout(timer);
    timer = undefined;
  };

  return {
    hold() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
      }, SETTLE_MS);
    },
    isHeld: () => timer !== undefined,
    dispose,
  };
}
