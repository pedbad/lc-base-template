/**
 * Tests for FlashcardsExercise's study stage (maintainer, 2026-10-08, option A).
 * Rendered to static markup (no DOM in this suite), so they pin the first view: the
 * progress circles that replaced "Card 1 of N", the direction switch, the card's
 * language label and back face, the single "Show answer" action and the quiet
 * housekeeping row. The flip/rate transitions are the reducer's (flashcards-deck).
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import FlashcardsExercise from './FlashcardsExercise';

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

  test('starts with one Show answer action, not Flip', () => {
    const html = render();
    expect(html).toContain('>Show answer</button>');
    expect(html).not.toContain('>Flip</button>');
  });

  test('keeps Restart in the housekeeping row, after the footnote', () => {
    const html = render();
    const footer = html.indexOf('class="flashcards-footer"');

    expect(html.indexOf('Escucha y repite.')).toBeLessThan(footer);
    expect(html.indexOf('Restart', footer)).toBeGreaterThan(footer);
  });

  test('stacks spare cards behind the current one while two or more remain', () => {
    expect(render()).toContain('data-stack="2"');
  });
});
