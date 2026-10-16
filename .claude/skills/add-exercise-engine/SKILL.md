---
name: add-exercise-engine
description: Use when someone asks for a new kind of exercise (a new exercise type or engine) that the course does not have yet — for example "learners drag labels onto a picture". In the template it builds the engine test-first; in a course repo it files a request to the template instead.
---

# Add an exercise engine

An exercise **engine** is a new kind of exercise (like `reading` or `memory-match`), not
a new exercise of an existing kind. For a new exercise of an existing kind, use the
`add-lo` skill.

## Step 0 — Where am I

Run `git remote get-url origin`. The repository name is the last part of the address,
without `.git`.

- **`lc-base-template`**: this is the template. Go on to Step 1.
- **Any other name**: this is a course repo. Engines are built once, in the template,
  for every course ([`COURSE_GUIDE.md` → "What you may edit"](../../../COURSE_GUIDE.md#what-you-may-edit)).
  Write no code. Go to **Request mode** at the end of this file.
- **No `origin`, or you cannot tell**: ask the user which it is.

## Step 1 — Test first

Every file you add in Step 2 starts from its test. For each one:

1. Write the test beside the code, as `<name>.test.ts(x)`
   ([`AGENTS.md` → "Code rules"](../../../AGENTS.md#code-rules)).
2. Run `bun run test`, and show the user the failure.
3. Check it fails for the expected reason (the file or function is missing), not a typo.
4. Only then write the code, and run `bun run test` again until it passes.

If the user gave marking examples ("X on Y → correct"), they are the first grading tests.
A request issue from a course has them under "How are answers marked?".

## Step 2 — Build it

Follow the engine recipe: schema, pure grading, colocated tests, thin view, fixture,
registry entry ([`CONTRIBUTING.md`, the note at the end of "Adding content vs. changing the system"](../../../CONTRIBUTING.md#adding-content-vs-changing-the-system-read-before-a-pr)).
Copy the shape of [`src/exercises/reading/`](../../../src/exercises/reading/), file for
file. What must exist for a new type is enforced by guard e
([`src/guards/registry-completeness.ts`](../../../src/guards/registry-completeness.ts)):
its key, its registry entry, its fixture and its schema.

Keep to [`AGENTS.md`](../../../AGENTS.md) while you build: tokens only, every CSS rule in
`@layer`, prerendered markup equal to the first client render, reduced motion through
`prefersReducedMotion()`. Watch the bundle budget
([`docs/TOOLING.md` → "Bundle budget"](../../../docs/TOOLING.md)).

Then document it where authors look: the exercise's section in
[`CONTRIBUTING.md`](../../../CONTRIBUTING.md), and
[`public/llms.txt`](../../../public/llms.txt) (it lists the engines).

## Step 3 — Finish

Use the `before-pr` skill. If a request issue started this, put `Closes #N` in the pull
request so merging closes it.

## Request mode (course repo)

1. **Check what exists.** The exercise types are listed in
   [`src/config/exercise-types.ts`](../../../src/config/exercise-types.ts), and each
   one can be seen in `DEBUG=1 bun run build` → `exercise-showcase.html`. If one fits,
   show the user and stop.
2. **Interview the user**, one question at a time:
   - what the learner sees and does, with a mouse, a keyboard and on a phone;
   - how answers are marked, as concrete examples, one per line ("_le bras_ on the arm →
     correct", "nothing placed → not marked");
   - a sample with their real content, in the shape of a lesson's `exercise.json`;
   - feedback, audio, Show answers and Reset;
   - which course and lesson need it.
3. **Draft the issue** with the fields of the template's request form
   ([`.github/ISSUE_TEMPLATE/template-request.yml`](../../../.github/ISSUE_TEMPLATE/template-request.yml)),
   and show it to the user. Write no file in this repo; keep any draft in a temporary
   file outside it (`mktemp`).
4. **File it only when the user says yes.** Find the template's address from this repo,
   never from memory: `git remote get-url upstream` (a linked copy), else
   `gh repo view --json parent --jq .parent.nameWithOwner` (a fork), else ask. Then:

   ```bash
   gh issue create --repo <owner/name> --title "[Request] <short name>" \
     --label "template request" --body-file <draft file>
   ```

   If `gh` is not installed or not signed in, give the user the text and the link
   `https://github.com/<owner/name>/issues/new?template=template-request.yml` to paste
   it into. Tell them the maintainer is emailed, replies on the issue, and that the new
   type reaches their course with the next template update.
