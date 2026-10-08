/**
 * answer-feedback.test.ts — what a learner sees after a wrong typed answer (maintainer,
 * 2026-10-08). The old line wove the typed text and the answer into one string
 * ("losgaterergeros"); it named no error and gave the answer away on the first try.
 * Now: the first wrong Check names the KIND of error and lets the learner try again;
 * the second shows the answer, with only the differing part marked, and only on a
 * close miss.
 */
import { describe, expect, test } from 'vitest';
import {
  REVEAL_AFTER_MISSES,
  answerKey,
  answerSegments,
  classifyMiss,
  feedbackFor,
  firstMarkedReveal,
  gradeTypedAnswers,
  similarity,
} from './answer-feedback';

describe('similarity', () => {
  test('is 1 for equal strings and 0 for nothing in common', () => {
    expect(similarity('gatos', 'gatos')).toBe(1);
    expect(similarity('abc', 'xyz')).toBe(0);
    expect(similarity('', '')).toBe(1);
  });

  test('scores a near miss high and a wild guess low', () => {
    expect(similarity('los gatas', 'los gatos')).toBeCloseTo(0.89, 2);
    expect(similarity('gtererger', 'los gatos')).toBeCloseTo(0.22, 2);
  });
});

describe('answerKey — what is compared', () => {
  test('ignores capitalisation by default', () => {
    expect(answerKey('Los Gatos', 'strict')).toBe(answerKey('los gatos', 'strict'));
  });

  test('counts capitalisation when the author asks', () => {
    expect(answerKey('Los gatos', 'strict', true)).not.toBe(answerKey('los gatos', 'strict', true));
  });

  test('never ignores accents', () => {
    expect(answerKey('está', 'strict')).not.toBe(answerKey('esta', 'strict'));
  });

  test('dictation still ignores sentence punctuation', () => {
    expect(answerKey('¿Qué tal?', 'dictation')).toBe(answerKey('qué tal', 'dictation'));
  });
});

describe('classifyMiss', () => {
  test.each([
    ['esta', 'está', 'accent'],
    ['los gatós', 'los gatos', 'accent'],
    ['los gatas', 'los gatos', 'ending'],
    ['comes', 'come', 'ending'],
    ['los gato', 'los gatos', 'missing'],
    ['habla', 'hablamos', 'missing'],
    ['los gtaos', 'los gatos', 'close'],
    ['gtererger', 'los gatos', 'far'],
  ] as const)('%s for %s is %s', (typed, expected, reason) => {
    expect(classifyMiss(typed, expected)).toBe(reason);
  });
});

describe('answerSegments — the answer with what differs marked', () => {
  test('marks the letters the learner got wrong or left out', () => {
    expect(answerSegments('los gatas', 'los gatos')).toEqual([
      { text: 'los gat', differs: false },
      { text: 'o', differs: true },
      { text: 's', differs: false },
    ]);
    expect(answerSegments('los gato', 'los gatos')).toEqual([
      { text: 'los gato', differs: false },
      { text: 's', differs: true },
    ]);
  });

  test('marks where an extra letter was typed', () => {
    expect(answerSegments('los gatoss', 'los gatos')).toEqual([
      { text: 'los gato', differs: false },
      { text: 's', differs: true },
    ]);
  });

  test('keeps the answer as authored, capitals included', () => {
    const segments = answerSegments('el perro', 'El gato');
    expect(segments.map((segment) => segment.text).join('')).toBe('El gato');
    expect(segments[0]).toEqual({ text: 'El ', differs: false });
  });
});

describe('feedbackFor', () => {
  test('first wrong Check: a hint naming the error, never the answer', () => {
    expect(feedbackFor('los gatas', 'los gatos', 1)).toEqual({ kind: 'hint', reason: 'ending' });
    expect(feedbackFor('gtererger', 'los gatos', 1)).toEqual({ kind: 'hint', reason: 'far' });
  });

  test(`after ${REVEAL_AFTER_MISSES} wrong Checks: the answer, the difference marked on a close miss`, () => {
    expect(feedbackFor('los gatas', 'los gatos', REVEAL_AFTER_MISSES)).toEqual({
      kind: 'reveal',
      answer: 'los gatos',
      segments: [
        { text: 'los gat', differs: false },
        { text: 'o', differs: true },
        { text: 's', differs: false },
      ],
    });
  });

  test('a far miss reveals the answer plain: marking nearly everything teaches nothing', () => {
    expect(feedbackFor('gtererger', 'los gatos', REVEAL_AFTER_MISSES)).toEqual({
      kind: 'reveal',
      answer: 'los gatos',
      segments: [{ text: 'los gatos', differs: false }],
    });
  });
});

describe('gradeTypedAnswers — one Check over a set of typed answers', () => {
  const expected = ['los gatos', 'está', 'come'];

  test('skips empty answers, grades the rest, counts misses per answer', () => {
    const result = gradeTypedAnswers(expected, { 0: 'los gatas', 1: 'está', 2: ' ' }, {});

    expect(result.checkedResults).toEqual({ 0: false, 1: true });
    expect(result.misses).toEqual({ 0: 1 });
    expect(result.feedback).toEqual({ 0: { kind: 'hint', reason: 'ending' } });
  });

  test('the second wrong Check on an answer reveals it; a right one gets no line', () => {
    const result = gradeTypedAnswers(expected, { 0: 'los gatas', 1: 'esta' }, { 0: 1 });

    expect(result.misses).toEqual({ 0: 2, 1: 1 });
    expect(result.feedback[0]?.kind).toBe('reveal');
    expect(result.feedback[1]).toEqual({ kind: 'hint', reason: 'accent' });
  });

  test('capitals do not count by default, and do when the author asks', () => {
    expect(gradeTypedAnswers(['Los gatos'], { 0: 'los gatos' }, {}).checkedResults[0]).toBe(true);
    expect(
      gradeTypedAnswers(['Los gatos'], { 0: 'los gatos' }, {}, 'strict', true).checkedResults[0],
    ).toBe(false);
  });

  test('dictation ignores sentence punctuation, as before', () => {
    expect(
      gradeTypedAnswers(['¿Qué tal?'], { 0: 'qué tal' }, {}, 'dictation').checkedResults[0],
    ).toBe(true);
  });
});

describe('firstMarkedReveal — where the one-line key goes', () => {
  test('is the first revealed answer with something marked', () => {
    const plain = {
      kind: 'reveal',
      answer: 'x',
      segments: [{ text: 'x', differs: false }],
    } as const;
    const marked = {
      kind: 'reveal',
      answer: 'x',
      segments: [{ text: 'x', differs: true }],
    } as const;

    expect(firstMarkedReveal({ 0: plain, 2: marked, 3: marked })).toBe(2);
    expect(firstMarkedReveal({ 0: plain, 1: { kind: 'hint', reason: 'far' } })).toBeUndefined();
  });
});
