/**
 * DoneCard.test.tsx — the card a finished deck leaves in place (TODO §E22). The deck
 * used to vanish on the last rating and the page jumped up by a card's height; now a
 * "done" card of the same size takes the card's place (maintainer, 2026-10-16).
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { DoneCard } from './DoneCard';
import { learnedText } from './flashcards-deck';

const html = renderToStaticMarkup(<DoneCard total={8} />);

describe('learnedText', () => {
  test('counts the cards, singular and plural', () => {
    expect(learnedText(1)).toBe('1 card learned');
    expect(learnedText(8)).toBe('8 cards learned');
  });
});

describe('DoneCard', () => {
  test("sits in the deck's own frame, with no spare cards behind it", () => {
    expect(html).toMatch(
      /^<div class="flashcards-card-wrap" data-stack="0"><div class="flashcards-done">/,
    );
  });

  test('shows a decorative success icon, the title and the count', () => {
    const icon = /<svg[^>]*flashcards-done-icon[^>]*>/.exec(html)?.[0] ?? '';
    expect(icon).toContain('aria-hidden="true"');
    expect(html).toContain('<p class="flashcards-done-title">Deck complete</p>');
    expect(html).toContain('<p class="flashcards-done-count">8 cards learned</p>');
  });

  test('points at the Reset button below rather than being one', () => {
    expect(html).toContain(
      '<p class="flashcards-done-hint">Select <strong>Reset</strong> to play again.</p>',
    );
    expect(html).not.toContain('<button');
  });

  test('carries no Tap to flip corner: there is nothing left to turn', () => {
    expect(html).not.toContain('flip-cue');
  });
});
