/**
 * ResultSlot.tsx — the far-right per-row verdict indicator shared by the
 * blank-grading engines (spec §7). Renders a tick (correct), a cross (wrong), or
 * nothing (not yet graded). Presentational only: the caller computes `hasResult`
 * and `isCorrect` from its own row state and reserves the fixed-width grid column,
 * so toggling the icon on Check / Show-answers never shifts the sentence.
 *
 * Extracted from the select engine's inlined slot; engine #2 (inline-choice) uses
 * the identical row layout and reuses this.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §7.
 */
import { CheckIcon, XIcon } from 'lucide-react';

interface ResultSlotProps {
  /** Whether this row has been graded (a tick/cross should show). */
  hasResult: boolean;
  /** When graded, whether every blank in the row is correct. */
  isCorrect: boolean;
}

export function ResultSlot({ hasResult, isCorrect }: ResultSlotProps) {
  return (
    <span aria-hidden className="flex items-center justify-center">
      {hasResult ? (
        isCorrect ? (
          <CheckIcon className="size-5 text-success" />
        ) : (
          <XIcon className="size-5 text-destructive" />
        )
      ) : null}
    </span>
  );
}
