/**
 * image-pairs.test.ts — the Images section finds light/dark pairs by file name, and
 * fails here when a variant's other half is missing (E20).
 */
import { describe, expect, test } from 'vitest';
import { APP_IMAGES } from './app-assets';
import { groupImages } from './image-pairs';

describe('groupImages', () => {
  test('pairs -black with -white and -light with -dark, light-ground side first', () => {
    const { pairs, singles, orphans } = groupImages([
      'images/a/mark-white.svg',
      'images/a/mark-black.svg',
      'images/a/lockup-light.png',
      'images/a/lockup-dark.png',
    ]);
    expect(pairs).toEqual([
      { name: 'mark', light: 'images/a/mark-black.svg', dark: 'images/a/mark-white.svg' },
      { name: 'lockup', light: 'images/a/lockup-light.png', dark: 'images/a/lockup-dark.png' },
    ]);
    expect(singles).toEqual([]);
    expect(orphans).toEqual([]);
  });

  test('keeps the order of everything else as a single', () => {
    const { singles } = groupImages(['logo.svg', 'images/x-black.svg', 'images/b.svg']);
    expect(singles).toEqual(['logo.svg', 'images/x-black.svg', 'images/b.svg']);
  });

  test('a variant whose other half is missing is an orphan, and still shown as a single', () => {
    const { pairs, singles, orphans } = groupImages(['images/x-white.svg', 'images/y-light.png']);
    expect(pairs).toEqual([]);
    expect(orphans).toEqual(['images/x-white.svg', 'images/y-light.png']);
    expect(singles).toEqual(orphans);
  });

  test('a partner must share folder and extension', () => {
    const { orphans } = groupImages([
      'images/a/mark-black.svg',
      'images/b/mark-white.svg',
      'images/c-light.svg',
      'images/c-dark.png',
    ]);
    expect(orphans).toHaveLength(4);
  });
});

describe('the app images', () => {
  test('every light/dark variant has its other half', () => {
    expect(groupImages(APP_IMAGES).orphans).toEqual([]);
  });

  test('the four footer marks pair up', () => {
    expect(groupImages(APP_IMAGES).pairs.map((pair) => pair.name)).toEqual([
      'cc-logo',
      'elearning-logo',
      'lc-logo',
      'ucam-lockup',
    ]);
  });
});
