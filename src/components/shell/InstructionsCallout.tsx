/**
 * InstructionsCallout — lesson instructions: an info `Callout` carrying the shared
 * `instructions` class (Phase C · Part A, step 4; spec §3). Since 2026-10-07 it is a
 * thin wrapper — the look is `Callout`'s, the one tinted box every page uses, so the
 * debug sandbox shows exactly this. It is deliberately `role="note"`, NOT role="alert". role="alert" is an
 * assertive live region (it interrupts the screen reader the moment it appears);
 * static lesson instructions are not an announcement, so using it would be wrong
 * semantics. The `instructions` class is the stable hook the section- and
 * accordion-level instruction slots both reuse (§3: one field, one name).
 *
 * `mt-2` is on the PRIMITIVE, not on each caller, because every instructions box
 * wants the same breathing room above it. Since 2026-10-08 an accordion body carries
 * that 8px as its own top padding (LoAccordion), so the accordion passes `mt-0`; the
 * margin here serves a plain block's box (`lo-page-sections.tsx`). A caller that needs
 * different spacing passes its own `mt-*`: `cn()` is tailwind-merge, so the caller's
 * class wins rather than both landing in the list.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Callout from './Callout';

interface InstructionsCalloutProps {
  children: ReactNode;
  className?: string;
}

export default function InstructionsCallout({ children, className }: InstructionsCalloutProps) {
  return <Callout className={cn('instructions mt-2', className)}>{children}</Callout>;
}
