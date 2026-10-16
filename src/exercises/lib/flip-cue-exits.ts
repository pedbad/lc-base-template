/**
 * flip-cue-exits.ts — which exit a retiring "Tap to flip" corner plays, and when
 * (TODO §E21, docs/specs/2026-10-16-flip-cue-retire-design.md §2).
 *
 * Pure: the random source is passed in, so a caller picks in an event handler (never
 * during render, which must match the prerender) and a test can force any exit.
 * The durations mirror flip-cue.css, and flip-cue-css.test.ts fails if they drift.
 */

export type FlipCueExit = 'peel' | 'pop' | 'wave' | 'tuck';

/** Percent chance of each exit: peel and pop most often (maintainer, 2026-10-16). */
export const FLIP_CUE_EXIT_WEIGHTS: Readonly<Record<FlipCueExit, number>> = {
  peel: 35,
  pop: 35,
  wave: 15,
  tuck: 15,
};

/** How long each exit runs, in ms — the same numbers as flip-cue.css. */
export const FLIP_CUE_EXIT_MS: Readonly<Record<FlipCueExit, number>> = {
  peel: 1400,
  pop: 1300,
  wave: 1500,
  tuck: 1300,
};

/** The gap between one card's exit and the next in a grid, so they ripple. */
export const FLIP_CUE_STAGGER_MS = 70;

const EXITS = Object.keys(FLIP_CUE_EXIT_WEIGHTS) as FlipCueExit[];
const TOTAL_WEIGHT = EXITS.reduce((sum, exit) => sum + FLIP_CUE_EXIT_WEIGHTS[exit], 0);

/** One weighted pick. `random` returns [0, 1), as `Math.random` does. */
export function pickExit(random: () => number): FlipCueExit {
  let remaining = random() * TOTAL_WEIGHT;
  for (const exit of EXITS) {
    remaining -= FLIP_CUE_EXIT_WEIGHTS[exit];
    if (remaining < 0) return exit;
  }
  // Only a source that breaks its [0, 1) promise gets here.
  return EXITS[EXITS.length - 1] ?? 'peel';
}

export interface PlannedExit {
  readonly id: string;
  readonly exit: FlipCueExit;
  readonly delayMs: number;
}

/** An exit for each card, in the order given, `FLIP_CUE_STAGGER_MS` apart. */
export function planExits(
  ids: readonly string[],
  random: () => number,
  startMs = 0,
): PlannedExit[] {
  return ids.map((id, index) => ({
    id,
    exit: pickExit(random),
    delayMs: startMs + index * FLIP_CUE_STAGGER_MS,
  }));
}

/**
 * The card whose exit ends last — the one to report the whole retirement finished.
 * Not simply the last card: a peel that starts first can outlast a pop after it.
 */
export function latestEnding(plan: readonly PlannedExit[]): string | null {
  let latest: PlannedExit | null = null;
  let latestEnd = -Infinity;
  for (const entry of plan) {
    const end = entry.delayMs + FLIP_CUE_EXIT_MS[entry.exit];
    if (end >= latestEnd) {
      latest = entry;
      latestEnd = end;
    }
  }
  return latest?.id ?? null;
}
