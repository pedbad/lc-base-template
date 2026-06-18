# LC Base Template — CONTINUE BUILD → Typography (next session)

**Open a NEW Claude Code session ROOTED on `/Users/ped/Sites/lc-base-template`**
(Desktop: new Code session with **only** that folder attached, so it's the **primary**
root — cwd + live preview target the right repo, and context stays small = lower cost).
Paste the prompt at the bottom.

> **Numbering:** this is the **typography** step, tracked as checklist item **10b**
> (split out of Step 10). The locked checklist reserves **11 = `course.config.ts`**, so
> typography slots in as 10b — no renumbering of the rest.

---

## Status (Steps 1–10 DONE + pushed)

Repo live + public: https://github.com/pedbad/lc-base-template (`main`).
`HEAD == origin/main`, **clean tree**.

| Step                                  | Done | Commit    |
| ------------------------------------- | ---- | --------- |
| 1 repo init + README                  | ✅   | `b090ae3` |
| 2 Vite + React + TS                   | ✅   | `7567d62` |
| 3 Bun test runner                     | ✅   | `c7d93fe` |
| 4 Prettier (+ format-on-save, LF)     | ✅   | `38ac7c2` |
| 5 ESLint + jsx-a11y + config-prettier | ✅   | `86e9afc` |
| 6 Stylelint + config-standard         | ✅   | `266a570` |
| 7 husky + lint-staged                 | ✅   | `fff566e` |
| 8 Tailwind CSS v4 + Vite plugin       | ✅   | `a3b2ec0` |
| 9 shadcn/ui + Lucide (init)           | ✅   | `f8d0d9b` |
| 9 shadcn full set (19 components)     | ✅   | `50f4c46` |
| 10 Cambridge Slate token system       | ✅   | `112db69` |
| 10 switchable presets + theming guide | ✅   | `deff97b` |

(+ a docs-hygiene commit retiring stale handovers — see `git log`.)

**Toolchain (all gates clean):** Bun 1.3.14 · React 19.2 · Vite 8 · TS 6 · ESLint 10 +
jsx-a11y · Prettier 3 · Stylelint 17 + config-standard · husky + lint-staged ·
Tailwind v4 + @tailwindcss/vite · shadcn/ui (Base UI, `base-nova`) + lucide-react ·
**Cambridge Slate token system** · @fontsource-variable/geist (← removed in this step) ·
tw-animate-css · cva · clsx · tailwind-merge.

**Per-step checks (before each commit):** `bun run format` · `bun run lint` ·
`bun run lint:css` · `bun test` · `bun run build`.

---

## What Step 10 delivered (theme — DONE)

3-layer token chain, official Cambridge brand only (no french-lo-1 teal):

- `src/styles/palette.css` — Layer-1 primitives (Cambridge Slate greyscale + Cambridge
  Blue family + secondary accents). The ONLY place raw hex lives.
- `src/styles/tokens.css` — Layer-2 semantic roles, light + dark. **Active = preset B.**
- `src/styles/tokens-variant-{a,b,c}-*.css` — 3 switchable primary presets
  (A Cambridge Blue · B Dark Blue [default] · C Warm Blue). Switch by
  `cp src/styles/tokens-variant-X.css src/styles/tokens.css`.
- `src/index.css` — kept shadcn's `@theme inline` bridge (skins all 19 components),
  imports the two token layers, stripped the Vite-demo cruft.
- `src/styles/README.md` — reskin + preset-switch guide.

All `@layer base`, zero `!important`, no raw hex in components → sets up guards f + g.

---

## ⚠ Typography critical context (read before starting)

shadcn's `init` (Step 9) pulled **Geist**, NOT the Cambridge default. Current state:

- `src/index.css` line ~8: `@import '@fontsource-variable/geist';`
- `src/index.css` `@theme inline`: `--font-sans: 'Geist Variable', sans-serif;` and
  `--font-heading: var(--font-sans);` — **this skins all component/body text.**
- `package.json` dep: `@fontsource-variable/geist`.

**Official Cambridge typography (cam.ac.uk/brand-resources/guidelines/typography):**

- **Feijoa Medium** = display / headings / titles. **Commercial (Klim) → NEVER committed**
  (spec §12, decision #18). Git-ignored; dropped into `public/fonts/feijoa/` per Cambridge
  deploy only.
- **Open Sans** = body / subheadings. **Free (Apache-2.0, Google Fonts)** = the public
  default. Weights: Regular, SemiBold, Bold (Feijoa: Medium, Medium Italic, Bold).
- Min digital size **16px**, leading **140%**. Fallback when Cambridge fonts unavailable: Arial.
- Cascade: `"Feijoa", "Open Sans", sans-serif` → fresh public clones render Open Sans
  automatically; real Feijoa drops in per deploy.

---

## NEXT — Typography (checklist 10b)

Keep it one concern. Proposed shape (confirm before running):

1. **Install Open Sans, remove Geist.** `bun add @fontsource-variable/open-sans` (variable
   weight) — or `@fontsource/open-sans` (static weights) if variable is fussy. Then
   `bun remove @fontsource-variable/geist` and delete its `@import` from `index.css`.
2. **Font tokens in `palette.css`** (font primitives belong in Layer 1, shared across
   presets — NOT per-preset): `--font-display: "Feijoa", "Open Sans", sans-serif;`
   `--font-body: "Open Sans", sans-serif;`
3. **Feijoa `@font-face`** referencing `public/fonts/feijoa/` (woff2/otf), `font-display: swap`.
   Add `public/fonts/feijoa/` to `.gitignore` (commercial — never push). Open Sans is the
   automatic fallback when the files are absent.
4. **Wire into `@theme inline`** (`index.css`): `--font-sans: var(--font-body)`,
   `--font-heading: var(--font-display)` — replacing `'Geist Variable'`. **Keep the
   `@theme inline` structure intact** (it skins all 19 components).
5. **Verify:** `bun run build` (fonts bundle), a type-ramp sample (h1→body, both fonts),
   16px min / 140% leading. Confirm Open Sans renders (Feijoa falls back since not present).
6. **Document:** `docs/TOOLING.md` typography section; update `src/styles/README.md`
   "Fonts" section; note the `.gitignore` Feijoa rule.

Spec refs: §7.2 (fonts), §12 (Feijoa licensing / git-ignore), decision #18.

**Then per checklist:** 11 `course.config.ts` (Zod) → 12 `ui-strings.ts` → 13 LO schema +
example → 14 registry + first exercise → 15 static pre-render → 16 debug sandbox
(includes the skinned component gallery + full font ramp) → 17 exercise showcase →
guards a–h → docs/CI.

---

## Contract (read first)

- `docs/specs/2026-06-15-lc-base-template-design.md` — 24 locked decisions, 20 sections.
- `docs/process/LC_BASE_TEMPLATE_BUILD_HANDOVER.md` — baby-step sequence + checklist
  (1–10 ticked, 10b = this step).
- `docs/process/STEP_11_TYPOGRAPHY_HANDOVER.md` — this file (status + typography context).
- `docs/TOOLING.md` — tooling rationale (append a section per new tool/decision).
- `src/styles/README.md` — token chain, reskin + preset-switch guide.

---

## WORK STYLE — non-negotiable

- **Baby steps. ONE concern per step.** Never batch concerns.
- **Explain WHAT + WHY (+ options) before every command** — user is a beginner. Tutorial
  tone. Wait for explicit "ok" before running.
- **One commit per verified step** (Conventional Commits; **NO `Co-Authored-By`** —
  attribution disabled). Commit AFTER verifying. Push when the user says.
- **Document as you go:** config files get a commented header; add a `docs/TOOLING.md`
  section per new tool/decision; tick the checklist item.

---

## ENVIRONMENT NOTES / gotchas (carry forward)

- **User is on Claude Desktop. THE ASSISTANT runs terminal commands** (Bash tool).
- **Confirm the repo every session.** Check the env header's "Primary working directory":
  - If `…/lc-base-template` → cwd + preview target the right repo. Good (live screenshots work).
  - If `…/french/french-lo-1` (the old primary) → cwd RESETS each turn; prefix every git/bun
    with `cd /Users/ped/Sites/lc-base-template &&` (or `git -C`); preview mis-targets →
    verify **headless** (`bun run build` + grep `dist/assets/*`), or render an inline visual.
- **config-protection hook BLOCKS Edit/Write on `eslint.config.js`** (confirmed). NOT blocked:
  `prettier.config.mjs`, `stylelint.config.mjs`, `package.json`, `.md`, source, CSS.
  If blocked → hand the user the full file to paste; do NOT bypass the guard.
- **Token presets:** `tokens.css` active = B; font tokens go in `palette.css` (shared), so
  the preset-switch mechanism stays intact (presets only differ in `--primary`/`--ring`).
- **Cost:** global `~/.claude/CLAUDE.md` + ECC rules reload EVERY turn (~tens of k tokens) —
  the dominant cost, independent of the work. Minimize turns; batch file writes; combine
  verify+commit(+push) into one Bash chain on low-risk steps.
- **Caveman mode** may be active (terse replies) — keep beginner explanations clear anyway.

---

## Paste-in prompt for the fresh (lc-base-template-rooted) session

```
Continue building lc-base-template, baby-step style. Steps 1–10 are DONE and pushed
(repo+README, Vite+React+TS, Bun test runner, Prettier, ESLint+jsx-a11y, Stylelint,
husky+lint-staged, Tailwind v4, shadcn/ui + Lucide [19 components], and the Cambridge
Slate token system: palette.css + tokens.css + 3 switchable primary presets + theming
guide). HEAD = origin/main, clean tree.

Read first:
  docs/specs/2026-06-15-lc-base-template-design.md          (24 decisions)
  docs/process/LC_BASE_TEMPLATE_BUILD_HANDOVER.md           (sequence + checklist; 1–10 ticked)
  docs/process/STEP_11_TYPOGRAPHY_HANDOVER.md               (status + typography context)
  docs/TOOLING.md  and  src/styles/README.md                (rationale + token/skin guide)

WORK STYLE (non-negotiable): one tiny concern per step; explain WHAT+WHY+options before every
command (I'm a beginner); wait for my "ok" before each step; one commit per verified step
(Conventional Commits, NO Co-Authored-By); document each tool in its config header + TOOLING.md
+ tick the checklist.

ENVIRONMENT: I'm on Claude Desktop — YOU run the Bash commands. Confirm the repo first: check
the env "Primary working directory". If it's lc-base-template, cwd + preview are correct (live
screenshots work). If it's french-lo-1, prefix git/bun with `cd /Users/ped/Sites/lc-base-template &&`
and verify headless. The config-protection hook blocks edits to eslint.config.js — if blocked,
hand me the file to paste.

NEXT STEP = TYPOGRAPHY (checklist 10b). Official Cambridge type: Feijoa Medium = display
(commercial/Klim → git-ignored, NOT committed), Open Sans = body (free, Apache-2.0/Google Fonts,
the public default). CRITICAL: shadcn's init pulled Geist — index.css imports
@fontsource-variable/geist and `@theme inline` sets --font-sans: 'Geist Variable'. Swap to
Cambridge type: install @fontsource-variable/open-sans, remove Geist (dep + import), add font
tokens (--font-display / --font-body) to palette.css (Layer 1, shared — NOT per-preset), add a
Feijoa @font-face → public/fonts/feijoa/ + .gitignore that dir, and rewire --font-sans /
--font-heading in `@theme inline` (KEEP the @theme structure — it skins all 19 components).
Min 16px, 140% leading. Verify build + a type-ramp sample; document in TOOLING.md + src/styles/README.md.

First confirm we're in the right project, then propose the typography step. Do not start until I say ok.
```
