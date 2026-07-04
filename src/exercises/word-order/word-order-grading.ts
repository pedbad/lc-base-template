/**
 * word-order-grading.ts — pure logic for the word-order engine (#10): building the
 * token deck, scrambling it, swapping two cards, and counting how many cards sit in
 * their expected position (the "check" score). Extracted from WordOrderExercise so
 * the sequence logic is testable without a DOM; the component keeps the reducer,
 * FLIP animation, and drag/drop handlers.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §7, §8.
 */
import { shuffle } from '@/exercises/lib/shuffle';

/** One word card: a stable id (position-independent) + its display label. */
export interface Token {
  id: string;
  label: string;
}

/** Build the ordered deck of tokens from the expected words. */
export function buildTokens(words: readonly string[]): Token[] {
  return words.map((label, index) => ({ id: `token-${index}`, label }));
}

/**
 * Shuffle the deck, retrying once (by swapping the first two) if it happens to land
 * back on the original order — so a scramble of 2+ cards is never a no-op.
 */
export function scramble(tokens: readonly Token[], rng?: () => number): Token[] {
  const scrambled = shuffle(tokens, rng);
  if (tokens.length < 2) return scrambled;
  const unchanged = scrambled.every((token, index) => token.id === tokens[index]?.id);
  if (!unchanged) return scrambled;
  const [first, second, ...rest] = scrambled;
  return first && second ? [second, first, ...rest] : scrambled;
}

/** Return a new order with the cards at `idA` and `idB` swapped. */
export function swapById(order: readonly Token[], idA: string, idB: string): Token[] {
  const next = [...order];
  const indexA = next.findIndex((token) => token.id === idA);
  const indexB = next.findIndex((token) => token.id === idB);
  if (indexA < 0 || indexB < 0) return next;
  [next[indexA], next[indexB]] = [next[indexB], next[indexA]];
  return next;
}

/** How many tokens sit in their expected position (the Check score). */
export function countCorrectPositions(order: readonly Token[], expected: readonly Token[]): number {
  return order.filter((token, index) => token.id === expected[index]?.id).length;
}
