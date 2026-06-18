# LC Base Template — CONTINUE BUILD → Step 10 (fresh session)

**Open a NEW Claude Code session ROOTED on `/Users/ped/Sites/lc-base-template`**
(Desktop: new chat/Code session with **only** that folder attached, so it becomes the
**primary** root). Fresh session = smaller context = lower cost, AND live preview targets
the right repo for Step 10's swatch page. Paste the prompt at the bottom.

---

## Status (Steps 1–9 DONE + pushed)

Repo live + public: https://github.com/pedbad/lc-base-template (`main`).
`HEAD == origin/main == 50f4c46`, **clean tree**.

| Step                                             | Done | Commit    |
| ------------------------------------------------ | ---- | --------- |
| 1 repo init + README                             | ✅   | `b090ae3` |
| 2 Vite + React + TS                              | ✅   | `7567d62` |
| 3 Bun test runner                                | ✅   | `c7d93fe` |
| 4 Prettier (+ format-on-save, .gitattributes LF) | ✅   | `38ac7c2` |
| 5 ESLint + jsx-a11y + config-prettier            | ✅   | `86e9afc` |
| 6 Stylelint + config-standard                    | ✅   | `266a570` |
| 7 husky + lint-staged (pre-commit gate)          | ✅   | `fff566e` |
| 8 Tailwind CSS v4 + Vite plugin                  | ✅   | `a3b2ec0` |
| 9 shadcn/ui + Lucide (init)                      | ✅   | `f8d0d9b` |
| 9 shadcn full set (all 19 components)            | ✅   | `50f4c46` |

**Toolchain (all gates clean):** Bun 1.3.14 · React 19.2 · Vite 8 · TypeScript 6 ·
ESLint 10 + jsx-a11y 6.10 + eslint-config-prettier 10 · Prettier 3 · Stylelint 17 +
config-standard 40 · husky 9 + lint-staged 17 · Tailwind CSS 4.3 + @tailwindcss/vite ·
**shadcn/ui (Base UI primitives, `base-nova` preset) + lucide-react 1.21** ·
@fontsource-variable/geist · tw-animate-css · class-variance-authority · clsx · tailwind-merge.

**Scripts:** `dev build preview test lint format format:check lint:css` (+ `prepare`=husky).
**Per-step checks (run before each commit):** `bun run format` · `bun run lint` ·
`bun run lint:css` · `bun test` · `bun run build`.

**shadcn state (Step 9):**

- 19 components in `src/components/ui/`: accordion, alert, badge, button, card, dialog,
  input, label, navigation-menu, select, separator, sheet, sidebar, skeleton, switch,
  table, tabs, textarea, tooltip. (Full french-lo-1 set — template is a self-contained
  app + landing page, so app-shell pieces kept.) Add more: `bunx shadcn@latest add <name>`.
- `components.json` (style `base-nova`, iconLibrary `lucide`, `@/*` aliases), `src/lib/utils.ts`
  (`cn()`), `src/hooks/use-mobile.ts`.
- `@/*` alias = `paths` in `tsconfig.json` + `tsconfig.app.json` (**no `baseUrl`** — TS6
  deprecates it) + `resolve.alias` in `vite.config.ts`.
- ESLint: scoped `src/components/ui/**` override turns OFF `react-refresh/only-export-components`
  - `jsx-a11y/label-has-associated-control` (rest of a11y guard h stays ON).

---

## ⚠ Step 10 critical context — shadcn left placeholder tokens

`bunx shadcn init` (Step 9) **merged its token system into `src/index.css`**:

- raw neutral oklch vars in `:root` / `.dark` (`--background`, `--primary`, `--border`, …),
- an `@theme inline { --color-*: var(--*) }` block that maps those vars to Tailwind color
  utilities — **this is what every shadcn component is skinned by** (e.g. `bg-primary`),
- `@import` of `tw-animate-css`, `shadcn/tailwind.css`, `@fontsource-variable/geist`,
- our original placeholder vars (`--text`, `--bg`, `--accent`, …) from the Vite demo.

**Step 10 must reconcile, not bulldoze.** The Cambridge Slate semantic layer should **map
onto / replace the VALUES of** shadcn's `--background`/`--primary`/etc. so all 19 components
reskin automatically — keep the `@theme inline` mapping shadcn needs, swap the raw values to
Slate primitives. Decide font handling (spec default = Open Sans; shadcn pulled Geist —
Feijoa is commercial/git-ignored).

---

## NEXT — Step 10: token files (THEME)

From the checklist: **`palette.css` (primitives) + `tokens.css` (semantic), Cambridge Slate,
light + dark, fully `@layer`'d, zero `!important`, no raw hex/px in components.**

Spec constraints (do not drift): tokens are **primitive → semantic → component**; CSS fully
layered; render-mirror naming later. Verify with a **swatch/preview page** showing the tokens
(live screenshots now possible if session is rooted on lc-base-template). This sets up guard f
(token-integrity) and guard g (css-layer-discipline) at Steps 24–25.

Then per checklist: `course.config.ts` (Zod, 11) → `ui-strings.ts` (12) → LO schema +
example (13) → registry + first exercise (14) → static pre-render (15) → debug sandbox (16,
**includes the skinned component gallery — decided: gallery-only, auto-grows from
`src/components/ui/`**) → exercise showcase (17) → guards a–h → docs/CI.

---

## Contract (read first)

- `docs/specs/2026-06-15-lc-base-template-design.md` — 24 locked decisions, 20 sections.
- `docs/process/LC_BASE_TEMPLATE_BUILD_HANDOVER.md` — baby-step sequence + checklist
  (Steps 1–9 ticked).
- `docs/TOOLING.md` — tooling rationale (append a section per new tool).

---

## WORK STYLE — non-negotiable

- **Baby steps. ONE concern per step.** Never batch concerns.
- **Explain WHAT + WHY (+ options) before every command** — user is a beginner (Bun/Vite/
  React/Tailwind/shadcn). Tutorial tone. Wait for explicit "ok" before running.
- **One commit per verified step** (Conventional Commits; **NO `Co-Authored-By`** —
  attribution disabled). Commit AFTER verifying. Push when the user says.
- **Document as you go:** config files get a commented header; add a `docs/TOOLING.md`
  section per new tool/decision.

---

## ENVIRONMENT NOTES / gotchas (carry forward)

- **User is on Claude Desktop. THE ASSISTANT runs terminal commands** (Bash tool).
- **Confirm the repo every session.** Check the env header's "Primary working directory":
  - If `…/lc-base-template` → cwd + preview target the right repo. Good.
  - If `…/french/french-lo-1` (the old primary) → cwd RESETS to it each turn; prefix every
    git/bun with `cd /Users/ped/Sites/lc-base-template &&` (or `git -C`), and preview
    mis-targets → verify **headless** (`bun run build` + grep `dist/assets/*`).
- **config-protection hook BLOCKS Edit/Write on `eslint.config.js`** (confirmed twice). NOT
  blocked: `prettier.config.mjs`, `stylelint.config.mjs`, `package.json`, `.md`, source.
  If blocked → hand the user the full file to paste; do NOT bypass the guard.
- **shadcn CLI 4.11:** `init -t vite -b base -p nova -y`; `add` needs `--overwrite` or it
  hangs on the "overwrite button.tsx?" prompt (button is pulled as a transitive dep).
- **Cost:** global `~/.claude/CLAUDE.md` + ECC rules reload EVERY turn (~tens of k tokens) —
  dominant cost, independent of the work. Minimize turns; batch file writes; combine
  verify+commit(+push) into one Bash chain on low-risk steps.
- **Caveman mode** may be active (terse replies) — keep beginner explanations clear anyway.

---

## Paste-in prompt for the fresh (lc-base-template-rooted) session

```
Continue building lc-base-template, baby-step style. Steps 1–9 are DONE and pushed
(repo+README, Vite+React+TS, Bun test runner, Prettier, ESLint+jsx-a11y, Stylelint,
husky+lint-staged, Tailwind v4, shadcn/ui + Lucide — all 19 components). HEAD=50f4c46, clean.
Read first:
  docs/specs/2026-06-15-lc-base-template-design.md      (24 decisions)
  docs/process/LC_BASE_TEMPLATE_BUILD_HANDOVER.md       (sequence + checklist, 1–9 ticked)
  docs/process/STEP_10_HANDOVER.md                      (status + gotchas + Step 10 context)
  docs/TOOLING.md                                       (tooling rationale — keep appending)

WORK STYLE (non-negotiable): one tiny concern per step; explain WHAT+WHY+options before every
command (I'm a beginner); wait for my "ok" before each step; one commit per verified step
(Conventional Commits, NO Co-Authored-By); document each tool in its config header + TOOLING.md.

ENVIRONMENT: I'm on Claude Desktop — YOU run the Bash commands. Confirm the repo first: check
the env "Primary working directory". If it's lc-base-template, cwd + preview are correct
(live screenshots work). If it's french-lo-1, prefix git/bun with
`cd /Users/ped/Sites/lc-base-template &&` and verify headless. The config-protection hook
blocks edits to eslint.config.js — if blocked, hand me the file to paste.

STEP 10 = token files: palette.css (primitives) + tokens.css (semantic), Cambridge Slate,
light+dark, fully @layer'd, zero !important, no raw hex/px. CRITICAL: shadcn's init merged
placeholder oklch tokens + an `@theme inline` mapping into src/index.css that skins all 19
components — RECONCILE (swap values to Slate, keep the mapping), don't bulldoze. Verify with a
swatch page (screenshot it). Sets up guards f (token-integrity) + g (css-layers) later.

First confirm we're in the right project, then propose Step 10. Do not start until I say ok.
```
