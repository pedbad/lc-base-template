/**
 * ContrastBadge — a WCAG verdict and ratio for two live colours (§E19), or a dash
 * while they are unknown (a server render, a browser with no canvas). The chip's colour
 * says pass or not at a glance; the words say it for everyone else.
 */
import { contrastRatio, formatRatio, verdictFor, type Rgb, type Verdict } from './colour-math';

export const PLACEHOLDER = '—';

const VERDICT_CLASS: Readonly<Record<Verdict, string>> = {
  AAA: 'bg-success text-success-foreground',
  AA: 'bg-success text-success-foreground',
  'AA large': 'bg-warning text-warning-foreground',
  'Decorative only': 'bg-muted text-muted-foreground',
};

interface ContrastBadgeProps {
  readonly a: Rgb | undefined;
  readonly b: Rgb | undefined;
  /** What `b` is called, e.g. "Cambridge Dark Blue" or "its text". */
  readonly withName: string;
}

export function ContrastBadge({ a, b, withName }: ContrastBadgeProps) {
  if (!a || !b) {
    return (
      <p data-slot="contrast" className="text-xs text-muted-foreground">
        Contrast with {withName}: {PLACEHOLDER}
      </p>
    );
  }
  const ratio = contrastRatio(a, b);
  const verdict = verdictFor(ratio);
  return (
    <p data-slot="contrast" className="flex flex-wrap items-center gap-2 text-xs">
      <span className={`rounded-sm px-1.5 py-0.5 font-semibold ${VERDICT_CLASS[verdict]}`}>
        {verdict}
      </span>
      <span>
        {formatRatio(ratio)}:1 with {withName}
      </span>
    </p>
  );
}
