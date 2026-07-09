/**
 * srs-scheduler.ts — the pure Leitner spaced-repetition scheduler for the flashcards
 * engine (Step 2, design §4.2). View-free and deterministic, so box promotion/demotion,
 * due calculation, and load-order are unit-testable without a DOM or storage. Mirrors
 * the per-engine `*-grading.ts` split: this module is pure logic; the `.tsx` view is
 * wiring, and `flashcards-storage.ts` owns the (untrusted) localStorage boundary.
 *
 * Spec: docs/specs/2026-07-03-new-exercise-engines-design.md §4.2.
 */

/** Number of Leitner boxes. Box 1 = due soonest (new/missed); box 5 = faded furthest. */
export const SRS_BOX_COUNT = 5;
export const SRS_MIN_BOX = 1;
export const SRS_MAX_BOX = SRS_BOX_COUNT;

/** One card's schedule: which box it sits in, and the review-step it next becomes due. */
export interface CardSchedule {
  /** Leitner box, 1..SRS_BOX_COUNT. Higher = better known = due further out. */
  readonly box: number;
  /** Review-step at which the card is due again (`step + intervalForBox(box)`). */
  readonly due: number;
}

/** The whole persisted scheduler state: a monotonic review counter + per-card boxes. */
export interface SrsState {
  /** Monotonic review counter; advanced by one on every `gradeCard`. */
  readonly step: number;
  /** Per-card schedule, keyed by the deck card's stable id. */
  readonly cards: Readonly<Record<string, CardSchedule>>;
}

/** The doubling review interval for a box: box 1 → 1, box 2 → 2, … box 5 → 16. */
export function intervalForBox(box: number): number {
  const clamped = Math.min(Math.max(box, SRS_MIN_BOX), SRS_MAX_BOX);
  return 2 ** (clamped - SRS_MIN_BOX);
}

/** A fresh schedule for a card that has never been rated: box 1, due immediately. */
function freshSchedule(): CardSchedule {
  return { box: SRS_MIN_BOX, due: 0 };
}

/** Build a fresh scheduler state: every id in box 1, due 0, review counter at 0. */
export function initSrsState(ids: readonly string[]): SrsState {
  const cards: Record<string, CardSchedule> = {};
  for (const id of ids) cards[id] = freshSchedule();
  return { step: 0, cards };
}

/** A self-rating: `good` = recalled it, `again` = missed it. Matches the deck grade. */
export type SrsGrade = 'again' | 'good';

/**
 * Apply a self-rating to one card, returning a NEW state (never mutates the input).
 * Advances the review counter, then moves the card: `good` promotes one box (capped),
 * `again` resets to box 1. An unrated id is treated as a fresh box-1 card.
 */
export function gradeCard(state: SrsState, id: string, grade: SrsGrade): SrsState {
  const step = state.step + 1;
  const current = state.cards[id] ?? freshSchedule();
  const box = grade === 'good' ? Math.min(current.box + 1, SRS_MAX_BOX) : SRS_MIN_BOX;
  const due = step + intervalForBox(box);
  return { step, cards: { ...state.cards, [id]: { box, due } } };
}

/**
 * Order ids by their due review-step ascending (soonest first). Ties keep the input
 * order (JS sort is stable). Ids absent from state sort as fresh (due 0). This is the
 * load-order applied to a freshly-built deck when SRS is enabled.
 */
export function dueOrder(state: SrsState, ids: readonly string[]): string[] {
  const dueOf = (id: string) => state.cards[id]?.due ?? 0;
  return [...ids].sort((a, b) => dueOf(a) - dueOf(b));
}

/**
 * Reconcile a (possibly stale) scheduler state against the deck's current card ids:
 * keep the schedule for ids still present, add missing ids as fresh, drop ids no
 * longer in the deck. Guards persisted state against deck-content drift — the deck is
 * the source of truth for which cards exist; the store only remembers their boxes.
 */
export function reconcileSrsState(state: SrsState, ids: readonly string[]): SrsState {
  const cards: Record<string, CardSchedule> = {};
  for (const id of ids) cards[id] = state.cards[id] ?? freshSchedule();
  return { step: state.step, cards };
}
