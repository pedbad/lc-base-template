/**
 * FlipCue — the "Tap to flip" corner on a card that turns over: a --flip-cue triangle
 * in the bottom-right corner holding the pointer icon over the words (maintainer,
 * 2026-10-09). Flashcards put it on the front; memory-match on the face-down side,
 * scaled to the card (2026-10-12). Decorative: the card's own button carries the name.
 *
 * Its parent must be positioned. A host sizes it with `--flip-cue-size` and may hide
 * `.flip-cue-words` where they do not fit.
 */
import { SplinePointer } from 'lucide-react';
import './flip-cue.css';

export function FlipCue() {
  return (
    <span className="flip-cue" aria-hidden="true">
      <span className="flip-cue-label">
        <SplinePointer aria-hidden="true" />
        <span className="flip-cue-words">Tap to flip</span>
      </span>
    </span>
  );
}
