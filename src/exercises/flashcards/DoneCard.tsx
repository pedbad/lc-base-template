/**
 * DoneCard.tsx — the card a finished deck leaves in place (TODO §E22).
 *
 * The deck used to vanish on the last rating, and everything below jumped up by a
 * card's height (maintainer, 2026-10-16). This card has the card's own frame
 * (flashcards.css), so finishing moves nothing. It turns nothing over, so no Tap to
 * flip corner, and it is not a control: its hint points at the Reset button below.
 * The engine's live region announces the same words.
 */
import { PartyPopper } from 'lucide-react';
import { learnedText } from './flashcards-deck';

export function DoneCard({ total }: { total: number }) {
  return (
    <div className="flashcards-card-wrap" data-stack="0">
      <div className="flashcards-done">
        <PartyPopper aria-hidden="true" className="flashcards-done-icon" />
        <p className="flashcards-done-title">Deck complete</p>
        <p className="flashcards-done-count">{learnedText(total)}</p>
        <p className="flashcards-done-hint">
          Select <strong>Reset</strong> to play again.
        </p>
      </div>
    </div>
  );
}
