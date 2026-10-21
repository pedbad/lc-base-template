/**
 * code-style-data.ts — what the Code style page reads from `virtual:sandbox-docs`:
 * docs/STYLE.md rendered at build time, and its `##` sections for the header's jump
 * menu. Apart from CodeStyle.tsx because a component file exports only components
 * (react-refresh), as ui-showcase-data.ts is for the UI showcase.
 */
import { CODE_STYLE_DOC_PAGE } from 'virtual:sandbox-docs';
import type { DebugSection } from '@/sandbox/DebugPageHeader';

export { CODE_STYLE_DOC_PAGE };

/** The guide's `##` sections, for the header's jump menu. */
export const CODE_STYLE_SECTIONS: readonly DebugSection[] = CODE_STYLE_DOC_PAGE.headings
  .filter((heading) => heading.level === 2)
  .map((heading) => ({ id: heading.id, label: heading.text }));
