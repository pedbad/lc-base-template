# LC Base Template — BUILD Session Handover

**Purpose:** Start the cold BUILD session for the LC base template, baby-step by baby-step.
**Spec (the contract):** `docs/superpowers/specs/2026-06-15-lc-base-template-design.md` — 24 decisions, 20 sections. **Read it first.**
**Branch:** `docs/lc-base-template-spec` (pushed to origin). Reference impl to PORT FROM: `french-lo-1`.

---

## Concrete setup params (decided 2026-06-16)

- **Repo name:** `lc-base-template`
- **Disk path:** `/Users/ped/Sites/lc-base-template` (sibling of `french/`, directly under `Sites/`)
- **GitHub:** new **PUBLIC** repo via `gh` (account `pedbad`, already authed). Use `gh repo create lc-base-template --public --source=. --remote=origin` after first local commit.
- **Docs:** new repo is SELF-CONTAINED. As an early step, copy these from french-lo-1 into the new repo's `docs/`:
  - `/Users/ped/Sites/french/french-lo-1/docs/superpowers/specs/2026-06-15-lc-base-template-design.md`
  - `/Users/ped/Sites/french/french-lo-1/docs/process/FUTURE_PROJECTS.md`
  - `/Users/ped/Sites/french/french-lo-1/docs/process/LC_BASE_TEMPLATE_BUILD_HANDOVER.md` (this file)
- **Env confirmed ready:** Bun 1.3.3, Node 22.19, gh 2.93 (authed), git 2.50. Nothing to install.
- **Audience = beginner.** Treat every step as a tutorial: explain WHAT each tool is and WHY before running. git, README, Bun, Vite, React, Tailwind, shadcn, Lucide all need a plain-English intro.

---

## Paste-in prompt (new BUILD session)

```
Build the LC base template — a clonable course-factory repo. This is the BUILD session;
brainstorm is DONE. The approved spec is the contract:
  docs/superpowers/specs/2026-06-15-lc-base-template-design.md
  (on branch docs/lc-base-template-spec in french-lo-1-test; read it FIRST, all 24 decisions.)
Reference impl to PORT FROM (not copy wholesale): french-lo-1.

WORK STYLE — BABY STEPS, NON-NEGOTIABLE:
- One tiny step at a time. ONE concern per step (add README, then init Vite, then add Bun,
  then Tailwind, …). Never batch steps.
- After EACH step: stop, show me the exact terminal commands + expected output, let me run
  and verify, and WAIT for my "ok" before the next step.
- ONE small commit per step (conventional commits, no Co-Authored-By — attribution disabled).
- No scaffolding ahead. No "I'll just also add X". If a step reveals more, propose it as a
  SEPARATE next step.

STACK (from spec §3): React + Vite + Bun (pkg/runtime/test) + TS + Zod + Tailwind + shadcn
+ Lucide + Prettier/ESLint/Stylelint + husky/lint-staged. Bun installs/runs/tests; Vite builds.

GUARDS (spec §5, build incrementally — do NOT try to land all 8 at once):
a config-schema(Zod) b naming+render-mirror c asset-path d asset-existence e registry
f token-integrity g css-layer-discipline h w3c/a11y. Each guard = its own step, with a
deliberately-failing fixture to prove it blocks, then green.

KEY CONSTRAINTS (do not drift):
- TS+Zod from day one. Static pre-render (one .html per LO, auto-discovered from lo-config/).
- Tokens: primitive→semantic→component; no raw hex/px; CSS fully layered, zero !important.
- Render-mirror naming: ordinal+type, section-scoped. Naming lo-01/ images/ semantic folders.
- Asset paths: resolveAsset() runtime, %BASE_URL% static head. Env-driven base path.
- Brand: Cambridge Slate palette baked in; logos w/ trademark disclaimer; Feijoa git-ignored
  (commercial), Open Sans default; README/LICENSE dual MIT+CC-BY-4.0 + disclaimer.
- Semantic DOM: header>nav → main → section → <article> per accordion. a11y CI-gated.
- 5 docs (README/CONTRIBUTING/DESIGNER/STRUCTURE/AGENTS); sandbox renders them; AGENTS.md as
  AI drift-guard.

DELIVERABLE PER STEP: commands to run, what I should see, one commit. Start at Step 1 (README)
and ASK before Step 2. Maintain the running task checklist (below) and tick items as we go.
```

> If the spec isn't on the checked-out branch in the new session:
> `git fetch && git show origin/docs/lc-base-template-spec:docs/superpowers/specs/2026-06-15-lc-base-template-design.md`

---

## Baby-step build sequence (terminal, per step)

Each is its own step + commit. Stop and test after every one.

| #   | Step                        | Key terminal                                                                     | Verify                                   |
| --- | --------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------- |
| 1   | New repo + README           | `mkdir lc-base-template && cd $_ && git init && bun init -y` (then write README) | `git log` shows 1 commit; README renders |
| 2   | Vite + React + TS           | `bun create vite@latest . --template react-ts`                                   | `bun run dev` → React page at localhost  |
| 3   | Bun as runtime/test         | confirm `bun install`, add `bun test` smoke                                      | `bun test` green (1 trivial test)        |
| 4   | Prettier                    | `bun add -d prettier` + `.prettierrc` + `.vscode/settings.json`                  | `bun run format` no diff churn           |
| 5   | ESLint + jsx-a11y           | `bun add -d eslint @typescript-eslint/* eslint-plugin-jsx-a11y`                  | `bun run lint` green                     |
| 6   | Stylelint                   | `bun add -d stylelint stylelint-config-standard`                                 | `bun run lint:css` green                 |
| 7   | Husky + lint-staged         | `bun add -d husky lint-staged && bunx husky init`                                | bad commit blocked locally               |
| 8   | Tailwind v4                 | `bun add tailwindcss @tailwindcss/vite` + `@layer` setup                         | utility class renders                    |
| 9   | shadcn + Lucide             | `bunx shadcn@latest init` → add Button; `bun add lucide-react`                   | Button + icon render                     |
| 10  | Token files                 | `palette.css` / `tokens.css` (Slate + light/dark), fully layered                 | swatch page shows tokens                 |
| 11  | Zod + `course.config.ts`    | `bun add zod` + schema + validate at load                                        | bad config → error                       |
| 12  | LO schema + example LO JSON | Zod LO schema + 1 example LO (4 accordions)                                      | example LO validates                     |
| 13  | Registry + 1 exercise       | `lazyRegistry` + port first exercise cluster                                     | exercise renders from config             |
| 14  | Static pre-render           | build scans `lo-config/` → one `.html` per LO                                    | `dist/` has real per-LO files            |
| 15  | Debug sandbox               | sandbox entry (debug-flag-gated)                                                 | palette/fonts/preview visible            |
| 16  | Exercise showcase           | port showcase, isolated fixtures                                                 | all ported types render                  |
| 17+ | Guards a–h                  | one guard per step + failing fixture + green                                     | each guard blocks then passes            |
| …   | Remaining 12 exercises      | cluster-by-cluster, debt cleared                                                 | showcase grows                           |
| n   | 5 docs + CI + LICENSE       | CONTRIBUTING/DESIGNER/STRUCTURE/AGENTS + GH Actions                              | CI runs all guards                       |

---

## Per-step checks (run before each commit)

```
bun run format        # Prettier clean
bun run lint          # ESLint + jsx-a11y green
bun run lint:css      # Stylelint green
bun test              # tests green
bun run guards        # (once guards exist) all green
bun run build         # (once build exists) succeeds
```

---

## Task checklist (carry forward, tick as you go)

```
SETUP
[x] 1  repo init + README
[x] 2  Vite + React + TS
[x] 3  Bun runtime/test
[x] 4  Prettier (+ .vscode format-on-save)
[x] 5  ESLint + jsx-a11y
[x] 6  Stylelint
[x] 7  Husky + lint-staged (pre-commit)
[x] 8  Tailwind v4 (@layer order)
[x] 9  shadcn + Lucide
THEME
[x] 10 Token files (Slate, light+dark, layered) — 3 switchable primary presets + src/styles/README.md
[x] 10b Typography (Open Sans default + Feijoa display, git-ignored; font tokens in palette.css) — baseline on <html> (100% / unitless 1.4); @theme inline rewired off Geist
[x] 11 course.config.ts (Zod) — src/config/, schema+infer type, validate-at-load, proven via bun test
[x] 12 ui-strings.ts (Zod, two-layer) — global strictObject (all keys req) + partial override + resolveLabel; 15 keys (A+B), English; proven via bun test
CONTENT ENGINE
[ ] 13 LO schema + example LO FOLDER (folder-per-LO) — [x] 13a schemas (LoManifest + Block/ExerciseConfig shared envelope, labels→UiStringsOverrideSchema, loose content, src/config/lo-schema.ts, proven via bun test) · [ ] 13b example lo-01/ (manifest + 4 accordions) · [ ] 13c loader/stitcher (validates parts + assembled LO)
[x] 14 Exercise engines (RESEQUENCED — see docs/specs/2026-06-19-exercise-engines-design.md)
    [x] Phase A foundation — exercise-types, options schema+enum, scoring/shuffle/reveal utils (src/exercises/lib/, bun test)
    [x] Phase B — port 12 engines one-by-one (tsx + content schema + options + labels + registry + showcase fixture)
        [x] shared lib: html.ts (decodeHtmlEntities) + parsing.ts (parseSentence, parseChoiceBlank) — bun test
        [x] shared shell (extracted @ #2): lib/prepareChoiceItems.ts (generic) + ExerciseFooter.tsx + ResultSlot.tsx — bun test
        [x] #1 select — schema + SelectExercise.tsx + 2 fixtures (rows + inline); --success token added
        [x] #2 inline-choice — schema (TDD) + InlineChoiceExercise.tsx (radio-pill group, arrow-key a11y) + 1 fixture; existing tokens only
        [x] #3 radio-quiz — schema (TDD, `*`-array single-correct refine) + RadioQuizExercise.tsx (multiple-choice questions, shared ChoicePillGroup, wrong-only explanations) + 1 fixture; existing tokens only
        [x] #4 inline-gap — schema (TDD) + InlineTypedGapExercise.tsx (typed blanks in prose) + audio subsystem ported (src/audio/, SequenceAudioController, useRowAudio) + demo clips + 1 fixture
        [x] #5 typed-transform — schema (TDD) + TypedTransformExercise.tsx (type transformed form) + shared TextEntryRuntime + charDiff/answers libs + 1 fixture
        [x] #6 dictation — schema (TDD) + DictationExercise.tsx (transcribe audio, Spanish punctuation tolerance) + 1 fixture
        [x] #7 line-match — schema (TDD) + LineMatchExercise.tsx (image↔word) + LineMatchConnectors.tsx (desktop SVG connector layout) + assets.ts helper + 1 fixture
        [x] #8 word-spot — schema (TDD, ≥1 [bracketed] target refine) + WordSpotExercise.tsx (own click-mark model, state-driven marks, real <button> part-words for a11y, reveal via canRevealAnswers) + word-spot.css (layered, semantic tokens) + 1 fixture; existing tokens only
        [x] #9 memory-match — schema (TDD, ≥2 pairs + unique-key refine) + MemoryMatchExercise.tsx (own flip/match model, pairId matching, audio-on-match, always-shuffled deck, options.sampleSize=nPairsToPlay) + MemoryCard.tsx (3D flip button, a11y) + shared reorderAnimation.ts (FLIP, reduced-motion aware) for animated show-answers reorder + memory-match.css (layered, template tokens) + 1 fixture (reuses line-match SVGs)
        [x] #10 word-order — schema (TDD, ≥2 words refine) + WordOrderExercise.tsx (sequence/placement: failCount + complete, always-scrambled deck, click-to-select/click-to-swap instead of mouse-only HTML5 dnd for keyboard a11y, canRevealAnswers reused) + word-order.css (layered, semantic tokens) + reuses reorderAnimation.ts (FLIP) for the swap animation + 1 fixture
        [x] #11 phrase-reorder — schema (TDD, ≥2 rows refine) + PhraseReorderExercise.tsx (sequence/placement: reuses word-order's swap/FLIP/click-select+native-dnd mechanics, but each slot pins a fixed non-draggable prompt/audio pair — only the phrase card moves) + phrase-reorder.css (layered, semantic tokens, grid columns collapse when no row has a prompt) + reuses reorderAnimation.ts (FLIP) + 1 fixture (fixed prompt + per-row audio)
        [x] #12 drag-fill-gaps — schema (TDD, ≥2 [bracketed] blanks refine, ported `phrases` variant only — other 4 legacy table layouts YAGNI'd) + DragFillGapsExercise.tsx (sequence/placement: click-to-select-tile-then-place-in-slot + native-dnd, tile bank <-> inline slots across two containers so no FLIP; Check locks correct placements and bounces wrong ones back to the bank) + drag-fill-gaps.css (layered, semantic tokens) + 1 fixture (shuffled bank) — **all 12 engines ported, Phase B complete**
    [ ] Phase C — example LO (13b/13c) + static pre-render (15) from proven engines
    [ ] KNOWN GAP (found 2026-07-01, not yet fixed): none of the 12 engines wrap
        target-language content in `lang="{course.config languageCode}"` — `<html>`
        is `lang="en"` (UI chrome only); learner content has no lang override, so
        screen readers mispronounce it (WCAG 3.1.2). See
        docs/specs/lo-semantic-structure.md §3 and the paste-in prompt at the
        bottom of this file ("lang retrofit").
[ ] 15 Static pre-render (auto-discover lo-config/*/lo.json)
DEV ARTIFACTS
[ ] 16 Debug sandbox (palette/fonts/SVG/preview)
[x] 17 Exercise showcase (built ahead of checklist during Phase B — src/showcase/{Showcase.tsx,fixtures.ts}; 12 engines, 18 fixtures)
[ ] 18 Sandbox renders docs as HTML
GUARDS (each: failing fixture → block → green)
[ ] 19 a config-schema   [ ] 20 b naming+render-mirror   [ ] 21 c asset-path
[ ] 22 d asset-existence [ ] 23 e registry               [ ] 24 f token-integrity
[ ] 25 g css-layers      [ ] 26 h w3c/a11y
ENGINES
[x] 27 Port remaining 12 exercises (superseded by step 14 Phase B — all 12 ported there, see log above)
DOCS + CI + DEPLOY
[ ] 28 README + LICENSE (MIT + CC-BY-4.0 + disclaimer)
[ ] 29 CONTRIBUTING / DESIGNER / STRUCTURE / AGENTS.md
[ ] 30 STRUCTURE tree auto-gen (bun run docs:tree)
[ ] 31 GitHub Actions CI (all guards, oven-sh/setup-bun)
[ ] 32 Env base path + resolveAsset()/%BASE_URL% + favicon — resolveAsset() itself already exists (src/lib/assets.ts, BASE_URL-aware, used by AudioClip); remaining: favicon still hardcoded `/favicon.svg` in index.html (not `%BASE_URL%`), no base-path build config yet
[ ] 33 Mark repo as GitHub "template repo"
```

---

## Gotchas (carry forward)

- Attribution disabled — no `Co-Authored-By`.
- Deploy: lcdev + lcitc both serve under a non-root base → env-driven base path up front.
- Two relative-path-under-non-root-base bugs bit french-lo-1 (runtime fetch #35, favicon #28):
  `resolveAsset()` for runtime fetches, `%BASE_URL%` for static `<head>` assets — from day one.
- Feijoa is commercial (Klim) — never commit the font file; Open Sans is the public default.
- Cluster note: ClozeTyping/TypedTransform/Dictation share `TextEntryExerciseRuntime` — port
  together; decide whether to resolve its `TODO(component-split)` during the port.

---

## Paste-in prompt — target-language `lang` retrofit (new session)

Found while brainstorming Phase C (2026-07-01), not yet fixed. Self-contained —
paste as-is into a fresh session.

```
Fix a WCAG 3.1.2 gap across the 12 exercise engines in lc-base-template: none of
them mark up target-language content with a `lang` attribute.

CONTEXT:
- `index.html` has `<html lang="en">` — that's the UI chrome language, correct
  as-is. Don't touch it.
- `src/config/course.config.ts` has `languageCode` (e.g. "es") — the single
  source of truth for the course's TARGET language. Nothing reads it for `lang`
  attribution today.
- All 12 engines under `src/exercises/*/` render learner-facing content
  (sentences, word tiles, options, phrases, vocab) with no `lang` wrapper at all.
  Screen readers pronounce it with English phonetics — wrong for a language
  course.
- Full rationale: `docs/specs/lo-semantic-structure.md` §3 ("lang on
  target-language content").
- Checklist tracking: `docs/process/LC_BASE_TEMPLATE_BUILD_HANDOVER.md`, step 14
  "KNOWN GAP" line.

THE RULE (do not deviate):
- Target-language TEXT (authored `content` — sentences, words, phrases, options,
  vocab, anything the learner reads/hears as the language being taught) gets
  `lang={TARGET_LANG}`.
- UI CHROME (Check/Reset/Show-answer button labels, status counts like "3 / 7",
  aria-labels, footnotes that are course-author English instructions) does NOT
  get the target-language `lang` — it inherits `lang="en"` from `<html>`.
- These two are intermixed in the same component in most engines — the work is
  figuring out, per engine, exactly which JSX subtree is content vs chrome, and
  wrapping only the content side. Do not wrap an engine's whole root container —
  that would wrongly mark its Check/Reset buttons as Spanish too.

WORK STYLE (matches how the 12 engines were originally built — see the same file,
Phase B log): ONE ENGINE PER STEP, one commit each. Verify gate every step:
`bun run format && bun run lint && bun run lint:css && bun test && bun run build`.
No batching multiple engines into one commit.

STEP 0 (once, before any engine):
- Add a single shared export for the target language — e.g.
  `src/config/course.config.ts` already parses `languageCode`; add a small
  re-export (or a `src/lib/lang.ts` helper) so every engine imports ONE constant
  instead of reaching into course.config directly. Bun-test it trivially if it's
  more than a one-line re-export.

THEN, one engine at a time (select, inline-choice, radio-quiz, inline-gap,
typed-transform, dictation, line-match, word-spot, memory-match, word-order,
phrase-reorder, drag-fill-gaps):
- Read the engine's .tsx, identify every place learner-facing target-language
  text renders (careful with `<select>`/`<option>` in `select` — `lang` is valid
  on `<option>` too; careful with parsed segments in inline-gap/word-spot/
  drag-fill-gaps where content and structure are interleaved token-by-token).
- Add `lang={TARGET_LANG}` at the smallest sensible wrapping point — usually one
  wrapper per content region (a sentence, a word bank, a phrase list), not one
  attribute per individual word/token, unless the engine's structure makes a
  region-level wrapper impossible.
- Verify in the showcase (`exercise-showcase.html`) — inspect the rendered DOM
  (`preview_inspect` or devtools) and confirm `lang="{code}"` sits on content
  elements and is ABSENT from Check/Reset/Show-answer/status elements.
- Verify gate, then commit: `fix: add lang={TARGET_LANG} to <engine> content
  (WCAG 3.1.2 retrofit)`.

DELIVERABLE PER STEP: which JSX subtree got wrapped and why, the diff, one
commit. Ask before moving to the next engine if anything is ambiguous (e.g. an
engine mixing target-language and English in the same sentence, like a
translation exercise) rather than guessing.
```
