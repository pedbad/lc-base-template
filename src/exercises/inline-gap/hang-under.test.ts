/**
 * hang-under.test.ts — where a blank's feedback line sits (maintainer, 2026-10-09; TODO
 * §D15). The line hangs under its blank without widening it, so the sentence never
 * moves; it stays inside the row, and clear of the next wrong blank's line on the
 * same text line.
 */
import { describe, expect, test } from 'vitest';
import { HANG_GAP_PX, placeHangs } from './hang-under';

const ROW = { start: 0, end: 600 };

describe('placeHangs', () => {
  test('a line that fits keeps its width and does not move', () => {
    expect(placeHangs([{ start: 100, width: 150, top: 40 }], ROW)).toEqual([
      { width: 150, shift: 0 },
    ]);
  });

  test('a line that would cross the row end moves back so its end meets it', () => {
    expect(placeHangs([{ start: 500, width: 160, top: 40 }], ROW)).toEqual([
      { width: 160, shift: 60 },
    ]);
  });

  test('a line wider than the row wraps to the row width and starts at the row start', () => {
    const narrow = { start: 0, end: 200 };
    expect(placeHangs([{ start: 120, width: 220, top: 40 }], narrow)).toEqual([
      { width: 200, shift: 120 },
    ]);
  });

  test('two on one text line: the first wraps short of the second, which runs on', () => {
    const [first, second] = placeHangs(
      [
        { start: 100, width: 200, top: 40 },
        { start: 220, width: 200, top: 40 },
      ],
      ROW,
    );
    expect(first).toEqual({ width: 120 - HANG_GAP_PX, shift: 0 });
    expect(second).toEqual({ width: 200, shift: 0 });
  });

  test('the later one on a line never moves back under the earlier one; it wraps', () => {
    const [, second] = placeHangs(
      [
        { start: 100, width: 100, top: 40 },
        { start: 450, width: 200, top: 40 },
      ],
      ROW,
    );
    expect(second).toEqual({ width: 150, shift: 0 });
  });

  test('lines on different text lines do not limit each other, in any order', () => {
    expect(
      placeHangs(
        [
          { start: 300, width: 200, top: 90 },
          { start: 100, width: 200, top: 40 },
          { start: 200, width: 200, top: 41 },
        ],
        ROW,
      ),
    ).toEqual([
      { width: 200, shift: 0 },
      { width: 100 - HANG_GAP_PX, shift: 0 },
      { width: 200, shift: 0 },
    ]);
  });
});
