/**
 * AudioClip — the public clip entry point. Dispatches on className tokens to the
 * variant that fits the surface:
 *   - "super-compact-speaker" → animated speaker (AudioManager-driven, click-to-play)
 *   - otherwise               → a native <audio controls> element
 *
 * Ported from french-lo-1's AudioClip dispatcher, trimmed to the two variants the
 * ported engines use. The `link` and bare-ring variants are intentionally not ported
 * (no consumer yet); add them back when an engine needs them (YAGNI). `onStatusChange`
 * is forwarded to the speaker variant so callers get play/stop feedback.
 */
import { useRef } from 'react';
import type { SyntheticEvent } from 'react';
import AudioManager from '@/audio/AudioManager';
import type { ClipStatus } from '@/audio/useAudioClip';
import { resolveAsset } from '@/lib/assets';
import { CircularAudioProgressAnimatedSpeaker } from './CircularAudioProgressAnimatedSpeaker';

interface AudioClipProps {
  soundFile: string;
  className?: string;
  id?: string;
  inline?: boolean;
  size?: number;
  /** Label for the native variant: renders "<label>: <audio>". */
  listenText?: string;
  /** `lang` for `listenText` (WCAG 3.1.2) when it's authored target-language content. */
  listenTextLang?: string;
  onStatusChange?: (status: ClipStatus) => void;
}

/**
 * Native <audio controls>. The browser owns the UI; on play we stop every other
 * clip but leave this element running (AudioManager.stopAll with `except`).
 */
function NativeAudioClip({
  className = '',
  id,
  listenText = '',
  listenTextLang,
  soundFile,
}: Pick<AudioClipProps, 'className' | 'id' | 'listenText' | 'listenTextLang' | 'soundFile'>) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlay = (event: SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
    AudioManager.stopAll({ except: audioRef.current });
  };

  const audio = (ariaLabel: string) => (
    // Pronunciation/listening clips are audio-only with no caption track to ship;
    // the aria-label names the control for assistive tech.
    // eslint-disable-next-line jsx-a11y/media-has-caption -- audio-only clip, no captions exist
    <audio
      aria-label={ariaLabel}
      className={className}
      controls
      id={id}
      onPlay={handlePlay}
      ref={audioRef}
    >
      <source src={resolveAsset(soundFile)} />
    </audio>
  );

  if (className.split(/\s+/).includes('compact')) return audio('Audio clip');

  if (listenText !== '') {
    // NB: not a <label> — <audio> is not a labelable form control, so `for=` would
    // orphan. The caption is a plain sibling; the audio names itself via aria-label.
    return (
      <span className="audio-clip" lang={listenTextLang}>
        {listenText}: {audio(listenText)}
      </span>
    );
  }

  return <div className="audio-clip">{audio('Audio clip')}</div>;
}

export function AudioClip({
  className = '',
  id,
  inline = false,
  listenText = '',
  listenTextLang,
  size,
  soundFile,
  onStatusChange,
}: AudioClipProps) {
  if (className.split(/\s+/).includes('super-compact-speaker')) {
    return (
      <CircularAudioProgressAnimatedSpeaker
        className={className}
        id={id}
        inline={inline}
        size={size}
        soundFile={soundFile}
        onStatusChange={onStatusChange}
      />
    );
  }

  return (
    <NativeAudioClip
      className={className}
      id={id}
      listenText={listenText}
      listenTextLang={listenTextLang}
      soundFile={soundFile}
    />
  );
}
