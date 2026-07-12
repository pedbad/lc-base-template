# Branch Protection — pre-handover checklist

**Do this once, in the GitHub UI, before/at handover to the developer team.** It is the
piece that makes the in-repo guardrails (`.github/CODEOWNERS`, the PR template, CI) actually
**block** a bad merge instead of merely _suggesting_ review. Nothing in the repo can enable
this for you — branch protection is a GitHub repo setting, not a file.

> Status: ⬜ **NOT yet enabled** — tick to ✅ once configured.

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

If you prefer the terminal (requires `gh auth login` with admin on the repo):

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
