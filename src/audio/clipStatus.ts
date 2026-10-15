/**
 * clipStatus — how a speaker icon's status follows AudioManager (TODO §E13b). Pure,
 * so it is unit-tested; useAudioClip wires it to the manager subscription.
 */
import type { AudioManagerState } from './AudioManager';
import type { ClipStatus } from './useAudioClip';

/**
 * The status a clip should move to after a manager change, or null for no change.
 * Another clip taking over (or none left) stops this one, so the next click replays
 * rather than pauses. This clip still active but not playing while the icon says
 * playing means the browser refused the play (a failed resume): show it paused.
 */
export function statusAfterManagerChange(
  managerState: AudioManagerState,
  clipId: string,
  status: ClipStatus,
): ClipStatus | null {
  if (managerState.activeId !== clipId) {
    return status === 'playing' || status === 'paused' ? 'stopped' : null;
  }
  return status === 'playing' && !managerState.isPlaying ? 'paused' : null;
}
