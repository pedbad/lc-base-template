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
  test('favours peel and pop, sometimes wave and tuck (maintainer, 2026-10-16)', () => {
    expect(FLIP_CUE_EXIT_WEIGHTS).toEqual({ peel: 35, pop: 35, wave: 15, tuck: 15 });
  });

  test('add up to 100, so each weight reads as a percentage', () => {
    const total = Object.values(FLIP_CUE_EXIT_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    expect(total).toBe(100);
  });
});

describe('pickExit', () => {
  test.each([
    [0, 'peel'],
    [0.3499, 'peel'],
    [0.35, 'pop'],
    [0.6999, 'pop'],
    [0.7, 'wave'],
    [0.8499, 'wave'],
    [0.85, 'tuck'],
    [0.9999, 'tuck'],
  ])('a random value of %s picks %s', (value, exit) => {
    expect(pickExit(() => value)).toBe(exit);
  });

  test('a broken random source (1 or more) still picks an exit', () => {
    expect(pickExit(() => 1)).toBe('tuck');
  });
});

describe('planExits', () => {
  test('gives each card its own exit, in deck order', () => {
    const plan = planExits(['a', 'b', 'c'], sequence(0, 0.5, 0.9));
    expect(plan.map((entry) => [entry.id, entry.exit])).toEqual([
      ['a', 'peel'],
      ['b', 'pop'],
      ['c', 'tuck'],
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
