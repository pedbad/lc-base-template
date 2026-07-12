# Handover — Phase C · Part A: Site Shell

**Date:** 2026-07-12 (draft for a Monday resume)
**Repo:** `lc-base-template` · branch `main` · in sync with `origin/main` at `7925f92`.
Working tree clean, all pushed.
**Prev work:** Phase A + B done (12 core engines), findings H1 + M1 done, all 3 new
engines done (flashcards Step 1+2 SRS, conjugation typed v1, reading comprehension),
a11y/Lighthouse sweep landed (WAVE 21→0). See the canonical status table at the top of
`docs/process/2026-07-08-handover.md`.
**This task:** build **Phase C · Part A — the Site Shell**: the page frame every rendered
Learning Object lives inside (header/nav, main, footer, the ONE accordion wrapper,
dark-mode toggle). Nothing in Phase C is built yet.

---

## 0. Why Part A, and why FIRST

Parts B–D of Phase C produce **content** (example LO JSON), a **loader/stitcher**, and
**static per-LO HTML**. None of it can render without a page frame to render into. Part A
is that frame. It is deliberately the first Phase C task because B–D depend on it.

Part A is also the project's **a11y-locked baseline**: get landmarks, heading order, and
keyboard behaviour right once here, and every LO the factory ever emits inherits them for
free (guard-h w3c/a11y then passes downstream without per-page fixes).

**Canonical references to build against (read both first):**

- `docs/specs/lo-semantic-structure.md` — §1 the DOM skeleton, §2 heading depth, §3
  content rules (`instructions` + `lang`), §4 accordion mechanics, §5 the french-lo-1
  mistakes list. **This is the spec. Build the markup to match §1 exactly.**
- `docs/process/2026-07-01-phase-c-brainstorm.md` §6.A — the 7-step Part A plan + the
  reasoning/history behind each decision.

---

## 1. Current state (what exists, what's missing)

**Exists and reusable:**

- `src/components/ui/` — shadcn primitives: `navigation-menu.tsx`, `sheet.tsx`,
  `alert.tsx`, `dialog.tsx`, `switch.tsx`, `accordion.tsx`, `button.tsx`, `card.tsx`,
  `separator.tsx`, `tooltip.tsx`, … (19 total).
- `src/components/audio/` — audio subsystem (not needed for Part A shell).
- `src/lib/lang.ts` — exports `TARGET_LANG` from `courseConfig.languageCode`. Use for any
  target-language content; NEVER on UI chrome / `aria-label` / sr-only text.
- `src/config/` — `course.config.ts`, `lo-schema.ts` (`LoManifestSchema`,
  `BlockConfigSchema`, `ExerciseConfigSchema`), `ui-strings.ts`, `exercise-types.ts`.
- Token system in `src/styles/` — dark mode driven by `.dark` class on the root +
  `data-theme` for brand (see `docs/process/FUTURE_PROJECTS.md` → Light/Dark Mode Rules).

**Missing — this task builds it:**

- `src/App.tsx` is still the **default Vite scaffold** (Rocket button + count demo) — step
  3 replaces it with a real `PageLayout`.
- No `Header`, `Footer`, `PageLayout`, LO accordion, or wired dark-mode toggle.
- `src/components/` has only `ui/` + `audio/` — no app-shell layer yet.

**Entry points:** `index.html` → `src/main.tsx` → `<App/>` into `#root` (this is the app).
`exercise-showcase.html` is the dev showcase and stays as-is.

---

## 2. ⚠️ TDD guard is now ACTIVE (repo-local) — READ FIRST

**Changed 2026-07-12.** The repo migrated `bun test` → **Vitest** (`bun run test`) and the
**TDD guard is now wired repo-locally** (committed `.claude/settings.json` hook + the
`tdd-guard-vitest` reporter). It is NO LONGER the old "always-blind, send `tdd-guard off`"
situation — the guard actually works now and **enforces Red→Green**: it blocks an
implementation write unless a failing test exists first.

Part A is almost all `.tsx` view/markup. Two ways to work with the guard:

- **Preferred — write a failing test first** (the guard's intent). For shell components,
  a `renderToStaticMarkup` test asserting the expected landmarks/roles is a genuine Red
  (see `conjugation/ConjugationExercise.test.tsx` for the server-render pattern).
- **Pragmatic — mute it for pure-markup spikes:** set
  `.claude/tdd-guard/data/config.json` → `{"guardEnabled":false}` (gitignored, per-machine,
  never committed), then re-enable when done. Do NOT commit `.claude/tdd-guard/`.

Note: the guard is a Claude Code helper only — **CI (`bun run test` · lint · build) +
branch protection are the real gate.**

---

## 3. Start-of-session checklist

1. `git fetch origin && git status -sb` — confirm `main` == `origin/main` at `7925f92`,
   clean tree. A separate work machine may have unpushed commits — reconcile FIRST.
2. Branch off main: `git checkout -b feat/phase-c-site-shell main`.
3. `bun install` (pulls the vitest + tdd-guard devDeps). TDD guard is active — either
   test-first, or mute via `.claude/tdd-guard/data/config.json` (see §2).
4. Read `docs/specs/lo-semantic-structure.md` §1–5 in full, then
   `docs/process/2026-07-01-phase-c-brainstorm.md` §4 (mistakes) + §6.A (the plan).

---

## 4. Goal — acceptance criteria (7 steps, one concern per commit)

Build order + the DOM each must produce (all markup mirrors
`lo-semantic-structure.md` §1). New files land under a new `src/components/shell/`.

### Step 1 — `Header.tsx`

- [ ] `<header><nav aria-label="Main navigation">` — the **one** primary nav landmark.
- [ ] Placeholder logo/title link → `href="#content"` (skip-to-main).
- [ ] Nav entries generated **from the section list** (one `<a href="#section-id">` per
      top-level section, in page order) — not hand-authored twice. For Part A the section
      list can be a small local constant; it later comes from the LO manifest.
- [ ] `aria-current="true"` (or `"page"`) on the active section link.
- [ ] Mobile nav via `sheet.tsx` OR a `<div id="mobile-nav-panel" hidden>` — closed panel
      uses the **`hidden` attribute** (real focus removal), NOT `aria-hidden`+CSS.
- [ ] Toggle button: `type="button"`, `aria-expanded`, `aria-controls="mobile-nav-panel"`,
      `aria-label="Toggle navigation menu"`.
- [ ] **Escape closes the mobile panel and returns focus to the toggle button.**

### Step 2 — `Footer.tsx`

- [ ] Plain `<footer>` with placeholder links/copyright.
- [ ] **No heading element anywhere inside** (french-lo-1 mistake — §5).

### Step 3 — `PageLayout.tsx` (replaces the Vite `App.tsx` scaffold)

- [ ] `<a class="skip-link" href="#content">Skip to main content</a>` first in `<body>`,
      visually hidden until `:focus`, always in the DOM.
- [ ] `Header` + `<main id="content" tabindex="-1">` + `Footer`.
- [ ] `<main>` holds `<h1>{LO title}</h1>` then one `<section
  id aria-labelledby={id}-heading>` per section, each with its `<h2>`.
- [ ] Rewire `src/App.tsx` (or a new `src/app/` composition root) to render `PageLayout`
      with placeholder sections. Delete the Rocket/count demo + its `App.css` / unused
      `assets/*.svg|png` imports if now dead.
- [ ] In-page nav (link click / hash) **moves focus to the target section heading**, not
      just scrolls.

### Step 4 — Placeholder chrome pass

- [ ] One instructional callout using `alert.tsx` styling but rendered as a plain
      `<div class="instructions">` — NOT `role="alert"` (that ARIA role is for assertive
      live regions; wrong semantics for static instructions — §3).
- [ ] One demo modal using `dialog.tsx`, filler text. Shows authors what "info box" and
      "popup" chrome look like.

### Step 5 — the ONE accordion wrapper (`LoAccordion.tsx`)

- [ ] Structure exactly (§4):
    `html
  <article aria-labelledby="{id}-heading">
    <details>
      <summary><h3 id="{id}-heading">{title}</h3></summary>
      <div class="details-content">
        <div class="instructions">{optional}</div>
        {body}
      </div>
    </details>
  </article>
  `
- [ ] **No `aria-expanded`/`aria-controls` bookkeeping** — native `<details>` provides it.
- [ ] **No `role="region"`** on the panel (APG: not recommended for many small accordions).
- [ ] Animation = progressive enhancement: baseline native open/close works with **JS
      disabled**; with JS, `.details-content` uses `display:grid; grid-template-rows:0fr→1fr`
      transition, driven by intercepting the `<summary>` click. Never break the no-JS path.
- [ ] **One heading-id helper** (`src/lib/headingId.ts` or similar) generates every id —
      never two hand-built id schemes (french-lo-1 trap, §5).
- [ ] ⚠️ **Accordion-collision decision (§4 "one implementation only"):** the repo already
      ships shadcn `src/components/ui/accordion.tsx` (Radix, div-based, no `<details>`).
      LO content MUST use the new native-`<details>` `LoAccordion`, never the Radix one.
      Grep for existing `accordion.tsx` imports: if nothing uses it, **remove it** in this
      step (kills the "wrong rival component gets reached for later" trap). If something
      does, note it and keep them cleanly separated with a comment on each.

### Step 6 — dark-mode toggle (`ThemeToggle.tsx` + `useTheme` hook)

- [ ] Use `switch.tsx` (`role="switch"` + `aria-checked` + `aria-label="Dark mode"`) — NOT
      a button with changing label text (§1).
- [ ] `useTheme` toggles `.dark` on `document.documentElement`, persists to `localStorage`,
      and on first load respects stored value else `prefers-color-scheme`. No inline style
      swaps; class switch only (FUTURE_PROJECTS Light/Dark rules). No-window-safe.

### Step 7 — verify in preview (see §5)

---

## 5. Verify (CI runs the first three on push)

```bash
bun run test       # Vitest
bun run lint
bun run lint:css
bun run build      # tsc -b + vite build
bun run dev        # app at index.html (Preview tooling: .claude/launch.json)
```

Then, in the browser preview of `index.html`, confirm against `lo-semantic-structure.md`:

- [ ] Landmarks present: one `header>nav`, one `<main>`, one `<footer>`.
- [ ] Heading order **h1 → h2 → h3, no skips, no repeats**; no decorative heading before
      `<h1>` (§2, §5).
- [ ] Keyboard-only pass: skip-link works; tab order sane; **no focusable inside a closed
      mobile panel or collapsed accordion** (no keyboard trap); Escape closes mobile nav
      and focus returns to its toggle.
- [ ] Accordion opens/closes with **JavaScript disabled** (native `<details>` fallback),
      and animates smoothly with JS on.
- [ ] Dark-mode Switch flips theme, persists across reload, honours system preference on a
      cleared store.
- [ ] Re-audit with `lighthouse_audit` (chrome-devtools MCP) + WAVE — Part A must not
      regress the a11y/SEO wins from the 2026-07-11 sweep. Consider the ECC `a11y-architect`
      agent + `accessibility` / `frontend-a11y` / `wcag-audit-patterns` skills.

---

## 6. Guardrails / conventions

- **Reuse primitives, don't re-derive.** `navigation-menu`, `sheet`, `alert`, `dialog`,
  `switch` already exist — wrap them, don't rebuild. New shell components go in
  `src/components/shell/`; `<800`-line file cap; many small files.
- **Semantic HTML first** — real `<header>/<nav>/<main>/<section>/<footer>/<button>/<a>`
  before any ARIA role fallback.
- **Tokens only** — no hardcoded colour/font-size/font-family; consume semantic tokens
  from `src/styles`. Verify light AND dark parity for every new surface.
- **`lang`** — Part A is UI chrome (English), so it inherits `lang="en"`. Only real
  target-language content gets `lang={TARGET_LANG}` (none in the shell itself yet).
- **Animation** — compositor-friendly props (`transform`/`opacity`/`grid-template-rows`
  transition); respect `prefers-reduced-motion`.
- Conventional commits, one concern each. Do NOT commit `.claude/tdd-guard/` or
  `graphify-out/` (both gitignored). CI = test + lint + build on push.

---

## 7. What comes AFTER Part A (context, don't start)

- **Part B** — example LO `lo-config/lo-00-example/` (placeholder JSON: `lo.json` manifest
  - `blocks/` + `exercises/`). Numbered `lo-00` to keep `lo-01` free.
- **Part C** — `loadLo(slug)` + `assembleLo()` (Zod-validated JSON → typed ordered LO).
- **Part D** — Node post-build `renderToStaticMarkup` → real per-LO `dist/*.html`
  (mechanism already spiked + decided 2026-07-03).
- **Guards b–h** — naming/render-mirror, asset-path, asset-existence, registry-complete,
  token-integrity, css-layer-discipline, w3c/a11y (only guard a active today).

Full Phase C map: `docs/process/2026-07-01-phase-c-brainstorm.md` §6.B–D.

---

## 8. Paste-ready resume prompt (Monday)

> Build **Phase C · Part A — the Site Shell** in `lc-base-template`. Full recipe:
> `docs/process/2026-07-12-phase-c-part-a-site-shell-handover.md`; canonical DOM spec:
> `docs/specs/lo-semantic-structure.md` §1–5. FIRST: `git fetch origin`, confirm `main` ==
> `origin/main` (`7925f92`), reconcile any unpushed work from the other machine, branch
> `feat/phase-c-site-shell` off main. `bun install`. The TDD guard is now ACTIVE repo-locally
> (Vitest + `tdd-guard-vitest` reporter) — work test-first, or mute it for pure-markup spikes
> via `.claude/tdd-guard/data/config.json` → `{"guardEnabled":false}` (gitignored, never
> commit). Build 7 steps, one commit each, new files in
> `src/components/shell/`: (1) `Header.tsx` — one `<header><nav aria-label="Main
navigation">`, section-derived links, mobile panel via `sheet` with `hidden` when closed,
> Escape-closes-and-restores-focus; (2) `Footer.tsx` — plain `<footer>`, no heading inside;
> (3) `PageLayout.tsx` — skip-link + Header + `<main id="content" tabindex="-1">` (h1 then
> `<section aria-labelledby>`+h2 each) + Footer, replacing the default Vite `App.tsx`
> scaffold, focus-moves-to-heading on in-page nav; (4) placeholder chrome — one
> `<div class="instructions">` callout (NOT role="alert") + one `dialog` demo modal; (5)
> the ONE accordion `LoAccordion.tsx` = `<article><details><summary><h3></summary>
>
> <div class="details-content">…</div></details></article>`, native semantics (no
> aria-expanded/role=region), `grid-template-rows:0fr→1fr` animation over a JS-disabled
> baseline, ids from one shared heading-id helper — and remove/segregate the unused shadcn
> `ui/accordion.tsx` so there's only one accordion; (6) `ThemeToggle` via `switch`
> (role="switch"/aria-checked) + `useTheme` hook toggling `.dark` on documentElement,
> localStorage-persisted, prefers-color-scheme fallback, no-window-safe; (7) verify.
> Reuse existing `ui/` primitives, tokens only (light+dark parity), semantic HTML first,
> `<800`-line files. Verify each step: `bun run test · bun run lint · bun run lint:css · bun run
> build`, then browser-preview `index.html` — landmarks, h1→h2→h3 no skips, keyboard-only
> (no trapped focus in closed panels), accordion works with JS OFF, dark-mode persists —
> and re-audit with `lighthouse_audit` + WAVE so the 2026-07-11 a11y wins don't regress.
> Conventional commits; don't commit `.claude/tdd-guard/`. Use the ECC `a11y-architect` /
> `accessibility` / `wcag-audit-patterns` skills.
