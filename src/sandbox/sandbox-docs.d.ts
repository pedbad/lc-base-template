/**
 * sandbox-docs.d.ts — types for the `virtual:sandbox-docs` module.
 *
 * The module has no file behind it: `src/build/sandbox-docs-plugin.ts` generates it at
 * dev-server / build time from the markdown docs. TypeScript cannot infer a virtual
 * module, so its shape is declared here and its element type is imported from the
 * renderer, which keeps the two from drifting.
 */
declare module 'virtual:sandbox-docs' {
  import type { ClaudeSkillsPage } from '@/build/claude-skills-docs';
  import type { SandboxDocPage } from '@/build/docs-markdown';

  export const SANDBOX_DOC_PAGES: readonly SandboxDocPage[];
  /** docs/STYLE.md, for the Code style debug page (code-style.html). */
  export const CODE_STYLE_DOC_PAGE: SandboxDocPage;
  /** docs/culp-syllabi/README.md, for the CULP syllabi debug page (culp-syllabi.html). */
  export const CULP_SYLLABI_DOC_PAGE: SandboxDocPage;
  /** .claude/skills/: a card per SKILL.md and the README, for claude-skills.html. */
  export const CLAUDE_SKILLS_PAGE: ClaudeSkillsPage;
}
