/**
 * reorderAnimation.ts — a tiny FLIP (First-Last-Invert-Play) helper for engines
 * that reorder DOM nodes and want the move animated (spec §8, "ported once").
 * Ported from french-lo-1's reorderAnimation.js, typed.
 *
 * Usage: capture each node's rect BEFORE the state change reorders them, let React
 * commit the new order, then in a layout effect call playFlipAnimation — it measures
 * the new rects, inverts the delta with a transform, and plays it back to zero.
 *
 * Honours `prefers-reduced-motion: reduce` (no-op) and SSR (no `window`).
 */
const DEFAULT_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

/** Snapshot of each node's bounding rect, keyed by id, taken before the reorder. */
export type FlipPositions = Map<string, DOMRect>;

export function captureFlipPositions(
  ids: readonly string[],
  getElement: (id: string) => HTMLElement | null | undefined,
): FlipPositions {
  const before: FlipPositions = new Map();
  ids.forEach((id) => {
    const element = getElement(id);
    if (element) before.set(id, element.getBoundingClientRect());
  });
  return before;
}

export interface PlayFlipOptions {
  before: FlipPositions;
  ids: readonly string[];
  getElement: (id: string) => HTMLElement | null | undefined;
  duration?: number;
  easing?: string;
  stagger?: number;
}

export function playFlipAnimation({
  before,
  ids,
  getElement,
  duration = 360,
  easing = DEFAULT_EASING,
  stagger = 0,
}: PlayFlipOptions): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  requestAnimationFrame(() => {
    ids.forEach((id, index) => {
      const element = getElement(id);
      const first = before.get(id);
      if (!element || !first) return;

      const last = element.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (dx === 0 && dy === 0) return;

      element.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
        { delay: stagger > 0 ? index * stagger : 0, duration, easing },
      );
    });
  });
}
