# Team workflow & organisation — handover (2026-10-11 → 2026-10-12)

**What was decided about sharing this template with colleagues, what is already done, and
what comes next.** Written on the PowerBook at the end of 2026-10-12 so the work can resume
on the iMac. The step-by-step plan itself lives in
[`docs/ORGANIZATION.md`](../ORGANIZATION.md); this file is the context around it.

---

## 1. Done

| Commit      | What                                                                                                                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `8381a85`   | **pre-push hook** (`.husky/pre-push`): `bun run guards` then `bun run test` (~6s). Self-installs on `bun install`; blocks a push with a red test. Documented in CONTRIBUTING, `docs/TOOLING.md`, DESIGNER. |
| `ce9ccf9`   | **`docs/ORGANIZATION.md`** — the plan for moving to the `lc-elearn` organisation, one repo per course.                                                                                                     |
| this commit | `ORGANIZATION.md` updated with the code-only review decision and the `CODEOWNERS` change; this handover; README and TODO links.                                                                            |

Verified on the pushed commits: format, lint, lint:css, 1634 tests, build; the pre-push
hook ran on both pushes.

---

## 2. Decisions (with the reasoning that led to them)

1. **One repo per course, owned by an organisation.** Considered and rejected:
   - _Branches per language in the template_ — they would never merge back into `main`,
     and every template change would have to be copied into each.
   - _Pull requests of course content into the template_ — would put a language into the
     template every future course forks.
   - _"Use this template" button_ — no shared history, so template updates do not merge.
   - _Colleagues' personal forks_ — works, but the course belongs to the colleague's
     account and leaves with them.
2. **Organisation name `lc-elearn`, display name "LC e-Learning Team".** The maintainer
   keeps working as `pedbad`, as organisation Owner.
3. **The template moves by transfer, not copy** — one repo on GitHub before and after, so
   there is nothing to drift. Local clones need one `git remote set-url`.
4. **The move is deferred** until the remaining template work is finished.
5. **Everything is public.** Content is Creative Commons (LICENSE: code MIT, content
   CC BY-NC 4.0). Public means the Free organisation plan covers branch rules and CI.
6. **Colleagues do not deploy.** The maintainer builds and deploys from the course repo.
7. **Review covers code, not content.** Content-only PRs (`lo-config/`, `public/images/`,
   `public/audio/`) merge on green CI; anything else needs the maintainer's approval.
   Mechanism: content paths ownerless in `CODEOWNERS` + "require review from Code Owners"
   with 0 required approvals on each course repo.
8. **New engine features go to the template first** ("upstream first"), then reach every
   course on sync. A course repo keeps to content and new files so syncs stay clean.
9. **Hooks are the local check, CI is the enforced one.** GitHub cannot stop a
   `--no-verify` push, but branch rules stop anything red reaching `main`. Forks start with
   Actions **off**, which is why the pre-push hook was added.

---

## 3. Next, in order

1. **Coverage rule in CI** (agreed in principle 2026-10-12, not started). Plan:
   - Measure first, in a scratch clone, so `package.json`/`bun.lock` are untouched until a
     threshold is chosen. Provider: `@vitest/coverage-v8` (must match the installed Vitest).
   - **Per-file** thresholds, not a single global one — a new file with no tests scores 0%
     and fails, whereas a global average barely moves.
   - Set `coverage.include` to `src/**` so files no test imports are still counted (without
     it a brand-new untested file is invisible).
   - Stricter bar for logic (`src/exercises/**` grading, `src/config/`, `src/lib/`), softer
     for React views (the suite renders to static markup, so handlers inside views do not
     run). Exclude tests, fixtures, sandbox/debug pages and build scripts.
   - CI only (`--coverage` on the test step), not the pre-push hook — keep pushes fast.
   - Document in `docs/TOOLING.md` and CONTRIBUTING ("new code needs a test beside it").
2. **Contributor guide for course repos.** Superseded the earlier `docs/FORKING.md` idea:
   with the organisation model, colleagues clone a course repo rather than fork the
   template. Steps 7–9 of `ORGANIZATION.md` cover setup; what is missing is a short page
   for the colleague (daily loop, what they may edit, how a template update arrives).
3. **Claude knowledge in the repo** (idea, not started). `AGENTS.md` is already the
   always-on rules. Add task recipes as `.claude/skills/` (`add-lo`, `add-exercise-engine`,
   `sync-from-template`, `before-pr`) and a reviewer as `.claude/agents/lc-reviewer.md`.
   Inside the repo so every course repo inherits them and a sync updates them. Skills link
   to the docs; they never copy rules.
4. **Release → zip in CI** (preferred deploy route, not started). On a release, CI builds
   the course and attaches the zip; the maintainer downloads and uploads. Needs the deploy
   targets first.
5. **The move itself** — `docs/ORGANIZATION.md` steps 1–9, when the template is ready.

## 4. Still open

- Deploy targets for each course.
- Confirm CC BY-NC 4.0 is the intended content licence.
- Verify on the first course: a second fork into the same organisation is allowed, and
  "0 approvals + code owner review" behaves as described (`ORGANIZATION.md` step 6).

## 5. Outside the repo

- A personal brainstorm PDF (`~/Desktop/LC-team-workflow.pdf` on the PowerBook). It
  predates the organisation decision and describes personal forks; this file and
  `ORGANIZATION.md` supersede it.
- The stash `powerbook: pre-push hook + docs` was checked on 2026-10-12: everything in it
  is committed in `8381a85` or superseded, so it was dropped.

## 6. Resume prompt

> Read `docs/process/2026-10-12-team-workflow-handover.md` and `docs/ORGANIZATION.md`.
> Then start "Next, in order" item 1: measure test coverage in a scratch clone (do not
> touch `package.json` or `bun.lock` in the repo yet) and propose per-file thresholds.
