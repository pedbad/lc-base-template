/**
 * Callout — the ONE tinted alert box, used by every page (maintainer, 2026-10-07).
 *
 * WHY ONE COMPONENT. There were three "info" boxes: `InstructionsCallout` (white,
 * grey border, a 1.36:1 Cambridge Blue icon), `ExerciseInstructions` (a primary tint)
 * and a demo-only copy in the debug sandbox that matched neither. The sandbox exists
 * to show what lessons render, so it now renders THIS, and so does every instruction
 * box — one look, defined once.
 *
 * Built on the vendored shadcn `Alert`, coloured here (`src/components/ui/` belongs to
 * the shadcn CLI). Each variant names ONE semantic token for its border, tint and
 * icon; body text stays `foreground`, so it reads at full contrast on every tint in
 * both themes (sandbox measurements, 2026-10-07: icons ≥ 3:1, text ≥ 9.9:1).
 *
 * `role="note"`, NOT THE WRAPPER'S `role="alert"`: these boxes are static, and an
 * `alert` is a live region that interrupts a screen reader on page load.
 *
 * MEANING IS IN WORDS, NOT COLOUR (WCAG 1.4.1). The icon only repeats what the text or
 * `title` says, so it is `aria-hidden`.
 */
import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, CircleX, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export type CalloutVariant = 'info' | 'success' | 'warning' | 'danger';

interface CalloutProps {
  /** Which semantic colour and icon. Instructions are `info`, the default. */
  variant?: CalloutVariant;
  /** Optional bold first line. */
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Icon and token classes per variant: border, tint and icon from one token. */
const VARIANTS = {
  info: { Icon: Info, className: 'border-primary/40 bg-primary/10 *:[svg]:text-primary' },
  success: {
    Icon: CircleCheck,
    className: 'border-success/40 bg-success/10 *:[svg]:text-success',
  },
  warning: {
    Icon: CircleAlert,
    className: 'border-warning/40 bg-warning/10 *:[svg]:text-warning',
  },
  danger: {
    Icon: CircleX,
    className: 'border-destructive/40 bg-destructive/10 *:[svg]:text-destructive',
  },
} as const;

export default function Callout({ variant = 'info', title, children, className }: CalloutProps) {
  const { Icon, className: variantClassName } = VARIANTS[variant];

  return (
    <Alert role="note" className={cn('text-foreground', variantClassName, className)}>
      <Icon aria-hidden="true" />
      {title === undefined ? null : <AlertTitle className="font-semibold">{title}</AlertTitle>}
      <AlertDescription className="text-foreground">{children}</AlertDescription>
    </Alert>
  );
}
