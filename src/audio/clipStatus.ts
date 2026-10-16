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
 * playing means the browser refused the play or something outside the page paused it
 * (media keys, a phone call): show it paused. Playing again while the icon says paused
 * means it was resumed from outside: show it playing.
 */
export function statusAfterManagerChange(
  managerState: AudioManagerState,
  clipId: string,
  status: ClipStatus,
): ClipStatus | null {
  if (managerState.activeId !== clipId) {
    return status === 'playing' || status === 'paused' ? 'stopped' : null;
  }
  if (status === 'playing' && !managerState.isPlaying) return 'paused';
  if (status === 'paused' && managerState.isPlaying) return 'playing';
  return null;
}
