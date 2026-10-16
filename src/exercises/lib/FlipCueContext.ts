/**
 * FlipCueContext.ts — one exercise's flip-cue phase, shared by its instruction box and
 * its engine (TODO §E21). ExerciseHost provides it (useFlipCue.ts); the flip engines
 * report each card turned and render no corner once the phase is `gone`.
 *
 * Outside a host — an engine rendered on its own, as its tests do — the default keeps
 * the cue shown, and turns change nothing.
 */
import { createContext } from 'react';
import type { FlipCuePhase } from './flip-cue-phase';

export interface FlipCueControl {
  readonly phase: FlipCuePhase;
  /** Count one card turned. True on the turn that retires the cue: plan the exits. */
  readonly recordTurn: () => boolean;
  /** The last exit has finished (or a Reset cut it short): the cue is gone. */
  readonly finishLeaving: () => void;
}

export const STATIC_FLIP_CUE: FlipCueControl = {
  phase: 'shown',
  recordTurn: () => false,
  finishLeaving: () => {},
};

export const FlipCueContext = createContext<FlipCueControl>(STATIC_FLIP_CUE);
