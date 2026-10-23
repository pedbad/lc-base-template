/**
 * claude-skills-data.ts — what the Claude skills page reads from `virtual:sandbox-docs`:
 * a card per skill in .claude/skills/ and the folder's README, rendered at build time
 * (src/build/claude-skills-docs.ts), and the header's jump menu built from them. Apart
 * from ClaudeSkills.tsx because a component file exports only components
 * (react-refresh), as culp-syllabi-data.ts is for the CULP syllabi page.
 */
import { CLAUDE_SKILLS_PAGE } from 'virtual:sandbox-docs';
import type { DebugSection } from '@/sandbox/DebugPageHeader';

export const CLAUDE_SKILLS = CLAUDE_SKILLS_PAGE;

/** One jump entry per skill, in page order, then the shared steps. */
export const CLAUDE_SKILLS_SECTIONS: readonly DebugSection[] = [
  ...CLAUDE_SKILLS.skills.map((skill) => ({ id: skill.id, label: skill.name })),
  { id: CLAUDE_SKILLS.readme.id, label: 'Shared steps' },
];
