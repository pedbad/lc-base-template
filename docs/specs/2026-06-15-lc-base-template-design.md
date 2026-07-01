# LC Base Template — Design Spec

**Date:** 2026-06-15
**Status:** Approved (brainstorm output). Build session pending.
**Author:** Pedram Badakhchani
**Source:** Brainstorm session continuing parked work from `docs/process/FUTURE_PROJECTS.md` + `docs/process/LC_BASE_TEMPLATE_BUILD_HANDOVER.md`.
**Reference impl:** `french-lo-1` (proven, but NOT the template — carries content + naming tech-debt).

---

## 1. Goal

A **public GitHub template repo** that acts as a **course factory**. A developer clicks "Use this template", gets a clean repo, and builds a new LTR-language course (Spanish, Portuguese, any LTR language) by:

1. Editing CSS theme tokens (designer hands palette + fonts + sizes).
2. Filling out one course-identity config.
3. Dropping JSON files into `lo-config/` — one per Learning Object.
4. Adding images + audio per LO.
5. Picking from a menu of 12 ready exercise types; authoring new ones via a documented contract.

The template ships with three dev tools (debug sandbox, exercise showcase, example LO) and a guard system that makes drift from the design architecture **impossible to merge**.

**Non-goal (v1):** RTL languages (Arabic, Persian). RTL is a separate future template, forked off this one once stable.

---

## 2. Core Decisions (locked)

| #   | Decision              | Choice                                                                                                                                                                                                                                                                                                                                                         |
| --- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Template shape        | **A — clonable empty-shell starter** (course factory). Not extract-package (B), not monorepo (C).                                                                                                                                                                                                                                                              |
| 2   | Language/validation   | **TypeScript + Zod.** Configs validated at load/compile.                                                                                                                                                                                                                                                                                                       |
| 3   | RTL                   | **Dropped from v1.** Separate future template forked off this base.                                                                                                                                                                                                                                                                                            |
| 4   | Dev artifacts shipped | **Three:** debug sandbox + exercise showcase + example LO. All debug-flag-gated.                                                                                                                                                                                                                                                                               |
| 5   | Exercise engines      | **All 12**, ported cluster-by-cluster, debt cleared per cluster.                                                                                                                                                                                                                                                                                               |
| 6   | Guards                | **All 8** (see §5).                                                                                                                                                                                                                                                                                                                                            |
| 7   | Enforcement gate      | **Option C** — husky pre-commit (fast) + GitHub Actions CI (unbypassable backstop).                                                                                                                                                                                                                                                                            |
| 8   | Tooling               | **Zero-touch:** Bun (pkg/runtime/test) + Vite (build) + Prettier + ESLint + Stylelint + husky + lint-staged.                                                                                                                                                                                                                                                   |
| 9   | Docs                  | `CONTRIBUTING.md` (root) + sandbox renders it as HTML (single source).                                                                                                                                                                                                                                                                                         |
| 10  | Routing               | **Static pre-rendered** — one real `.html` per LO slug, build auto-discovers from `lo-config/`.                                                                                                                                                                                                                                                                |
| 11  | Theming               | **Single-theme-per-clone**, light + dark kept. Drop `theme-lc-[lang]` locale-naming fossil.                                                                                                                                                                                                                                                                    |
| 12  | Course identity       | One Zod-validated `course.config.ts` — single source of course identity.                                                                                                                                                                                                                                                                                       |
| 13  | UI-chrome strings     | Global `ui-strings.ts` (complete, Zod-required) **+** optional per-exercise `labels` override (partial). Override wins.                                                                                                                                                                                                                                        |
| 14  | Repo home             | **Public** GitHub template repo `lc-base-template`. "Use this template" flow. Collaborators gate template edits.                                                                                                                                                                                                                                               |
| 15  | License               | **MIT for code + CC-BY-4.0 for content** + brand/trademark disclaimer (see §12).                                                                                                                                                                                                                                                                               |
| 16  | Designer role         | **Hands-off.** Designer defines look (palette/type/spacing/icons); does not touch code/JSON/guards. Output = theme spec the dev applies. Confirmed visually in the debug sandbox.                                                                                                                                                                              |
| 17  | Out-of-box brand      | Clone ships **pre-branded as a Cambridge course** — full Cambridge Slate palette + logos/imagery baked in. Designer rebrands later by editing token values (one place), not find-replace.                                                                                                                                                                      |
| 18  | Brand asset licensing | **Colours** baked in (not copyrightable). **Logos/imagery** baked in + trademark disclaimer. **Font:** Feijoa is commercial (Klim) → **NOT shipped**; git-ignored, local/deploy-only. Public default = **Open Sans** (Apache-2.0). Cascade falls back automatically.                                                                                           |
| 19  | CSS cascade layers    | **Fully layered from day one.** Every custom rule in `@layer base/components` or `@utility`. Zero unlayered CSS, zero `!important`. No legacy `index.css` debt inherited (rules #27/#39).                                                                                                                                                                      |
| 20  | Developer workflow    | One-time setup (config, theme, ui-strings) → repeatable per-LO loop (copy example JSON, edit, add assets, commit) → guards backstop → static build + deploy. See §13.                                                                                                                                                                                          |
| 21  | Documentation hub     | 5 markdown docs (`README`, `CONTRIBUTING`, `DESIGNER`, `STRUCTURE`, `AGENTS`) = source of truth; debug-sandbox renders human-facing ones as HTML (single source, no duplication). `STRUCTURE.md` tree auto-generated. See §14.                                                                                                                                 |
| 22  | AGENTS.md             | AI-agent instruction file at root — makes the AI assistant a drift guard at _authoring_ time. Concise, rule-first, references CONTRIBUTING for depth. Optional `CLAUDE.md` symlink. See §16.                                                                                                                                                                   |
| 23  | Render-mirror naming  | File structure mirrors rendered page: **ordinal + type, section-scoped** (content blocks `01-grammar…`; exercises restart `01-select…`). Applies to all block types (grammar, vocab, pronunciation, dialogue, monologue, exercises). Guard b enforces folder↔config match. See §15.                                                                            |
| 24  | W3C / a11y compliance | **Non-negotiable, CI-gated** (guard h). Semantic DOM: `header>nav` (one primary nav) → `main` → `section` landmarks → **`<article>` per accordion**; logical `h1`→`h2` order; accessible names on icon-only controls; `GrammarLabel` for short labels (no bare `<h4>`/`<p>`); semantic emphasis (`<strong>`/`<em>`); `<table>` only for tabular data. See §17. |

---

## 3. Stack

**React + Vite + Bun + TypeScript + Zod + Tailwind + shadcn + Lucide.**

- **Bun** = package manager, runtime, test runner (`bun test`). Setup = `git clone && bun install`.
- **Vite** = dev server + bundler (react plugin, multi-page debug entries, static pre-render build). Bun is NOT the bundler.
- **Husky** self-installs via the `prepare` script on `bun install`. Dev configures nothing.
- `bun.lockb` committed.

---

## 4. Dev artifacts (shipped, debug-flag-gated)

All three behind the debug flag (`VITE_INCLUDE_DEBUG=true`); production builds exclude them.

1. **Debug sandbox — the design control panel.** Renders the live theme across all three token layers (primitives, semantic roles, component tokens), light + dark: palette swatches, font ramp (Open Sans now / Feijoa when present), SVG/icon set, spacing tokens, **plus a live component preview** (real buttons + exercises rendered with the exact tokens). Where the designer's handoff is confirmed visually. Also renders `CONTRIBUTING.md` as HTML (single source — no hand-copied duplicate).
2. **Exercise showcase.** Full catalog of all 12 exercise types in isolated fixtures. The menu a dev browses + the place a new exercise component is verified.
3. **Example LO.** One complete, realistic, **Zod-valid** Learning Object: intro + grammar block + vocab block + an exercise section of **4 accordions** (4 exercise types, NOT all 12 — that's the showcase's job). The "copy me to start" artifact. Ships as a **folder** (`lo-config/lo-01-…/`): a thin `lo.json` manifest + one config file per block/exercise; media mirrors under `public/` by the same ordinal+type names (folder-per-LO — see §6/§15).

---

## 5. Guard system (the bulletproofing)

Eight checks. Each maps to a real bug that already hurt the prior project. All run at **both** gates (Option C: husky pre-commit + CI).

| #   | Guard                                  | Enforces                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a   | **Config schema** (Zod)                | Every `lo-config/*.json` validates. Catches key drift (`instructionsText` vs `informationText`), missing fields, wrong shapes.                                                                                                                                                                                                                                                                          |
| b   | **Naming conventions + render-mirror** | `lo-01` not `lo1`; `images/` not `img/`; semantic ordinal+type folders (`01-fill-gaps/` not `draggableFillGaps1/`). **Extended:** every block's asset folder name (`03-line-match`) must match that block's **index + type in the LO config**, section-scoped (content blocks one sequence, exercises another). Reorder without rename → guard fails. Makes the file↔page mirror an enforced invariant. |
| c   | **Asset-path discipline**              | Runtime fetches via `resolveAsset()`; static `<head>` assets via `%BASE_URL%`. Block raw relative paths (bugs #35, #28).                                                                                                                                                                                                                                                                                |
| d   | **Asset existence**                    | Every audio/image referenced in a config exists on disk. No runtime 404s.                                                                                                                                                                                                                                                                                                                               |
| e   | **Registry completeness**              | Every exercise `type` in configs is registered in `lazyRegistry`; every registered type has a showcase fixture.                                                                                                                                                                                                                                                                                         |
| f   | **Theme-token integrity**              | No hardcoded hex/px in components — colors/spacing pull from CSS tokens only (Stylelint).                                                                                                                                                                                                                                                                                                               |
| g   | **CSS layer discipline**               | Build fails on any unlayered custom CSS rule and on stray `!important` (Stylelint). Prevents reintroducing the cascade debt (rules #27/#39).                                                                                                                                                                                                                                                            |
| h   | **W3C / accessibility**                | `jsx-a11y` eslint + automated a11y check (axe/pa11y). **CI fails on the a11y gate** (mirrors FUTURE_PROJECTS `check:a11y:branch`). Enforces semantic landmarks, accessible names, no `<table>` for layout. See §17.                                                                                                                                                                                     |

**Enforcement (Option C):**

- **Local:** husky pre-commit + lint-staged → instant feedback. Bypassable with `--no-verify`.
- **CI:** GitHub Actions (`oven-sh/setup-bun`) re-runs all guards on push/PR → the unbypassable wall. A `--no-verify` commit still gets caught before merge.

---

## 6. Routing — static pre-rendered

**Problem solved:** french-lo-1 was an SPA; lcitc has no mod_rewrite, so direct/refresh hits on `/some-lo` 404'd. DevOps patched it by manually creating a folder + blank `index.html` per LO — a fragile manual hack repeated per LO, no SEO, two sources of truth.

**Template approach:**

- Slug-only routing (rule #26, no `?lo=` resolver).
- Build **auto-discovers** LOs by scanning `lo-config/*/lo.json` (folder-per-LO; see below).
- Build emits **one real, content-full `.html` per LO slug**.
- No mod_rewrite needed; works on dumb static hosting; best SEO; no manual folders.
- The old devops shell hack becomes a build step the template owns. Drop an LO folder → get a page. Can't forget, can't drift.

**Content structure — folder-per-LO** _(refined 2026-06-19; replaces the original monolithic per-LO JSON of french-lo-1)_:

- Each LO is a **folder** under `lo-config/` containing a thin **`lo.json` manifest** (LO meta + the _ordered_ list of block/exercise refs, e.g. `["01-grammar", "02-vocab"]`, `["01-select", "02-inline-choice", …]`) plus **one config file per block/exercise**.
- A config file is small and self-contained — it declares its `type` (resolved to the one shared engine via `lazyRegistry`) and its content + optional per-exercise `labels` override.
- **Components stay shared** — there is one `SelectExercise` engine for _all_ select exercises; only the per-instance content is split out. Config (in `lo-config/`) and media (in `public/`, fetched via `resolveAsset()`/`%BASE_URL%`) both follow the same `<ordinal>-<type>` render-mirror names (§15); guard **b** keeps the two in sync.
- The build reads each `lo.json`, stitches the referenced parts, **Zod-validates each part _and_ the assembled LO**, then pre-renders the page.
- **Why:** smaller files, far fewer merge conflicts (authors edit separate files), config sits beside its render-mirror assets, and reorder-by-rename is guard-checked. One-time cost = a loader that globs + stitches + validates (the right place to pay it: this is a template).

---

## 7. Theming — single theme per clone, light + dark

- Each new language = its own clone = one look. No runtime brand/locale swap (YAGNI — never switch themes inside a running course).
- **Keep light + dark** (orthogonal to brand-swap; user-facing preference). Tailwind v4 `.dark` variant.
- Token split retained (palette / typography / spacing / theme), each holding light + dark values.
- **Drop the `theme-lc-french.css` locale-naming fossil** → plain `theme.css`. french-lo-1 carries the _naming_ of a multi-theme swap system with no `data-theme` machinery behind it; the template must not inherit that false promise.

### 7.1 Token chain (single source → components)

Three layers, each pointing at the one below. Designer's single edit point is the primitive layer.

1. **Primitive tokens** (`palette.css`) — raw brand values: `--slate-1:#ECEEF1 … --slate-4:#232830`, font tokens.
2. **Semantic tokens** (`tokens.css`) — roles mapped to primitives, light + dark: `--color-surface:var(--slate-1)`, `--color-text:var(--slate-4)`, `--color-primary:var(--slate-3)`.
3. **Component tokens** — e.g. `--button-bg:var(--color-primary)`. Components read these, never raw hex.

Change Slate 3 once → primitive → semantic → every button updates. Guard **f** forbids raw hex/px in components; guard **g** forbids unlayered rules. The chain cannot be bypassed.

### 7.2 Out-of-box brand defaults

- **Colours:** full Cambridge Slate palette (4 tones → semantic ramp: surface → muted → secondary → text), light + dark. Maps to the existing frenchLO 4-tone handoff.
- **Fonts:** display token = `"Feijoa", "Open Sans", sans-serif`. Feijoa git-ignored (commercial, Klim) → fresh clones render Open Sans automatically via cascade; real Feijoa dropped in `public/fonts/feijoa/` per deploy.
- **Logos / visual-language imagery:** baked in, covered by the §12 trademark disclaimer.

---

## 8. Course identity — `course.config.ts`

One Zod-validated file, the single source of course identity. Dev fills it out first. Feeds the static pre-render (titles, `<head>`, per-LO meta) and centralizes `%BASE_URL%` asset refs (kills favicon-on-subpath bug #28).

Fields: `courseTitle`, `languageCode`, `basePath` (env-driven deploy subpath), `landingCopy`, `logo`/`favicon` paths, LO order.

---

## 9. UI-chrome strings — two-layer

Exercise UI words ("Check", "Next", "Show answer", "Correct!") must not be hardcoded in components.

- **Layer 1 — global `ui-strings.ts`.** Flat key→string map. Course-wide default/fallback. **Zod: all keys required** → build fails on any missing key (no half-translated chrome ships).
- **Layer 2 — per-exercise `labels` override** in the LO JSON. Optional, partial. Lets one exercise say "See answer" while others fall back to global "Check". **Zod: validates keys are real + values are strings** (typo `chekc` → build fails).
- **Resolution:** `config.labels?.check ?? uiStrings.check`. Override wins; global default always exists.
- **Not** a runtime i18n framework — each clone is one language set once. One file + one schema check.

New dev translates one file → whole course localized; never touches component code.

---

## 10. Exercise engines — all 13, cluster-by-cluster

The 13 engines are not 13 independent ports — they cluster around shared runtimes. Port cluster-by-cluster; use each port as the moment to clear that cluster's known TODO debt so the template ships clean.

**Known cluster:** the **TextEntry family** — `ClozeTyping`, `TypedTransform`, `Dictation` are semantic wrappers over a shared `TextEntryExerciseRuntime` (behavior split by flags). Port together. `TextEntryExerciseRuntime` carries a `TODO(component-split)` (planned split into UI-only base + behavior controllers). The template port is the moment to decide: port as-is or resolve the split — so the template doesn't inherit "compatibility layer" debt.

ClozeTyping bugs from french-lo-1 (missing audio icon, unstyled check button, showcase fixture issues) were **resolved** (commit `fe86a8f`, Jun 11) — port the fixed version.

---

## 11. Repo & license

- **Public** GitHub **template repo** `lc-base-template` ("Use this template" → fresh repo, clean history, no fork back-link).
- Cloning/using = open to anyone. **Push access to the template itself = collaborators only** (gates who edits the base).
- **License:** MIT for code + CC-BY-4.0 for content. Both stated in `LICENSE` + README.

---

## 12. Designer workflow + brand asset licensing

**Designer is hands-off.** Job = define the look; never touches code/JSON/guards.

- **Defines:** palette (light + dark), typography (families/sizes/scale/weights), spacing/rhythm/radius, iconography (Lucide + brand SVGs).
- **Output:** a theme spec the developer types into the primitive token layer (§7.1).
- **Confirms** visually in the debug sandbox (live component preview).
- **Does not:** write exercise logic, edit LO JSON, touch routing/guards.

**Brand asset licensing (public repo).** The repo is public + forkable, so what ships is constrained:

| Asset                                      | Ships in public repo? | Mitigation                                                                                                                                                                                                     |
| ------------------------------------------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colours (Slate hex)                        | ✅ yes                | Not copyrightable. README note that they reflect Cambridge brand.                                                                                                                                              |
| Logos / wordmark / visual-language imagery | ✅ yes                | **Trademark disclaimer** in README + LICENSE: marks are University property; remove/replace before reuse. Shifts responsibility to forker.                                                                     |
| Feijoa font file                           | ❌ no                 | Commercial (Klim Type Foundry). Git-ignored; never pushed. `@font-face` references `public/fonts/feijoa/` (local/deploy only). Public default = Open Sans (Apache-2.0). CONTRIBUTING.md documents the drop-in. |

**README/LICENSE disclaimer (required):** "Cambridge branding (logos, marks, imagery) and the Feijoa typeface are the property of the University of Cambridge / Klim Type Foundry respectively, and are **not** licensed for reuse. Forks must remove or replace them. Code is MIT; learning content is CC-BY-4.0."

---

## 13. Developer workflow

**One-time setup (≈once per course):**

1. "Use this template" → `bun install` (husky self-installs; nothing else to configure).
2. Fill `course.config.ts` — title, `languageCode`, `basePath`, landing copy, logo/favicon.
3. Apply designer's theme — edit primitive tokens in `palette.css`; confirm in sandbox. Drop licensed Feijoa in `public/fonts/feijoa/` if a Cambridge deploy (else Open Sans renders).
4. Translate `ui-strings.ts` — Check/Next/etc → target language (Zod fails build on missing key).

**Per-LO loop (the repeatable part):** 5. Copy the example LO **folder** → rename to `lo-NN-slug/` (its `lo.json` manifest + per-block/exercise config files come with it). 6. Edit content — intro, grammar, vocab, pronunciation, dialogue/monologue, exercises. 7. Add assets — images to `media/images/lo-NN/<NN-type>/`, audio to `audio/lo-NN/<NN-type>/` (render-mirror naming, §15). 8. Pick exercises from the showcase menu; paste the config shape, fill content. 9. `bun run dev` → preview. Build auto-discovers the new JSON → pre-renders its page. 10. Commit → guards fire (pre-commit + CI). Red = CONTRIBUTING.md gives the fix.

**Deploy:** 11. `bun run build` → static HTML per LO → push to lcdev/lcitc with the env base path.

**Rare path — new exercise _type_** (not just using existing): the authoring contract — register in `lazyRegistry` + add showcase fixture + add Zod schema (guard e fails if any step skipped).

---

## 14. Documentation hub

Five markdown docs are the **single source of truth**; the debug sandbox renders the human-facing ones as HTML pages (markdown→HTML at build / fetch+render). Edit the `.md` once → GitHub + sandbox both update. No hand-copied duplication.

| File              | Audience                     | Content                                                                                                                                                                                                |
| ----------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `README.md`       | everyone (GitHub front door) | What this is, quickstart, links to the others, licence + brand disclaimer.                                                                                                                             |
| `CONTRIBUTING.md` | developer                    | Per-LO loop, exercise authoring contract, the 7 guards (what fails + how to fix), naming/asset rules.                                                                                                  |
| `DESIGNER.md`     | designer                     | Theme tokens, palette/font/spacing, how to read the sandbox, handoff format.                                                                                                                           |
| `STRUCTURE.md`    | developer                    | Annotated project tree — where LOs/images/audio go. **Tree auto-generated** (`bun run docs:tree`) above a hand-written "where things go" block; optional guard checks documented top-level dirs exist. |
| `AGENTS.md`       | AI agents                    | See §16.                                                                                                                                                                                               |

Sandbox "Docs" hub = pages rendering `DESIGNER.md` (designer), `CONTRIBUTING.md` (developer), `STRUCTURE.md` (project tree). AGENTS.md may also surface for transparency.

---

## 15. Render-mirror naming convention

File structure mirrors the rendered page so maintenance is "look at the page → go straight to the file."

- **Scheme:** `<ordinal>-<type>` — ordinal = position on page, type = what it is. `01-grammar/`, `03-line-match/`.
- **Scope: section-scoped (decision B).** Content blocks form one sequence; exercises restart their own. **Config (folder-per-LO) and media use the identical `<ordinal>-<type>` names:**
  ```
  lo-config/lo-01-salutations/          ← the LO folder (config)
    lo.json                             ← manifest: meta + ordered block/exercise refs
    blocks/01-grammar/block.json
    blocks/02-vocabulary/block.json
    exercises/01-select/exercise.json
    exercises/02-fill-gaps/exercise.json
  public/media/images/lo-01/02-vocabulary/   ← media mirrors the same names (served via %BASE_URL%)
  public/audio/lo-01/01-grammar/
  public/audio/lo-01/03-pronunciation/
  public/audio/lo-01/04-dialogue/
  …exercise section restarts: public/audio/lo-01/exercises/01-select/  02-fill-gaps/ …
  ```
- **Applies to all block types** with assets: grammar, vocabulary, pronunciation, dialogue, monologue, exercises.
- **Enforced (guard b):** each folder name must match that block's index + type in the LO config, per section. Reorder without rename → guard fails. The file↔page mirror is an invariant, not a hope.
- Insert within a section renumbers only that section (smaller blast radius than global numbering).

---

## 16. AGENTS.md — AI as a drift guard

Vendor-neutral AI-agent instruction file at repo root (read by Cursor/Codex/Claude Code etc.). Since most new devs will use an AI assistant, AGENTS.md makes the **AI a drift guard at _authoring_ time** — violations get prevented before the commit-time guards even run.

- **Audience:** machines. Concise, imperative, rule-first (contrast CONTRIBUTING.md = human prose).
- **Content:** naming + render-mirror rules; "add LO = copy example, Zod must pass"; new exercise = authoring contract; tokens only (no raw hex/px); no unlayered CSS / `!important`; `resolveAsset()` runtime + `%BASE_URL%` static head; run `bun run guards` before done; "see CONTRIBUTING/DESIGNER/STRUCTURE for detail."
- **Single source:** short, references canonical docs — does not restate them.
- Optional `CLAUDE.md` → `AGENTS.md` symlink so Claude Code picks it up.

---

## 17. Semantic markup & accessibility (W3C compliant)

Accessibility is a **build requirement, not polish** (FUTURE_PROJECTS "Accessibility Is Non-Negotiable"). Enforced by **guard h** at both gates; CI fails on the a11y gate.

**Semantic page DOM (carry-forward + the accordion decision):**

```
header > nav[aria-label]        ← exactly one primary nav landmark
main
  section (aria-labelledby)     ← real section landmarks, one per top-level content area
    h2 …                        ← logical heading order: h1 (page) → section h2 → …
    article                     ← one <article> per accordion (self-contained LO block / exercise)
footer
```

- One `h1` per page; headings never skip levels (no `<h4>` used as a visual label).
- **`<article>` per accordion** — each accordion wraps a self-contained block (a content section or an exercise), which is the correct semantic for `<article>`. _(New decision — not in FUTURE_PROJECTS, which specified `section` landmarks + reuse of the accordion wrapper; `<article>` is our refinement.)_

**Carry-forward markup rules (from FUTURE_PROJECTS):**

- **`GrammarLabel`** for short labels ("For example:", "Here are the forms:") — renders a token-sized `<div>`, never `<h4>`/`<p>`. Prevents heading-outline distortion + WAVE "possible heading" alerts.
- **Semantic emphasis only** — `<strong>`/`<em>`, never `<b>`/`<i>`, in authored HTML/JSON content.
- **`<table>` only for true tabular data** — never for visual layout (use flex/grid).
- **Icon-only controls** must have an accessible name (`aria-label` / visually-hidden text); decorative icons `aria-hidden`.
- **Native interactive elements first** (`button`, `a`, `input`) before ARIA role fallbacks.
- Visible focus, full keyboard support, `prefers-reduced-motion` respected.

**Tooling (guard h):** `eslint-plugin-jsx-a11y` + an automated checker (axe-core / pa11y) over the pre-rendered pages. CI fails on any gate violation (mirrors `bun run check:a11y:branch`).

---

## 18. Deploy reality (carry-forward constraints)

- lcdev (dev) + lcitc (live) both served `/french/french-basic/` under a non-root base. Template needs an **env-driven base path** decided per course (in `course.config.ts`).
- Two relative-path-under-non-root-base bugs bit french-lo-1: runtime fetch (#35) → fixed via `resolveAsset()`; favicon (#28) → fixed via `%BASE_URL%` for static `<head>` assets. Template uses both from day one (guard **c** enforces).

---

## 19. Explicitly deferred to BUILD session

- File generation / scaffold commands.
- Component extraction order + the per-cluster port sequence.
- TextEntry split decision (port as-is vs resolve `TODO(component-split)`).
- Exact `CONTRIBUTING.md` prose.
- Exact Zod schema shapes per exercise type.

---

## 20. Open / not-yet-decided

- None blocking. All 15 core decisions locked.
