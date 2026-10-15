/**
 * useAudioClip — playback state + a single click handler for an AudioManager-driven
 * clip (the animated-speaker variant). Holds status / progress / duration, wires the
 * AudioManager subscription (another clip starting resets this one; a refused resume
 * shows paused, via clipStatus.ts),
 * attaches media listeners to the off-DOM Audio element, and toggles play/pause.
 *
 * Ported from french-lo-1's components/AudioClip/useAudioClip.js (typed).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import AudioManager from './AudioManager';
import { statusAfterManagerChange } from './clipStatus';
import { resolveAsset } from '@/lib/assets';

export type ClipStatus = 'stopped' | 'playing' | 'paused';

interface UseAudioClipOptions {
  /** Stable clip id (falls back to the soundFile path). */
  id?: string;
  onStatusChange?: (status: ClipStatus) => void;
}

export interface UseAudioClipResult {
  status: ClipStatus;
  progress: number;
  duration: number;
  handleClick: (event?: SyntheticEvent) => void;
}

const stopEvent = (event?: SyntheticEvent) => {
  if (!event) return;
  event.preventDefault();
  event.stopPropagation();
};

export function useAudioClip(
  soundFile: string,
  { id, onStatusChange }: UseAudioClipOptions = {},
): UseAudioClipResult {
  const clipId = id || soundFile;

  const [status, setStatusState] = useState<ClipStatus>('stopped');
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [soundFileAudio, setSoundFileAudio] = useState<HTMLAudioElement | null>(null);

  // Latest status for the subscribe callback / click switch, without re-subscribing
  // or reading a stale value inside closures. Synced in an effect (never written
  // during render).
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const setStatus = useCallback(
    (nextStatus: ClipStatus) => {
      setStatusState(nextStatus);
      onStatusChange?.(nextStatus);
    },
    [onStatusChange],
  );

  // Follow the manager (statusAfterManagerChange): another clip starting stops this
  // one, otherwise the next click would pause instead of replay; a refused resume
  // shows paused rather than a stuck "playing".
  useEffect(() => {
    const unsubscribe = AudioManager.subscribe((managerState) => {
      const next = statusAfterManagerChange(managerState, clipId, statusRef.current);
      if (next === null) return;
      setStatus(next);
      if (next === 'stopped') setProgress(0);
    });
    return unsubscribe;
  }, [clipId, setStatus]);

  // Media listeners on the off-DOM Audio element AudioManager.play created.
  useEffect(() => {
    if (!soundFileAudio) return undefined;
    const handleMetadataLoaded = () => setDuration(soundFileAudio.duration);
    const handleTimeUpdate = () => setProgress(soundFileAudio.currentTime);
    soundFileAudio.addEventListener('loadedmetadata', handleMetadataLoaded);
    soundFileAudio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      soundFileAudio.removeEventListener('loadedmetadata', handleMetadataLoaded);
      soundFileAudio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [soundFileAudio]);

  const playSound = useCallback(
    (event?: SyntheticEvent) => {
      stopEvent(event);
      const audio = AudioManager.play(resolveAsset(soundFile), {
        id: clipId,
        onEnded: () => {
          setStatus('stopped');
          setProgress(0);
        },
      });
      setSoundFileAudio(audio);
      setStatus('playing');
    },
    [soundFile, clipId, setStatus],
  );

  const pause = useCallback(
    (event?: SyntheticEvent) => {
      stopEvent(event);
      setStatus('paused');
      AudioManager.pause(clipId);
    },
    [clipId, setStatus],
  );

  const handleClick = useCallback(
    (event?: SyntheticEvent) => {
      stopEvent(event);
      switch (statusRef.current) {
        case 'stopped':
          playSound(event);
          break;
        case 'paused':
          setStatus('playing');
          if (!soundFileAudio || !AudioManager.getActiveId()) {
            playSound(event);
          } else {
            AudioManager.resume(clipId);
          }
          break;
        case 'playing':
          pause(event);
          break;
        default:
          break;
      }
    },
    [playSound, pause, soundFileAudio, clipId, setStatus],
  );

  return { status, progress, duration, handleClick };
}
