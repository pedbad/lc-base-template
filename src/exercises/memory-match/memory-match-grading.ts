/**
 * memory-match-grading.ts — pure deck logic for the memory-match engine (#9):
 * expanding the content pairs into a shuffled deck and reordering a deck into solved
 * (adjacent image→text) pairs for the Show-answers reveal. Extracted from
 * MemoryMatchExercise so deck construction and the reveal order are testable without
 * a DOM; the component keeps the reducer, flip timing, and FLIP animation.
 *
 * Uses the shared lib `shuffle` (rather than a bespoke local one) per the reuse rule;
 * an optional rng makes deck construction deterministic in tests.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §7, §8.
 */
import { shuffle } from '@/exercises/lib/shuffle';
import type { DeckCard } from './MemoryCard';
import type { MemoryMatchContent } from './memory-match-schema';

/** Expand the pairs into a shuffled deck: one image card + one text card per pair. */
export function buildDeck(
  content: MemoryMatchContent,
  sampleSize?: number,
  rng?: () => number,
): DeckCard[] {
  const chosen = shuffle(content.items, rng).slice(0, sampleSize ?? content.items.length);
  const cards: DeckCard[] = [];
  chosen.forEach((item, index) => {
    const pairId = String(index);
    cards.push({
      id: `${index}-img`,
      pairId,
      kind: 'image',
      image: item.image,
      alt: item.alt ?? item.localLanguage ?? '',
    });
    cards.push({
      id: `${index}-txt`,
      pairId,
      kind: 'text',
      text: item.text,
      audio: item.audio,
      alt: item.text,
    });
  });
  return shuffle(cards, rng);
}

/** Reorder the current deck so matched pairs sit adjacent (image then text). */
export function solveOrder(cards: readonly DeckCard[]): DeckCard[] {
  const byPair = new Map<string, { image?: DeckCard; text?: DeckCard }>();
  cards.forEach((card) => {
    const entry = byPair.get(card.pairId) ?? {};
    if (card.kind === 'image') entry.image = card;
    else entry.text = card;
    byPair.set(card.pairId, entry);
  });
  return [...byPair.entries()]
    .sort(([a], [b]) => Number(a) - Number(b))
    .flatMap(([, pair]) => [pair.image, pair.text])
    .filter((card): card is DeckCard => Boolean(card));
}
