---
name: before-pr
description: Use before committing, pushing or opening a pull request, or when someone asks "is this ready?" — checks the branch and where it will go, runs the repo's full check and walks the pull request checklist.
---

# Before a pull request

## Steps

1. **Check where the work is**, before the long checks. Decide first whether this is the
   template or a course repo ([`.claude/skills/README.md` → "Where am I"](../README.md#where-am-i)).
   - `git branch --show-current` is not `main`. If it is, stop: the push would be
     refused. Move the work onto a branch as
     [`CONTRIBUTING.md` → "Forgot to branch?"](../../../CONTRIBUTING.md#how-a-change-reaches-main)
     says, with the user's agreement, before anything else.
   - `git remote get-url origin` is this repository. In a course repo it is the course
     (`lc-elearn/<course-repo>`), never the template, and `gh repo set-default --view`
     names the same repository; if it names another, tell the user and set it to
     `origin`'s only when they agree.
   - `git config user.name` and `git config user.email` are set. If not, ask the user
     for their own; never make them up.
   - After `git fetch origin`, `git merge-base --is-ancestor origin/main HEAD` exits 0.
     If not, the branch is behind `main`. In a course repo bring it up to date by
     merging (`git merge origin/main`), never by rebasing
     ([`docs/ORGANIZATION.md` step 9](../../../docs/ORGANIZATION.md#step-9--bringing-template-updates-into-a-course));
     in the template, which keeps a straight-line history, `git rebase origin/main`
     (if the branch was already pushed, the next push needs `--force-with-lease`: say
     so and push only with the user's agreement).
2. **Run the verify gate** exactly as [`AGENTS.md` → "Verify before you claim done"](../../../AGENTS.md#verify-before-you-claim-done)
   gives it, and show the user the result. Do not say "ready" while any part fails.
   - If `test:e2e` cannot start a browser, say which one and that CI runs it; do not
     call it passed.
   - If a check fails, fix the cause. Never weaken a test or a guard to get green
     ([`AGENTS.md` → "The eight guards"](../../../AGENTS.md#the-eight-guards)).
3. **Check the scope.** Run `git diff --name-only origin/main...` (and `git status` for files
   not yet committed).
   - In a **course repo** (by [`.claude/skills/README.md` → "Where am I"](../README.md#where-am-i)),
     every file must sit in the folders
     [`COURSE_GUIDE.md` → "What you may edit"](../../../COURSE_GUIDE.md#what-you-may-edit)
     lists. If one does not, stop and tell the user which file and why it needs the
     maintainer.
   - Check nothing the hard constraints forbid committing is staged
     ([`AGENTS.md` → "Hard constraints"](../../../AGENTS.md)).
4. **Walk the checklist** in [`.github/pull_request_template.md`](../../../.github/pull_request_template.md)
   with the user. A content-only pull request (lessons, their media, or `course.json`) needs only a
   green CI (COURSE_GUIDE, "Every day: the loop"); a change to the machinery needs the
   accessibility boxes too.
5. **Commit only if the user asks.** Otherwise say it is ready and show the commit
   message you would use: small [Conventional Commits](https://www.conventionalcommits.org/),
   one concern each ([`AGENTS.md` → "Commits"](../../../AGENTS.md#commits)). If the
   change answers a request issue, the pull request says `Closes #N`.
6. **Push and open the pull request only if the user asks.** `git push -u origin
<branch>`, then `gh pr create --repo <origin's owner/name> --base main`, so the pull
   request goes into this same repository: in a course repo, the course, never the
   template. Show its address. Merging is the user's decision, once CI is green (and,
   for anything COURSE_GUIDE's table says waits, the maintainer has approved): in a
   course repo with **Create a merge commit**, the only method it allows
   ([`docs/ORGANIZATION.md` step 6](../../../docs/ORGANIZATION.md#step-6--create-a-course-repo-once-per-course));
   in the template with **Rebase and merge** (CONTRIBUTING, step 5 there).
7. Optionally, ask the `lc-reviewer` agent to review the diff before the pull request.
