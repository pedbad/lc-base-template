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
  (commercial), Open Sans default; README/LICENSE dual MIT+CC-BY-NC-4.0 + disclaimer.
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
bun run test          # tests green (Vitest — NOT `bun test`, which throws on
                      #   the import.meta.glob in load-lo-glob.ts)
bun run guards        # the fast guard subset (vitest run src/guards)
bun run build         # (once build exists) succeeds
```

---

> **For the ordered live worklist, read `docs/process/TODO.md`.** This checklist is the
> numbered build history and the tick record; TODO.md says what to do next and why.

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
[x] 13 LO schema + example LO FOLDER (folder-per-LO) — [x] 13a schemas (LoManifest + Block/ExerciseConfig shared envelope, labels→UiStringsOverrideSchema, loose content, src/config/lo-schema.ts) · [x] 13b example lo-config/lo-00-example/ (manifest + sections + blocks + exercises + modal) · [x] 13c loader/stitcher (src/lo/: assembleLo + disk/glob readers, validates parts + assembled LO)
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
    [x] Phase C — Part A site shell · Part B example LO (13b) · Part C loader (13c) · Part D static pre-render (15); plus inline rich text + modals (docs/specs/lo-rich-text-modals.md)
    [x] KNOWN GAP (found 2026-07-01, fixed 2026-07-01): none of the 12 engines wrapped
        target-language content in `lang="{course.config languageCode}"` — `<html>`
        is `lang="en"` (UI chrome only); learner content had no lang override, so
        screen readers mispronounced it (WCAG 3.1.2). Fixed via `src/lib/lang.ts`
        (`TARGET_LANG` shared constant) + one commit per engine, wrapping only
        target-language content subtrees (never chrome/aria-label/sr-only text).
        Also caught + fixed along the way: `footnote` fields are actually authored
        in the target language in this course's fixtures (not "course-author
        English instructions" as the original rule assumed) — they get
        `lang={TARGET_LANG}` too. See docs/specs/lo-semantic-structure.md §3.
[x] 15 Static pre-render (auto-discover lo-config/*/lo.json) — scripts/prerender.tsx, post-build Bun script, one dist/<slug>.html per folder; hydrates; no-JS readable; BASE_URL feeds bundle + prerender; slug collisions fail the build
[x] 15b Course landing page (Phase D) — dist/index.html is now the course index, not a
    duplicate of the first LO: CourseHome (hero from course.config + one card per LO
    folder, title/description/image from each manifest) + LessonSideNav (left
    off-canvas nav over every LO: aria-expanded, Escape, focus trap + restore, scroll
    lock, inert when closed, reduced-motion in CSS) + buildLoIndex (src/lo/lo-index.ts,
    reader-agnostic). index.html's root div is unstamped and main.tsx branches on
    data-lo-folder, so one entry serves both pages; LO header brand now links home.
    Decisions: (A) REVISED same day — loDevPages() (src/build/lo-dev-pages.ts) serves
    /<slug>.html on the dev server by stamping data-lo-folder through the shared
    injectRootDiv(), because without it Vite's SPA fallback answered a lesson card with
    the unstamped landing template (silent bounce, no 404); dev still does not
    prerender, so `bun run build && bun run preview` stays the no-JS check;
    (B) the lo-NN- folder ordinal is the ONLY source of course order,
    courseConfig.loOrder deleted; (E) optional `image` added to the LO manifest, with
    public/images/lo-placeholder.svg shipped and wired into lo-00-example.
    Full record: docs/process/2026-08-06-phase-d-landing-page-handover.md §5.
DEV ARTIFACTS
[ ] 16 Debug sandbox (palette/fonts/SVG/preview)
[x] 17 Exercise showcase (built ahead of checklist during Phase B — src/showcase/{Showcase.tsx,fixtures.ts}; 12 engines, 18 fixtures)
    [x] 17b Showcase OPT-IN per build (2026-09-03) — it shipped to every deploy as an
        unlinked but public URL since Phase C · Part D §5. src/build/build-entries.ts
        (isShowcaseRequested, fail-closed, 5 tests) gates rollupOptions.input:
        `bun run build` = course only, `SHOWCASE=1 bun run build` = + showcase. Dev
        unaffected — Vite serves root-level .html regardless of the input list.
[ ] 18 Sandbox renders docs as HTML
GUARDS (each: failing fixture → block → green) — 0 of 8 open; ALL EIGHT LIVE, see TODO.md §A
    [x] 20b DONE 2026-09-07 — src/guards/render-mirror.ts + 17 tests. An LO exists
        because its FOLDER exists; its page structure exists because lo.json NAMES it.
        Two registries, so two silent drifts: a ref with no folder behind it (the page
        renders short, saying nothing), and a folder no ref names (the author writes an
        exercise, it parses, it never appears). The mechanism is a SET DIFF per kind
        (blocks/exercises/modals) — neither a URL sink like c nor a key like d would
        work, because a ref is only wrong RELATIVE to the folders and vice versa.
        Unreferenced is an ERROR, not a warning: lo-schema.ts decision D1 already
        declares refs rather than globbing them precisely so an undeclared file is
        detectable, a Vitest warning has no reader, and the drafting escape hatch is to
        declare the ref. The NAMING half is here too — loSlug() is called through (never
        re-implemented) so every lo-config/ folder is provably lo-NN-<slug>; that was
        already loud at build time via loOrdinal(), but NO test asserted it, so a
        malformed folder survived a green `bun run test` and died at `bun run build`.
        Manifest read raw and defensively, with find-count floors, so a lo.json reshape
        fails loudly instead of silently disabling the guard. Thinned the now-duplicated
        existsSync half out of example-lo.test.ts, which was written as this guard's
        seed. Repo was already clean; verified by renaming a referenced folder, adding
        an unreferenced one (80 other test files stayed green — proof it was silent),
        and adding a valid LO whose only fault was its folder name.
    [x] 21c DONE 2026-09-03 — src/guards/asset-path.ts + 21 tests. Source scan: an
        asset-looking string literal in a URL sink (src/href/poster/srcSet attr, or
        AudioManager.play/new Audio/fetch arg) without resolveAsset() fails the suite;
        plus every <link> href in index.html / exercise-showcase.html must carry
        %BASE_URL% (#28). Requiring a SINK is what keeps authored LO/fixture paths —
        which are data and must stay bare — from being flagged. Comments stripped first
        (string-aware, so the // in a URL is not mistaken for one). Repo was already
        clean; verified by planting a violation in Footer.tsx and watching it block.
    [x] 22d DONE 2026-09-03 — src/guards/asset-existence.ts + 11 tests. Collects every
        value under an asset KEY (audio, image) from lo-config/**/*.json and every
        showcase fixture, then asserts a file exists under public/. Collects by key, not
        by string shape — the opposite call to guard c, because this reads DATA
        describing a URL while c reads CODE building one, and `title: "audio/x.mp3"` is
        a title. Both NFC and NFD spellings are tried (Mac filenames are NFD, which is
        why resolveAsset normalises). The sweep asserts a find-count floor so a schema
        field rename fails loudly instead of silently disabling the guard. Verified by
        pointing lo.json at a missing image and watching it block.
    [x] 23e DONE 2026-09-07 — src/guards/registry-completeness.ts + 30 tests. Unlike
        b/c/d this guards a LOUD failure that ships anyway: both renderers already
        handle an unknown type by printing a red "No engine/renderer registered for
        type X", so the build passes, the suite stays green, and the learner meets the
        error. Two halves. (1) THE AUTHORING CONTRACT over EXERCISE_TYPE_KEYS — spec
        §223 says a new type is register-in-lazyRegistry + showcase-fixture + Zod
        schema and guard e fails if any step is skipped; every skipped step is
        reported, not just the first. The schema step is a CONVENTION check
        (src/exercises/<type>/<type>-schema.ts) rather than a central map, because a
        map could only live in the guard, making "add yourself to the guard" a fourth
        uncheckable step; the test then imports each file and asserts it exports a real
        Zod schema, so a renamed-but-empty file cannot pass. (2) AUTHORED TYPES RESOLVE
        — every type in lo-config/**/{block,exercise}.json resolves in its own
        registry. Exercise types have the Zod enum behind them; BLOCK types have
        NOTHING (BlockConfigSchema.type is a bare string, BLOCK_RENDERERS is keyed by
        free string), so for blocks this guard is the only backstop that exists.
        Compile-enforced facts are deliberately not re-asserted (Partial<Record<
        ExerciseType>>, ShowcaseFixture.type, the exhaustive EXERCISE_INSTRUCTIONS),
        and content PARSING is explicitly out of scope — guard e proves a schema
        exists, guard a's family proves content fits it. Corrected two stale claims
        while here: lazyRegistry's "guard e will…" header, and lo-schema.ts, which
        wrongly said per-type content tightening was guard e's job. Repo was already
        clean; verified by adding an unbacked engine key (all three steps reported),
        typo'ing a block type (81 other test files stayed green — the block side had
        zero protection), renaming a schema file, unregistering an engine, and gutting
        a schema file's exports.
    [x] 24f DONE 2026-09-07 — src/guards/token-integrity.ts + 27 tests, plus
        src/guards/css-source.ts, the stylesheet reader f and g share. Protects the
        token chain's VALUES: palette.css holds raw values, tokens.css names meanings,
        components read tokens, so a hex written into a component is invisible from the
        top of the chain and a re-skin silently misses it. Repo was already fully
        compliant, which INVERTS the job — the work is not detecting violations but not
        flagging correct code, and the survey found three ways a naive rule fires on
        something right. So px is a PROPERTY ALLOWLIST, not the blanket ban spec §138
        reads as: legitimate on border*/outline*/box-shadow/backdrop-filter/perspective/
        transform, where 44 of the 52 sites are hairlines and focus rings and rem would
        actively be wrong. A px inside a token-referencing calc() is allowed — the four
        `calc(var(--radius) ± 4px)` sites go THROUGH the token, a derivative not a
        bypass, and that was the survey's biggest reversal. A px in a custom property is
        allowed (naming a raw value is what a token IS); a hex in one is not (Layer 1 is
        palette.css alone). Hex banned everywhere but palette.css. src/components/ui/ is
        exempt from the markup half — shadcn regenerates it, so nine of the eleven
        arbitrary-value hits are code no author here can keep clean; guard c set the
        precedent for a written-down scope exclusion. A bracket group followed by `:` is
        a Tailwind VARIANT, so `min-[980px]:hidden` reads as the media query it is.
        Mechanism was DECIDED, not inherited: stylelint's
        declaration-property-unit-allowed-list cannot express the calc() exemption and
        cannot see TSX at all, and a split rule would make `bun run guards` a half-truth.
        stripComments()/lineAt() exported from guard c rather than copied — three guards
        running are only correct because comments are stripped first — and gained a
        `lineComments` flag because CSS has no `//` and honouring one would blank the
        tail of any unquoted url(https://…). Verified by planting `padding: 24px` in
        home.css and `color: #cdd2d8` in flashcards.css (82 other test files stayed
        green — proof it was silent), then `p-[24px]` and `style={{ color: '#ff0000' }}`
        in LineMatchExercise.tsx, with min-[980px]:block on the same line correctly
        ignored. Floors assert 15 stylesheets, 100+ markup files, 50+ px sites and
        palette.css's own 17 primitives, so a rename fails loudly.
    [x] 25g DONE 2026-09-07 — src/guards/layer-discipline.ts + 21 tests. Where f
        protects the chain's values, g protects its ability to be overridden at all:
        both banned structures win the cascade unconditionally, not by specificity but
        by sitting outside the ordering the layers establish. An unlayered rule beats
        every layered one; one !important inverts layer order on top (inside a layer the
        FIRST layer's important declaration wins), making the order mean the opposite of
        what it reads as. "The file contains @layer" was never the check — all 15 files
        already grep positive, and a file can open a layer, close it, and carry on with
        bare rules. So g tracks brace depth and the enclosing at-rule per block. That
        assertion is the one thing the §A-g survey could not make; it now holds — 169
        selector rules, every one layered, zero real !important. No live bug found. Four
        structures a naive depth counter gets wrong, each decided in the header:
        statement at-rules are legal unlayered (@import is REQUIRED first, so index.css's
        five could not be layered even in principle; @charset/@custom-variant/`@layer a,
        b;` have no block); descriptor at-rules are legal unlayered AND their inner
        blocks are not rules (@font-face and @theme inline are what index.css holds at
        top level, and a @keyframes `0% { … }` step is the trap); :root blocks ARE
        ordinary rules and ARE checked, because custom properties cascade by layer too —
        an unlayered :root beats a layered one, so the token files wrapping theirs in
        @layer base is load-bearing, not habit; @media is transparent to the cascade and
        must be looked THROUGH both ways — nested in a layer its rules stay layered (all
        nine in the repo, and flagging them would flag correct code), at top level it
        layers nothing. Comment stripping is the whole !important half: all six matches
        are engine file headers PROMISING "no raw hex, no !important". Scope is CSS only
        — Tailwind's trailing-! in src/components/ui/ is generated utility precedence
        inside Tailwind's own layer, so extending to markup buys an exemption and no
        signal. Verified by planting an unlayered `.lo-shell` rule in shell.css and
        `999px !important` in word-order.css: both blocked with truthful file:line while
        83 other test files stayed green, and `bun run lint:css` passed CLEAN on both —
        stylelint offers no coverage here, which settles the mechanism choice for g too.
    [x] 26h DONE 2026-09-07 — src/guards/semantic-dom.ts + html-source.ts (the
        rendered-markup reader) + rendered-markup.tsx (the 26 documents it validates),
        84 tests. The last guard, and the second half of spec guard h: the FIRST half
        was already live and CI-enforced before any of this — eslint-plugin-jsx-a11y is
        wired into eslint.config.js. What was missing is what §95/§309 name, a checker
        over RENDERED output, and the reason it cannot be a lint rule is that jsx-a11y
        reads one JSX file at a time while every §17 clause is a property of the
        ASSEMBLED page: that LoAccordion renders inside a section LoPage labelled, that
        the h2 above it came from a section title and the h3 inside it from a block
        title, that the nav toggle's aria-controls resolves to a panel another component
        renders. Checks the heading outline, header > nav[aria-label], labelled sections,
        one <article> per accordion, layout tables, accessible names, decorative icons,
        id references, <strong>/<em>, interactive ARIA roles that cannot take focus or
        have no name, and <html lang> in the source template. THE SURFACE WAS ALREADY
        CLEAN — both pages match §17 exactly, all 15 engines are clean, and the one real
        defect (SpeakerSvg with no aria-hidden) was fixed in 1ce0275 before the guard
        existed — so, as with f and g, the expensive half was NOT FLAGGING CORRECT CODE.
        Five narrowings, each a pattern the repo genuinely uses that a first-guess rule
        reports: a control can be named by a <label for>, and 17 are (shadcn's select
        trigger has no text of its own, and select/line-match give it an sr-only label,
        legal because <button> is labelable); an aria-hidden control needs no name (Base
        UI's five mirror inputs exist so a styled select submits with a form); a <table>
        is judged by its headers, not its looks (dictation's two <th>s are sr-only, which
        reads as a layout table and is the opposite, so the check is "has a <th> or
        <caption> and is not role=presentation"); tabindex="-1" is not a defect — it is
        on main and all four section h2s deliberately; and a fragment is not a page — 24
        of the 26 documents are single engines with no h1 and no landmarks, and
        conjugation legitimately opens at h3, so the page-scope rules apply only to
        pages. Three decisions all taken AGAINST the obvious answer: no jsdom, so no
        axe-core (it would reverse the deliberate node-env choice for the whole suite,
        and the suite already renders to strings — a string is all a §17 checker needs;
        axe's WCAG coverage stays a separate later decision); no new dependency either,
        which reversed the survey's first answer of html-validate, because there is ZERO
        dangerouslySetInnerHTML in the repo — all four grep hits are comments saying so —
        so every byte of markup is React-emitted and the "w3c" half of "w3c + a11y" is
        guaranteed by construction, leaving only semantics no off-the-shelf ruleset
        expresses ("one <article> per accordion", "section count == h2 count"); and ALL
        15 ENGINES, not the 2 a default build prerenders, because the other thirteen live
        behind SHOWCASE=1 and appear in no built page, so a guard over the pages alone
        would have covered 2 of 15 while reading as though it covered the lot (guard d's
        staleness lesson). NEEDS NO dist/, which is why it passes on a clean checkout:
        the pages are rendered in process from the same component trees
        scripts/prerender.tsx uses, with the same loader, and the result is
        BYTE-IDENTICAL to the body it writes (23007 and 7324 bytes, verified against a
        fresh build). Reading dist/ would be strictly worse even when it exists — a stale
        dist/ validates last week's markup and passes. Native-first was narrowed to what
        rendered output can decide, and the lint route was TRIED and rejected:
        jsx-a11y/prefer-tag-over-role is not in flatConfigs.recommended, and enabling it
        fires 16 times, every hit <p role="status"> wanted as <output> — a swap that
        changes nothing an assistive technology does. Verified by re-planting the 1ce0275
        defect: `bun run lint` passed CLEAN on it, so jsx-a11y offers no coverage there,
        and 84 other test files stayed green — the proof the failure was otherwise
        silent — while it fired on 5 engine fragments no test had ever covered, which is
        decision 3 paying for itself. Two other plants (a section h2 → h4, the nav
        toggle's aria-label stripped) were caught by guard h AND by the colocated
        PageLayout.test.tsx / Header.test.tsx, so they are not evidence for h: the shell
        is well covered, the engines' markup was not. Floors assert both pages, all 15
        engine keys against EXERCISE_TYPE_KEYS, 24+ fixtures and plausible
        control/icon/id/heading totals, so a rename fails loudly. eslint.config.js: the
        Fast-Refresh rule is off under src/guards/ (test-only, not an HMR boundary), and
        its header no longer promises an axe/pa11y half that was deliberately not built.
[x] 19 a config-schema   [x] 20 b naming+render-mirror   [x] 21 c asset-path
[x] 22 d asset-existence [x] 23 e registry               [x] 24 f token-integrity
[x] 25 g css-layers      [x] 26 h w3c/a11y
ENGINES
[x] 27 Port remaining 12 exercises (superseded by step 14 Phase B — all 12 ported there, see log above)
DOCS + CI + DEPLOY
[x] 28 README + LICENSE (MIT code + CC-BY-NC-4.0 content + brand/Feijoa disclaimer; copyright The Language Centre, University of Cambridge; README License section rewritten to link it. NonCommercial chosen 2026-09-03 over plain BY: content is Language Centre property, commercial reuse needs its permission)
[ ] 29 CONTRIBUTING / DESIGNER / STRUCTURE / AGENTS.md
[ ] 30 STRUCTURE tree auto-gen (bun run docs:tree)
[x] 31 GitHub Actions CI (oven-sh/setup-bun) — .github/workflows/ci.yml runs lint ·
    lint:css · format:check · test · build. Guards are Vitest tests, so each one joins
    CI automatically the moment it lands — `test` already enforces a, b, c, d and e.
    CLOSED 2026-09-07 with `bun run guards` (`vitest run src/guards`), the fast local
    subset: 211 tests in ~0.7s vs the suite's ~2s (79 when it closed; f, g and h have
    since joined). A path glob, not a list, so a new
    guard joins when its file lands (a hand-kept list is what goes stale — guard e's
    convention-over-map argument). Guard a is deliberately outside it: config-schema is
    not a sweep, it is Zod running inside assembleLo on every load, with contract tests
    colocated at src/config/lo-schema.test.ts and every on-disk LO parsed by
    lo-rich-text.test.ts. No separate CI step added — `test` is a strict superset, so a
    guards step would re-run the same tests for no extra signal.
[x] 32 Env base path + resolveAsset()/%BASE_URL% + favicon — resolveAsset() (src/lib/assets.ts, BASE_URL-aware); favicon now `%BASE_URL%favicon.svg` in index.html AND exercise-showcase.html (bug #28 closed); `base` reads process.env.BASE_URL in vite.config.ts, so `BASE_URL=/course/ bun run build` feeds bundle + prerender together
[x] 33 Mark repo as GitHub "template repo" — DONE 2026-09-07, verified
    `isTemplate: true`. Adds the "Use this template" button, so a new course starts
    from a single initial commit instead of a fork. Fork was the only route before,
    which dragged this repo's whole build history into every course AND linked the
    two, so a new author's pull requests would have defaulted to targeting here.
    Reversible, and changes nothing about this repo — it only adds an option.
BEFORE SHARING WITH OTHER DEVELOPERS (pre-share gate — none of these block solo work)
[ ] 34 Enable branch protection on main — docs/BRANCH_PROTECTION.md. DEFERRED BY DECISION
    2026-09-03: main takes direct pushes while this is a single-maintainer build; the
    verify gate is run by hand per commit. Trigger to enable = a second person gets push
    access. Do NOT enable `Require approvals: 1` + `Do not allow bypassing` with one
    collaborator — GitHub forbids self-approval, so the merge button locks forever.
    Solo-safe subset if wanted early: PR required + status checks only.
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
`bun run format && bun run lint && bun run lint:css && bun run test && bun run build`.
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
