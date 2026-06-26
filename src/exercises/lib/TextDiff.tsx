/**
 * TextDiff.tsx — renders a character diff (from `diffChars`, charDiff.ts) as
 * coloured spans. Presentational only; all logic lives in the pure `diffChars`.
 *
 * Replaces french-lo-1's HTML-string + dangerouslySetInnerHTML approach: the diff is
 * plain React nodes, so there is no innerHTML and no sanitizer dependency. Colours
 * use the template's semantic Tailwind tokens (no hardcoded values):
 *  - same      → muted (it was right)
 *  - inserted  → success (the char the learner missed — what they should have typed)
 *  - deleted   → destructive + strike (a char the learner typed that doesn't belong)
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §8.
 */
import type { DiffKind, DiffPart } from './charDiff';

const KIND_CLASS: Record<DiffKind, string> = {
  same: 'text-muted-foreground',
  inserted: 'text-success underline decoration-dotted underline-offset-2',
  deleted: 'text-destructive line-through',
};

/** Non-breaking space so a diffed space stays visible (and keeps its colour). */
const NBSP = ' ';

interface TextDiffProps {
  parts: DiffPart[];
}

export function TextDiff({ parts }: TextDiffProps) {
  return (
    <span className="inline-flex flex-wrap font-mono text-sm leading-normal">
      {parts.map((part) => (
        <span key={part.key} className={KIND_CLASS[part.kind]}>
          {part.char === ' ' ? NBSP : part.char}
        </span>
      ))}
    </span>
  );
}
