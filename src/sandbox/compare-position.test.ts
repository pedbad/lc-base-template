/**
 * compare-position.test.ts — the comparison slider's pointer maths (E20).
 */
import { expect, test } from 'vitest';
import { clipRight, positionFromPointer } from './compare-position';

test('a pointer maps to a whole percent of the frame', () => {
  expect(positionFromPointer(150, 100, 200)).toBe(25);
  expect(positionFromPointer(133, 100, 200)).toBe(17);
});

test('a pointer outside the frame clamps to its edge', () => {
  expect(positionFromPointer(50, 100, 200)).toBe(0);
  expect(positionFromPointer(400, 100, 200)).toBe(100);
});

test('a frame with no width yet keeps the handle in the middle', () => {
  expect(positionFromPointer(120, 100, 0)).toBe(50);
});

test('the top layer is clipped from the right by what the handle leaves', () => {
  expect(clipRight(50)).toBe('inset(0 50% 0 0)');
  expect(clipRight(0)).toBe('inset(0 100% 0 0)');
  expect(clipRight(100)).toBe('inset(0 0% 0 0)');
});
