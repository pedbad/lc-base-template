/**
 * MemoryCard.tsx — one card in the memory-match deck (#9). A single <button> that
 * flips between a face-down "?" back and a content front (image or word). State is
 * driven by `data-*` attributes the stylesheet reads — no inline transform soup,
 * no DOM mutation. Keyboard-operable for free (it's a real button).
 *
 * The french-lo-1 original wrapped the word in a "link" AudioClip; that clip variant
 * isn't ported, so the word renders as plain text and the match audio is played by
 * the engine on a successful pair instead.
 */
import { memo } from 'react';
import { resolveAsset } from '@/lib/assets';

export type CardKind = 'image' | 'text';

/** One deck card: half of a pair. `pairId` links the image and text halves. */
export interface DeckCard {
  id: string;
  pairId: string;
  kind: CardKind;
  text?: string;
  image?: string;
  audio?: string;
  alt?: string;
}

interface MemoryCardProps {
  card: DeckCard;
  isRevealed: boolean;
  isMatched: boolean;
  disabled: boolean;
  onFlip: (card: DeckCard) => void;
  setRef: (id: string, element: HTMLButtonElement | null) => void;
}

function MemoryCardComponent({
  card,
  isRevealed,
  isMatched,
  disabled,
  onFlip,
  setRef,
}: MemoryCardProps) {
  const label =
    isRevealed || isMatched
      ? card.kind === 'text'
        ? (card.text ?? '')
        : (card.alt ?? 'picture')
      : 'Face-down card, click to flip';

  return (
    <button
      type="button"
      className="memory-card"
      data-kind={card.kind}
      data-revealed={isRevealed || isMatched}
      data-state={isMatched ? 'matched' : 'default'}
      aria-label={label}
      aria-pressed={isRevealed || isMatched}
      disabled={disabled}
      onClick={() => onFlip(card)}
      ref={(element) => setRef(card.id, element)}
    >
      <span className="memory-card-inner">
        <span className="memory-card-face memory-card-back" aria-hidden="true">
          ?
        </span>
        <span className="memory-card-face memory-card-front">
          {card.kind === 'text' ? (
            <span className="memory-card-word">{card.text}</span>
          ) : (
            <img
              className="memory-card-image"
              src={resolveAsset(card.image ?? '')}
              alt={card.alt ?? ''}
            />
          )}
        </span>
      </span>
    </button>
  );
}

export const MemoryCard = memo(MemoryCardComponent);
