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

- **Name:** `lc-elearn` (the URL), confirmed 2026-11-02. **Display name:** LC eLearning.
  **Base permission:** Read. Check the name is free at step 1; if taken, pick another and replace `lc-elearn`
  throughout this file.
- **Decided 2026-11-02** (the maintainer, after E44):
  - **Approvals: P1 with path 1.** Only the maintainer approves colleagues' core
    changes; the maintainer's own core PRs (template updates) are opened by the course's
    author and approved by the maintainer. Ruleset B's bypass list stays **empty**
    ([step 6](#who-approves-core-changes)).
  - **Ownership:** the maintainer owns the organisation personally; no institutional
    owner (decided 2026-11-02). **Two Owner accounts, both the maintainer's:** `pedbad`,
    used every day, and `pedbad-uol`, a **backup for recovery only**, so losing one
    account's credentials never locks the organisation (step 1). Each has its own
    two-factor setup and recovery codes, never the same phone alone, and each signs in
    with a **passkey on the Mac** (decided 2026-11-03; both have one: `pedbad-uol`'s was
    added 2026-11-04, synced through iCloud Keychain, and tested by signing out and back
    in with it). Neither is on any
    bypass list, and `pedbad-uol` is never used for everyday work. Revisit if the
    maintainer's role changes.
  - **Merge commits only** in course repos, for every pull request (step 6, item 4).
  - **Colleagues join as members**, base permission Read, with **one team per course**
    holding Write on that course's repo only, one person per team to start (step 7).
  - **Template updates when there is something to share**, no fixed rhythm: the
    maintainer announces one and each author opens the course's update PR (step 9).
  - **Deployments are recorded** in one pinned "Deployments" issue per course repo, a
    comment per release; never a password, key or sensitive server path
    ([`DEPLOY.md`](../DEPLOY.md), step 9).
  - **Course settings an author can edit** (`course.json`): done, E45 (PR 51).
- **One repo per course** (`lc-french`, `lc-spanish`, `lc-english`, `lc-portuguese`), never one branch per
  course in the template. Language branches would never merge back and would drift.
- **Course content never enters the template.** Only engine changes go to the template, by
  pull request. The rule for what counts as engine is in
  [`CONTRIBUTING.md` → "Adding content vs. changing the system"](../CONTRIBUTING.md).
- **Authors do not deploy.** They merge into their course repo's `main` through a pull
  request; the colleague who publishes courses builds and uploads them by
  [`DEPLOY.md`](../DEPLOY.md) (decided 2026-10-16; it was the maintainer).
- **Review covers code, not content** (decided 2026-10-12). A pull request that only
  changes a course's own lessons and their media (`lo-config/lo-NN-slug/`,
  `public/images/lo-NN-slug/`, `public/audio/lo-NN-slug/`) merges on green CI. A pull
  request that touches anything else, the template's example lesson and shared media
  included, waits for the maintainer's approval. Defined by path and purpose (E41, the
  table in [`COURSE_GUIDE.md` → "What you may edit"](../COURSE_GUIDE.md#what-you-may-edit));
  enforced by `CODEOWNERS` (step 5) plus the course repo's branch rules (step 6).
- **Colleagues get write access to their own course repo only.**
- **Everything is public** (decided 2026-10-12): the template and every course repo.
  Learning content is Creative Commons — the existing [`LICENSE`](../LICENSE) already
  makes code MIT and content CC BY-NC 4.0, and every course repo inherits it. Public
  means the **Free** organisation plan covers everything below: GitHub documents repository rulesets and code owners for public repositories on GitHub Free for organizations ([About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets),
  [About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)).
  The pilot verifies our configuration. Every course can be a
  true fork.

## Still to decide before starting

- [x] **Deploy targets.** None fixed in the repo: addresses change between servers, so
      the default build uses relative paths (`./`) and works from any folder; `BASE_URL`
      is set only for a fixed address ([`DEPLOY.md`](../DEPLOY.md), E24). Decided by the
      maintainer 2026-10-16.
- [x] **Content licence variant.** CC BY-NC 4.0 (no commercial reuse), as `LICENSE`
      says. Confirmed by the maintainer 2026-10-14.
- [x] **Who approves core changes**: P1 with path 1, ruleset B's bypass list empty
      ([step 6](#who-approves-core-changes)). Decided by the maintainer 2026-11-02.

---

## Step 1 — Create the organisation

Logged in as `pedbad`: **+** (top right) → **New organization** → **Free** → name
`lc-elearn`, display name **LC eLearning**, contact email, "belongs to: my personal
account".

`pedbad` becomes the organisation's **Owner** automatically.

**The first thing after creating it: invite the backup Owner, `pedbad-uol`.** Do it
before any other setting, so the organisation never runs on one key.

1. **Before the day**, on **each** of `pedbad` and `pedbad-uol`: two-factor on, recovery
   codes saved (a password manager or on paper), and a **passkey on the Mac** (decided
   2026-11-03), tested by signing out and back in with it, so one lost phone cannot lock
   both. A hardware security key on both accounts is an optional extra.
2. **Invite**, as `pedbad`: **People → Invite member** → `pedbad-uol` → role **Owner**.
   Or from the terminal, after granting `gh` the organisation permission once:

   ```bash
   gh auth refresh -h github.com -s admin:org
   gh api -X POST orgs/lc-elearn/invitations \
     -F invitee_id="$(gh api users/pedbad-uol --jq .id)" -f role=admin
   ```

   (`role=admin` is the Owner role.)

3. **Accept**, logged in as `pedbad-uol` (a private window): the email from GitHub, or
   github.com/lc-elearn.
4. **Read it back:** `gh api 'orgs/lc-elearn/members?role=admin' --jq '.[].login'`
   lists `pedbad` and `pedbad-uol`.

Then **Settings → Member privileges**:

| Setting             | Value    | Why                                                      |
| ------------------- | -------- | -------------------------------------------------------- |
| Base permissions    | **Read** | members can see every repo, but write only where granted |
| Repository creation | **off**  | only Owners create repos, so the layout stays as planned |

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

**Done 2026-10-14, narrowed by E41.** **Before the first course repo exists**, the
template's `.github/CODEOWNERS` leaves a course's own lessons and their media without an
owner, so a lesson-only pull request needs no approval. Course repos inherit the file, so
it is changed once here and never per course (a per-course edit would conflict on every
sync). After the `*` default line it has:

```text
# Lesson content: no owner, so a lesson-only PR merges on green CI
/lo-config/lo-*/
/public/images/lo-*/
/public/audio/lo-*/
/course.json
# Template files inside those folders: the maintainer (later lines win)
/lo-config/lo-00-example/          @pedbad
/public/images/lo-00-example/      @pedbad
/public/audio/lo-00-example/       @pedbad
```

followed by the shared media (`public/images/footer/` and the rest). A pattern with no
owner after it removes ownership for that path, and the last matching line wins.
`/course.json`, the course's own settings, has no owner either (E45). Every other path
keeps `@pedbad` (or `@lc-elearn/maintainers`) as owner, including anything
loose in the three content folders. Whole folders are never exempt: the full table is in
[`COURSE_GUIDE.md` → "What you may edit"](../COURSE_GUIDE.md#what-you-may-edit), and
`src/docs/codeowners.test.ts` holds the file to it.

---

## Step 6 — Create a course repo (once per course)

All four course repos (French, Spanish, English, Portuguese) can be created on the same
day (decided 2026-11-02): repeat this step for each, then step 7 for each team. **Read
back each repo's effective rules** (item 5 below): identical intended settings are not
evidence of identical configuration. Authors do not merge independently until the
required cases of "The rules pilot" have passed.

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
   - **Ruleset A, the template's rules less one** (TODO §E1, §E43). Bypass list **empty**,
     so they hold for everyone, the Owner included. Rules: **Restrict deletions**;
     **Require a pull request before merging**, required approvals **0**;
     **Require status checks to pass**, with **Require branches to be up to date before
     merging** and all five CI checks (`Lint, test, build` and four `Browser tests (…)`;
     the exact names are in [`BRANCH_PROTECTION.md`](BRANCH_PROTECTION.md)); **Block
     force pushes**. **Not** "Require linear history", which the template has: it forbids
     merge commits, and a course takes template updates as merge commits (step 9).
   - **Ruleset B, code owners.** One rule: **Require a pull request before merging**,
     required approvals **0**, with **Require review from Code Owners** and **Dismiss
     stale pull request approvals when new commits are pushed**. Bypass list **empty**
     (["Who approves core changes"](#who-approves-core-changes), decided 2026-11-02).

   What that gives:
   - A **lesson-only** PR merges on green CI: a course's own lesson folders have no code
     owner (step 5), so ruleset B has nothing to ask for.
   - A colleague's PR touching **anything else**, a mixed lesson-and-code PR included,
     waits for a code owner's approval. The code owner is `@pedbad`, so today that means
     the maintainer personally.
   - **An approval covers the changes that were reviewed, not later ones.** GitHub
     dismisses an approval when commits that affect the PR's diff are pushed, and when
     the base branch brought in (**Update branch**) adds new changes; the code-owner
     requirement is then unmet again until the owner re-approves. Without this setting
     a colleague could push another core change after the approval and merge on the old
     one. GitHub's documentation lists no exception for code-owner approvals; pilot case
     R11 shows it on a real course. A lesson-only push to a PR that also touches code
     dismisses the approval too: re-approving is the cost.
   - **Considered, not chosen:** "Require approval of the most recent reviewable push"
     (an approval from someone other than the last person to push). Stale dismissal
     already closes the gap, and with 0 required approvals its effect on lesson-only PRs
     is not documented. Revisit only if R11 fails.
   - The maintainer's **own** PR touching code (in practice a template update, step 9)
     cannot get that review: GitHub never counts an author's
     approval, and the maintainer is the only code owner. How such a PR is accepted:
     below.

4. **Settings → General → Pull Requests:** **Allow merge commits** on: every template
   update merges this way (step 9). **Allow squash merging** and **Allow rebase merging**
   off, for every pull request, so a template update can never be squashed or rebased
   by mistake (decided 2026-11-02).
   **Automatically delete head branches** on. None of this weakens step 3: pull
   requests, the five checks, code-owner review, and the bans on deletion and force
   pushes all stay.

   From the terminal (the REST names are `allow_merge_commit`, `allow_squash_merge`,
   `allow_rebase_merge`):

   ```bash
   gh repo edit lc-elearn/<course> --enable-merge-commit \
     --enable-squash-merge=false --enable-rebase-merge=false --delete-branch-on-merge
   ```

   No linear-history rule goes with this: GitHub requires squash or rebase merging to be
   allowed before linear history can be required, and a course needs neither.

5. **Read back every course repo** (each one, not only the first):

   ```bash
   gh api repos/lc-elearn/<course> --jq '{merge: .allow_merge_commit,
     squash: .allow_squash_merge, rebase: .allow_rebase_merge,
     delete_branch: .delete_branch_on_merge, template: .is_template}'
   gh api repos/lc-elearn/<course>/rulesets --jq '.[] | {id, name, enforcement}'
   gh api repos/lc-elearn/<course>/rules/branches/main --jq '.[] | {type, parameters}'
   ```

   Expected: merge `true`, squash and rebase `false`; rulesets A and B `active`; the
   effective rules on `main` include deletion, non_fast_forward, pull_request (with
   `require_code_owner_review` and `dismiss_stale_reviews_on_push` true) and
   required_status_checks with the five checks; no `required_linear_history`.

   **Verify with the [rules pilot](#the-rules-pilot-first-course)** once step 7 has
   invited an author, before authors merge independently. The course repo has to exist
   for it, so it runs after these settings, not before them. **Free plan:** GitHub documents repository rulesets and code owners for public repositories on GitHub Free for organizations
   (checked 2026-11-02). The read-back and the pilot verify our configuration, which
   availability does not. Private repositories are a different case: on GitHub Free
   they are not covered by that statement, so nothing here is assumed for one.

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

Same shared history as a fork, so template updates still merge cleanly (step 9); only
the "Sync fork" button is missing, and step 9 never uses it. Then do the three
settings above (Actions are on by default in a repo that is not a fork).

### Who approves core changes

Two policies, and the settings above enforce only one of them on their own:

- **P1: the maintainer personally approves every colleague's core change.**
  `CODEOWNERS` names only `@pedbad`.
- **P2: an authorised core owner approves.** `CODEOWNERS` names a team such as
  `@lc-elearn/maintainers`, with the maintainer and at least one other person.

The maintainer's own core PRs in a course (in practice, template updates) need someone
else's approval, or a bypass. The ways to accept one:

| Path                           | How                                                                                                                                                            | Keeps P1?                                                                            | Consequence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. A colleague prepares it** | The maintainer or an authorised colleague prepares the step 9 branch; the course's author opens the PR; the maintainer approves as code owner.                 | yes                                                                                  | No bypass and no second owner. Needs the course's author to open the PR for every update. Ruleset B's bypass list stays empty.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **2. Another code owner**      | A second person joins the owner team in `CODEOWNERS` (changed in the template, step 4) and reviews the maintainer's PRs.                                       | **no**: that person can then approve colleagues' core PRs too, which is P2           | Needs a second trusted person with write access who can review code. Does not on its own guarantee the maintainer's approval of anything.                                                                                                                                                                                                                                                                                                                                                                                                       |
| **3. A scoped bypass**         | Ruleset B's bypass list: **Organization admin**, **For pull requests only**. The maintainer merges their own PR with "Merge without waiting for requirements". | only by practice: GitHub would let an Owner merge a colleague's core PR the same way | The bypass belongs to the role, so every organisation Owner holds it (`pedbad` and the backup `pedbad-uol`, and any Owner added later). It covers ruleset B's one rule only. Ruleset A keeps an empty bypass list; GitHub applies every ruleset on a branch, but its documentation does not state that bypassing one leaves another's checks enforced. Not the selected policy: if it were ever considered, it would need its own separate test, outside R12 and the required pilot. Bypasses are listed under **Settings → Rules → Insights**. |

What the settings cannot do: enforce P1 for colleagues while letting the maintainer
merge their own core PRs alone. Path 3 gives the maintainer the same power over
colleagues' PRs, so P1 then rests on practice, not on GitHub. Path 1 enforces P1 but
depends on the author opening each update PR. **Decided 2026-11-02: P1 with path 1**, bypass
list empty. In practice the author's part is small: the maintainer announces a template
update, and the author opens the update PR on GitHub's website (step 9), which the
maintainer reviews and approves.

Never treat `gh pr merge --admin`, or a bypass, as a routine way to merge: it merges a
PR that "does not meet requirements". The template itself is unaffected: its protection
requires 0 approvals and no code-owner review
([`BRANCH_PROTECTION.md`](BRANCH_PROTECTION.md)), so its sole author can merge on green.

## Step 7 — Invite the colleagues, one team per course

Decided 2026-11-02: colleagues join as organisation **members** (never Owners), and each
course has its own **team** with **Write** on that course's repo only. Every team starts
with one person; later a second author, or a colleague helping on another course, joins
that course's team and leaves it when done. The maintainer needs no team: an Owner
already reaches every repo. Who is in which team is kept outside this public repo.

**Before the day:** each colleague has a GitHub account under their own name, with their
**University of Cambridge email** added and verified (Settings → Emails), and sends the
maintainer their GitHub username.

All the courses can be set up on one day (step 6 for each repo first). Then, for each
course:

| Course repo     | Team         | Members to start      |
| --------------- | ------------ | --------------------- |
| `lc-french`     | `french`     | none yet (see below)  |
| `lc-spanish`    | `spanish`    | the Spanish author    |
| `lc-english`    | `english`    | the English author    |
| `lc-portuguese` | `portuguese` | the Portuguese author |

Every course belongs to the **Language Centre, University of Cambridge**, the copyright
holder in [`LICENSE`](../LICENSE) and every course's footer, whoever writes it. Where no
author is named yet, the course is simply the Language Centre's: create its team with no
members, and add people when they are known. Courses will often have several authors.

**On the website**, logged in as `pedbad`:

1. **Create the team:** lc-elearn → **Teams → New team** → name `spanish`, visibility
   **Visible** → **Create team**. GitHub may add you as the team's maintainer: harmless,
   or remove yourself under the team's **Members**.
2. **Give it its course, and only that:** the team → **Repositories → Add repository** →
   `lc-spanish` → role **Write**.
3. **Invite the colleague into the team:** lc-elearn → **People → Invite member** →
   their GitHub username (or their Cambridge email) → role **Member** → under teams,
   tick `spanish` → **Send invitation**.
4. **They accept** the invitation from GitHub's email, then follow step 8.

**Or from the terminal** (after `gh auth refresh -h github.com -s admin:org` once):

```bash
gh api -X POST orgs/lc-elearn/teams -f name=spanish -f privacy=closed
gh api -X PUT orgs/lc-elearn/teams/spanish/repos/lc-elearn/lc-spanish -f permission=push
gh api -X POST orgs/lc-elearn/invitations -f role=direct_member \
  -F invitee_id="$(gh api users/<their-username> --jq .id)" \
  -F "team_ids[]=$(gh api orgs/lc-elearn/teams/spanish --jq .id)"
```

(`push` is GitHub's name for Write; `direct_member` for Member.)

**Read it back**, once they have accepted:

```bash
gh api orgs/lc-elearn/teams/spanish/members --jq '.[].login'
gh api repos/lc-elearn/lc-spanish/teams --jq '.[] | {name, permission}'
gh api orgs/lc-elearn/invitations --jq '.[] | {login, email, role}'   # still pending
```

The team lists the colleague; the repo lists `spanish` with `push`, and no other team.
**Later:** a second author → step 3 with the same team; a colleague helping on another
course → add them to that course's team as well (**Teams → that team → Members → Add a
member**), and remove them when done.

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

**When:** whenever the template has something to share (decided 2026-11-02): the
maintainer merges it in the template, then tells the authors ("a new exercise is in,
please update your course").

**The procedure: an update branch inside the course repo.** Not a pull request from the
template's `main` straight into the course's `main`: the course's rules require the
branch to be up to date with the course's `main`, and bringing it up to date would
mean writing course changes into the template's `main`. Course-specific changes never
go into the template. Nor the **Sync fork** button, which writes to `main` directly.

1. **Prepare** (the maintainer, or an authorised colleague with Write on the course):
   update the local `main` from the course repo, create an update branch, fetch the
   template, merge the tested template commit with a merge commit, resolve any
   conflict deliberately, install, and run the full checks on content and behaviour.
   Then push the branch to the **course** repo. The commands are below.
2. **Open the pull request** from that branch into the same course repo's `main`: GitHub
   offers **Compare & pull request** on the course repo's page once the branch is
   pushed. **The course's author opens it** (path 1), even when the maintainer
   prepared the branch: a pull request the maintainer opens could never get a code
   owner's approval.
3. **Accept:** the five checks pass, the maintainer approves as code owner, and the
   author merges with **Create a merge commit**.

**Review of a branch the maintainer prepared (decided 2026-11-02):** the maintainer's own
approval is enough. It reviews the maintainer's own merge work, which nobody else reads;
GitHub accepts it because the maintainer is not the pull request's author. Revisit if a
second code owner joins (P2).
**Not proven on a real course:** pilot case R13 tests this procedure before it is
recommended for use.

**The commands**, on a clone of the course repo.
`main` takes changes only through a pull request (step 6), so the merge happens on a
branch. **Who prepares the branch:** the maintainer, or a
colleague with write access on that course; **who opens the pull request:** the
course's author (path 1 under "Who approves core changes"). Start from a clean working tree: a merge started over
uncommitted edits can stop half-way, and those edits are hard to separate from it.

```bash
git status                      # "nothing to commit": otherwise commit or stash first
git switch main && git pull --ff-only && git switch -c sync-template
git fetch upstream
git log --oneline -5 upstream/main  # find the tested template commit the maintainer named
git merge --no-ff <template commit> # a merge commit: keeps the template's ancestry
bun install
bun run format && bun run lint && bun run lint:css && bun run test:coverage && bun run build && bun run test:e2e
git push -u origin sync-template
```

Then the course's author opens the pull request into the course's `main`, the maintainer
approves, and the author merges it once CI is green, with **Create a merge commit**: never **Squash and merge** or **Rebase and merge**. A merge
commit keeps the template's commits in the course's history, so the next update brings
only what is new. Squashed or rebased, the course holds copies and loses the record of
which template commits it has, so a later update **can** conflict on lines the course
never touched. It does not happen every time, but it did in a local test (TODO §E43),
and it can recur with each update until repaired (below). If the course's `main` moved
while the pull request was open, bring it in by merging (`git merge origin/main`, or
**Update branch** with a merge), never by rebasing the sync branch. To check afterwards:
`git merge-base --is-ancestor <template commit> origin/main` prints nothing and exits 0.

A sync touches code, so it needs a code owner's approval, by the path chosen under "Who
approves core changes": path 1, so the maintainer reviews and approves the author's PR.
Merging it does not publish anything: the
course goes live only when it is next built and uploaded ([`DEPLOY.md`](../DEPLOY.md)).

Then every clone updates `main`:

```bash
git switch main && git pull --ff-only && bun install
```

and, separately, each branch still open (a lesson in progress), so its pull request is
tested against the updated course:

```bash
git status                      # commit the lesson's work first
git switch lo-03-food && git merge main
git push
```

`bun install` is not optional — a template update can add a package, and the hooks and
tests fail without it. Pushing a branch keeps what is **committed** on it; it does not
save edits that were never committed, so commit (or `git stash`) before switching.

A sync conflicts only where the course repo edited a file the template also changed. If
course repos keep to content and new files (the CONTRIBUTING rule), syncs stay clean.
When one does conflict, look at both changes before choosing; the
[`sync-from-template`](../.claude/skills/sync-from-template/SKILL.md) skill says how.
`git merge --abort` stops a merge that has gone wrong and tries to put the branch back
as it was before the merge began. It discards any conflict resolutions made so far, and
it can restore the earlier state reliably only if the working tree was clean when the
merge started, which is why the steps above begin with `git status`.

The template itself keeps rebase-merge and linear history
([`BRANCH_PROTECTION.md`](BRANCH_PROTECTION.md)): nothing is merged into it from
elsewhere. **If a course's template update was ever squashed or rebased**, do not rewrite
the course's history: on a new branch, merge the same template commit again with
`git merge --no-ff <template commit>`, read what it changes (little or nothing), resolve
any conflict by reading both sides as above, and merge that pull request with a merge
commit. Never repair with `git merge -s ours`, which records the template's changes as
taken without taking them.

## The rules pilot (first course)

Run once, on the first course repo, after step 6 has set its rules and step 7 has
invited a colleague, and before real lessons. Each case is a throwaway branch and pull
request; close the PR unmerged unless the case says to merge. **A** is the colleague's
own account (Write on the course; never the maintainer's account, whose Owner role
changes the result), **M** is `pedbad` (Owner), **P** is whoever publishes. Record each
case's evidence (the PR's address, a screenshot of its merge box, the terminal output)
in TODO.md under E2, and mark it **passed** only when the expected result was seen.
Until then every case is **pending rollout**: no course repo exists yet.

| #   | Case                               | Who        | Change                                                             | Expected                                                                                                                                                                                                                                     | Evidence                                                               | Status          |
| --- | ---------------------------------- | ---------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------- |
| R1  | Lesson JSON                        | A          | `lo-config/lo-01-test/` (a copy of the example)                    | five checks run; no review requested; A merges once green                                                                                                                                                                                    | PR, merge box before merging, merged commit                            | pending rollout |
| R2  | Lesson images and audio            | A          | `public/images/lo-01-test/`, `public/audio/lo-01-test/`            | as R1                                                                                                                                                                                                                                        | as R1                                                                  | pending rollout |
| R3  | The example lesson                 | A          | one line in `lo-config/lo-00-example/`                             | review requested from `@pedbad`; merge blocked: code owner review required                                                                                                                                                                   | reviewers list, merge box                                              | pending rollout |
| R4  | Shared logos and template media    | A          | a file in `public/images/footer/` or `public/audio/showcase-demo/` | as R3                                                                                                                                                                                                                                        | as R3                                                                  | pending rollout |
| R5  | Core code and dependencies         | A          | a comment in `src/`; separately, `package.json`                    | as R3; after M approves, A merges once green                                                                                                                                                                                                 | as R3, then the approval and merge                                     | pending rollout |
| R6  | Workflows and `CODEOWNERS`         | A          | `.github/workflows/ci.yml`; separately, `.github/CODEOWNERS`       | as R3, judged by `main`'s `CODEOWNERS`, not the PR's edited copy                                                                                                                                                                             | as R3                                                                  | pending rollout |
| R7  | Loose files outside lesson folders | A          | `public/images/card.webp`, `lo-config/notes.md`                    | as R3                                                                                                                                                                                                                                        | as R3                                                                  | pending rollout |
| R8  | Mixed content and core             | A          | R1's lesson plus a comment in `src/`                               | the whole PR waits for the code owner                                                                                                                                                                                                        | as R3                                                                  | pending rollout |
| R9  | Failed required check              | A, then M  | a lesson with a blank's `*` removed                                | `Lint, test, build` fails; merge blocked for A and for M alike (ruleset A has no bypass)                                                                                                                                                     | failed check, both merge boxes                                         | pending rollout |
| R10 | Direct push to `main`              | A, then M  | `git push origin HEAD:main` with a trivial commit                  | refused for both: changes must go through a pull request                                                                                                                                                                                     | terminal output                                                        | pending rollout |
| R11 | Core change after approval         | A, M       | A opens a core PR, M approves, A pushes another core commit        | M's approval is dismissed; merge blocked until M approves again                                                                                                                                                                              | PR timeline showing the dismissal, merge box                           | pending rollout |
| R12 | M's own core PR                    | M; A and M | a comment in `src/`, or a template update (R13)                    | the selected policy (path 1, empty bypass lists): a PR **M opens** that touches core stays blocked, with no way to approve it; the same change on a branch M pushed, in a PR **A opens**, takes M's approval and merges once the checks pass | M's blocked merge box; A's PR with M's approval and the merge          | pending rollout |
| R13 | Template update                    | M or A     | step 9's procedure: branch prepared, A opens the PR                | lesson files unchanged; only **Create a merge commit** offered; afterwards `git merge-base --is-ancestor <template commit> origin/main` exits 0                                                                                              | `git diff` of the lesson folders, the merge button, the command output | pending rollout |
| R14 | An open branch after an update     | A          | a lesson branch opened before R13; step 9's branch update          | `git merge main` succeeds; its PR's checks rerun green                                                                                                                                                                                       | terminal output, the PR's checks                                       | pending rollout |
| R15 | Merging does not publish           | A, P       | R1's merge                                                         | the live site is unchanged until P deploys                                                                                                                                                                                                   | the live page before and after                                         | pending rollout |
| R16 | Publishing the intended commit     | P          | [`DEPLOY.md`](../DEPLOY.md) in a team test folder                  | that exact commit's CI is green; it builds with `--frozen-lockfile`; P records repo, full commit, result, rollback copy                                                                                                                      | the record line, the live checks                                       | pending rollout |

**Before authors merge independently**, on one course with a named author: R1 to R12 must
pass (every content and core boundary, failed checks, direct pushes, renewed approval,
and the maintainer's own core PR). **R13 must pass before step 9 is recommended**, and
**R16 before the first real deployment**; R14 and R15 follow the first time each comes
up. The courses share one intended setup, so step 6's read-back on **every** course
shows each is configured the same; a case is passed only on evidence, and the others
stay pending. How long this takes is an estimate (an afternoon), not measured.

If R9, R10 or R11 fails, stop: the rules do not protect `main` as step 6 claims. If R12's
M-opened PR can merge, the bypass lists are not empty: stop and fix them. A bypass (path 3)
is not part of the selected policy; if it is ever considered, test it separately, never
inside the normal procedure. The
French content pilot ([`process/FRENCH_PILOT_CHECKLIST.md`](process/FRENCH_PILOT_CHECKLIST.md))
runs after this one.

## What is proved, and how

| Layer                                | State on 2026-11-02, template `main` at `2a52ae2`                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Repository files** (implemented)   | `CODEOWNERS` (E41, and `course.json` ownerless since E45), the CI workflow, these docs. `src/docs/codeowners.test.ts` proves the file matches the path policy; GitHub's `CODEOWNERS` errors API reports none. Neither proves GitHub **enforces** a merge rule: that needs the settings below and the pilot.                                                                                                                                          |
| **GitHub settings, inspected**       | the template only, read with `gh api`: classic protection on `main` (pull request, 0 approvals, the five checks up to date, admins included, linear history, no force push or deletion; no code-owner review or stale dismissal, not needed solo); merge commit, squash and rebase all allowed; no environments, deployments, Pages site or webhooks. GitHub Apps installed on the account were not listed (the API needs an app token): unverified. |
| **GitHub settings, proposed**        | step 6's rulesets A and B and merge settings for each course repo. Nothing is set: no course repo exists.                                                                                                                                                                                                                                                                                                                                            |
| **Behaviour shown by pull requests** | on the template, a direct push to `main` was refused (2026-10-21, `BRANCH_PROTECTION.md`). On a course: nothing yet; every rules-pilot case is pending rollout.                                                                                                                                                                                                                                                                                      |

---

## If `pedbad` cannot be used

Two different things, kept apart. **Untested:** nothing here has been tried.

**Account recovery** is GitHub's process for `pedbad` itself: its recovery codes, a
second two-factor method, or GitHub's account recovery request. It restores the
account; nothing in the organisation needs changing.

**Organisation recovery**, while `pedbad` is unavailable, works through `pedbad-uol`,
the backup Owner (step 1):

| Action                                          | Who can do it                                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| invite, remove, add to teams; change settings   | `pedbad-uol`, as Owner                                                                                  |
| a lesson-only PR                                | its author, on green CI: no code owner is needed                                                        |
| a core PR (template update, `src/`, `.github/`) | **nobody**: `CODEOWNERS` names `@pedbad`, and being an Owner does not satisfy a named code-owner review |
| change `CODEOWNERS` itself                      | **nobody** by pull request, for the same reason: it is under `.github/`                                 |

So core work **waits** for account recovery: that is the expected path. If it cannot
wait, the only way is a **deliberate administrative change** by `pedbad-uol` on the one
course repo affected: set ruleset B to **Disabled** (or add `pedbad-uol` to its bypass
list) for that one pull request, merge it after reading it, and restore ruleset B at
once. While it is changed, that repo's core PRs need no code-owner approval at all, so
keep it to minutes, and record what was done, when and why in TODO.md. Ruleset A
(checks, no direct pushes) is never touched. GitHub's documentation does not say in so
many words that an Owner can edit a repo's rulesets; it is expected, since an Owner is
an admin of every repo, but unverified. This is a recovery exception, never a routine.

**Not proposed:** naming `pedbad-uol` in `CODEOWNERS`. It would let the maintainer's
second account approve the maintainer's own pull requests, which is self-approval in
effect, and approve colleagues' core PRs from either account. If a second code owner is
ever added, it is a person other than the maintainer, and the policy becomes P2 (step 6,
"Who approves core changes"), decided on purpose.

## Cost

**None expected.** All repos are public, and GitHub documents repository rulesets and code owners for public repositories on GitHub Free for organizations (step 6). The pilot verifies our
configuration. Nothing here is assumed for private repositories. A paid plan would only matter if a
course ever had to be private — and a fork of a public repo cannot be made private, so that
course would use the linked-copy fallback in step 6.

## Undo

An Owner can transfer `lc-base-template` back to `pedbad` the same way (Settings → Transfer).
Course repos can stay in the organisation or be transferred individually. Re-run step 3 with
the old URL on each machine.

## Sources

- [Forking a repository](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) — forking into an organisation
- [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) — plan availability
- [Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) — stale approvals, the most recent push, code-owner review
- [About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets) — every ruleset on a branch applies; bypass lists
- [Managing rulesets for a repository](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository) — Rule insights, where bypasses are listed
- [About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) — write access, the base branch's file, the last match wins
- [Approving a pull request with required reviews](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/approving-a-pull-request-with-required-reviews) — authors cannot approve their own pull requests
- [`gh pr merge`](https://cli.github.com/manual/gh_pr_merge) — `--admin`
- [GitHub's plans](https://docs.github.com/en/get-started/learning-about-github/githubs-plans) — the Free plan's public repositories
- [GitHub changelog, 2023-02-16](https://github.blog/changelog/2023-02-16-more-love-for-innersource-collaboration-and-enterprise-fork-policies) — forking into an organisation more than once
