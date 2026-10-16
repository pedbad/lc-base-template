/**
 * flip-cue-phase.test.ts — the session state behind a retiring flip cue (TODO §E21):
 * shown → leaving on the third turn → gone once the exits finish.
 */
import { describe, expect, test } from 'vitest';
import {
  INITIAL_FLIP_CUE_SESSION,
  RETIRE_AFTER_TURNS,
  finishLeaving,
  phaseOf,
  recordTurn,
  type FlipCueSession,
} from './flip-cue-phase';

/** Record `count` turns from the start, never stored as retired. */
const turns = (count: number): FlipCueSession => {
  let session = INITIAL_FLIP_CUE_SESSION;
  for (let index = 0; index < count; index++) session = recordTurn(session, false).session;
  return session;
};

describe('recordTurn', () => {
  test('retires the cue on the third turn (maintainer, 2026-10-16)', () => {
    expect(RETIRE_AFTER_TURNS).toBe(3);
  });

  test('the first two turns only count', () => {
    const first = recordTurn(INITIAL_FLIP_CUE_SESSION, false);
    expect(first.retiresNow).toBe(false);
    expect(first.session).toEqual({ turns: 1, phase: 'shown' });
    expect(recordTurn(first.session, false)).toEqual({
      session: { turns: 2, phase: 'shown' },
      retiresNow: false,
    });
  });

  test('the third turn sends the cue leaving, and says so once', () => {
    expect(recordTurn(turns(2), false)).toEqual({
      session: { turns: 3, phase: 'leaving' },
      retiresNow: true,
    });
    expect(recordTurn(turns(3), false).retiresNow).toBe(false);
  });

  test('a cue already retired in an earlier visit counts nothing', () => {
    expect(recordTurn(turns(2), true)).toEqual({ session: turns(2), retiresNow: false });
  });

  test('never changes the session it is given', () => {
    const session = turns(1);
    recordTurn(session, false);
    expect(session).toEqual({ turns: 1, phase: 'shown' });
  });
});

describe('finishLeaving', () => {
  test('turns a leaving cue gone', () => {
    expect(finishLeaving(turns(3))).toEqual({ turns: 3, phase: 'gone' });
  });

  test('leaves a cue that is still shown alone', () => {
    const session = turns(1);
    expect(finishLeaving(session)).toBe(session);
  });
});

describe('phaseOf', () => {
  test('is shown before anything happens', () => {
    expect(phaseOf(INITIAL_FLIP_CUE_SESSION, false)).toBe('shown');
  });

  test('is gone when an earlier visit retired it', () => {
    expect(phaseOf(INITIAL_FLIP_CUE_SESSION, true)).toBe('gone');
  });

  test('stays leaving after this visit saves the flag, so the exit is not cut short', () => {
    expect(phaseOf(turns(3), true)).toBe('leaving');
    expect(phaseOf(finishLeaving(turns(3)), true)).toBe('gone');
  });
});
