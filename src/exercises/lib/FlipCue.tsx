/**
 * FlipCue — the "Tap to flip" corner on a card that turns over: a --flip-cue triangle
 * in the bottom-right corner holding the pointer icon over the words (maintainer,
 * 2026-10-09). Flashcards put it on the front; memory-match on the face-down side,
 * scaled to the card (2026-10-12). Decorative: the card's own button carries the name.
 *
 * Its parent must be positioned. A host sizes it with `--flip-cue-size` and may hide
 * `.flip-cue-words` where they do not fit.
 *
 * Retiring (TODO §E21): given an `exit`, it plays that exit after `delayMs`
 * (flip-cue.css) and calls `onExitEnd` when its own animation ends — not when the
 * pointer's wave inside it does. The pop adds five sparkles beside it.
 */
import type { AnimationEvent, CSSProperties } from 'react';
import { SplinePointer } from 'lucide-react';
import type { FlipCueExit } from './flip-cue-exits';
import './flip-cue.css';

const SPARKS = [0, 1, 2, 3, 4];

interface FlipCueProps {
  exit?: FlipCueExit | null;
  delayMs?: number;
  onExitEnd?: () => void;
}

export function FlipCue({ exit = null, delayMs = 0, onExitEnd }: FlipCueProps = {}) {
  const handleAnimationEnd = (event: AnimationEvent<HTMLSpanElement>) => {
    if (event.target === event.currentTarget) onExitEnd?.();
  };
  const style = exit ? ({ '--flip-cue-delay': `${delayMs}ms` } as CSSProperties) : undefined;

  return (
    <>
      <span
        className="flip-cue"
        aria-hidden="true"
        data-exit={exit ?? undefined}
        style={style}
        onAnimationEnd={exit ? handleAnimationEnd : undefined}
      >
        <span className="flip-cue-label">
          <SplinePointer aria-hidden="true" />
          <span className="flip-cue-words">Tap to flip</span>
        </span>
      </span>
      {exit === 'pop' ? (
        <span className="flip-cue-sparks" aria-hidden="true" style={style}>
          {SPARKS.map((index) => (
            <span key={index} className="flip-cue-spark" />
          ))}
        </span>
      ) : null}
    </>
  );
}
