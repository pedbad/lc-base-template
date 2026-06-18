# LC Base Template — CONTINUE BUILD (fresh session)

**Paste the prompt at the bottom into a new Claude Code session** opened on
`/Users/ped/Sites/lc-base-template`. Starting fresh keeps context small + cost low.

---

## Status (as of Step 8 — pushed)

Repo live + public: https://github.com/pedbad/lc-base-template (`main`).
Everything below is committed AND pushed (`HEAD == origin/main == a3b2ec0`, clean tree).

| Step                                             | Done | Commit              |
| ------------------------------------------------ | ---- | ------------------- |
| 1 repo init + README                             | ✅   | `b090ae3`           |
| 2 Vite + React + TS scaffold                     | ✅   | `7567d62`           |
| 3 Bun test runner + smoke test                   | ✅   | `c7d93fe`           |
| _docs: spec + handovers_                         | ✅   | `f7335ac`           |
| 4 Prettier (+ format-on-save, .gitattributes LF) | ✅   | `38ac7c2`           |
| 5 ESLint + jsx-a11y + eslint-config-prettier     | ✅   | `86e9afc`           |
| _docs: TOOLING.md + tick steps 1–5_              | ✅   | `dbb392b`           |
| 6 Stylelint + config-standard                    | ✅   | `266a570`           |
| 7 husky + lint-staged (pre-commit gate)          | ✅   | `fff566e`           |
| _docs: CONTRIBUTING.md stub (+ list fix)_        | ✅   | `89fad86` `799b77a` |
| 8 Tailwind CSS v4 + Vite plugin                  | ✅   | `a3b2ec0`           |

**Toolchain (all linting clean):** Bun 1.3.14 · React 19.2 · Vite 8 · TypeScript 6 ·
ESLint 10 + jsx-a11y 6.10 + eslint-config-prettier 10 · Prettier 3.8 ·
Stylelint 17 + config-standard 40 · **husky 9 + lint-staged 17** ·
**Tailwind CSS 4.3 + @tailwindcss/vite 4.3**. Lockfile `bun.lock` committed.

**Scripts available:** `dev` `build` `preview` `test` `lint` `format` `format:check`
`lint:css` (+ `prepare` runs husky on `bun install`).

**Pre-commit gate (Step 7):** `.husky/pre-commit` runs `bunx lint-staged` →
Prettier/ESLint on staged JS/TS, Prettier/Stylelint on CSS, Prettier on
JSON/MD/config. Unfixable lint error blocks the commit (verified). Config in
`lint-staged.config.mjs`. Tests stay in CI, not pre-commit.

**Tailwind (Step 8):** v4 CSS-first — `@import 'tailwindcss'` in `src/index.css`,
plugin in `vite.config.ts`. NO `tailwind.config.js` / `postcss.config.js` (intentional).
Stylelint adapted via at-rule allowlist + `import-notation:'string'` (Option A, no new
dep). Theme tokens (`@theme`) come at Step 10.

**Docs written so far:** `docs/specs/2026-06-15-lc-base-template-design.md` (contract),
`docs/process/LC_BASE_TEMPLATE_BUILD_HANDOVER.md` (baby-step sequence + checklist;
steps 1–8 ticked), `CONTRIBUTING.md` (root — new-dev stub, grows per step),
`docs/process/FUTURE_PROJECTS.md`,
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
- **Preview MCP binds to the PRIMARY root (french-lo-1), NOT lc-base-template.**
  `preview_start` launched french-lo-1's dev server (returned name `"french-lo-1"`),
  so screenshots are impossible from this session. Two ways round it: (1) verify
  headlessly — `bun run build` then grep `dist/assets/*.css` for the expected output
  (proved Tailwind utilities generate in Step 8); (2) for real visual work (Steps 9–11:
  shadcn/Lucide/theme), **open a session ROOTED on `/Users/ped/Sites/lc-base-template`**
  (Desktop: new chat → pick that folder) so preview targets the right repo. This is the
  3rd cwd-binding gotcha (git push, terminal cwd, preview) — all stem from french-lo-1
  being the session primary.
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

## NEXT — Step 9: shadcn + Lucide

Component layer on top of Tailwind v4 (installed Step 8). From the checklist:

- **shadcn/ui** — copy-in (not a dependency) accessible component primitives built on
  Tailwind + Radix. `bunx shadcn@latest init`, then add components as needed.
- **Lucide** — the icon set (`lucide-react`).
- Adapt as needed: shadcn init may want path aliases / `components.json`; confirm it
  fits the v4 CSS-first setup (no `tailwind.config.js`). Verify with a sample component.
- Tick checklist Step 9; add a shadcn/Lucide section to `docs/TOOLING.md`.

**Do Step 9 in a session ROOTED on `/Users/ped/Sites/lc-base-template`** — components are
visual; live preview/screenshots only work when lc-base-template is the session PRIMARY
(see ENVIRONMENT NOTES → preview gotcha).

Then per checklist: tokens (Step 10 — `@theme`) → `course.config.ts` (Zod) → content
engine → guards → docs/CI.

---

## Paste-in prompt for the fresh session

```
Continue building lc-base-template, baby-step style. Steps 1–8 are DONE and pushed
(repo+README, Vite+React+TS, Bun test runner, Prettier, ESLint+jsx-a11y, Stylelint,
husky+lint-staged pre-commit gate, Tailwind CSS v4 + Vite plugin).
Read the contract first:
  docs/specs/2026-06-15-lc-base-template-design.md      (24 decisions)
  docs/process/LC_BASE_TEMPLATE_BUILD_HANDOVER.md       (baby-step sequence + checklist)
  docs/process/CONTINUE_BUILD_HANDOVER.md               (status + work style + gotchas + next)
  docs/TOOLING.md                                       (tooling rationale — keep appending)

WORK STYLE (non-negotiable): one tiny concern per step; explain WHAT+WHY+options before
every command (I'm a beginner); wait for my "ok" before each step; one commit per verified
step (Conventional Commits, NO Co-Authored-By); document each tool in its config header +
docs/TOOLING.md.

ENVIRONMENT: I'm on Claude Desktop — YOU run the Bash commands. If this session is rooted
on lc-base-template, cwd + preview target the right repo. If NOT (rooted on french-lo-1),
cwd resets each turn — prefix every git/bun call with
`cd /Users/ped/Sites/lc-base-template &&` (or use `git -C`), and preview will mis-target.
The ECC config-protection hook may block edits to lint config files — if so, hand me the
file to paste.

Begin by proposing Step 9 (shadcn + Lucide). Do not start until I say ok.
```
