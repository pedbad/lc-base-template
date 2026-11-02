---
name: sync-from-template
description: Use when bringing a template update into a course repo — "sync from the template", "pull in the template changes", "update this course from upstream". Usually the course's author opens the update on GitHub's website; this recipe is the command-line route, for the maintainer or an author, when a branch must be prepared or a conflict resolved.
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
3. **If it clashes**, neither side is always right. For each file, show the user both
   changes since the common starting point (`base=$(git merge-base HEAD MERGE_HEAD)`, then
   `git diff "$base" MERGE_HEAD -- <file>` for the template's and
   `git diff "$base" HEAD -- <file>` for the course's) and work out the result that keeps
   what each side meant: usually the template's new code with the course's own settings
   and content. Take one side's whole file only when the user has seen what it throws
   away. The course's own lessons and media
   ([`COURSE_GUIDE.md` → "What you may edit"](../../../COURSE_GUIDE.md#what-you-may-edit))
   are the course's. Anything unclear: ask the user. `git merge --abort` stops the merge
   and tries to put the branch back as it was, discarding resolutions made so far; it is
   reliable because step 1 started from a clean tree.
4. **Run the verify gate** from [`AGENTS.md` → "Verify before you claim done"](../../../AGENTS.md#verify-before-you-claim-done).
   The example lesson and the tests may have changed; a lesson of the course's own that
   now fails needs fixing in the lesson, not in the test.
5. **Push the branch; the course's author opens the pull request** into the course's
   `main` (a pull request the maintainer opens could never get a code owner's approval,
   ORGANIZATION.md step 6, path 1). When CI is
   green, merge it with **Create a merge commit**, never squash or rebase
   (ORGANIZATION.md step 9 says why), once the code owner has approved it by the path
   ORGANIZATION.md step 6 records. If `main` moved meanwhile, merge it into the sync
   branch; never rebase it. Then tell the user to let colleagues know. Their side is
   `main` and then each open branch
   ([`COURSE_GUIDE.md` → "When the template changes"](../../../COURSE_GUIDE.md#when-the-template-changes)).
