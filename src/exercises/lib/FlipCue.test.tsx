/**
 * FlipCue.test.tsx — the "Tap to flip" corner shared by flashcards and memory-match.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FlipCue } from './FlipCue';

const html = renderToStaticMarkup(<FlipCue />);

describe('FlipCue', () => {
  it('is decorative: the card itself carries the accessible name', () => {
    expect(html).toMatch(/^<span class="flip-cue" aria-hidden="true">/);
  });

  it('shows the pointer icon over the words, which can be hidden on their own', () => {
    expect(html).toMatch(
      /<span class="flip-cue-label"><svg[^>]*lucide-spline-pointer[^>]*>[\s\S]*?<\/svg><span class="flip-cue-words">Tap to flip<\/span><\/span>/,
    );
  });
});
