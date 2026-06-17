# LC Base Template — CONTINUE BUILD (fresh session)

**Paste the prompt below into a new Claude Code session** opened in
`/Users/ped/Sites/lc-base-template`. Starting fresh keeps context small + cost low.

---

## Status (as of Step 3)

Repo live + public: https://github.com/pedbad/lc-base-template (`main`).

| Step                                        | Done              | Commit    |
| ------------------------------------------- | ----------------- | --------- |
| 1 repo init + README (badges, prereqs)      | ✅ pushed         | `b090ae3` |
| 2 Vite + React + TS scaffold (dev verified) | ✅ pushed         | `7567d62` |
| 3 Bun test runner + smoke test              | ✅ (this session) | _next_    |

**Installed:** Bun 1.3.14 · React 19.2 · react-dom 19.2 · Vite 8 · TypeScript 6 ·
ESLint 10 · @types/bun. Lockfile `bun.lock` committed.

**Toolchain verified (for README):** Bun ≥1.3 (1.3.14) · Node ≥22.12 (22.19.0) ·
git 2.50.1 · gh 2.94.0 (authed: pedbad).

---

## The contract (read first)

- `docs/specs/2026-06-15-lc-base-template-design.md` — 24 locked decisions, 20 sections.
- `docs/process/LC_BASE_TEMPLATE_BUILD_HANDOVER.md` — full baby-step sequence + checklist.
- `docs/process/FUTURE_PROJECTS.md` — origin/carry-forward constraints.

---

## WORK STYLE — non-negotiable

- **Baby steps. ONE concern per step.** Never batch.
- **Explain WHAT + WHY (+ options) before every terminal command** — user is a beginner
  with Bun/Vite/React/Tailwind/shadcn. Tutorial tone.
- After each step: show exact commands + expected output, **wait for the user's "ok"**
  before the next step.
- **One commit per verified step** (Conventional Commits; **no `Co-Authored-By`** —
  attribution disabled). Commit AFTER verifying, not before.
- `cd /Users/ped/Sites/lc-base-template` at the start of EVERY new terminal tab
  (a fresh tab opens in `french/french-lo-1` — wrong repo).

---

## NEXT — Step 4: Prettier (+ format-on-save)

From the handover sequence:

- `bun add -d prettier` + `.prettierrc` + `.vscode/settings.json` (format-on-save).
- **Gotcha:** `.gitignore` ignores `.vscode/*` (except `extensions.json`). To ship
  `.vscode/settings.json` to clones, either `git add -f .vscode/settings.json` or
  un-ignore it in `.gitignore`. Decide at Step 4.
- Verify: `bun run format` produces no churn.

Then Steps 5+ per the checklist: ESLint+jsx-a11y → Stylelint → husky/lint-staged →
Tailwind v4 → shadcn+Lucide → tokens → Zod configs → content engine → guards → docs/CI.

---

## Open items (not blocking the build)

- **Memory write disabled:** claude-mem's `CLAUDE_CODE_OAUTH_TOKEN` in keychain expired
  (Jun 11). Reads work; new auto-memories won't write until refreshed (`claude setup-token`
  in a terminal where the `claude` CLI exists, then restart the worker).
- **Script Editor popups:** ECC plugin `desktop-notify` Stop hook uses osascript (notification
  owned by Script Editor) because not running under iTerm2. Quick fix: System Settings →
  Notifications → Script Editor → off. Durable fix: disable the ECC hook via `/ecc:configure-ecc`.

---

## Paste-in prompt for the fresh session

```
Continue building lc-base-template, baby-step style. Steps 1–3 are DONE and pushed
(repo init+README, Vite+React+TS scaffold, Bun test runner). Read the contract first:
  docs/specs/2026-06-15-lc-base-template-design.md  (24 decisions)
  docs/process/LC_BASE_TEMPLATE_BUILD_HANDOVER.md   (baby-step sequence + checklist)
  docs/process/CONTINUE_BUILD_HANDOVER.md           (status + work style + next step)

WORK STYLE (non-negotiable): one tiny concern per step; explain WHAT+WHY+options before
every command (I'm a beginner); wait for my "ok" before each next step; one commit per
verified step (Conventional Commits, NO Co-Authored-By). I run terminal commands in my
own terminal and paste output. Remind me to `cd /Users/ped/Sites/lc-base-template` in
every new tab.

Begin by proposing Step 4 (Prettier + format-on-save). Do not start until I say ok.
```
