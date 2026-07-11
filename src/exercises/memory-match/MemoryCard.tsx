/**
 * MemoryCard.tsx — one card in the memory-match deck (#9). A single <button> that
 * flips between a face-down "?" back and a content front (image or word). State is
 * driven by `data-*` attributes the stylesheet reads — no inline transform soup,
 * no DOM mutation. Keyboard-operable for free (it's a real button).
 *
 * When a text card carries `audio`, a "super-compact-speaker" click-to-play control
 * (§8 shared AudioClip) renders as a SIBLING overlay, not nested inside the flip
 * button — a <button> inside a <button> is invalid HTML and fails jsx-a11y. It only
 * shows once the card is revealed or matched, so it never leaks which cards have a
 * word before the learner flips them.
 */
import { memo } from 'react';
import { AudioClip } from '@/components/audio/AudioClip';
import { resolveAsset } from '@/lib/assets';
import { TARGET_LANG } from '@/lib/lang';

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
  const isFaceUp = isRevealed || isMatched;
  const label = isFaceUp
    ? card.kind === 'text'
      ? (card.text ?? '')
      : (card.alt ?? 'picture')
    : 'Face-down card, click to flip';
  const showSpeaker = isFaceUp && card.kind === 'text' && Boolean(card.audio);
  // aria-label IS the target-language word when a text card is face-up (no chrome
  // mixed in) — safe to tag the button itself. Face-down/image labels are English.
  const labelLang = isFaceUp && card.kind === 'text' ? TARGET_LANG : undefined;

  return (
    <span className="memory-card-wrap">
      <button
        type="button"
        className="memory-card"
        data-kind={card.kind}
        data-revealed={isFaceUp}
        data-state={isMatched ? 'matched' : 'default'}
        aria-label={label}
        lang={labelLang}
        aria-pressed={isFaceUp}
        disabled={disabled}
        onClick={() => onFlip(card)}
        ref={(element) => setRef(card.id, element)}
      >
        <span className="memory-card-inner">
          <span className="memory-card-face memory-card-back" aria-hidden="true">
            ?
          </span>
          <span className="memory-card-face memory-card-front" aria-hidden="true">
            {card.kind === 'text' ? (
              <span className="memory-card-word" lang={TARGET_LANG}>
                {card.text}
              </span>
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
      {showSpeaker ? (
        <AudioClip
          className="super-compact-speaker memory-card-audio"
          soundFile={card.audio ?? ''}
          size={20}
          inline
        />
      ) : null}
    </span>
  );
}

export const MemoryCard = memo(MemoryCardComponent);
