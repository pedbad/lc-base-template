---
name: sync-from-template
description: Use when bringing a template update into a course repo — "sync from the template", "pull in the template changes", "update this course from upstream". For the maintainer; a colleague only pulls.
---

# Sync a course repo from the template

How a fork and a linked copy each take an update:
[`docs/ORGANIZATION.md` → "Step 9 — Bringing template updates into a course"](../../../docs/ORGANIZATION.md#step-9--bringing-template-updates-into-a-course).

## Steps

1. **Check where you are.** This must be a course repo, by
   [`.claude/skills/README.md` → "Where am I"](../README.md#where-am-i). Start from a
   clean, up-to-date `main` (`git status`, `git switch main && git pull`).
2. **Merge the update on a branch**, as ORGANIZATION.md step 9 says. A course's `main`
   takes changes only through a pull request (ORGANIZATION.md step 6), so never push the
   merge to `main` directly. Then `bun install` — not optional, an update can add a
   package.
3. **If it clashes**, look at each file before choosing:
   - a template file (anything outside the course's own lesson folders and media): take
     the template's version, and tell the user what the course had changed there;
   - the course's own lessons and media
     ([`COURSE_GUIDE.md` → "What you may edit"](../../../COURSE_GUIDE.md#what-you-may-edit)):
     keep the course's version;
   - anything unclear: ask the user.
4. **Run the verify gate** from [`AGENTS.md` → "Verify before you claim done"](../../../AGENTS.md#verify-before-you-claim-done).
   The example lesson and the tests may have changed; a lesson of the course's own that
   now fails needs fixing in the lesson, not in the test.
5. **Push the branch and open a pull request** into the course's `main`; merge it when
   CI is green. Then tell the user to let colleagues know. Their side is
   `git switch main && git pull && bun install`
   ([`COURSE_GUIDE.md` → "When the template changes"](../../../COURSE_GUIDE.md#when-the-template-changes)).
