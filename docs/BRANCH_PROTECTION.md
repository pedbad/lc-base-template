# Branch Protection — DO BEFORE SHARING WITH OTHER DEVELOPERS

**Do this once, in the GitHub UI, before the repo is shared with anyone else.** It is the
piece that makes the in-repo guardrails (`.github/CODEOWNERS`, the PR template, CI) actually
**block** a bad merge instead of merely _suggesting_ review. Nothing in the repo can enable
this for you — branch protection is a GitHub repo setting, not a file.

> Status: ✅ **Enabled 2026-10-21, solo-maintainer version** (classic protection, set
> with the [gh CLI command below](#alternative--gh-cli-classic-protection)): pull request
> required, **0 approvals**, all five CI checks green and up to date, admins included,
> linear history, no force-push or deletion of `main`. Proved the same day: a direct
> `git push origin main` was refused (`GH006: Protected branch update failed … Changes must
be made through a pull request`).
>
> **Why now, not at the second collaborator as first planned (2026-09-03):** the second
> external review found that with `main` open, a direct push lands before CI has looked
> at it, and the local pre-push hook can be skipped. The approval and code-owner rows stay
> off until there is a second person to approve ([below](#-do-not-enable-approvals-while-there-is-only-one-collaborator)).

---

## Why it matters

Without protection on `main`:

- anyone can `git push` straight to `main` and skip CI entirely;
- CODEOWNERS only _requests_ review — it doesn't require it;
- a red CI run doesn't stop a merge.

With it: every change goes through a PR, CI must be green, and a code owner must approve
changes to tokens / schemas / engine wiring / build. That's the wall that keeps a shared
template from rotting as many authors add Learning Objects.

---

## ⚠ Do not enable approvals while there is only one collaborator

`Require approvals: 1` + `Do not allow bypassing` (admins included) **locks a solo
maintainer out of their own repo.** GitHub will not let you approve your own pull request,
so the merge button stays disabled forever, waiting on an approval that cannot arrive.

As of 2026-09-03 the only collaborator is `pedbad` — re-verified 2026-09-09, still one
(`gh api repos/pedbad/lc-base-template/collaborators --jq '.[].login'`). So:

| If the repo has…          | Enable                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| one collaborator          | PR required with **0 approvals** + status checks + admins included — no approval or code-owner rows |
| two or more collaborators | the full table below, approvals included                                                            |

The status-check half is what actually protects `main` (nothing red can merge). The
approval half only becomes meaningful once there is someone else to do the approving.

**Admins included is safe at 0 approvals.** With no approval to wait for, the only thing
that can block a merge is a red check, which the author can fix. Leaving admins out
instead would let the one maintainer — an admin — push straight to `main`, which is the
gap protection exists to close. And no setting here is a permanent lockout: an admin can
always change or remove the rule under **Settings → Branches**.

### ⚠ `CODEOWNERS` is a SECOND lockout, by a different route

**Adding a collaborator is not enough. Fix `.github/CODEOWNERS` first.** Every one of its
15 owner rules currently names `@pedbad` and nobody else (the three content folders have
no owner), so **Require review from Code Owners**
demands a code-owner review on your own PR — which, being your own, you cannot give. That
is the same dead merge button as the approvals trap above, reached without ever touching
the approvals row, and it survives adding a second collaborator because CODEOWNERS still
names only you.

So the enablement order is: **(1)** add the collaborator, **(2)** commit a `CODEOWNERS`
that names a reviewer who is not the author on every protected path, **(3)** only then
enable the approval and code-owner rows. Noted 2026-09-09, when all 15 rules were still
sole-owner.

Cost to know: every merge waits for CI. That wait is **about 4 minutes** — the jobs run
side by side, and the slowest (a browser-test row) took 229s, 235s and 236s in the last
three runs on `main` (measured 2026-10-21 from `gh run view <id> --json jobs`). It was
~45s on 2026-09-09, before the browser tests joined CI (E12a, 2026-10-14). Still short
next to what it buys: nothing red reaches `main`.

---

## UI path

**github.com/pedbad/lc-base-template → Settings → Branches → Add branch ruleset**
(or classic "Add rule"). Target branch: **`main`**. Enable:

| Toggle                                                                  | Why                                                                                                                         |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| ☐ **Require a pull request before merging**                             | kills direct pushes to `main`                                                                                               |
| ☐ &nbsp;&nbsp;→ **Require approvals: 1**                                | a human reviews every change                                                                                                |
| ☐ &nbsp;&nbsp;→ **Require review from Code Owners**                     | activates `.github/CODEOWNERS` enforcement (else it only requests). **Fix CODEOWNERS first** — see the second warning above |
| ☐ &nbsp;&nbsp;→ **Dismiss stale approvals on new commits**              | re-review after changes                                                                                                     |
| ☐ **Require status checks to pass** → select all five CI checks (below) | no merge on red CI                                                                                                          |
| ☐ &nbsp;&nbsp;→ **Require branches to be up to date before merging**    | CI ran against latest `main`                                                                                                |
| ☐ **Require conversation resolution before merging**                    | no merging over unresolved comments                                                                                         |
| ☐ **Do not allow bypassing the above settings**                         | rule applies to admins too (recommended for handoff)                                                                        |
| ☐ **Require linear history** _(optional)_                               | matches the rebase-merge workflow                                                                                           |

**Gotcha — already cleared here.** The status-check picker only lists a check **after CI
has run at least once**, so on a fresh repo you would open a throwaway PR, let CI run, then
find it. Not needed on this repo: all five checks have run many times on `main`
(`gh run list`), so they appear in the picker straight away. The step is kept only for
whoever clones this template into a repo whose CI has never run.

The names in the picker must match the check names `.github/workflows/ci.yml` reports —
currently five: **`Lint, test, build`** (the `verify` job), and four from the `e2e` job, one
per `matrix.site` × `matrix.debug` (since 2026-10-20):

- **`Browser tests (./ from /any/folder/)`**
- **`Browser tests (./ from /any/folder/, DEBUG=1)`**
- **`Browser tests (/course/)`**
- **`Browser tests (/course/, DEBUG=1)`**

Require all five: the verify gate includes the browser tests, so CI should too. To read
the live names, run `gh pr checks <number>` on any open PR. **Rename a job, or change the
matrix, and every merge blocks forever** on a required check that no longer reports, so the
change and this doc go in the same commit.

---

## Alternative — gh CLI (classic protection)

If you prefer the terminal (requires `gh auth login` with admin on the repo).

**The solo-maintainer version** — what is set on this repo (2026-10-21):

```bash
gh api -X PUT repos/pedbad/lc-base-template/branches/main/protection \
  -H "Accept: application/vnd.github+json" --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Lint, test, build",
      "Browser tests (./ from /any/folder/)",
      "Browser tests (./ from /any/folder/, DEBUG=1)",
      "Browser tests (/course/)",
      "Browser tests (/course/, DEBUG=1)"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

**With a second collaborator**, and only after `CODEOWNERS` names a reviewer who is not
the author ([above](#-codeowners-is-a-second-lockout-by-a-different-route)): run it again
with `"required_approving_review_count": 1`, `"require_code_owner_reviews": true` and
`"dismiss_stale_reviews": true`. Running it with those while solo is the lockout above.

Read back what is set:

```bash
gh api repos/pedbad/lc-base-template/branches/main/protection
```

(Confirm the check names match the CI jobs listed above. If you rename a job or change
the matrix, update them here too.)

---

## Verify it worked

1. Try `git push origin main` directly → it should be **rejected** (`GH006`). Then drop
   the test commit: `git reset --hard origin/main`. **Done 2026-10-21.**
2. On a branch, push a change and open a PR. Confirm merge is **blocked** until all five
   checks are green. **Done 2026-10-21**, by the PR that added this line.
3. Solo version: confirm you can then merge your own PR with no approval. With a second
   collaborator: confirm merge also waits for an approval, and that editing a file under
   `src/styles/` or `src/config/` requests a **code-owner review** automatically.
