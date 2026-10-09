/**
 * ProgressMeter — the progress line under an exercise (maintainer, 2026-10-09). Ported
 * from french-lo-1's ProgressDots: one slot per answer, the first `correct` filled, so
 * it fills like a jar as the count rises. A meter, not a map of the questions — each
 * row already carries its own tick or cross — and deliberately with no "wrong" state:
 * it shows what has been achieved. Shown from the start, so the goal is visible before
 * the first Check; a short hop when every answer is right (progress-meter.css, motion-
 * safe only).
 *
 * The slots are decoration (aria-hidden); the count is said in words in a live region,
 * worded by the `progressCorrect` UI string. A slot is a dot, or the course's own icon
 * when course.config sets `progressIcon` (drawn as a mask, so it takes the same two
 * colours). Pure props in, markup out: the prerendered page equals the first render.
 */
import type { CSSProperties } from 'react';
import { courseConfig } from '@/config/course.config';
import { resolveLabel, type UiStringsOverride } from '@/config/ui-strings';
import { resolveAsset } from '@/lib/assets';
import { progressText } from './progress-text';
import './progress-meter.css';

interface ProgressMeterProps {
  correct: number;
  total: number;
  /** The exercise's own wording, if it overrides `progressCorrect`. */
  labels?: UiStringsOverride;
  /** The slot icon; defaults to course.config's `progressIcon` (a dot when unset). */
  iconSrc?: string;
}

export function ProgressMeter({
  correct,
  total,
  labels,
  iconSrc = courseConfig.progressIcon,
}: ProgressMeterProps) {
  const safeTotal = Math.max(0, Math.floor(total));
  if (safeTotal === 0) return null;
  const safeCorrect = Math.min(safeTotal, Math.max(0, Math.floor(correct)));
  const isComplete = safeCorrect === safeTotal;
  const iconStyle =
    iconSrc === undefined
      ? undefined
      : ({ '--progress-icon': `url("${resolveAsset(iconSrc)}")` } as CSSProperties);

  return (
    <div className="progress-meter" data-complete={isComplete ? 'true' : undefined}>
      <span className="progress-meter-slots" aria-hidden="true" style={iconStyle}>
        {Array.from({ length: safeTotal }, (_, index) => (
          <span
            key={index}
            className={`progress-meter-slot${index < safeCorrect ? ' is-filled' : ''}${iconSrc === undefined ? '' : ' is-icon'}`}
            style={{ '--slot-index': index } as CSSProperties}
          />
        ))}
      </span>
      <p className="progress-meter-text" role="status">
        {progressText(resolveLabel('progressCorrect', labels), safeCorrect, safeTotal)}
      </p>
    </div>
  );
}
