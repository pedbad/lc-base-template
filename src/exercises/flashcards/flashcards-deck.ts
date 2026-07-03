/**
 * flashcards-deck.ts — the pure, view-free deck logic for the flashcards engine.
 *
 * Extracted from the component so the session model (shuffle, flip, self-rate,
 * requeue-on-Again, restart) is unit-testable without rendering. The `.tsx` view is
 * a thin shell over `deckReducer` + `buildDeck`. Step 1 is fully in-memory; the
 * Step 2 SRS layer will build on these same shapes (design §4).
 *
 * Spec: docs/specs/2026-07-03-new-exercise-engines-design.md §4.
 */
import type { FlashcardsContent } from './flashcards-schema';

/** One deck card: an authored card plus a stable id for React keys and requeueing. */
export interface DeckCard {
  id: string;
  target: string;
  native: string;
  image?: string;
  audio?: string;
}

/** Fisher-Yates, immutable (returns a new array; never mutates the input). */
export function shuffle<T>(input: readonly T[]): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Expand the authored cards into a deck (stable ids from authored order), shuffled
 * when the author opted in.
 */
export function buildDeck(content: FlashcardsContent, doShuffle: boolean): DeckCard[] {
  const cards: DeckCard[] = content.cards.map((card, index) => ({ id: String(index), ...card }));
  return doShuffle ? shuffle(cards) : cards;
}

/** Session state for one pass through the deck. `queue[0]` is the current card. */
export interface DeckState {
  /** Remaining cards; `queue[0]` is the current card. Empty ⇒ deck complete. */
  queue: DeckCard[];
  /** Is the current card showing its back (reveal) face? */
  flipped: boolean;
  /** Unique cards retired with a Good rating. */
  known: number;
  /** Total unique cards in the deck. */
  total: number;
}

export type DeckAction =
  | { kind: 'flip' }
  | { kind: 'rate'; grade: 'again' | 'good' }
  | { kind: 'restart'; queue: DeckCard[] };

/** Build the initial session state from a freshly-built deck. */
export function initDeckState(queue: DeckCard[]): DeckState {
  return { queue, flipped: false, known: 0, total: queue.length };
}

/**
 * The whole Step 1 session model, as a pure reducer:
 *   - flip    toggles the current card's face.
 *   - rate    'good' retires the current card; 'again' sends it to the back so it
 *             resurfaces this session. Either way the next card starts face-down.
 *   - restart replaces the queue with a fresh (optionally re-shuffled) deck.
 */
export function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.kind) {
    case 'flip':
      return { ...state, flipped: !state.flipped };
    case 'rate': {
      const [current, ...rest] = state.queue;
      if (!current) return state;
      const queue = action.grade === 'good' ? rest : [...rest, current];
      const known = action.grade === 'good' ? state.known + 1 : state.known;
      return { ...state, queue, known, flipped: false };
    }
    case 'restart':
      return initDeckState(action.queue);
    default:
      return state;
  }
}
