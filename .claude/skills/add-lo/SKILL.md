---
name: add-lo
description: Use when someone wants to add a new lesson (a Learning Object, LO) to the course, or add blocks and exercises of existing kinds to a lesson. Copies the example lesson, never edits it.
---

# Add a lesson (Learning Object)

A lesson is a folder under `lo-config/`; the folder existing is what adds its page and
its card. How it works, and what each block and exercise accepts:
[`CONTRIBUTING.md` → "Authoring a Learning Object"](../../../CONTRIBUTING.md#authoring-a-learning-object).
Read that section before you start.

This skill writes content (JSON and media), not code, so there is no test-first step: the
schemas check every lesson file when it loads, and `bun run test` runs them.

## Steps

1. **Start from an up-to-date `main`**
   ([`COURSE_GUIDE.md` → "Every day: the loop"](../../../COURSE_GUIDE.md#every-day-the-loop)).
   **In the template** (by [`.claude/skills/README.md` → "Where am I"](../README.md#where-am-i)),
   stop and ask: course lessons never enter the template
   ([`docs/ORGANIZATION.md` → "Decisions already made"](../../../docs/ORGANIZATION.md#decisions-already-made)).
   In a course repo, run `git status` first. If anything is uncommitted, ask the user
   whether to commit it on its own branch or stash it; never discard it. **Extending a
   lesson that already exists:** stay on its branch if the user is on it; otherwise
   `git switch main && git pull`, then `git switch -c <its folder name>`, and go to
   step 4. **A new lesson:** `git switch main && git pull`.
2. **Pick the folder name, then branch.** List `lo-config/`. The new lesson takes the next free
   `lo-NN-` number and a short slug, for example `lo-03-food`; the slug may not be a
   reserved page name or another lesson's ([`CONTRIBUTING.md`, step 1](../../../CONTRIBUTING.md)). The number is the course
   order and nothing else ([`CONTRIBUTING.md` → "Course order has one source"](../../../CONTRIBUTING.md#course-order-has-one-source-the-folder-ordinal)).
   Then `git switch -c lo-03-food`, the branch named after the lesson folder. Never
   write the lesson on `main`: GitHub refuses the push.
3. **Copy the example.** Copy `lo-config/lo-00-example/` to the new folder. **Never edit
   or delete `lo-00-example`**: it belongs to the template, the tests run on it, and it
   hides itself once the course has a lesson of its own (same section of CONTRIBUTING).
4. **Fill it in.** Edit `lo.json`, then each `blocks/*/block.json` and
   `exercises/*/exercise.json`. Remove the blocks and exercises the lesson does not need,
   and keep the folder names in step with the config (`<ordinal>-<type>`,
   [`STRUCTURE.md`](../../../STRUCTURE.md)). Rich-text tags are in
   [`docs/specs/lo-rich-text-modals.md`](../../../docs/specs/lo-rich-text-modals.md).
   If the lesson comes from a teacher's document, the
   [`culp-syllabus`](../culp-syllabus/SKILL.md) skill can first check its level
   (optional).
5. **Use existing kinds only.** If the user wants a kind of exercise or block that does
   not exist, stop and use the `add-exercise-engine` or `add-block-type` skill instead.
6. **Media.** Ask who made each image and recording before adding it, and follow the
   bold media rule in CONTRIBUTING's "Authoring a Learning Object". If the answer is
   unclear, do not add the file.
7. **Check it.** Run `bun run test`; a wrong lesson file fails with a message naming it.
   Then `bun run build && bun run preview` and click through the new lesson.
8. **Finish** with the `before-pr` skill.
