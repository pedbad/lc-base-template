/**
 * CircularAudioProgressAnimatedSpeaker — the interactive `super-compact-speaker`
 * clip: a thin wrapper that drives the (presentational) animated speaker display
 * with useAudioClip state. Use this when the clip plays a single sound on click;
 * for a master playlist the display is driven by the sequence controller instead.
 *
 * Ported from french-lo-1; `onStatusChange` is now threaded through (the original
 * dropped it, so callers relying on play/stop feedback got nothing).
 */
import type { ClipStatus } from '@/audio/useAudioClip';
import { useAudioClip } from '@/audio/useAudioClip';
import { CircularAudioProgressAnimatedSpeakerDisplay } from './CircularAudioProgressAnimatedSpeakerDisplay';

interface AnimatedSpeakerProps {
  soundFile: string;
  id?: string;
  className?: string;
  inline?: boolean;
  size?: number;
  title?: string;
  onStatusChange?: (status: ClipStatus) => void;
}

export function CircularAudioProgressAnimatedSpeaker({
  soundFile,
  id,
  className = '',
  inline,
  size,
  title,
  onStatusChange,
}: AnimatedSpeakerProps) {
  const { status, progress, duration, handleClick } = useAudioClip(soundFile, {
    id,
    onStatusChange,
  });

  return (
    <span>
      <CircularAudioProgressAnimatedSpeakerDisplay
        className={className}
        size={size}
        inline={inline}
        status={status}
        progress={progress}
        duration={duration}
        handleClick={handleClick}
        title={title}
      />
    </span>
  );
}
