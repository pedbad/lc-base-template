/**
 * ResultSlot.tsx — the far-right per-row verdict indicator shared by the
 * blank-grading engines (spec §7). Renders a circled tick (correct), a circled
 * cross (wrong), or nothing (not yet graded). Presentational only: the caller
 * computes `hasResult` and `isCorrect` from its own row state and reserves the
 * fixed-width grid column,
 * so toggling the icon on Check / Show-answers never shifts the sentence.
 *
 * The icon is decorative; a graded row also says its verdict in screen-reader-only
 * words (the course's `correct` / `incorrect` labels), so a screen reader hears which
 * row was wrong, not just the progress count (decided 2026-10-16).
 *
 * Extracted from the select engine's inlined slot; engine #2 (inline-choice) uses
 * the identical row layout and reuses this.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §7.
 */
import { CircleCheckBig, CircleX } from 'lucide-react';
import { resolveLabel } from '@/config/ui-strings';

interface ResultSlotProps {
  /** Whether this row has been graded (a tick/cross should show). */
  hasResult: boolean;
  /** When graded, whether every blank in the row is correct. */
  isCorrect: boolean;
}

export function ResultSlot({ hasResult, isCorrect }: ResultSlotProps) {
  return (
    <span className="flex items-center justify-center">
      {hasResult ? (
        <>
          {isCorrect ? (
            <CircleCheckBig aria-hidden className="size-8 text-success" />
          ) : (
            <CircleX aria-hidden className="size-8 text-destructive" />
          )}
          <span className="sr-only">{resolveLabel(isCorrect ? 'correct' : 'incorrect')}</span>
        </>
      ) : null}
    </span>
  );
}
