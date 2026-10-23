/**
 * claude-skills-docs.test.ts — what the Claude skills debug page (claude-skills.html)
 * reads from .claude/skills/: one card per skill folder, built from its SKILL.md's
 * frontmatter and body, and the folder's README of shared steps (TODO §E40).
 *
 * The page renders the files, never a copy of them, so the cases that matter are the
 * ways it could drift from them: a skill folder missing from the page, frontmatter
 * leaking into the recipe, and a link inside a recipe that worked on GitHub becoming a
 * dead click or landing nowhere.
 */
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { claudeSkillPaths, parseSkillFile, readClaudeSkills } from './claude-skills-docs';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');

/** A throwaway repo with two skills, a folder that is not one, and a stray file. */
const fake = mkdtempSync(path.join(tmpdir(), 'claude-skills-'));
const skills = path.join(fake, '.claude', 'skills');
const write = (relative: string, text: string) => {
  const file = path.join(skills, relative);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, text);
};
write('README.md', '# Skills\n\n## Where am I\n\nThe shared check.\n');
write(
  'zeta/SKILL.md',
  '---\nname: zeta\ndescription: Use when zeta is due.\n---\n\n# Zeta recipe\n\nDo it.\n',
);
write(
  'alpha/SKILL.md',
  [
    '---',
    'name: alpha',
    'description: Use when: alpha needs doing, before beta.',
    '---',
    '',
    '# Alpha recipe',
    '',
    '## Step one',
    '',
    'Apply [the shared check](../README.md#where-am-i) and [the rules](../../../AGENTS.md).',
    '',
  ].join('\n'),
);
write('notes/todo.txt', 'not a skill');
write('extra.md', 'not a skill either');
afterAll(() => rmSync(fake, { recursive: true, force: true }));

describe('parseSkillFile', () => {
  it('reads the name and description, and keeps the body without its frontmatter', () => {
    const skill = parseSkillFile('---\nname: a\ndescription: Use when: b.\n---\n\n# A\n', 'a');
    expect(skill).toEqual({ name: 'a', description: 'Use when: b.', body: '\n# A\n' });
  });

  it('refuses a file with no frontmatter, naming the file', () => {
    expect(() => parseSkillFile('# Just a heading\n', 'x/SKILL.md')).toThrow(/x\/SKILL\.md/);
  });

  it('refuses a skill without a name or a description, naming the file', () => {
    expect(() => parseSkillFile('---\nname: a\n---\n', 'a/SKILL.md')).toThrow(
      /a\/SKILL\.md.*description/,
    );
    expect(() => parseSkillFile('---\ndescription: d\n---\n', 'b/SKILL.md')).toThrow(
      /b\/SKILL\.md.*name/,
    );
  });
});

describe('readClaudeSkills', () => {
  const page = readClaudeSkills(fake);
  const alpha = page.skills.find((skill) => skill.name === 'alpha');

  it('has one card per folder holding a SKILL.md, sorted by name', () => {
    expect(page.skills.map((skill) => skill.name)).toEqual(['alpha', 'zeta']);
    expect(alpha?.id).toBe('skill-alpha');
    expect(alpha?.file).toBe('.claude/skills/alpha/SKILL.md');
    expect(alpha?.description).toBe('Use when: alpha needs doing, before beta.');
  });

  it('renders the recipe without its frontmatter, its headings under the card', () => {
    expect(alpha?.html).not.toContain('name: alpha');
    expect(alpha?.html).toContain('<h3 id="skill-alpha--alpha-recipe">');
    expect(alpha?.html).toContain('<h4 id="skill-alpha--step-one">');
  });

  it('keeps a link to the shared steps on this page, and sends one to a hub doc there', () => {
    expect(alpha?.html).toContain('href="#skills--where-am-i"');
    expect(alpha?.html).toContain('href="debug-sandbox.html#agents"');
  });

  it("renders the folder's README as a page section, its title an h2", () => {
    expect(page.readme.file).toBe('.claude/skills/README.md');
    expect(page.readme.html).toContain('<h2 id="skills--skills">');
    expect(page.readme.html).toContain('<h3 id="skills--where-am-i">');
  });

  it('lists every skill this repo ships, each with a description', () => {
    const real = readClaudeSkills(REPO_ROOT);
    const folders = readdirSync(path.join(REPO_ROOT, '.claude', 'skills'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .filter((entry) =>
        existsSync(path.join(REPO_ROOT, '.claude', 'skills', entry.name, 'SKILL.md')),
      )
      .map((entry) => entry.name)
      .sort();
    expect(real.skills.map((skill) => skill.name)).toEqual(folders);
    expect(real.skills.length).toBeGreaterThanOrEqual(8);
    real.skills.forEach((skill) => expect(skill.description, skill.name).not.toBe(''));
  });
});

describe('claudeSkillPaths', () => {
  it('is every SKILL.md, absolute and sorted, for the dev server to watch', () => {
    expect(claudeSkillPaths(fake)).toEqual([
      path.join(skills, 'alpha', 'SKILL.md'),
      path.join(skills, 'zeta', 'SKILL.md'),
    ]);
  });
});
