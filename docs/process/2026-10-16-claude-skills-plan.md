# Claude skills that ship with the repo (E7) — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline,
> the maintainer's choice: one review agent at the end, no fan-out). Steps use checkbox
> (`- [ ]`) syntax for tracking.

**Goal:** ship seven Claude skills, a reviewer agent and a template-request issue form
in the repo, kept in shape by one test, proven test-first in a scratch clone.

**Architecture:** plain Markdown in `.claude/skills/<name>/SKILL.md` and
`.claude/agents/`, each step linking the doc that holds its rule; a Vitest file in
`src/docs/` reads them from disk and checks their frontmatter and the code skills'
opening steps.

**Tech stack:** Claude Code skills and agents (YAML frontmatter + Markdown), GitHub
issue forms (YAML), Vitest.

**Spec:** [`2026-10-16-claude-skills-design.md`](../specs/2026-10-16-claude-skills-design.md)

---

## File map

| File                                                                                                   | Responsibility                                            |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `src/docs/claude-skills.test.ts`                                                                       | the skills' shape (spec §6)                               |
| `.claude/skills/add-lo/SKILL.md`                                                                       | a new lesson from the example, existing types only        |
| `.claude/skills/add-exercise-engine/SKILL.md`                                                          | Step 0, Step 1, engine recipe; request mode               |
| `.claude/skills/add-block-type/SKILL.md`                                                               | Step 0, Step 1, block shape after `sources`; request mode |
| `.claude/skills/change-theme/SKILL.md`                                                                 | Step 0, Step 1, palette / preset; request mode            |
| `.claude/skills/sync-from-template/SKILL.md`                                                           | template update into a course repo                        |
| `.claude/skills/before-pr/SKILL.md`                                                                    | gate, PR checklist, own-folders check                     |
| `.claude/skills/build-for-upload/SKILL.md`                                                             | `DEPLOY.md` walk-through                                  |
| `.claude/agents/lc-reviewer.md`                                                                        | read-only review against `AGENTS.md`                      |
| `.github/ISSUE_TEMPLATE/template-request.yml`                                                          | the request form                                          |
| `COURSE_GUIDE.md`, `CONTRIBUTING.md`, `README.md`, `AGENTS.md`, `STRUCTURE.md`, `docs/process/TODO.md` | say the skills exist                                      |

Request mode is written once per code skill, not shared through a fourth file: a skill
must read top to bottom on its own, and the three copies differ in what "existing
types" means. Each is short, and the test pins the headings they share.

## Task 1: the shape test (red)

**Files:** create `src/docs/claude-skills.test.ts`

- [ ] **Step 1: write the test**

```ts
/**
 * claude-skills.test.ts — keeps the Claude skills that ship with the repo in the shape
 * E7 agreed (docs/specs/2026-10-16-claude-skills-design.md §6).
 *
 * Reads the files from disk, not git's index, so a new skill is checked before it is
 * committed. A course repo may add skills of its own: they must have the same
 * frontmatter, and nothing here forbids them. Links inside the skills are
 * md-links.test.ts's job.
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
];
const STEP_0 = '## Step 0 — Where am I';
const STEP_1 = '## Step 1 — Test first';

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
    const text = read(skillFile(name));
    const step0 = text.indexOf(STEP_0);
    const step1 = text.indexOf(STEP_1);
    expect(step0, `${name} has no "${STEP_0}"`).toBeGreaterThan(-1);
    expect(step1, `${name}: "${STEP_1}" must come after Step 0`).toBeGreaterThan(step0);
  });

  it('no skill or agent tells Claude to run `bun test`', () => {
    const files = [...skillsOnDisk().map(skillFile), REVIEWER].filter((f) => existsSync(f));
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
```

- [ ] **Step 2: run it, see it fail**

Run: `bun run test src/docs/claude-skills.test.ts`
Expected: the two `frontmatter()` cases PASS; every `exists` case FAILS with
`missing …/SKILL.md`, the Step 0 cases throw `ENOENT`, the reviewer case fails.

## Task 2: the seven skills and the agent (green)

Write each file with frontmatter `name` + one-line `description` ("Use when …", naming
the requests that should trigger it). Every rule is a link, never a copy. Re-read a doc
just before linking a heading in it.

- [ ] **`add-lo`** — 1. Read `CONTRIBUTING.md` "Authoring a Learning Object". 2. Pick the
      next free `lo-NN-` ordinal (`ls lo-config/`); copy `lo-00-example/` to
      `lo-NN-slug/` (never edit or delete the example). 3. Fill `lo.json`, blocks and
      exercises **using existing types only**; if the user wants a type that does not
      exist, switch to `add-exercise-engine` or `add-block-type`. 4. Media: the bold rule
      in CONTRIBUTING; ask who made each file. 5. `bun run test`, then
      `bun run build && bun run preview`. 6. Hand over to `before-pr`.
- [ ] **`add-exercise-engine`** — `## Step 0 — Where am I` (spec §4.1, with the exact
      command); `## Step 1 — Test first` (test beside the code, `bun run test`, see it
      fail for the expected reason, show the output); `## Step 2 — Build it` (the recipe
      in CONTRIBUTING's note, copy `src/exercises/reading/`; guard e lists what must
      exist: `src/guards/registry-completeness.ts`); `## Step 3 — Finish` (`before-pr`).
      `## Request mode (course repo)` — spec §4.2 steps 1–4; existing types =
      `src/config/exercise-types.ts`; never file without the colleague's OK.
- [ ] **`add-block-type`** — same headings; Step 2 copies the `sources` block
      (`src/lo/blocks/sources-block-schema.ts`, `SourcesBlock.tsx`, the entry in
      `block-renderers.ts`, its CONTRIBUTING section and the example LO's use of it);
      existing types = `BLOCK_RENDERERS`.
- [ ] **`change-theme`** — same headings; Step 1 = an expectation in
      `src/styles/token-contrast.test.ts` or `token-presets.test.ts`; Step 2 =
      `DESIGNER.md` Jobs 1–3 (palette, preset variant file, never `tokens.css` by hand),
      check light and dark in the sandbox; existing = the three presets.
- [ ] **`sync-from-template`** — `docs/ORGANIZATION.md` step 9 for fork and linked copy;
      on a clash, keep the template's version of template files and the course's own
      lesson folders and media (COURSE_GUIDE "What you may edit"); then the verify gate.
- [ ] **`before-pr`** — the gate in `AGENTS.md` "Verify before you claim done"; the
      boxes in `.github/pull_request_template.md`; in a course repo,
      `git diff --name-only main...` must stay inside the folders COURSE_GUIDE lists,
      else stop and say which file.
- [ ] **`build-for-upload`** — `DEPLOY.md` in order; never commit Feijoa (AGENTS hard
      constraint 5).
- [ ] **`.claude/agents/lc-reviewer.md`** — frontmatter `name: lc-reviewer`,
      `description`, `tools: Read, Grep, Glob, Bash`; reviews `git diff main...` against
      `AGENTS.md` "Hard constraints", "Content rules", "Code rules"; one line per finding
      (`path:line — rule — fix`); never edits.
- [ ] **Run:** `bun run test src/docs/` → all PASS (shape + links).
- [ ] **Commit** (after the verify gate):
      `feat: ship the repo's Claude skills and reviewer agent (E7)`

## Task 3: the request form

**Files:** create `.github/ISSUE_TEMPLATE/template-request.yml`

- [ ] **Write it**

```yaml
name: Template request
description: Ask for a new exercise type, block type or change to the look
title: '[Request] '
labels: ['template request']
body:
  - type: dropdown
    id: kind
    attributes:
      label: What do you need?
      options: [A new exercise type, A new block type, A change to the look]
    validations: { required: true }
  - type: input
    id: where
    attributes:
      label: Which course and lesson need it?
    validations: { required: true }
  - type: textarea
    id: learner
    attributes:
      label: What does the learner see and do?
      description: Mouse, keyboard and phone.
    validations: { required: true }
  - type: textarea
    id: marking
    attributes:
      label: How are answers marked?
      description: Concrete examples, one per line ("X dropped on Y → correct").
  - type: textarea
    id: sample
    attributes:
      label: A sample with your real content
      render: json
  - type: textarea
    id: access
    attributes:
      label: Keyboard and screen-reader use
  - type: checkboxes
    id: checked
    attributes:
      label: Before you send
      options:
        - label: I checked the existing types and none of them fits
          required: true
```

- [ ] **Ask the maintainer**, then create the label once:
      `gh label create "template request" --repo pedbad/lc-base-template`
- [ ] **Commit:** `feat: add the template-request issue form (E7)`

## Task 4: proof in a scratch clone (spec §7)

- [ ] `git clone` this branch into the scratchpad; `bun install`.
- [ ] For each code skill, follow `SKILL.md` literally: a true/false engine, a `note`
      block, a fourth preset `tokens-variant-d-test.css`. At the first red
      `bun run test`, record `git status --short`: only test files may be new or changed.
- [ ] `git remote set-url origin https://github.com/example/french-1.git`; ask for an
      exercise type; the skill must draft an issue and leave `git status` empty. **Do not
      file it.**
- [ ] Record the four results in TODO's E7 entry (Task 5). Delete the clone.

## Task 5: docs

- [ ] `COURSE_GUIDE.md`: "Claude skills you can use" (one line per colleague skill) and
      "Need a new exercise, block or look?" (ask Claude, it checks, interviews, files
      the issue; you get emailed; when built, the template update brings it).
- [ ] `CONTRIBUTING.md`: a short pointer beside the engine-recipe note; `README.md`: a
      docs-table row; `AGENTS.md`: one line under "Working habits".
- [ ] `bun run docs:tree` (the tree comes from `git ls-files`, so `git add` first); check
      `STRUCTURE.md`'s `.claude/` and `.github/` rows.
- [ ] TODO: E7 done with the proof results; "Next" gains the sandbox palette drop-down as
      item 2; spec status → built.
- [ ] `bun run test src/docs/` green. **Commit:** `docs: tell colleagues the Claude skills exist (E7)`

## Task 6: finish

- [ ] Verify gate; one review agent over `git diff main...`; fix CRITICAL/HIGH.
- [ ] Push, PR, CI green, `git merge --ff-only` + push.
