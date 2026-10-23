# GitHub Organisation — `lc-elearn` (planned move)

**The plan for moving this template into a GitHub organisation and giving each course its
own repo.** Follow it top to bottom on the day. Only step 5's template-side work is done
already (the `CODEOWNERS` content rule, and `main`'s protection); the move itself is not.

> Status: ⬜ **NOT started — deferred by decision.**
>
> **Decided 2026-10-12:** the template stays under `pedbad` until the remaining template
> work is finished. When colleagues are ready to start courses, do the steps below in
> order. Tick to ✅ once the move is complete and the first course repo is working.

---

## What changes, and what does not

|                  | Today                                | After the move                                  |
| ---------------- | ------------------------------------ | ----------------------------------------------- |
| Template address | `github.com/pedbad/lc-base-template` | `github.com/lc-elearn/lc-base-template`         |
| Who owns it      | the `pedbad` account                 | the `lc-elearn` organisation                    |
| Who maintains it | `pedbad`                             | `pedbad` (as organisation **Owner**)            |
| Copies on GitHub | one                                  | still one — a transfer **moves**, never copies  |
| Local clones     | work iMac + MacBook Pro              | same folders, same history, one-line URL update |
| Courses          | —                                    | one repo per course inside `lc-elearn`          |

The maintainer keeps logging in as `pedbad`. An organisation has no login of its own; people
act in it through their personal accounts, with the permissions the Owner grants.

**Why an organisation rather than personal forks:** course repos belong to the team, not to
whoever built them. A colleague who leaves loses access; the course stays. The Owner sets
branch rules on every course repo, and nobody else can switch them off.

---

## Decisions already made

- **Name:** `lc-elearn` (the URL). **Display name:** LC e-Learning Team. Check the name is
  free at step 1; if taken, pick another and replace `lc-elearn` throughout this file.
- **One repo per course** (`lc-french`, `lc-english`, `lc-italian`, …), never one branch per
  course in the template. Language branches would never merge back and would drift.
- **Course content never enters the template.** Only engine changes go to the template, by
  pull request. The rule for what counts as engine is in
  [`CONTRIBUTING.md` → "Adding content vs. changing the system"](../CONTRIBUTING.md).
- **Authors do not deploy.** They merge into their course repo's `main` through a pull
  request; the colleague who publishes courses builds and uploads them by
  [`DEPLOY.md`](../DEPLOY.md) (decided 2026-10-16; it was the maintainer).
- **Review covers code, not content** (decided 2026-10-12). A pull request that only
  changes content (`lo-config/`, `public/images/`, `public/audio/`) merges on green CI. A
  pull request that touches anything else waits for the maintainer's approval. Enforced
  by `CODEOWNERS` (step 5) plus the course repo's branch rules (step 6).
- **Colleagues get write access to their own course repo only.**
- **Everything is public** (decided 2026-10-12): the template and every course repo.
  Learning content is Creative Commons — the existing [`LICENSE`](../LICENSE) already
  makes code MIT and content CC BY-NC 4.0, and every course repo inherits it. Public
  means the **Free** organisation plan covers everything below, and every course can be a
  true fork.

## Still to decide before starting

- [x] **Deploy targets.** None fixed in the repo: addresses change between servers, so
      the default build uses relative paths (`./`) and works from any folder; `BASE_URL`
      is set only for a fixed address ([`DEPLOY.md`](../DEPLOY.md), E24). Decided by the
      maintainer 2026-10-16.
- [x] **Content licence variant.** CC BY-NC 4.0 (no commercial reuse), as `LICENSE`
      says. Confirmed by the maintainer 2026-10-14.

---

## Step 1 — Create the organisation

Logged in as `pedbad`: **+** (top right) → **New organization** → **Free** → name
`lc-elearn`, display name **LC e-Learning Team**, contact email, "belongs to: my personal
account".

`pedbad` becomes the organisation's **Owner** automatically.

Then **Settings → Member privileges**:

| Setting             | Value    | Why                                                          |
| ------------------- | -------- | ------------------------------------------------------------ |
| Base permissions    | **Read** | members can see every repo, but write only where granted     |
| Repository creation | **off**  | only the Owner creates repos, so the layout stays as planned |

## Step 2 — Transfer the template

**github.com/pedbad/lc-base-template → Settings → General → Danger Zone → Transfer** →
new owner `lc-elearn`.

Moves with it: all history, branches, tags, releases, issues, the Actions workflows,
settings, and the "Template repository" tick. GitHub redirects the old URL to the
new one for web, `git` and API traffic.

**Never create a new repo named `lc-base-template` under `pedbad` afterwards** — it would
take over the old address and break the redirect.

## Step 3 — Point each local clone at the new address

Once on every machine with a clone (work iMac, MacBook Pro):

```bash
git remote set-url origin https://github.com/lc-elearn/lc-base-template.git
```

Check it:

```bash
git remote -v && git fetch && git status -sb
```

No re-clone, no lost work. The redirect means a machine that has not been updated yet still
pulls and pushes correctly — this step just stops relying on it.

## Step 4 — Update the old address inside the repo

One commit (`docs: template moved to lc-elearn`). As of 2026-10-21 these name the old
address:

| File                              | What to change                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `CONTRIBUTING.md`                 | the `git clone` line under "Getting started"                                    |
| `docs/BRANCH_PROTECTION.md`       | the collaborators `gh api` line, the UI path, both `gh api` protection commands |
| `src/sandbox/DebugPageHeader.tsx` | `REPO_URL`, the source link in every debug page's nav                           |
| this file                         | the "Today" column becomes history; flip the status to ✅                       |

Re-check before committing — the list goes stale:

```bash
git grep -n "pedbad/lc-base-template"
```

`.github/CODEOWNERS` names `@pedbad`. That stays valid (the Owner has write access). To let
a second maintainer approve later, replace it with an organisation team such as
`@lc-elearn/maintainers`.

## Step 5 — Protect the template's `main`

**Already protected in the personal repo since 2026-10-21**
([`docs/BRANCH_PROTECTION.md`](BRANCH_PROTECTION.md)), so after the move this step is a
check: read the rule back with that file's `gh api …/protection` line, with the repo path
changed to `lc-elearn/lc-base-template`. If it did not come across, run the doc's
solo-maintainer command against the new path. Its warnings about single-maintainer
lockout still apply: moving into an organisation does not add a second reviewer.

**Done 2026-10-14.** **Before the first course repo exists**, make the content folders ownerless in the
template's `.github/CODEOWNERS`, so a content-only pull request needs no approval. Course
repos inherit the file, so it is changed once here and never per course (a per-course edit
would conflict on every sync). Add after the `*` default line:

```text
# Content: no owner, so content-only PRs merge on green CI
/lo-config/
/public/images/
/public/audio/
```

A pattern with no owner after it removes ownership for that path. Every other path keeps
`@pedbad` (or `@lc-elearn/maintainers`) as owner.

---

## Step 6 — Create a course repo (once per course)

On the template: **Fork** → owner **`lc-elearn`** → name **`lc-french`** (the course's
name, not `lc-base-template`) → create.

GitHub allows forking into the same organisation as the parent (since June 2022) and
forking one repo into an organisation more than once under unique names (since
February 2023). **Verify this on the first course.** If the fork page refuses a second fork
into `lc-elearn`, use the fallback below for that course.

Right after creating it, in the new course repo:

1. **Actions tab → enable workflows.** Forks start with Actions off; until this is done,
   CI never runs on the course.
2. **Settings → General:** untick "Template repository" if it was carried over — a course
   is not a template.
3. **Two branch rulesets on `main`**, each from **Settings → Rules → Rulesets → New
   ruleset → New branch ruleset**, enforcement **Active**, target **Include default
   branch**. GitHub applies every rule of every ruleset on a branch, so the two add up.
   - **Ruleset A, the template's rules** (TODO §E1). Bypass list **empty**, so they hold
     for everyone, the Owner included. Rules: **Restrict deletions**; **Require linear
     history**; **Require a pull request before merging**, required approvals **0**;
     **Require status checks to pass**, with **Require branches to be up to date before
     merging** and all five CI checks (`Lint, test, build` and four `Browser tests (…)`;
     the exact names are in [`BRANCH_PROTECTION.md`](BRANCH_PROTECTION.md)); **Block
     force pushes**.
   - **Ruleset B, code owners.** Bypass list: **Organization admin**, set to **For pull
     requests only**. One rule: **Require a pull request before merging**, required
     approvals **0**, with **Require review from Code Owners**.

   What that gives:
   - A **content-only** PR merges on green CI: the content folders have no code owner
     (step 5).
   - A colleague's PR **touching code** waits for the maintainer's review, as code owner.
   - The maintainer's **own** PR touching code, a template sync above all (step 9),
     could never get that review: GitHub does not count an author's approval, and the
     maintainer is the only code owner. Ruleset B's bypass lets an Owner merge it from
     the pull request ("Merge without waiting for requirements to be met"). Ruleset A
     still holds, so a red, missing or out-of-date check blocks the merge, and nobody
     pushes to `main` directly.

   **Verify on the first course** with three test PRs before any real work: one
   content-only (merges on green CI, no review); one from the colleague touching `src/`
   (waits for the maintainer); and one from the maintainer touching `src/`, as a sync
   would (the bypass box appears, and the merge still waits for every check to pass).
   If the bypass lets that third PR merge before its checks pass, remove the bypass, and
   let the colleague open each sync PR for the maintainer to review instead.

**Fallback — a linked copy instead of a fork** (only if a second fork into `lc-elearn`
is refused). Create an **empty** repo `lc-elearn/lc-french`
on GitHub, then:

```bash
git clone https://github.com/lc-elearn/lc-base-template.git lc-french
cd lc-french
git remote rename origin upstream
git remote add origin https://github.com/lc-elearn/lc-french.git
git push -u origin main
```

Same shared history as a fork, so template updates still merge cleanly. The only loss is
the "Sync fork" button: updates come in by command line (step 9). Then do the three
settings above (Actions are on by default in a repo that is not a fork).

## Step 7 — Invite the colleague

**Organisation → People → Invite member** by GitHub username (each colleague uses their own
personal account). Then, in the course repo: **Settings → Collaborators and teams → Add
people** → the colleague → **Write**.

For more than one person per course, create a team per course (`french`, `english`, …)
under **Organisation → Teams** and give the team Write on its repo instead.

## Step 8 — The colleague's setup

They clone the **course repo** (not the template), then `bun install`. That installs the
pre-commit and pre-push hooks automatically — nothing to configure. Send them
[`COURSE_GUIDE.md`](../COURSE_GUIDE.md), with the course repo's real address in place of
its placeholders: setup, what they may edit, and the daily loop (a branch per LO, a pull
request into the course repo's `main`, CI green before merge).

## Step 9 — Bringing template updates into a course

When the template changes, each course repo pulls it in:

- **Fork:** not the **Sync fork** button. It updates `main` directly, which step 6's
  ruleset A refuses for everyone. Add the template as `upstream` once
  (`git remote add upstream <template URL>`) and use the branch route below.
- **Linked copy:** `upstream` is set already (step 6).

Either way, `main` takes changes only through a pull request (step 6), so merge on a
branch, on a clone of the course repo:

```bash
git switch main && git pull && git switch -c sync-template
git fetch upstream && git merge upstream/main && bun install
git push -u origin sync-template
```

Then open a pull request into the course's `main` and merge it once CI is green. A sync
touches code, so the maintainer merges their own sync PR with ruleset B's bypass (step 6).
Then, on each clone: `git switch main && git pull && bun install`.

`bun install` is not optional — a template update can add a package, and the hooks and
tests fail without it.

A sync conflicts only where the course repo edited a file the template also changed. If
course repos keep to content and new files (the CONTRIBUTING rule), syncs stay clean.

---

## Cost

**None.** All repos are public, and on public repos the **Free** organisation plan includes
branch protection, required status checks and Actions. A paid plan would only matter if a
course ever had to be private — and a fork of a public repo cannot be made private, so that
course would use the linked-copy fallback in step 6.

## Undo

An Owner can transfer `lc-base-template` back to `pedbad` the same way (Settings → Transfer).
Course repos can stay in the organisation or be transferred individually. Re-run step 3 with
the old URL on each machine.

## Sources

- [Forking a repository](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) — forking into an organisation
- [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) — plan availability
- [GitHub changelog, 2023-02-16](https://github.blog/changelog/2023-02-16-more-love-for-innersource-collaboration-and-enterprise-fork-policies) — forking into an organisation more than once
