---
name: sync-from-template
description: Use when bringing a template update into a course repo — "sync from the template", "pull in the template changes", "update this course from upstream". For the maintainer; a colleague only pulls.
---

# Sync a course repo from the template

The steps for a fork and for a linked copy are in
[`docs/ORGANIZATION.md` → "Step 9 — Bringing template updates into a course"](../../../docs/ORGANIZATION.md#step-9--bringing-template-updates-into-a-course).
Follow the one that matches this repo.

## Steps

1. **Check where you are.** `git remote get-url origin` must be a course repo, not
   `lc-base-template`. Start from a clean, up-to-date `main` (`git status`,
   `git switch main && git pull`).
2. **Merge the update** as ORGANIZATION.md step 9 says, then `bun install` — not optional,
   an update can add a package.
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
5. **Push**, and tell the user to let colleagues know. Their side is
   `git switch main && git pull && bun install`
   ([`COURSE_GUIDE.md` → "When the template changes"](../../../COURSE_GUIDE.md#when-the-template-changes)).
