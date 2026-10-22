/**
 * claude-skills.test.ts — keeps the Claude skills that ship with the repo in the shape
 * E7 agreed (docs/specs/2026-10-16-claude-skills-design.md §6), plus E31's syllabus
 * skill (docs/specs/2026-10-22-culp-syllabus-skill-design.md §6).
 *
 * Reads the files from disk, not git's index, so a new skill's shape is checked before
 * it is committed. A course repo may add skills of its own: they need the same
 * frontmatter (Claude Code needs it too), and the other checks cover only the skills
 * shipped here. Links inside the skills are md-links.test.ts's job, once they are
 * tracked.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from './docs-tree';

const SKILLS_DIR = path.join(REPO_ROOT, '.claude', 'skills');
const REVIEWER = path.join(REPO_ROOT, '.claude', 'agents', 'lc-reviewer.md');

/** The skills that write code: each opens with Step 0, then Step 1 (spec §4.1). */
const CODE_SKILLS = ['add-exercise-engine', 'add-block-type', 'change-theme'];
const SHIPPED_SKILLS = [
  'add-lo',
  ...CODE_SKILLS,
  'sync-from-template',
  'before-pr',
  'build-for-upload',
  'culp-syllabus',
];
const STEP_0 = '## Step 0 — Where am I';
const STEP_1 = '## Step 1 — Test first';
/** Step 0 applies the one shared rule rather than a copy of it (spec §4.1). */
const WHERE_AM_I_LINK = '../README.md#where-am-i';
/** The syllabus skill links the notes' one description rather than a copy (E31 §3.3). */
const CULP_SKILL = 'culp-syllabus';
const CULP_README_LINK = '../../../docs/culp-syllabi/README.md';

/** The text under a `## ` heading, up to the next `## ` heading. */
function section(markdown: string, heading: string): string {
  const start = markdown.indexOf(heading);
  if (start === -1) return '';
  const rest = markdown.slice(start + heading.length);
  const end = rest.search(/^## /m);
  return end === -1 ? rest : rest.slice(0, end);
}

/** The `key: value` lines between the opening `---` fences; `{}` when there are none. */
function frontmatter(markdown: string): Record<string, string> {
  const block = /^---\n([\s\S]*?)\n---\n/.exec(markdown);
  if (!block) return {};
  const pairs = block[1]
    .split('\n')
    .map((line) => /^([a-z-]+):\s*(.*)$/.exec(line))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => [m[1], m[2].trim()] as const);
  return Object.fromEntries(pairs);
}

const read = (file: string) => readFileSync(file, 'utf8');
const skillFile = (name: string) => path.join(SKILLS_DIR, name, 'SKILL.md');
const skillsOnDisk = () =>
  existsSync(SKILLS_DIR)
    ? readdirSync(SKILLS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
    : [];

describe('frontmatter()', () => {
  it('reads name and description', () => {
    expect(frontmatter('---\nname: add-lo\ndescription: Use when x\n---\n# T\n')).toEqual({
      name: 'add-lo',
      description: 'Use when x',
    });
  });

  it('returns {} when there is no frontmatter', () => {
    expect(frontmatter('# Title\n\nname: not-frontmatter\n')).toEqual({});
  });
});

describe('section()', () => {
  it('returns the text up to the next heading of the same level', () => {
    expect(section('## A\none\n### sub\n## B\ntwo\n', '## A')).toBe('\none\n### sub\n');
  });

  it('returns the rest of the file for the last section, and "" for a missing one', () => {
    expect(section('## A\none\n', '## A')).toBe('\none\n');
    expect(section('## A\none\n', '## Z')).toBe('');
  });
});

describe('the Claude skills that ship with the repo', () => {
  it.each(SHIPPED_SKILLS)('%s exists', (name) => {
    expect(existsSync(skillFile(name)), `missing ${skillFile(name)}`).toBe(true);
  });

  it('every skill on disk names its folder and says when to use it', () => {
    const problems = skillsOnDisk().flatMap((name) => {
      const file = skillFile(name);
      if (!existsSync(file)) return [`${name}: no SKILL.md`];
      const meta = frontmatter(read(file));
      return [
        ...(meta.name === name ? [] : [`${name}: frontmatter name is "${meta.name ?? ''}"`]),
        ...(meta.description ? [] : [`${name}: no description`]),
      ];
    });
    expect(problems).toEqual([]);
  });

  it.each(CODE_SKILLS)('%s opens with Step 0, then Step 1', (name) => {
    const file = skillFile(name);
    expect(existsSync(file), `missing ${file}`).toBe(true);
    const text = read(file);
    const step0 = text.indexOf(STEP_0);
    const step1 = text.indexOf(STEP_1);
    expect(step0, `${name} has no "${STEP_0}"`).toBeGreaterThan(-1);
    expect(step1, `${name}: "${STEP_1}" must come after Step 0`).toBeGreaterThan(step0);
  });

  it.each(CODE_SKILLS)('%s Step 0 applies the shared rule', (name) => {
    expect(section(read(skillFile(name)), STEP_0)).toContain(WHERE_AM_I_LINK);
  });

  it.each(CODE_SKILLS)('%s Step 1 runs the tests and waits for a failure', (name) => {
    const step1 = section(read(skillFile(name)), STEP_1);
    expect(step1, `${name} Step 1 must run \`bun run test\``).toContain('bun run test');
    expect(step1, `${name} Step 1 must check the test fails`).toMatch(/\bfail/);
  });

  it(`${CULP_SKILL} links the syllabi README`, () => {
    const file = skillFile(CULP_SKILL);
    expect(existsSync(file), `missing ${file}`).toBe(true);
    expect(read(file)).toContain(CULP_README_LINK);
  });

  it('no shipped skill or agent tells Claude to run `bun test`', () => {
    const files = [...SHIPPED_SKILLS.map(skillFile), REVIEWER].filter((f) => existsSync(f));
    const offenders = files.filter((f) => /\bbun test\b/.test(read(f)));
    expect(offenders.map((f) => path.relative(REPO_ROOT, f))).toEqual([]);
  });
});

describe('the lc-reviewer agent', () => {
  it('exists, names itself and says when to use it', () => {
    expect(existsSync(REVIEWER), `missing ${REVIEWER}`).toBe(true);
    const meta = frontmatter(read(REVIEWER));
    expect(meta.name).toBe('lc-reviewer');
    expect(meta.description).toBeTruthy();
  });
});
