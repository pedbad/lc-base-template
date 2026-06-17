# LC Base Template — CONTINUE BUILD (fresh session)

**Paste the prompt at the bottom into a new Claude Code session** opened on
`/Users/ped/Sites/lc-base-template`. Starting fresh keeps context small + cost low.

---

## Status (as of Step 6 — pushed)

Repo live + public: https://github.com/pedbad/lc-base-template (`main`).
Everything below is committed AND pushed (`HEAD == origin/main`, clean tree).

| Step                                             | Done | Commit    |
| ------------------------------------------------ | ---- | --------- |
| 1 repo init + README                             | ✅   | `b090ae3` |
| 2 Vite + React + TS scaffold                     | ✅   | `7567d62` |
| 3 Bun test runner + smoke test                   | ✅   | `c7d93fe` |
| _docs: spec + handovers_                         | ✅   | `f7335ac` |
| 4 Prettier (+ format-on-save, .gitattributes LF) | ✅   | `38ac7c2` |
| 5 ESLint + jsx-a11y + eslint-config-prettier     | ✅   | `86e9afc` |
| _docs: TOOLING.md + tick steps 1–5_              | ✅   | `dbb392b` |
| 6 Stylelint + config-standard                    | ✅   | `266a570` |

**Toolchain (all linting clean):** Bun 1.3.14 · React 19.2 · Vite 8 · TypeScript 6 ·
ESLint 10 + jsx-a11y 6.10 + eslint-config-prettier 10 · Prettier 3.8 ·
Stylelint 17 + config-standard 40. Lockfile `bun.lock` committed.

**Scripts available:** `dev` `build` `preview` `test` `lint` `format` `format:check`
`lint:css`.

**Docs written so far:** `docs/specs/2026-06-15-lc-base-template-design.md` (contract),
`docs/process/LC_BASE_TEMPLATE_BUILD_HANDOVER.md` (baby-step sequence + checklist;
steps 1–5 ticked — TICK STEP 6 next session), `docs/process/FUTURE_PROJECTS.md`,
`docs/TOOLING.md` (living tooling-rationale log — append a section per new tool).

---

## The contract (read first)

- `docs/specs/2026-06-15-lc-base-template-design.md` — 24 locked decisions, 20 sections.
- `docs/process/LC_BASE_TEMPLATE_BUILD_HANDOVER.md` — full baby-step sequence + checklist.
- `docs/TOOLING.md` — why each tool was chosen / how it helps (keep appending).

---

## WORK STYLE — non-negotiable

- **Baby steps. ONE concern per step.** Never batch concerns.
- **Explain WHAT + WHY (+ options) before every command** — user is a beginner with
  Bun/Vite/React/Tailwind/shadcn. Tutorial tone. Wait for explicit "ok" before running.
- **One commit per verified step** (Conventional Commits; **no `Co-Authored-By`** —
  attribution disabled). Commit AFTER verifying. Push when the user says.
- **Document as you go:** config files get a commented header (see `prettier.config.mjs`,
  `eslint.config.js`, `stylelint.config.mjs`); add a `docs/TOOLING.md` section per tool.

---

## ENVIRONMENT NOTES (learned this session — important)

- **User is on Claude Desktop. THE ASSISTANT runs the terminal commands** (Bash tool),
  not the user. No copy-paste-into-terminal workflow. Show output, then commit.
- **cwd RESETS to `/Users/ped/Sites/french/french-lo-1` at the start of every turn**
  (the session's primary dir). It only persists _within_ a turn. ALWAYS prefix git/bun
  with `cd /Users/ped/Sites/lc-base-template &&` OR use
  `git -C /Users/ped/Sites/lc-base-template`. A push once silently no-op'd against
  french-lo-1 because of this — always verify the repo.
- **Config-protection hook:** the ECC `config-protection` PreToolUse hook BLOCKS the
  Edit/Write tools on certain config files. `eslint.config.js` WAS blocked (had to hand
  the file to the user to paste manually). `prettier.config.mjs` / `stylelint.config.mjs`
  / `package.json` / `.md` were NOT blocked. If blocked: give the user the full file to
  paste — do not bypass the guard.
- **Cost:** the global `~/.claude/CLAUDE.md` + ECC rules reload every turn (~tens of k
  tokens) — most of the session cost, independent of the work. Minimize turns: batch
  file writes; combine verify+commit+push into one Bash chain when a step is low-risk.

---

## Decisions parked for later

- **README badges (deferred to Step 28 README polish).** Agreed curated set:
  static tech-stack badges (Bun / Vite / TypeScript / React / Prettier / ESLint /
  Stylelint — real brand hex + simple-icons logos) + the truthful `code style: prettier`
  badge. DROP any static `linting: passing` badge (it lies — always green). Add a REAL
  GitHub Actions CI status badge at Step 31
  (`https://github.com/pedbad/lc-base-template/actions/workflows/ci.yml/badge.svg`) — it
  reflects live pass/fail.

---

## NEXT — Step 7: husky + lint-staged (pre-commit hook)

The "stick" that enforces everything added in Steps 4–6. From the handover sequence:

- `bun add -d husky lint-staged && bunx husky init`
- husky self-installs via the `prepare` script on `bun install` (zero-touch — spec §3).
- lint-staged config: run `prettier --write`, `eslint --fix`, `stylelint --fix` over
  **staged files only** (fast). Wire into `.husky/pre-commit`.
- **Verify:** stage a deliberately mis-formatted / lint-failing file → commit is BLOCKED
  locally; fix → commit passes. (Bypassable with `--no-verify`; CI is the real wall, later.)
- Tick checklist Step 6 AND Step 7; add a husky/lint-staged section to `docs/TOOLING.md`.

Then per checklist: Tailwind v4 (Step 8 — adapt Stylelint for `@theme` / `@utility` /
`@apply` at-rules) → shadcn + Lucide → tokens → Zod configs → content engine → guards →
docs/CI.

---

## Paste-in prompt for the fresh session

```
Continue building lc-base-template, baby-step style. Steps 1–6 are DONE and pushed
(repo+README, Vite+React+TS, Bun test runner, Prettier, ESLint+jsx-a11y, Stylelint).
Read the contract first:
  docs/specs/2026-06-15-lc-base-template-design.md      (24 decisions)
  docs/process/LC_BASE_TEMPLATE_BUILD_HANDOVER.md       (baby-step sequence + checklist)
  docs/process/CONTINUE_BUILD_HANDOVER.md               (status + work style + gotchas + next)
  docs/TOOLING.md                                       (tooling rationale — keep appending)

WORK STYLE (non-negotiable): one tiny concern per step; explain WHAT+WHY+options before
every command (I'm a beginner); wait for my "ok" before each step; one commit per verified
step (Conventional Commits, NO Co-Authored-By); document each tool in its config header +
docs/TOOLING.md.

ENVIRONMENT: I'm on Claude Desktop — YOU run the Bash commands, not me. cwd resets to
french/french-lo-1 each turn, so prefix every git/bun call with
`cd /Users/ped/Sites/lc-base-template &&` (or use `git -C`). The ECC config-protection
hook may block edits to lint config files — if so, hand me the file to paste.

Begin by proposing Step 7 (husky + lint-staged pre-commit hook). Do not start until I say ok.
```
