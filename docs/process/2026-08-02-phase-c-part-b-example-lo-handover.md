# Handover — Phase C · Part B: The Example LO (`lo-00-example`)

**Date:** 2026-08-02 (draft for a Monday resume)
**Repo:** `lc-base-template` · branch `main` · in sync with `origin/main` (clean, all pushed).
**HEAD:** `6235a48` — end of Phase C · Part A (site shell), merged fast-forward to `main`.
**This task:** build **Phase C · Part B — the example Learning Object**: a folder-per-LO
of placeholder JSON (`lo-config/lo-00-example/`) that later parts load, validate, and
render into the Part A shell.

---

## 0. Part A is DONE — what now exists

Part A (the site shell) shipped and is live on `main` (7 feat commits + 1 fix,
`2711c8d..6235a48`). The page frame every rendered LO lives inside is built and
a11y-locked. Concretely, under `src/components/shell/`:

- **`Header.tsx`** — one `<header><nav aria-label="Main navigation">`; nav links derived
  from a single ordered section list; `hidden` mobile panel; Escape closes it + restores
  focus to the toggle.
- **`Footer.tsx`** — plain `<footer>`, no heading inside.
- **`PageLayout.tsx`** — skip-link → Header → `<main id="content" tabindex="-1">` (one `<h1>`
  - one `<section aria-labelledby>`/`<h2>` per section) → Footer. In-page nav moves focus to
    the target heading. **This is the component Part B/C content flows into.**
- **`InstructionsCallout.tsx`** — the one `.instructions` callout (a plain `<div>`, NOT
  `role="alert"`).
- **`DemoModal.tsx`** — a `dialog`-based demo popup.
- **`LoAccordion.tsx`** — the ONE accordion: `<article><details><summary><h3></summary>
  <div class="details-content">…</div></details></article>`. Native semantics, no
  `aria-expanded`/`role=region`, `grid-template-rows:0fr→1fr` animation over a JS-off
  baseline. (The unused shadcn `ui/accordion.tsx` was removed — only one accordion exists.)
- **`ThemeToggle.tsx`** + **`src/hooks/useTheme.ts`** — dark-mode Switch; toggles `.dark` on
  `<html>`, localStorage-persisted, `prefers-color-scheme` fallback, no-window-safe.
- **`sections.ts`** — `NavSection` type + `DEFAULT_SECTIONS` placeholder list.
- **`src/lib/headingId.ts`** — the ONE heading-id helper (`baseId → {baseId}-heading`),
  used by both sections and accordions.

**Verified:** `bun run test` (397 pass) · `lint` · `lint:css` · `build` all green; browser
pass (landmarks, h1→h2→h3 no skips, keyboard/Escape/focus contract, accordion collapses to
0px / expands, dark-mode persists); **Lighthouse desktop a11y/best-practices/SEO = 100**.

### The integration seam Part B/C plugs into

`src/App.tsx` currently composes the shell by hand: it maps `DEFAULT_SECTIONS` to
`PageSection[]` and inlines placeholder content (an `InstructionsCallout`, a `DemoModal`, two
`LoAccordion`s). `PageSection` is `{ id, label, content? }` and lives in `PageLayout.tsx`.

**The end state (Part C):** `assembleLo(slug)` returns a typed ordered LO, an adapter maps it
to `PageSection[]` (one `LoAccordion` per block/exercise inside the right section), and
`App.tsx` renders `<PageLayout title={lo.title} sections={mapped} themeToggle={<ThemeToggle/>}/>`.
Part B just produces the JSON that adapter will consume — **do not wire the loader yet** (that's
Part C).

---

## 1. What Part B builds

A single example LO as a folder of placeholder JSON. Filler content throughout
(grammar/vocab blocks, exercise prompts, instructions/alert/modal copy) — the goal is to show
authors what the CHROME looks like, NOT to teach a real topic. No real Spanish/French content,
no new audio/image assets beyond existing showcase fixtures.

### Numbering — it is `lo-00`, not `lo-01`

`lo-config/lo-00-example/` keeps `lo-01` free for the first real LO an author adds. Folders
INSIDE keep their own position-in-page ordinal, independent of the LO being `00`:

```
lo-config/lo-00-example/
  lo.json                          ← manifest (LoManifestSchema)
  blocks/01-grammar/block.json     ← the "Grammar" section's one accordion
  blocks/02-vocabulary/block.json  ← the "Vocabulary" section
  exercises/01-<type>/exercise.json ← the "Exercises" section's accordions
  exercises/02-<type>/exercise.json
```

### The schemas already exist — build JSON to match them

`src/config/lo-schema.ts` already ships and Zod-validates the envelopes (all exported):

- `LoManifestSchema` → `{ title, description, blocks: string[], exercises: string[] }`
- `BlockConfigSchema` → `{ type, labels?, content }` (`content` is still a loose object —
  the per-type block `content` shape is intentionally NOT locked; Part B is what grounds it,
  same deferral pattern the 12 exercise engines went through)
- `ExerciseConfigSchema` → `{ type, content, options?, labels? }`
- `ExerciseOptionsSchema` → `{ shuffle?, allowShowAnswers?, … }`

Exercise `content` shapes ARE locked per engine (e.g. `SelectContentSchema` in
`src/exercises/select/select-schema.ts` is final). Pick 1–2 exercise types whose schemas are
already shipped and reuse a known-good fixture shape for their `content`.

The canonical JSON→DOM mapping (which manifest field becomes which DOM node) is in
**`docs/specs/lo-semantic-structure.md` §1a** — build the JSON so it maps cleanly onto the
Part A shell (`blocks[]`/`exercises[]` order → section+accordion order; `title` → the `<h1>`;
`content.instructions` → the one `.instructions` slot; target-language text → `lang={TARGET_LANG}`).

---

## 2. Start-of-session checklist

1. `git fetch origin && git status -sb` — confirm `main` == `origin/main`, clean tree. A
   separate work machine may have unpushed commits — reconcile FIRST.
2. Branch off main: `git checkout -b feat/phase-c-example-lo main`.
3. `bun install`. **TDD guard is ACTIVE repo-locally** (Vitest + `tdd-guard-vitest`). Part B is
   data + a bit of schema/validation logic — genuinely test-first-able (write a failing
   "the example LO parses against `LoManifestSchema`" / "every referenced block/exercise folder
   exists" test, then add the JSON). The guard enforces ONE new failing test at a time — if it
   blocks a pure-data spike, mute via `.claude/tdd-guard/data/config.json → {"guardEnabled":false}`
   (gitignored, per-machine) and re-enable when done. **Never commit `.claude/tdd-guard/`.**
4. Read `src/config/lo-schema.ts` (the envelopes you validate against) and
   `docs/specs/lo-semantic-structure.md` §1a (the JSON→DOM mapping) in full.

---

## 3. Acceptance criteria (one concern per commit)

- [ ] `lo-config/lo-00-example/lo.json` — filler `title`/`description`, ordered `blocks[]` +
      `exercises[]` arrays referencing the folder names below. Parses clean against
      `LoManifestSchema`.
- [ ] `blocks/01-grammar/block.json` + `blocks/02-vocabulary/block.json` — valid
      `BlockConfigSchema`; ground a sensible `content` shape (`instructions` + prose text),
      target-language prose marked for `lang` handling downstream.
- [ ] `exercises/0N-<type>/exercise.json` — 1–2 exercises whose `type` is already in the
      registry and whose `content` matches that engine's shipped schema; reuse a showcase fixture.
- [ ] A test that **validates the whole example LO** — manifest parses, every folder named in
      `blocks[]`/`exercises[]` exists on disk, every `block.json`/`exercise.json` parses against
      its schema. This is the seed of guard b/e; keep it fast (node, no DOM).
- [ ] No real course content, no new binary assets.
- [ ] Verify: `bun run test · lint · lint:css · build` all green. (No browser step — Part B is
      data; rendering happens in Part C/D.)

---

## 4. What comes AFTER Part B (context — do NOT start)

- **Part C — the loader/stitcher.** `loadLo(slug)` reads one LO folder and Zod-validates
  `lo.json` + every block/exercise file; `assembleLo()` stitches them into one typed, ordered
  LO object. Then the shell adapter: LO → `PageSection[]` (one `LoAccordion` per block/exercise)
  → `PageLayout`. This is where `lo-00-example` first actually RENDERS in the browser.
- **Part D — static per-LO HTML.** Node post-build `renderToStaticMarkup` → real per-LO
  `dist/*.html` (mechanism spiked + decided 2026-07-03). The Part A shell markup is already
  no-JS-safe by construction, so it renders correctly statically.
- **Guards b–h** — naming/render-mirror, asset-path, asset-existence, registry-complete,
  token-integrity, css-layer-discipline, w3c/a11y. Only guard a is active today; the Part B
  validation test is the first real step toward guards b + e.

Full Phase C map: `docs/process/2026-07-01-phase-c-brainstorm.md` §6.B–D. Part A recipe (for
reference on conventions): `docs/process/2026-07-12-phase-c-part-a-site-shell-handover.md`.

---

## 5. Guardrails / conventions

- **Schemas are the contract** — validate at load, fail fast + loud (the `courseConfig.parse()`
  pattern). Build JSON to the shipped schema, don't invent new envelope fields.
- **Reuse before authoring** — exercise `content` should mirror an existing shipped fixture; do
  not hand-roll a new exercise `content` shape when a locked schema already exists.
- Conventional commits, one concern each. Do NOT commit `.claude/tdd-guard/` or `graphify-out/`
  (both gitignored). CI = `test + lint + build` on push; branch protection is the real gate.
- Semantic HTML / tokens-only / `<800`-line files still apply to any `.tsx` touched.

---

## 6. Paste-ready resume prompt (Monday)

> Build **Phase C · Part B — the example Learning Object** in `lc-base-template`. Full recipe:
> `docs/process/2026-08-02-phase-c-part-b-example-lo-handover.md`; schema contract:
> `src/config/lo-schema.ts`; JSON→DOM mapping: `docs/specs/lo-semantic-structure.md` §1a. FIRST:
> `git fetch origin`, confirm `main` == `origin/main` (Part A shell is merged at `6235a48`),
> reconcile any unpushed work, branch `feat/phase-c-example-lo` off main. `bun install`. TDD
> guard is ACTIVE (Vitest + `tdd-guard-vitest`) — work test-first (a failing "example LO parses
>
> - every referenced folder exists" test), or mute for pure-data spikes via
>   `.claude/tdd-guard/data/config.json → {"guardEnabled":false}` (gitignored, never commit).
>   Build `lo-config/lo-00-example/` — `lo.json` (LoManifestSchema, filler title/description,
>   ordered `blocks[]`+`exercises[]`), `blocks/01-grammar` + `blocks/02-vocabulary` (BlockConfigSchema,
>   ground a sensible content shape), 1–2 `exercises/0N-<type>` whose type is already registered and
>   whose content matches the shipped engine schema (reuse a showcase fixture) — all filler, no real
>   course content, no new binary assets, `lo-00` so `lo-01` stays free. Add ONE fast node test that
>   validates the whole example LO (manifest parses, every `blocks[]`/`exercises[]` folder exists,
>   every file parses against its schema — the seed of guards b + e). Verify `bun run test · lint ·
lint:css · build`. Conventional commits, one concern each; don't commit `.claude/tdd-guard/`.
>   Do NOT wire the loader/renderer — that's Part C.
