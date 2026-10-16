/**
 * flip-cue-phase.ts — the session state behind a retiring flip cue (TODO §E21).
 *
 * `shown` until the third card is turned, then `leaving` while the exits play, then
 * `gone`. A cue retired in an earlier visit (the saved flag) is `gone` from the start.
 * Pure, so the hook in useFlipCue.ts is only glue.
 *
 * The session's own `leaving` / `gone` wins over the saved flag: the flag is written at
 * the third turn, and reading it then must not cut the exit short.
 */

/** Cards turned in one exercise before its cue retires (maintainer, 2026-10-16). */
export const RETIRE_AFTER_TURNS = 3;

export type FlipCuePhase = 'shown' | 'leaving' | 'gone';

export interface FlipCueSession {
  readonly turns: number;
  /** This visit's own phase; `shown` defers to the saved flag (`phaseOf`). */
  readonly phase: FlipCuePhase;
}

export const INITIAL_FLIP_CUE_SESSION: FlipCueSession = { turns: 0, phase: 'shown' };

/** The phase to render: this visit's own once it moved, else the saved flag's. */
export function phaseOf(session: FlipCueSession, isStoredRetired: boolean): FlipCuePhase {
  if (session.phase !== 'shown') return session.phase;
  return isStoredRetired ? 'gone' : 'shown';
}

/** Count one card turned. `retiresNow` is true on the one turn that retires the cue. */
export function recordTurn(
  session: FlipCueSession,
  isStoredRetired: boolean,
): { session: FlipCueSession; retiresNow: boolean } {
  if (phaseOf(session, isStoredRetired) !== 'shown') return { session, retiresNow: false };
  const turns = session.turns + 1;
  const retiresNow = turns >= RETIRE_AFTER_TURNS;
  return { session: { turns, phase: retiresNow ? 'leaving' : 'shown' }, retiresNow };
}

/** The exits have played: a leaving cue is gone. Anything else is unchanged. */
export function finishLeaving(session: FlipCueSession): FlipCueSession {
  return session.phase === 'leaving' ? { ...session, phase: 'gone' } : session;
}
