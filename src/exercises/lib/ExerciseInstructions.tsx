/**
 * ExerciseInstructions.tsx — the info box shown above every exercise.
 *
 * Presentational only: it takes the already-resolved instruction `text` and renders
 * it in the shared `ui/alert` (see resolveInstructions in ./instructions for how the
 * text is chosen from the type default + author override). Returns `null` when
 * `text` is null or blank, so a suppressed exercise (`instructions: ''`) renders
 * nothing.
 *
 * The copy marks button names with `**…**`; those segments render as `<strong>` so
 * Check / Reset / Show answers read as UI references.
 *
 * a11y: `role="note"` (this is course-author guidance, not a live alert). The text
 * is English course chrome — deliberately NOT tagged `lang={TARGET_LANG}` (same rule
 * as ChoicePillGroup's group labels: only learner-facing target-language content
 * carries the lang attribute).
 *
 * Spec: docs/process/2026-07-02-instructions-box-handover.md §3.
 */
import { Fragment } from 'react';
import { Info } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExerciseInstructionsProps {
  /** Resolved instruction copy, or `null`/empty to render nothing. */
  text: string | null;
}

/** Split copy on `**bold**` markers into alternating plain / strong segments. */
function renderWithBold(text: string) {
  return text.split('**').map((segment, index) =>
    // Odd segments sat between a pair of `**` markers → button names → bold.
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold text-foreground">
        {segment}
      </strong>
    ) : (
      <Fragment key={index}>{segment}</Fragment>
    ),
  );
}

export function ExerciseInstructions({ text }: ExerciseInstructionsProps) {
  if (text === null || text.trim() === '') return null;

  return (
    <Alert role="note" className="mb-4">
      <Info />
      <AlertDescription>{renderWithBold(text)}</AlertDescription>
    </Alert>
  );
}
