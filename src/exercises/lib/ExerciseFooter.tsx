/**
 * ExerciseFooter.tsx — the shared action-button row for the exercise engines
 * (spec §5, §8). Three buttons in canonical order: Check (primary, always shown),
 * Reset (shown once there's something to reset), Show-answers (shown only after a
 * wrong Check — the caller decides via `showAnswers`, per the §5.3 reveal gate).
 *
 * Extracted from the inlined footer the select engine carried while it was the
 * only engine; engine #2 (inline-choice) renders the exact same shape, so it now
 * lives here. The footer owns ONLY chrome (buttons + labels); each engine keeps
 * its own status line and computes the booleans it passes in.
 *
 * All button text resolves through resolveLabel(key, labels) so a per-exercise
 * `labels` override wins over the global ui-strings default (§9).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §5, §8.
 */
import { Button } from '@/components/ui/button';
import { resolveLabel, type UiStringsOverride } from '@/config/ui-strings';

interface ExerciseFooterProps {
  /** Check handler (grade the current answers). */
  onCheck: () => void;
  /** Disable Check while there's nothing gradeable yet. */
  checkDisabled?: boolean;
  /** Reset handler (clear input + scoring back to baseline). */
  onReset: () => void;
  /** Whether the Reset button is shown. */
  showReset: boolean;
  /** Show-answers handler (reveal the correct options). */
  onShowAnswers: () => void;
  /** Whether the Show-answers button is shown (the §5.3 reveal gate). */
  showAnswers: boolean;
  /** Per-exercise chrome overrides; falls back to the global ui-strings. */
  labels?: UiStringsOverride;
}

export function ExerciseFooter({
  onCheck,
  checkDisabled = false,
  onReset,
  showReset,
  onShowAnswers,
  showAnswers,
  labels,
}: ExerciseFooterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
      <Button onClick={onCheck} disabled={checkDisabled}>
        {resolveLabel('check', labels)}
      </Button>
      {showReset ? (
        <Button variant="outline" onClick={onReset}>
          {resolveLabel('reset', labels)}
        </Button>
      ) : null}
      {showAnswers ? (
        <Button variant="ghost" onClick={onShowAnswers}>
          {resolveLabel('showAnswer', labels)}
        </Button>
      ) : null}
    </div>
  );
}
