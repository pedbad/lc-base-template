/**
 * CircularAudioProgressAnimatedSpeakerDisplay — the speaker icon with a circular
 * progress ring and radiating arcs while playing. Presentational and props-driven:
 * the AnimatedSpeaker wrapper feeds it useAudioClip state; the master sequence
 * player feeds it controller state. No playback logic lives here.
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
const ARC_STROKE_WIDTH = 1.2;
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

function SpeakerSvg({ size, offset }: { size: number; offset: number }) {
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
      {/* Speaker body */}
      <path
        fill="currentColor"
        d="M10.4 8.1a.8.8 0 0 0-1.36-.57L6.2 10.35a1.15 1.15 0 0 1-.82.34H3.9a.9.9 0 0 0-.9.9v.82a.9.9 0 0 0 .9.9h1.48c.31 0 .61.12.82.34l2.84 2.82a.8.8 0 0 0 1.36-.57z"
      />
      {/* Radiating arcs (animated via audio.css when .playing) */}
      <path
        className="speaker-arc speaker-arc1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={ARC_STROKE_WIDTH}
        vectorEffect="non-scaling-stroke"
        d="M13.9 9.3a4.5 4.5 0 0 1 0 5.4"
      />
      <path
        className="speaker-arc speaker-arc2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={ARC_STROKE_WIDTH}
        vectorEffect="non-scaling-stroke"
        d="M16.2 7.3a7.5 7.5 0 0 1 0 9.4"
      />
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
        <SpeakerSvg size={size} offset={offset} />
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
      <SpeakerSvg size={size} offset={offset} />
    </button>
  );
}

export const CircularAudioProgressAnimatedSpeakerDisplay = memo(SpeakerDisplay);
