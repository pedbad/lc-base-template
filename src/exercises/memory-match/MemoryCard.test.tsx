/**
 * MemoryCard.test.tsx — the face-down side shows the flip cue (maintainer, 2026-10-12),
 * the same corner the flashcards use.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MemoryCard, type DeckCard } from './MemoryCard';

const card: DeckCard = { id: 'a', pairId: 'p', kind: 'text', text: 'el perro' };
const render = () =>
  renderToStaticMarkup(
    <MemoryCard
      card={card}
      isRevealed={false}
      isMatched={false}
      disabled={false}
      onFlip={() => {}}
      setRef={() => {}}
    />,
  );

describe('MemoryCard', () => {
  it('puts the flip cue on the face-down side, after the "?"', () => {
    expect(render()).toMatch(
      /<span class="memory-card-face memory-card-back" aria-hidden="true">\?<span class="flip-cue" aria-hidden="true">/,
    );
  });
});
