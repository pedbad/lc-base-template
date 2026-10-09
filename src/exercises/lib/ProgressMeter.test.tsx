/**
 * ProgressMeter.test.tsx — the progress line under an exercise (maintainer, 2026-10-09),
 * ported from french-lo-1's ProgressDots. One slot per answer; the first `correct` are
 * filled, so it fills as the count rises (a meter, not a map of the questions — each
 * row already carries its own tick or cross). There is no "wrong" state. The count is
 * said in words in a live region; the slots are decoration.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { ProgressMeter } from './ProgressMeter';
import { progressText } from './progress-text';

const slots = (html: string) => html.match(/class="progress-meter-slot(?: [^"]*)?"/g) ?? [];
const filled = (html: string) => slots(html).filter((slot) => slot.includes('is-filled'));

describe('progressText', () => {
  test('fills both placeholders, wherever the wording puts them', () => {
    expect(progressText('{correct} correct out of {total}', 4, 6)).toBe('4 correct out of 6');
    expect(progressText('{total} questions, {correct} right', 1, 3)).toBe('3 questions, 1 right');
  });
});

describe('ProgressMeter', () => {
  test('one slot per answer, the first `correct` filled, the count in a live line', () => {
    const html = renderToStaticMarkup(<ProgressMeter correct={2} total={5} />);

    expect(slots(html)).toHaveLength(5);
    expect(filled(html)).toHaveLength(2);
    expect(html).toMatch(/<p[^>]*role="status"[^>]*>2 correct out of 5<\/p>/);
    expect(html).toMatch(/class="progress-meter-slots" aria-hidden="true"/);
  });

  test('starts empty, so the goal shows before the first Check', () => {
    const html = renderToStaticMarkup(<ProgressMeter correct={0} total={3} />);
    expect(filled(html)).toHaveLength(0);
    expect(html).toContain('0 correct out of 3');
    expect(html).not.toContain('data-complete');
  });

  test('all correct: every slot filled and the meter marked complete', () => {
    const html = renderToStaticMarkup(<ProgressMeter correct={3} total={3} />);
    expect(filled(html)).toHaveLength(3);
    expect(html).toMatch(/class="progress-meter" data-complete="true"/);
  });

  test('clamps a count outside 0…total', () => {
    expect(filled(renderToStaticMarkup(<ProgressMeter correct={9} total={2} />))).toHaveLength(2);
    expect(filled(renderToStaticMarkup(<ProgressMeter correct={-1} total={2} />))).toHaveLength(0);
  });

  test('nothing to count: no meter at all', () => {
    expect(renderToStaticMarkup(<ProgressMeter correct={0} total={0} />)).toBe('');
  });

  test('an exercise can reword the line', () => {
    const html = renderToStaticMarkup(
      <ProgressMeter
        correct={1}
        total={2}
        labels={{ progressCorrect: '{correct}/{total} bien' }}
      />,
    );
    expect(html).toContain('1/2 bien');
  });

  test('a course icon draws every slot as that icon; without one, a dot', () => {
    const dot = renderToStaticMarkup(<ProgressMeter correct={1} total={2} />);
    expect(dot).not.toContain('is-icon');

    const icon = renderToStaticMarkup(
      <ProgressMeter correct={1} total={2} iconSrc="images/progress/tortoise.svg" />,
    );
    expect(slots(icon).every((slot) => slot.includes('is-icon'))).toBe(true);
    expect(icon).toMatch(/--progress-icon:url\(&quot;\/?images\/progress\/tortoise\.svg&quot;\)/);
  });
});
