# Branch Protection — DO BEFORE SHARING WITH OTHER DEVELOPERS

**Do this once, in the GitHub UI, before the repo is shared with anyone else.** It is the
piece that makes the in-repo guardrails (`.github/CODEOWNERS`, the PR template, CI) actually
**block** a bad merge instead of merely _suggesting_ review. Nothing in the repo can enable
this for you — branch protection is a GitHub repo setting, not a file.

> Status: ⬜ **NOT enabled — deliberately, for now.**
>
> **Decided 2026-09-03:** while this is a single-maintainer build, `main` accepts direct
> pushes and the verify gate (`format · lint · lint:css · test · build`) is run by hand
> before each commit. This is a considered choice, not a missed step — CONTRIBUTING says
> the same. **The trigger to switch it on is a second person getting push access.**
>
> Tick to ✅ once configured.

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

As of 2026-09-03 the only collaborator is `pedbad`. So:

| If the repo has…          | Enable                                                  |
| ------------------------- | ------------------------------------------------------- |
| one collaborator          | PR required + **status checks only** — no approval rows |
| two or more collaborators | the full table below, approvals included                |

The status-check half is what actually protects `main` (nothing red can merge). The
approval half only becomes meaningful once there is someone else to do the approving —
which is exactly the "sharing with other developers" moment this checklist is gated on.

Cost to know before flipping it: CI on this repo runs ~8m30s, so every merge — typo fixes
included — waits that long.

---

## UI path

**github.com/pedbad/lc-base-template → Settings → Branches → Add branch ruleset**
(or classic "Add rule"). Target branch: **`main`**. Enable:

| Toggle                                                                          | Why                                                                |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| ☐ **Require a pull request before merging**                                     | kills direct pushes to `main`                                      |
| ☐ &nbsp;&nbsp;→ **Require approvals: 1**                                        | a human reviews every change                                       |
| ☐ &nbsp;&nbsp;→ **Require review from Code Owners**                             | activates `.github/CODEOWNERS` enforcement (else it only requests) |
| ☐ &nbsp;&nbsp;→ **Dismiss stale approvals on new commits**                      | re-review after changes                                            |
| ☐ **Require status checks to pass** → select the **`Lint, test, build`** CI job | no merge on red CI                                                 |
| ☐ &nbsp;&nbsp;→ **Require branches to be up to date before merging**            | CI ran against latest `main`                                       |
| ☐ **Require conversation resolution before merging**                            | no merging over unresolved comments                                |
| ☐ **Do not allow bypassing the above settings**                                 | rule applies to admins too (recommended for handoff)               |
| ☐ **Require linear history** _(optional)_                                       | matches the fast-forward-merge workflow                            |

**Gotcha:** the status-check picker only lists a check **after CI has run at least once**.
If `Lint, test, build` isn't selectable, open one throwaway PR, let CI run, then it appears.

---

## Alternative — gh CLI (classic protection)

If you prefer the terminal (requires `gh auth login` with admin on the repo).

**Do not paste this as-is with one collaborator** — the two
`required_pull_request_reviews` lines and `enforce_admins=true` are the lockout combination
described above. Drop those three lines for the solo-maintainer version.

```bash
gh api -X PUT repos/pedbad/lc-base-template/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  -f 'required_status_checks[strict]=true' \
  -f 'required_status_checks[contexts][]=Lint, test, build' \
  -f 'required_pull_request_reviews[required_approving_review_count]=1' \
  -f 'required_pull_request_reviews[require_code_owner_reviews]=true' \
  -f 'enforce_admins=true' \
  -f 'restrictions=' \
  -f 'required_linear_history=true'
```

(Confirm the check name matches the CI job — currently **`Lint, test, build`** in
`.github/workflows/ci.yml`. If you rename the job, update it here too.)

---

## Verify it worked

1. On a scratch branch, push a trivial change and open a PR.
2. Confirm: merge is **blocked** until CI is green **and** an approval exists.
3. Edit a file under `src/styles/` or `src/config/` in that PR → confirm a **code-owner
   review** is requested automatically.
4. Try `git push origin main` directly → it should be **rejected**.

Once all four behave, flip the status line at the top of this file to ✅ and you're done.
