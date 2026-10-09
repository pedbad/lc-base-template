/**
 * Tests for WordOrderExercise, rendered to static markup (no DOM needed).
 *
 * TODO §D18 (maintainer, 2026-10-09): the progress meter counts only on Check. It
 * used to count pieces in place as they moved, so a fresh shuffle could open at
 * "1 correct out of 7" before the student had done anything.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import WordOrderExercise from './WordOrderExercise';

const config = { type: 'word-order', content: { words: ['Yo', 'como', 'pan'] } };

describe('WordOrderExercise', () => {
  test('a fresh shuffle opens the meter at zero, whatever lands in place', () => {
    // Three words: about half of all shuffles leave one in place.
    for (let run = 0; run < 60; run += 1) {
      const html = renderToStaticMarkup(<WordOrderExercise config={config} />);
      expect(html).toContain('0 correct out of 3');
    }
  });
});
