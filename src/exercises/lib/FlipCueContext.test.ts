/**
 * FlipCueContext.test.ts — outside an ExerciseHost (an engine rendered on its own, as
 * its tests do) the cue simply stays: shown, and turns change nothing (TODO §E21).
 */
import { describe, expect, test } from 'vitest';
import { STATIC_FLIP_CUE } from './FlipCueContext';

describe('STATIC_FLIP_CUE', () => {
  test('is shown and never retires', () => {
    expect(STATIC_FLIP_CUE.phase).toBe('shown');
    expect(STATIC_FLIP_CUE.recordTurn()).toBe(false);
    expect(STATIC_FLIP_CUE.recordTurn()).toBe(false);
    expect(STATIC_FLIP_CUE.recordTurn()).toBe(false);
    STATIC_FLIP_CUE.finishLeaving();
    STATIC_FLIP_CUE.restore();
    expect(STATIC_FLIP_CUE.phase).toBe('shown');
  });
});
