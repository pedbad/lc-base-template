/**
 * claude-skills-docs.ts — what the Claude skills debug page (claude-skills.html) shows,
 * read from .claude/skills/ at dev-server / build time (TODO §E40).
 *
 * ONE CARD PER FOLDER, NO LIST. A skill is a folder holding a SKILL.md, as Claude Code
 * itself reads them, and a course repo may add its own. So the page walks the folder
 * rather than naming the skills: a new one appears on the next build with nothing to
 * register. Each card takes the skill's `name` and `description` from its frontmatter
 * and renders the rest of the file as its recipe; the folder's README (the steps several
 * skills share) renders after the cards, through the same docs renderer as the hub.
 *
 * FAILS LOUDLY. A SKILL.md without a name or a description stops the build, naming the
 * file: Claude Code needs both to offer the skill at all, so a card without them would
 * describe a skill that does not work.
 *
 * ALIAS-FREE: the docs plugin imports this file, and `vite.config.ts` imports the plugin
 * before its own `resolve.alias` exists.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  CLAUDE_SKILLS_PAGE_FILE,
  readClaudeSkillsReadme,
  renderDoc,
  type SandboxDocPage,
} from './docs-markdown';

/** Where the skills live, repo-relative, in the shape Claude Code reads. */
const SKILLS_DIR = '.claude/skills';
const SKILL_FILE = 'SKILL.md';

/**
 * A recipe's `#` title sits under its card's `<h2>`, so it renders as an `<h3>` — one
 * level deeper than a doc on a page of its own.
 */
const RECIPE_HEADING_OFFSET = 2;

/** What a SKILL.md holds: the frontmatter Claude Code reads, and the recipe below it. */
export interface ParsedSkill {
  readonly name: string;
  readonly description: string;
  readonly body: string;
}

/** One skill's card. */
export interface ClaudeSkill {
  /** The card's anchor, and the namespace of its recipe's headings: `skill-<name>`. */
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Repo-relative path of its SKILL.md. */
  readonly file: string;
  /** The recipe, rendered without its frontmatter. */
  readonly html: string;
}

/** Everything the page shows. */
export interface ClaudeSkillsPage {
  readonly skills: readonly ClaudeSkill[];
  /** The folder's README: the steps several skills share. */
  readonly readme: SandboxDocPage;
}

/**
 * The `key: value` lines between a SKILL.md's opening `---` fences, and the body after.
 * Only the first colon splits, so a description may hold colons of its own.
 *
 * @param file named in the error when a field is missing
 */
export function parseSkillFile(markdown: string, file: string): ParsedSkill {
  const block = /^---\n([\s\S]*?)\n---\n/.exec(markdown);
  if (!block) throw new Error(`${file} has no frontmatter: a skill needs a name and a description`);
  const fields = new Map(
    (block[1] ?? '')
      .split('\n')
      .map((line) => /^([a-z-]+):\s*(.*)$/.exec(line))
      .filter((match): match is RegExpExecArray => match !== null)
      .map((match) => [match[1] ?? '', (match[2] ?? '').trim()] as const),
  );
  const name = fields.get('name') ?? '';
  const description = fields.get('description') ?? '';
  if (!name) throw new Error(`${file} has no name in its frontmatter`);
  if (!description) throw new Error(`${file} has no description in its frontmatter`);
  return { name, description, body: markdown.slice(block[0].length) };
}

/** The skill folders, those holding a SKILL.md, sorted by folder name. */
function skillFolders(repoRoot: string): string[] {
  const root = path.join(repoRoot, SKILLS_DIR);
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(path.join(root, name, SKILL_FILE)))
    .sort((a, b) => a.localeCompare(b));
}

/** Read one skill's SKILL.md and render its recipe for its card. */
function readSkill(repoRoot: string, folder: string): ClaudeSkill {
  const file = `${SKILLS_DIR}/${folder}/${SKILL_FILE}`;
  const { name, description, body } = parseSkillFile(
    readFileSync(path.join(repoRoot, file), 'utf-8'),
    file,
  );
  const id = `skill-${name}`;
  const { html } = renderDoc(body, id, {
    file,
    page: CLAUDE_SKILLS_PAGE_FILE,
    headingOffset: RECIPE_HEADING_OFFSET,
  });
  return { id, name, description, file, html };
}

/** Every skill's card, sorted by name, and the folder's README. */
export function readClaudeSkills(repoRoot: string): ClaudeSkillsPage {
  return {
    skills: skillFolders(repoRoot).map((folder) => readSkill(repoRoot, folder)),
    readme: readClaudeSkillsReadme(repoRoot),
  };
}

/**
 * Absolute paths of every SKILL.md, for the dev server to watch. A skill folder added
 * while it runs is not on the list until the next restart; an edit to one already there
 * reloads the page.
 */
export function claudeSkillPaths(
  repoRoot: string = path.resolve(import.meta.dirname, '../..'),
): string[] {
  return skillFolders(repoRoot).map((folder) =>
    path.join(repoRoot, SKILLS_DIR, folder, SKILL_FILE),
  );
}
