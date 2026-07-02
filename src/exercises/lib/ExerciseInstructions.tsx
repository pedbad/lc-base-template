/**
 * ExerciseInstructions.tsx — the info box shown above every exercise.
 *
 * Presentational only: it takes the already-resolved instruction `text` and renders
 * it in the shared `ui/alert` (see resolveInstructions in ./instructions for how the
 * text is chosen from the type default + author override). Returns `null` when
 * `text` is null or blank, so a suppressed exercise (`instructions: ''`) renders
 * nothing.
 *
 * The copy marks button names with `**…**`; those segments render as `<strong>`, and
 * when the name matches a real footer control (Check / Reset / Show answers) it is
 * prefixed with that button's own lucide glyph in the button's identity colour
 * (success / destructive / primary — mirroring ExerciseFooter) so the reference reads
 * as the actual control. Unknown bold names (custom overrides) render bold, no icon.
 *
 * a11y: `role="note"` (this is course-author guidance, not a live alert). The text
 * is English course chrome — deliberately NOT tagged `lang={TARGET_LANG}` (same rule
 * as ChoicePillGroup's group labels: only learner-facing target-language content
 * carries the lang attribute). The inline glyphs are decorative (aria-hidden).
 *
 * Spec: docs/process/2026-07-02-instructions-box-handover.md §3.
 */
import { Fragment, type ComponentType } from 'react';
import { CircleCheck, Eye, Info, RotateCcw } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExerciseInstructionsProps {
  /** Resolved instruction copy, or `null`/empty to render nothing. */
  text: string | null;
}

/** A footer control's inline glyph + its identity colour, keyed by button name. */
const BUTTON_GLYPHS: Record<
  string,
  { Icon: ComponentType<{ className?: string }>; color: string }
> = {
  check: { Icon: CircleCheck, color: 'text-success' },
  reset: { Icon: RotateCcw, color: 'text-destructive' },
  'show answers': { Icon: Eye, color: 'text-primary' },
};

/** Split copy on `**bold**` markers into alternating plain / strong segments. */
function renderWithBold(text: string) {
  return text.split('**').map((segment, index) => {
    // Even segments are plain prose between the `**` markers.
    if (index % 2 === 0) return <Fragment key={index}>{segment}</Fragment>;

    // Odd segments are button names → bold, with the matching control glyph.
    const glyph = BUTTON_GLYPHS[segment.trim().toLowerCase()];
    return (
      // Kept as normal inline text (not inline-flex) so the label sits on the same
      // baseline as the surrounding prose; only the icon is nudged to align with it.
      <strong key={index} className="font-semibold text-foreground">
        {glyph ? (
          <glyph.Icon className={`mr-1 inline size-4 align-[-0.2em] ${glyph.color}`} />
        ) : null}
        {segment}
      </strong>
    );
  });
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
