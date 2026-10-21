---
name: add-exercise-engine
description: Use when someone asks for a new kind of exercise (a new exercise type or engine) that the course does not have yet — for example "learners drag labels onto a picture". In the template it builds the engine test-first; in a course repo it files a request to the template instead.
---

# Add an exercise engine

An exercise **engine** is a new kind of exercise (like `reading` or `memory-match`), not
a new exercise of an existing kind. For a new exercise of an existing kind, use the
`add-lo` skill.

## Step 0 — Where am I

Apply the rule in [`.claude/skills/README.md` → "Where am I"](../README.md#where-am-i).

- **The template**: go on to Step 1.
- **A course repo**: engines are built once, in the template, for every course
  ([`COURSE_GUIDE.md` → "What you may edit"](../../../COURSE_GUIDE.md#what-you-may-edit)).
  Write no code. Go to **Request mode** at the end of this file.

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

1. **The key.** Add the type to `EXERCISE_TYPE_KEYS` in
   [`src/config/exercise-types.ts`](../../../src/config/exercise-types.ts). The file's
   header says what then fails to compile until its instruction copy is added.
2. **The engine**, by the recipe: schema, pure grading, colocated tests, thin view,
   fixture, and both registry entries, view and schema ([`CONTRIBUTING.md`, the note at the end of "Adding content vs. changing the system"](../../../CONTRIBUTING.md#adding-content-vs-changing-the-system-read-before-a-pr)).
   Copy the shape of [`src/exercises/reading/`](../../../src/exercises/reading/), file
   for file. Guard e ([`src/guards/registry-completeness.ts`](../../../src/guards/registry-completeness.ts))
   names anything still missing.
3. **The rules.** Keep to [`AGENTS.md`](../../../AGENTS.md) "Hard constraints" and "Code
   rules" throughout, and watch the bundle budget
   ([`docs/TOOLING.md` → "Bundle budget"](../../../docs/TOOLING.md)).
4. **The docs** authors read: [`public/llms.txt`](../../../public/llms.txt) (it lists
   the engines). CONTRIBUTING has no section per exercise, because the schema and the
   fixture are an engine's reference. Update
   [`CONTRIBUTING.md` → "Exercise options"](../../../CONTRIBUTING.md#exercise-options)
   only if the engine changes what that section says (its `showAnswersAfter` default,
   say).

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
   - a short, made-up sample in the shape of a lesson's `exercise.json`;
   - feedback, audio, Show answers and Reset;
   - which course and lesson need it.
3. **File it** by [`.claude/skills/README.md` → "Filing a template request"](../README.md#filing-a-template-request).
