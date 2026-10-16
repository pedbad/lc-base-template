---
name: before-pr
description: Use before committing, pushing or opening a pull request, or when someone asks "is this ready?" — runs the repo's full check and walks the pull request checklist.
---

# Before a pull request

## Steps

1. **Run the verify gate** exactly as [`AGENTS.md` → "Verify before you claim done"](../../../AGENTS.md#verify-before-you-claim-done)
   gives it, and show the user the result. Do not say "ready" while any part fails.
   - If `test:e2e` cannot start a browser, say which one and that CI runs it; do not
     call it passed.
   - If a check fails, fix the cause. Never weaken a test or a guard to get green
     ([`AGENTS.md` → "The eight guards"](../../../AGENTS.md#the-eight-guards)).
2. **Check the scope.** Run `git diff --name-only main...` (and `git status` for files
   not yet committed).
   - In a **course repo** (by [`.claude/skills/README.md` → "Where am I"](../README.md#where-am-i)),
     every file must sit in the folders
     [`COURSE_GUIDE.md` → "What you may edit"](../../../COURSE_GUIDE.md#what-you-may-edit)
     lists. If one does not, stop and tell the user which file and why it needs the
     maintainer.
   - Check nothing the hard constraints forbid committing is staged
     ([`AGENTS.md` → "Hard constraints"](../../../AGENTS.md)).
3. **Walk the checklist** in [`.github/pull_request_template.md`](../../../.github/pull_request_template.md)
   with the user. A content-only pull request (lessons and their media) needs only a
   green CI (COURSE_GUIDE, "Every day: the loop"); a change to the machinery needs the
   accessibility boxes too.
4. **Commit only if the user asks.** Otherwise say it is ready and show the commit
   message you would use: small [Conventional Commits](https://www.conventionalcommits.org/),
   one concern each ([`AGENTS.md` → "Commits"](../../../AGENTS.md#commits)). If the
   change answers a request issue, the pull request says `Closes #N`.
5. Optionally, ask the `lc-reviewer` agent to review the diff before the pull request.
