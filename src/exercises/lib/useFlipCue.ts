/**
 * useFlipCue.ts — the glue behind FlipCueContext (TODO §E21): this visit's session
 * (flip-cue-phase.ts) plus the saved flag (flip-cue-store.ts).
 *
 * The flag is read with `useSyncExternalStore`, whose server snapshot is "not retired",
 * so the prerendered page and the hydration render both show the cue (AGENTS.md:
 * prerender equals the first client render); a saved retirement hides it on the next
 * render. The session sits in a ref as well as in state, so `recordTurn` can answer
 * synchronously inside the engine's click handler.
 */
import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { resolveHomeHref } from '@/lib/assets';
import type { FlipCueControl } from './FlipCueContext';
import {
  INITIAL_FLIP_CUE_SESSION,
  finishLeaving,
  phaseOf,
  recordTurn,
  type FlipCueSession,
} from './flip-cue-phase';
import {
  flipCueKey,
  isFlipCueRetired,
  restoreFlipCue,
  retireFlipCue,
  subscribeFlipCue,
} from './flip-cue-store';

const notRetiredOnServer = () => false;

export function useFlipCue(progressId: string | undefined): FlipCueControl {
  const key = progressId ? flipCueKey(resolveHomeHref(), progressId) : null;
  const isStoredRetired = useSyncExternalStore(
    subscribeFlipCue,
    () => isFlipCueRetired(key),
    notRetiredOnServer,
  );
  const [session, setSession] = useState<FlipCueSession>(INITIAL_FLIP_CUE_SESSION);
  const sessionRef = useRef(session);

  return useMemo(() => {
    const commit = (next: FlipCueSession) => {
      sessionRef.current = next;
      setSession(next);
    };
    return {
      phase: phaseOf(session, isStoredRetired),
      recordTurn: () => {
        const result = recordTurn(sessionRef.current, isFlipCueRetired(key));
        commit(result.session);
        if (result.retiresNow) retireFlipCue(key);
        return result.retiresNow;
      },
      finishLeaving: () => commit(finishLeaving(sessionRef.current)),
      restore: () => {
        restoreFlipCue(key);
        commit(INITIAL_FLIP_CUE_SESSION);
      },
    };
  }, [session, isStoredRetired, key]);
}
