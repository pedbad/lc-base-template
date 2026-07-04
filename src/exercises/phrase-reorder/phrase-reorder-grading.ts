/**
 * phrase-reorder-grading.ts — pure sequence logic for the phrase-reorder engine
 * (#11): building the phrase deck, scrambling it, swapping two cards, and counting
 * cards in their expected position (the Check score). Same mechanics as word-order
 * (#10) over a {id, phrase} token; kept as its own engine module so the two stay
 * decoupled. Extracted from PhraseReorderExercise; the component keeps the reducer,
 * FLIP animation, and drag/drop handlers.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §7, §8.
 */
import { shuffle } from '@/exercises/lib/shuffle';

/** One phrase card: a stable id (position-independent) + its phrase text. */
export interface PhraseToken {
  id: string;
  phrase: string;
}

/** Build the ordered deck from the content rows (one card per row's phrase). */
export function buildTokens(rows: readonly { phrase: string }[]): PhraseToken[] {
  return rows.map((row, index) => ({ id: `slot-${index}`, phrase: row.phrase }));
}

/**
 * Shuffle the deck, retrying once (by swapping the first two) if it happens to land
 * back on the original order — so a scramble of 2+ cards is never a no-op.
 */
export function scramble(tokens: readonly PhraseToken[], rng?: () => number): PhraseToken[] {
  const scrambled = shuffle(tokens, rng);
  if (tokens.length < 2) return scrambled;
  const unchanged = scrambled.every((token, index) => token.id === tokens[index]?.id);
  if (!unchanged) return scrambled;
  const [first, second, ...rest] = scrambled;
  return first && second ? [second, first, ...rest] : scrambled;
}

/** Return a new order with the cards at `idA` and `idB` swapped. */
export function swapById(order: readonly PhraseToken[], idA: string, idB: string): PhraseToken[] {
  const next = [...order];
  const indexA = next.findIndex((token) => token.id === idA);
  const indexB = next.findIndex((token) => token.id === idB);
  if (indexA < 0 || indexB < 0) return next;
  [next[indexA], next[indexB]] = [next[indexB], next[indexA]];
  return next;
}

/** How many tokens sit in their expected position (the Check score). */
export function countCorrectPositions(
  order: readonly PhraseToken[],
  expected: readonly PhraseToken[],
): number {
  return order.filter((token, index) => token.id === expected[index]?.id).length;
}
