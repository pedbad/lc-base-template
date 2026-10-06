/**
 * Tests for the scroll-spy's pure selection rules (header scroll-spy spec §3).
 */
import { describe, expect, test } from 'vitest';
import { isScrolledToBottom, pickSectionInView } from './sectionInView';

const LINE = 88;

const at = (...tops: number[]) => tops.map((top, index) => ({ id: `s${index}`, top }));

describe('pickSectionInView', () => {
  test('returns undefined when there are no sections', () => {
    expect(pickSectionInView([], LINE, false)).toBeUndefined();
  });

  test('returns undefined while every section is still below the line (the hero, S2)', () => {
    expect(pickSectionInView(at(400, 900, 1600), LINE, false)).toBeUndefined();
  });

  test('returns the last section whose top has reached the line', () => {
    expect(pickSectionInView(at(-900, -200, 300), LINE, false)).toBe('s1');
  });

  test('a top exactly on the line counts as reached (where a followed link lands it)', () => {
    expect(pickSectionInView(at(-400, LINE, 700), LINE, false)).toBe('s1');
  });

  test('at the bottom of the page the last section wins whatever the positions (S4)', () => {
    expect(pickSectionInView(at(-900, -200, 300), LINE, true)).toBe('s2');
  });
});

describe('isScrolledToBottom', () => {
  test('false before any scrolling, even when the page fits the viewport', () => {
    expect(isScrolledToBottom(0, 800, 600)).toBe(false);
  });

  test('true when the viewport reaches the end of the document', () => {
    expect(isScrolledToBottom(1200, 800, 2000)).toBe(true);
  });

  test('true within the tolerance for sub-pixel scroll positions', () => {
    expect(isScrolledToBottom(1199.5, 800, 2000)).toBe(true);
  });

  test('false when the end is still out of reach', () => {
    expect(isScrolledToBottom(1000, 800, 2000)).toBe(false);
  });
});
