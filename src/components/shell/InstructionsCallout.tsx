/**
 * InstructionsCallout — the ONE instructional-callout primitive (Phase C · Part A,
 * step 4; spec §3). It borrows the shadcn Alert's *visual* treatment but is a plain
 * <div class="instructions"> — deliberately NOT role="alert". role="alert" is an
 * assertive live region (it interrupts the screen reader the moment it appears);
 * static lesson instructions are not an announcement, so using it would be wrong
 * semantics. The `instructions` class is the stable hook the section- and
 * accordion-level instruction slots both reuse (§3: one field, one name).
 */
import type { ReactNode } from 'react';
import { InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstructionsCalloutProps {
  children: ReactNode;
  className?: string;
}

export default function InstructionsCallout({ children, className }: InstructionsCalloutProps) {
  return (
    <div
      className={cn(
        'instructions flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground',
        className,
      )}
    >
      <InfoIcon className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}
