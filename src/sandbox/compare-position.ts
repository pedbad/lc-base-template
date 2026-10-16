/**
 * compare-position.ts — the comparison slider's maths, apart from the DOM so Vitest
 * (node environment) can test it (E20). A position is a whole percent, 0–100, measured
 * from the frame's left edge: how much of the light layer shows.
 */

/** Where the handle starts: half light, half dark (maintainer, 2026-10-16). */
export const START_POSITION = 50;

/** The position under a pointer at `clientX`, for a frame at `left` with `width`. */
export function positionFromPointer(clientX: number, left: number, width: number): number {
  if (width <= 0) return START_POSITION;
  const percent = ((clientX - left) / width) * 100;
  return Math.round(Math.min(100, Math.max(0, percent)));
}

/** The light layer's clip: everything right of the handle is cut away. */
export const clipRight = (position: number): string => `inset(0 ${100 - position}% 0 0)`;
