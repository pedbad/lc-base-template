/**
 * Tests for PhraseReorderExercise, rendered to static markup (no DOM needed).
 *
 * TODO §D18 (maintainer, 2026-10-09): the progress meter counts only on Check. It
 * used to count phrases in place as they moved, so a fresh shuffle could open above
 * zero before the student had done anything.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PhraseReorderExercise from './PhraseReorderExercise';

const config = {
  type: 'phrase-reorder',
  content: {
    rows: [
      { phrase: 'Buenos días', prompt: 'Good morning' },
      { phrase: '¿Cómo estás?', prompt: 'How are you?' },
      { phrase: 'Hasta luego', prompt: 'See you later' },
    ],
  },
};

describe('PhraseReorderExercise', () => {
  test('a fresh shuffle opens the meter at zero, whatever lands in place', () => {
    // Three phrases: about half of all shuffles leave one in place.
    for (let run = 0; run < 60; run += 1) {
      const html = renderToStaticMarkup(<PhraseReorderExercise config={config} />);
      expect(html).toContain('0 correct out of 3');
    }
  });
});
