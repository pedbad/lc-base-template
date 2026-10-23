/**
 * culp-syllabi-data.ts — what the CULP syllabi page reads from `virtual:sandbox-docs`:
 * docs/culp-syllabi/README.md rendered at build time, and its `##` sections for the
 * header's jump menu. Apart from CulpSyllabi.tsx because a component file exports only
 * components (react-refresh), as code-style-data.ts is for the Code style page.
 */
import { CULP_SYLLABI_DOC_PAGE } from 'virtual:sandbox-docs';
import type { DebugSection } from '@/sandbox/DebugPageHeader';

export { CULP_SYLLABI_DOC_PAGE };

/** The README's `##` sections, for the header's jump menu. */
export const CULP_SYLLABI_SECTIONS: readonly DebugSection[] = CULP_SYLLABI_DOC_PAGE.headings
  .filter((heading) => heading.level === 2)
  .map((heading) => ({ id: heading.id, label: heading.text }));
