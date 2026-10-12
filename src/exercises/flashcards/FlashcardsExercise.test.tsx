/**
 * Tests for FlashcardsExercise's study stage (maintainer, 2026-10-08, option A).
 * Rendered to static markup (no DOM in this suite), so they pin the first view: the
 * progress circles that replaced "Card 1 of N", the direction switch, the card's
 * language label and back face, the hidden rating row and the quiet
 * housekeeping row. The flip/rate transitions are the reducer's (flashcards-deck).
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import FlashcardsExercise, { ProgressDots } from './FlashcardsExercise';

const config = {
  type: 'flashcards',
  content: {
    cards: [
      { target: 'la casa', native: 'the house' },
      { target: 'el perro', native: 'the dog' },
      { target: 'la mesa', native: 'the table' },
    ],
    footnote: 'Escucha y repite.',
  },
  options: { shuffle: false },
};
const render = (overrides: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    <FlashcardsExercise config={{ ...config, options: { ...config.options, ...overrides } }} />,
  );

describe('FlashcardsExercise study stage', () => {
  test('shows one progress circle per card, all pending, and no "Card 1 of" line', () => {
    const html = render();

    expect((html.match(/class="flashcards-dot"/g) ?? []).length).toBe(3);
    expect(html).toContain('data-result="pending"');
    expect(html).toMatch(/<ol class="flashcards-dots" aria-hidden="true">/);
    expect(html).not.toMatch(/>Card 1 of 3</);
  });

  test('says the progress in words for screen readers', () => {
    expect(render()).toContain(
      '<p class="sr-only" role="status" aria-live="polite">Card 1 of 3. 0 recognised.</p>',
    );
  });

  test('marks the current card among the circles', () => {
    expect(render()).toContain('data-current="true"');
  });

  test('offers the direction as a two-option switch, unless locked', () => {
    const html = render();
    expect(html).toContain('role="group" aria-label="Card direction"');
    // Full language names, not codes (maintainer, 2026-10-08).
    expect(html).toMatch(/aria-pressed="true"[^>]*>Spanish to English</);
    expect(html).toMatch(/aria-pressed="false"[^>]*>English to Spanish</);

    expect(render({ lockDirection: true })).not.toContain('Card direction');
  });

  test('labels each face with its language', () => {
    const html = render();
    expect(html).toContain('<span class="flashcards-lang">Spanish</span>');
    expect(html).toContain('<span class="flashcards-lang">English</span>');
  });

  // After the flip the learner compares: the prompt stays, small, above the answer.
  test('keeps the prompt above the answer on the back', () => {
    const html = render();
    const back = html.slice(html.indexOf('flashcards-face-back'));

    expect(back.indexOf('flashcards-prompt')).toBeGreaterThan(-1);
    expect(back.indexOf('la casa')).toBeLessThan(back.indexOf('the house'));
  });

  // Maintainer, 2026-10-12: the card is the flip control (a button, and the "Tap to
  // flip" corner says so), so the separate Show answer button went. Again / Got it sit
  // in their row from the start, hidden until the flip, so nothing below jumps.
  test('has no Show answer button; the rating row waits, hidden, for the flip', () => {
    const html = render();
    expect(html).not.toContain('Show answer');
    expect(html).toMatch(
      /<div class="flashcards-actions" data-flipped="false">[\s\S]*Again[\s\S]*Got it/,
    );
  });

  test('keeps Reset in the housekeeping row, after the footnote', () => {
    const html = render();
    const footer = html.indexOf('class="flashcards-footer"');

    expect(html.indexOf('Escucha y repite.')).toBeLessThan(footer);
    expect(html.indexOf('Reset', footer)).toBeGreaterThan(footer);
  });

  // Maintainer, 2026-10-12: Restart was a small ghost button, unlike every other
  // exercise's Reset. It is now the same button: the shared destructive look, the
  // RotateCcw icon, the `reset` UI string.
  test('its Reset is the button every other exercise uses', () => {
    const html = render();
    const footer = html.slice(html.indexOf('class="flashcards-footer"'));
    expect(footer).toMatch(
      /<button[^>]*class="[^"]*bg-destructive\/10 text-destructive-text[^"]*"[^>]*><svg[^>]*lucide-rotate-ccw[^>]*>[\s\S]*?<\/svg>Reset<\/button>/,
    );
    expect(footer).not.toContain('Restart');
  });

  test('stacks spare cards behind the current one while two or more remain', () => {
    expect(render()).toContain('data-stack="2"');
  });

  // Maintainer, 2026-10-09: the front's "Select the card to flip" read as stray text.
  // A Warm Blue triangle in the corner now holds a pointer icon and "Tap to flip",
  // wrapped together so the icon centres over the words (over "to"). The corner is the
  // shared FlipCue (memory-match shows it too, 2026-10-12).
  test('puts the shared flip cue on the front face', () => {
    expect(render()).toMatch(
      /<span class="flip-cue" aria-hidden="true"><span class="flip-cue-label"><svg[^>]*lucide-spline-pointer[^>]*>[\s\S]*?<\/svg><span class="flip-cue-words">Tap to flip<\/span><\/span><\/span>/,
    );
  });
});

// Maintainer, 2026-10-12: when every card is rated Got it, the circles hop like the
// other exercises' progress meter (the hop itself is flashcards.css).
describe('ProgressDots', () => {
  const order = ['a', 'b', 'c'];
  const dots = (results: Record<string, 'good' | 'again'>) =>
    renderToStaticMarkup(<ProgressDots order={order} results={results} currentId={null} />);

  test('marks the row complete only when every card is Got it', () => {
    expect(dots({ a: 'good', b: 'good', c: 'good' })).toContain('data-complete="true"');
    expect(dots({ a: 'good', b: 'again', c: 'good' })).not.toContain('data-complete');
    expect(dots({ a: 'good', b: 'good' })).not.toContain('data-complete');
  });

  test('numbers each circle for the staggered hop', () => {
    expect(dots({})).toContain('--slot-index:2');
  });
});

// Maintainer, 2026-10-12: Reset starts the round again and keeps the saved memory;
// forgetting it is a separate, quieter button, shown only when progress is saved.
test('with saved progress, Reset sits beside a Clear saved progress button', () => {
  const footer = (html: string) => html.slice(html.indexOf('class="flashcards-footer"'));
  expect(footer(render({ srs: true }))).toContain('>Clear saved progress</button>');
  expect(footer(render())).not.toContain('Clear saved progress');
  expect(footer(render()).match(/<button/g)).toHaveLength(1);
});
