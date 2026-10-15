# GitHub Organisation — `lc-elearn` (planned move)

**The plan for moving this template into a GitHub organisation and giving each course its
own repo.** Follow it top to bottom on the day. Nothing here has been done yet.

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
| Local clones     | iMac + PowerBook                     | same folders, same history, one-line URL update |
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
- **Colleagues do not deploy.** They merge into their course repo's `main` through a
  pull request; the maintainer builds and deploys.
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

- [ ] **Deploy targets** for each course (CONTRIBUTING mentions two).
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

Once on every machine with a clone (iMac, PowerBook):

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

One commit (`docs: template moved to lc-elearn`). As of 2026-10-12 these name the old
address:

| File                        | What to change                                                                |
| --------------------------- | ----------------------------------------------------------------------------- |
| `CONTRIBUTING.md`           | the `git clone` line under "Getting started"                                  |
| `docs/BRANCH_PROTECTION.md` | the collaborators `gh api` line, the UI path, the `gh api` protection command |
| this file                   | the "Today" column becomes history; flip the status to ✅                     |

Re-check before committing — the list goes stale:

```bash
git grep -n "pedbad/lc-base-template"
```

`.github/CODEOWNERS` names `@pedbad`. That stays valid (the Owner has write access). To let
a second maintainer approve later, replace it with an organisation team such as
`@lc-elearn/maintainers`.

## Step 5 — Protect the template's `main`

Follow [`docs/BRANCH_PROTECTION.md`](BRANCH_PROTECTION.md). Its UI path changes to
`github.com/lc-elearn/lc-base-template → Settings → Branches`. Its warnings about
single-maintainer lockout still apply: moving into an organisation does not add a second
reviewer.

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
3. **Settings → Rules → New branch ruleset** on `main`: require a pull request,
   **required approvals 0**, **require review from Code Owners**, and the
   **`Lint, test, build`** status check. Content-only PRs then merge on green CI; any PR
   touching code waits for the maintainer (the code owner). With a colleague as the author
   and the maintainer as the reviewer, nobody is locked out. **Verify on the first course**
   with two test PRs (one content-only, one touching `src/`) that GitHub accepts
   "0 approvals + code owner review" and behaves as described.

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
pre-commit and pre-push hooks automatically — nothing to configure. From there the daily
workflow is in [`CONTRIBUTING.md`](../CONTRIBUTING.md): a branch per LO, a pull request into
the course repo's `main`, CI green before merge.

## Step 9 — Bringing template updates into a course

When the template changes, each course repo pulls it in:

- **Fork:** course repo page → **Sync fork** → **Update branch**. Then, on each clone:
  `git pull && bun install`.
- **Linked copy:** on a clone of the course repo:

  ```bash
  git fetch upstream && git merge upstream/main && bun install && git push
  ```

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
