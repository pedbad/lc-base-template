# Claude skills that ship with the repo — E7 design

**Date:** 2026-10-16 · **Status:** agreed 2026-10-16, not built
**TODO:** §E7 · **Plan:** to follow in `docs/process/`

## 1. Why

The TDD guard is off by default (§E3), so nothing on a colleague's machine keeps Claude
test-first. Skills shipped in the repo do: every course repo inherits them, a template
sync updates them, and CI's coverage rule checks the result. They also carry the
course-repo rule (content only, so template updates merge cleanly) to the moment a
colleague asks Claude for something the template does not have.

## 2. Scope

**In:** seven skills in `.claude/skills/<name>/SKILL.md`, one agent in
`.claude/agents/lc-reviewer.md`, a GitHub issue form for template requests, one test
file that keeps the skills' shape, the docs that tell colleagues all this exists, and a
scratch-clone proof.

**Out:** per-course colours (decided 2026-10-16: one look for all courses); the sandbox
palette drop-down (its own task straight after E7, §8); any change to the eight guards.

## 3. Decisions (2026-10-16, with the maintainer)

1. **Code skills stop in a course repo.** A new exercise type, block type or theme
   change is built in the template only. In a course repo the skill switches to
   **request mode**: it files a GitHub issue on the template instead of writing code.
2. **Requests are GitHub issues** on the template repo, through one issue form. The
   maintainer is emailed by GitHub, replies on the issue, builds it in the template, and
   the PR's `Closes #N` closes it. COURSE_GUIDE documents the colleague's side.
3. **One look for all courses.** `change-theme` follows decision 1.
4. **Seven skills plus the reviewer**, including `change-theme` and `build-for-upload`.
5. **Proof:** the skills are run by hand in a scratch clone (option B), plus a test in
   the repo that keeps the test-first step in every code skill.

## 4. The skills

Each `SKILL.md` has YAML frontmatter (`name` equal to its folder, a `description` that
names the requests that should trigger it) and short numbered steps. **Every step that
rests on a rule links to the doc that holds it**: `AGENTS.md`, `CONTRIBUTING.md`,
`DESIGNER.md`, `DEPLOY.md`, `COURSE_GUIDE.md`, `docs/ORGANIZATION.md` step 9, or the
engine recipe (`src/exercises/reading/`). No rule is copied into a skill.

| Skill                 | Who                                 | Does                                                                                                                                                                                                                                                                        |
| --------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `add-lo`              | everyone                            | Copies `lo-config/lo-00-example/` to `lo-NN-slug` (never edits or deletes the example; order is the ordinal), fills blocks and exercises of **existing** types, applies the media rule, runs `bun run test` and the build. No code, so no test-first step: Zod is its test. |
| `add-exercise-engine` | maintainer (template); request mode | Template: test first, then the engine recipe, copying the shape of `src/exercises/reading/`.                                                                                                                                                                                |
| `add-block-type`      | maintainer (template); request mode | Template: test first, then a block's schema, renderer and registration, copying the shape of the `sources` block (`src/lo/blocks/`).                                                                                                                                        |
| `change-theme`        | maintainer (template); request mode | Template: test first (an expectation in `src/styles/token-contrast.test.ts` or `token-presets.test.ts`), then `palette.css` or a variant file, never `tokens.css` by hand (`DESIGNER.md`); both themes checked.                                                             |
| `sync-from-template`  | maintainer                          | Brings a template update into a course repo (`ORGANIZATION.md` step 9): merge, `bun install`, the verify gate, help with a clash. A colleague's side is `git pull && bun install` (COURSE_GUIDE).                                                                           |
| `before-pr`           | everyone                            | The verify gate from `AGENTS.md`, the PR template's checks, and in a course repo: nothing changed outside the colleague's folders (COURSE_GUIDE, "What you may edit").                                                                                                      |
| `build-for-upload`    | colleagues                          | Walks `DEPLOY.md`: own Feijoa files, `BASE_URL` set to the course folder, the checks before going live.                                                                                                                                                                     |

**`lc-reviewer`** (agent): reviews a diff against `AGENTS.md`'s code and content rules
(tokens only, every rule in `@layer`, prerender equals first render, tests beside the
code, example lesson untouched, media rule, `%BASE_URL%` / `resolveAsset()`), and
reports findings with file and line. It does not edit.

### 4.1 The opening of every code skill

The three code skills (`add-exercise-engine`, `add-block-type`, `change-theme`) open
with the same two steps, in this order:

- **Step 0 — Where am I.** Read `git remote get-url origin`. A repository named
  `lc-base-template` is the template; any other name is a course repo. No `origin`, or
  unclear: ask the user.
- **Step 1 — Test first** (template only). Write the test beside the code, run
  `bun run test`, see it fail for the expected reason, and only then write the code.

### 4.2 Request mode (course repo)

1. Check the existing types first (the exercise registry, the block renderers, the
   three presets). If one fits, show the colleague and stop.
2. Interview: what the learner sees and does (mouse, keyboard, phone), how answers are
   marked as concrete examples ("X dropped on Y → correct"), a sample in the lesson's
   JSON shape with their real content, feedback, audio, show answers and reset. The
   marking examples become the maintainer's first failing tests.
3. Draft the issue from the form's fields and show it. Write no file in the course
   repo.
4. On the colleague's OK, file it with `gh issue create` on the template. The template's
   address comes from the repo, never a fixed name: the `upstream` remote (linked copy),
   else `gh repo view --json parent` (fork), else ask. Without a working `gh`, give the
   text and the template's new-issue link to paste in a browser.

## 5. The issue form

`.github/ISSUE_TEMPLATE/template-request.yml`: kind (exercise type, block type, theme
change), the course and lesson that need it, what the learner sees and does, marking
examples, sample content, keyboard and screen-reader use, and a checkbox "I checked the
existing types". Label `template request`, created once on the template
(`gh label create`). Course repos inherit the file; it is harmless there.

## 6. The test that keeps the skills' shape

`src/docs/claude-skills.test.ts`, beside `md-links.test.ts`, written failing first:

- every `.claude/skills/*/SKILL.md` has frontmatter with `name` equal to its folder and
  a non-empty `description`; the agent file has `name` and `description`;
- the three code skills contain the Step 0 and Step 1 headings, Step 0 first;
- no skill or agent tells Claude to run `bun test` (only `bun run test`).

Broken links are already caught: `md-links.test.ts` checks every tracked `.md`.

## 7. Proof

In a scratch clone of the branch, follow each code skill literally on a toy target: a
true/false exercise engine, a "note" block, a fourth colour preset. At the first red
`bun run test`, `git status` must show only new or changed **test** files. Then rename
the clone's `origin` to a course-repo name and ask for an exercise type: the skill must
draft an issue and write no file. Results are recorded in TODO's E7 entry.

## 8. Docs, and what follows

- `COURSE_GUIDE.md`: "Claude skills you can use" and "Need a new exercise, block or
  look? File a request".
- `CONTRIBUTING.md`, `README.md`: a pointer each. `AGENTS.md`: one line pointing at the
  skills. TODO: E7 done; the sandbox palette drop-down added to "Next" as item 2.
- **Then:** a drop-down in `debug-sandbox.html` that switches the three
  `tokens-variant-*.css` presets live, preview only (decided 2026-10-16, its own PR).
