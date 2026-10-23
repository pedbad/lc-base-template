/**
 * flip-cue-exits.test.ts — which exit each retiring "Tap to flip" corner plays, and when
 * (TODO §E21, docs/specs/2026-10-16-flip-cue-retire-design.md §2).
 */
import { describe, expect, test } from 'vitest';
import {
  FLIP_CUE_EXIT_MS,
  FLIP_CUE_EXIT_WEIGHTS,
  FLIP_CUE_STAGGER_MS,
  latestEnding,
  pickExit,
  planExits,
} from './flip-cue-exits';

/** A random source that returns the given values in turn. */
const sequence = (...values: number[]) => {
  let index = 0;
  return () => values[index++ % values.length] ?? 0;
};

describe('FLIP_CUE_EXIT_WEIGHTS', () => {
  test('gives all ten exits an equal chance (maintainer, 2026-10-23)', () => {
    expect(FLIP_CUE_EXIT_WEIGHTS).toEqual({
      peel: 10,
      pop: 10,
      wave: 10,
      tuck: 10,
      fold: 10,
      flip: 10,
      wipe: 10,
      spin: 10,
      shatter: 10,
      melt: 10,
    });
  });

  test('add up to 100, so each weight reads as a percentage', () => {
    const total = Object.values(FLIP_CUE_EXIT_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    expect(total).toBe(100);
  });
});

describe('pickExit', () => {
  test.each([
    [0, 'peel'],
    [0.0999, 'peel'],
    [0.1, 'pop'],
    [0.2, 'wave'],
    [0.3, 'tuck'],
    [0.4, 'fold'],
    [0.5, 'flip'],
    [0.6, 'wipe'],
    [0.7, 'spin'],
    [0.8, 'shatter'],
    [0.9, 'melt'],
    [0.9999, 'melt'],
  ])('a random value of %s picks %s', (value, exit) => {
    expect(pickExit(() => value)).toBe(exit);
  });

  test('a broken random source (1 or more) still picks an exit', () => {
    expect(pickExit(() => 1)).toBe('melt');
  });
});

describe('planExits', () => {
  test('gives each card its own exit, in deck order', () => {
    const plan = planExits(['a', 'b', 'c'], sequence(0, 0.5, 0.9));
    expect(plan.map((entry) => [entry.id, entry.exit])).toEqual([
      ['a', 'peel'],
      ['b', 'flip'],
      ['c', 'melt'],
    ]);
  });

  test('staggers the cards 70 ms apart after the start delay', () => {
    expect(FLIP_CUE_STAGGER_MS).toBe(70);
    const plan = planExits(['a', 'b', 'c'], () => 0, 250);
    expect(plan.map((entry) => entry.delayMs)).toEqual([250, 320, 390]);
  });

  test('starts at once when no start delay is given', () => {
    expect(planExits(['only'], () => 0)[0]?.delayMs).toBe(0);
  });

  test('plans nothing for no cards', () => {
    expect(planExits([], () => 0)).toEqual([]);
  });
});

describe('latestEnding', () => {
  test('is the card whose exit ends last, not simply the last card', () => {
    // A long peel that starts first can outlast a short pop that starts later.
    const longFirst = FLIP_CUE_EXIT_MS.peel - FLIP_CUE_EXIT_MS.pop;
    expect(longFirst).toBeGreaterThan(FLIP_CUE_STAGGER_MS);
    const plan = [
      { id: 'a', exit: 'peel' as const, delayMs: 0 },
      { id: 'b', exit: 'pop' as const, delayMs: FLIP_CUE_STAGGER_MS },
    ];
    expect(latestEnding(plan)).toBe('a');
  });

  test('is the later card when both end together', () => {
    const plan = [
      { id: 'a', exit: 'tuck' as const, delayMs: 0 },
      { id: 'b', exit: 'tuck' as const, delayMs: 0 },
    ];
    expect(latestEnding(plan)).toBe('b');
  });

  test('is null for an empty plan', () => {
    expect(latestEnding([])).toBeNull();
  });
});
