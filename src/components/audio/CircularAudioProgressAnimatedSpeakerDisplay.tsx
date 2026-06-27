/**
 * CircularAudioProgressAnimatedSpeakerDisplay — a circular audio control: a progress
 * ring around a centre glyph that mirrors the other players (a play triangle by
 * default, pause bars while playing). Presentational and props-driven: the
 * AnimatedSpeaker wrapper feeds it useAudioClip state; the master sequence player
 * feeds it controller state. No playback logic lives here. (Name kept for now though
 * the radiating-speaker glyph was replaced — a rename is a separate cleanup.)
 *
 * Ported from french-lo-1, with three deliberate changes:
 *  - Size comes from a `size` prop (default constant), not a getComputedStyle read
 *    of a CSS var — that was an SSR-unsafe per-render layout read that blanked the
 *    control when the var was missing.
 *  - The progress ring offset is computed in render (no ref + effect).
 *  - The hover label uses aria-label + native title instead of a Tooltip component,
 *    dropping the base-ui coupling for a cosmetic affordance.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §8.
 */
import { memo } from 'react';
import type { SyntheticEvent } from 'react';
import type { ClipStatus } from '@/audio/useAudioClip';
import './audio.css';

const VIEWBOX = 24;
const CENTER = VIEWBOX / 2;
const RADIUS = 11;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const STROKE_WIDTH = 1.8;
/** Rendered pixel size; mirrors french-lo-1's --compact-dimension default. */
const DEFAULT_SIZE = 27;

interface SpeakerDisplayProps {
  status?: ClipStatus;
  progress?: number;
  duration?: number;
  /** Pixel size of the control (width = height). */
  size?: number;
  inline?: boolean;
  className?: string;
  /** Hover/aria label; defaults to a play/pause hint from `status`. */
  title?: string;
  /** When false, render a non-interactive, aria-hidden decoration. */
  interactive?: boolean;
  handleClick?: (event?: SyntheticEvent) => void;
}

function SpeakerSvg({
  size,
  offset,
  isPlaying,
}: {
  size: number;
  offset: number;
  isPlaying: boolean;
}) {
  return (
    <svg
      className="pointer-events-none"
      width={size}
      height={size}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
    >
      {/* Background ring */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        stroke="var(--border)"
        strokeWidth={STROKE_WIDTH}
        fill="none"
      />
      {/* Progress ring */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        fill="none"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${CENTER} ${CENTER})`}
        style={{ transition: 'stroke-dashoffset 0.2s linear' }}
      />
      {/* Centre glyph: the SAME play/pause shapes as the other players (master +
          native), reused from SequenceAudioController and scaled + centred into the
          24 viewBox — a play triangle by default, pause bars while playing. */}
      {isPlaying ? (
        <g transform="translate(7 7) scale(0.5)">
          <path d="M.682.003H7v19.994H.682ZM13 .003h6.318v19.994H13z" fill="currentColor" />
        </g>
      ) : (
        <g transform="translate(8.4 7) scale(0.588)">
          <path
            d="M12.8378 7.01827L2.19005 0.21473C1.32492 -0.337792 0 0.198383 0 1.56498V15.1688C0 16.3948 1.23114 17.1337 2.19005 16.519L12.8378 9.71877C13.7876 9.11394 13.7906 7.62311 12.8378 7.01827Z"
            fill="currentColor"
          />
        </g>
      )}
    </svg>
  );
}

function SpeakerDisplay({
  status = 'stopped',
  progress = 0,
  duration = 0,
  size = DEFAULT_SIZE,
  inline = false,
  className = '',
  title,
  interactive = true,
  handleClick,
}: SpeakerDisplayProps) {
  const ratio = duration > 0 ? progress / duration : 0;
  const offset = CIRCUMFERENCE * (1 - ratio);
  const label = title || (status === 'playing' ? 'Click to pause' : 'Click to play');
  const baseClass =
    `audio-container super-compact-speaker circular-audio-progress-speaker ${status} ${inline ? 'inline' : ''} ${className}`.trim();
  const sizeStyle = { width: `${size}px`, height: `${size}px` };

  if (!interactive) {
    return (
      <span aria-hidden="true" className={baseClass} style={sizeStyle}>
        <SpeakerSvg size={size} offset={offset} isPlaying={status === 'playing'} />
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={baseClass}
      style={sizeStyle}
      onClick={handleClick}
    >
      <SpeakerSvg size={size} offset={offset} isPlaying={status === 'playing'} />
    </button>
  );
}

export const CircularAudioProgressAnimatedSpeakerDisplay = memo(SpeakerDisplay);
