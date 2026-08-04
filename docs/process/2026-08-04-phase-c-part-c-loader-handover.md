# Handover — Phase C · Part C: The LO Loader + Shell Adapter

**Date:** 2026-08-04
**Repo:** `lc-base-template` · branch `main` · in sync with `origin/main` (clean, all pushed).
**HEAD:** `fc79c19` — end of Phase C · Part B (example LO) plus two follow-up fixes.
**This task:** make the JSON actually drive the page — `loadLo()` → `assembleLo()` → shell
adapter → `PageLayout`. This is where `lo-00-example` first RENDERS in a browser.

**Read this section first: §2 records three schema decisions taken 2026-08-04 that CHANGE
`LoManifestSchema`. Part C implements the new shape; it does not inherit Part B's verbatim.**

---

## 0. What exists now

### Part B shipped (`aef1756`, `5243007`)

```
lo-config/lo-00-example/
  lo.json                            ← LoManifestSchema (OLD flat shape — see §2)
  blocks/01-grammar/block.json       ← { type: "grammar", content: { instructions, text } }
  blocks/02-vocabulary/block.json    ← { type: "vocabulary", content: { instructions, items[] } }
  exercises/01-select/exercise.json  ← reuses the select showcase fixture shape
  exercises/02-radio-quiz/exercise.json
```

`src/config/example-lo.test.ts` validates it end to end: manifest parses, every
`blocks[]`/`exercises[]` ref resolves to an on-disk folder, every file parses against its
schema (per-`type` for exercises). Seed of guards b + e.

**Nothing imports the LO yet.** Only that test reads it. The page is still driven by
hardcoded TypeScript — see below.

### Two follow-ups also landed

- `bc47e03` — **a11y fix:** Base UI's `Switch` renders an `aria-hidden` hidden `<input>` for
  form participation, which WAVE flags as "Missing form label". `ThemeToggle` now passes a
  `useId()` to the Switch and pairs it with a visually-hidden `<label htmlFor>`. AT behaviour
  unchanged (root keeps `role="switch"` + `aria-label="Dark mode"`).
- `4653917` + `fc79c19` — **asset quarantine:** all showcase placeholder audio moved to
  `public/audio/showcase-demo/{flashcards,inline-gap,memory-match}` so real course audio added
  later never mixes with demo clips. Six showcase fixtures updated. New guard
  `src/showcase/showcase-audio-assets.test.ts` walks every `SHOWCASE_FIXTURES` config for
  `audio` refs and asserts each is under `audio/showcase-demo/` AND resolves to a real file in
  `public/`. Seed of guards c + e.

**Verified at HEAD:** `bun run test` (434 pass) · `lint` · `lint:css` · `build` all green.

### The seam Part C replaces

`src/App.tsx` hand-composes the page today:

- `DEFAULT_SECTIONS` (from `src/components/shell/sections.ts`) — a hardcoded `NavSection[]`,
  identical for every LO.
- `SECTION_CONTENT` (App.tsx:20) — a hardcoded `Record<string, ReactNode>` with placeholder
  JSX: an `InstructionsCallout` + `DemoModal` under `introduction`, and one `LoAccordion` each
  under `grammar` and `exercises`.
- Title comes from `courseConfig.courseTitle`, NOT from `lo.json`.

`PageSection` is `{ id, label, content? }` and lives in `PageLayout.tsx`. That's the target
shape the adapter must produce.

---

## 1. Why the schema changes (the reasoning, so it isn't re-litigated)

Part B's manifest is flat and carries no section information:

```json
{ "blocks": ["01-grammar", "02-vocabulary"], "exercises": ["01-select", "02-radio-quiz"] }
```

It says _what exists_, never _where it goes_. Three things have no home in it: which section a
block belongs to, what sections an LO even has, and what the nav label should say. Filling only
the first (a code-side `type → section` map, or a `section` field per block) leaves the other
two open.

Evidence from the reference implementation — **`pedbad/French-Basic-2026`**, worth re-reading if
context is needed (`src/lo-config/*.json`, one flat JSON per LO × 15; loader `src/lib/loConfig.js`;
nav `src/components/layout/page-shell/MainMenu/navEntries.js`):

1. **Sections are declared by the LO, not the code.** Top-level JSON keys ARE the sections
   (`grammar`, `vocabulary`, `pronunciation`, `dialogues`, `exercises`, plus a `settings` meta
   key). Nav is derived: `Object.values(config).filter(v => v.component && v.id)`.
2. **But section ORDER relies on JS object key insertion order** — an accident of the language,
   not a promise. Reorder two keys by hand and the page silently reorders. We make order
   explicit instead (spec §15 already committed to explicit ordering).
3. **Introduction is hardcoded** as the first nav entry in `navEntries.js`, because its content
   lives under `settings` (no `component`/`id`, so the nav filter skips it). Consequences: two
   sources of truth for "what sections exist"; the `#introduction` link is emitted
   unconditionally even when `settings.introHTML` is empty (a nav link to nothing); and the
   label is a frozen English string in code.
4. **Two human labels were genuinely needed.** `navEntries.js` does
   `menuText ? menuText : titleText`, and in `first-contact.json` both `grammar` and
   `pronunciation` set `menuText` — 2 of 5 sections wanted shorter nav text than their heading.
5. **Labels cannot be derived from `id`.** An `id` must be URL-safe ASCII, so
   `going-to-a-cafe` has already lost the é in _café_; no capitalisation rule recovers it. Same
   class of failure: `faq → "Faq"`, `q-and-a → "Q And A"`.

**Timing argument for changing the schema now:** the cost today is one schema, five placeholder
JSON files and one test — all authored 2026-08-04, no real content anywhere. Once 15 real LOs
exist (the reference has exactly 15) the same change is 15 migrations plus a data script plus
re-verifying every page.

---

## 2. Decisions taken 2026-08-04 (locked)

### D1 — `lo.json` declares its own ordered `sections[]`

The manifest owns page structure. No code-side `type → section` map, and no `section` field
duplicated into every `block.json`. Order is explicit (array order), never inferred from object
key order.

### D2 — Introduction is an ordinary declared section

No hardcoded special case anywhere. **Principle: a nav entry exists because content exists,
never because a line of code says so.** An LO that omits an intro gets no intro nav link. An LO
can rename or reorder it like any other section.

### D3 — `label` required, `navLabel` optional

`label` is the `<h2>` text and the default nav text. `navLabel` overrides the nav only when the
heading is too long for a nav bar. Nav resolves as `navLabel ?? label` — the reference's
one-line fallback with honest names (`menuText`/`titleText` don't say which is which, exactly
the near-duplicate-field-name trap `docs/specs/lo-semantic-structure.md` §3 warns about).

No derivation from `id`. See §1.5.

### Sketch of the new shape (to refine in-session, not gospel)

```json
{
  "title": "Example Learning Object",
  "description": "…",
  "sections": [
    { "id": "introduction", "label": "Introduction", "blocks": ["00-intro"] },
    {
      "id": "grammar",
      "label": "Grammar: formal and informal address",
      "navLabel": "Grammar",
      "blocks": ["01-grammar"]
    },
    { "id": "vocabulary", "label": "Vocabulary", "blocks": ["02-vocabulary"] },
    { "id": "exercises", "label": "Exercises", "exercises": ["01-select", "02-radio-quiz"] }
  ]
}
```

Notes on the sketch:

- A section carries optional `blocks[]` and/or `exercises[]`. This mirrors the on-disk folder
  split, so a ref stays trivially resolvable (`blocks/<ref>/block.json` vs
  `exercises/<ref>/exercise.json`). **Rejected alternative:** one `items[{ kind, ref }]` array —
  more uniform, but makes every ref carry a discriminator the folder name already implies.
- Ordinal prefixes (`01-`, `02-`) stay LO-wide per kind, as today; the array is what orders
  them within a section.
- `id` must be unique across `sections[]` and must feed `src/lib/headingId.ts` cleanly
  (`baseId → {baseId}-heading`).

---

## 3. What Part C builds

1. **`LoManifestSchema` rewrite** — replace flat `blocks[]`/`exercises[]` with `sections[]` per
   §2. Add a `SectionSchema` (`id`, `label`, `navLabel?`, `blocks?`, `exercises?`), non-empty
   `id`/`label`, unique `id`s.
2. **`loadLo(slug)`** — read one LO folder, Zod-validate `lo.json` plus every referenced
   `block.json` / `exercise.json`. Fail fast and loud with the offending path in the message
   (the `courseConfig.parse()` pattern).
3. **`assembleLo()`** — stitch the parts into one typed, ordered LO object: sections in
   manifest order, each with its resolved block/exercise configs in array order.
4. **Shell adapter** — assembled LO → `PageSection[]`, one `LoAccordion` per block/exercise
   inside its declared section. Exercise bodies mount the engine via `lazyRegistry`.
5. **Nav** — derive from `sections[]` (`navLabel ?? label`). `DEFAULT_SECTIONS` in
   `sections.ts` becomes dead; delete it rather than leaving a second source of truth.
6. **`App.tsx`** — delete `SECTION_CONTENT`, render
   `<PageLayout title={lo.title} sections={mapped} themeToggle={<ThemeToggle />} />`.
7. **Migrate `lo-00-example`** — new `lo.json`, plus a `blocks/00-intro/block.json` for the
   introduction prose (suggest `type: "prose"`). The four existing block/exercise files are
   untouched by the schema change.
8. **Update `src/config/example-lo.test.ts`** — new manifest shape, and extend it: every
   section's refs resolve, `id`s unique, `label` non-empty. This test is the natural RED driver
   for the whole task.

---

## 4. Open questions Part C must settle

- **How does the loader read the files?** `lo-config/` sits at the repo ROOT (not `src/`, not
  `public/`). Two candidates: Node `fs` at build time, or Vite `import.meta.glob`. Constraint:
  **Part D needs to render the same LO from Node** (`renderToStaticMarkup` post-build), so pick
  the mechanism that serves both. Verify what actually resolves before committing — do not
  decide this blind.
- **Where do the Part A chrome demos go?** `InstructionsCallout` is covered by a block's
  `content.instructions`, but `DemoModal` (App.tsx:30) has no JSON home. Keep it as a
  showcase-only widget, give it a block `type`, or drop it from the rendered LO?

  > **RESOLVED (2026-08-04): dropped.** `DemoModal.tsx` is deleted. Part C's adapter left it
  > the only orphan of the Part A placeholder batch — the callout, filler prose and demo
  > accordions that shared its purpose went with `SECTION_CONTENT`, and it referenced nothing
  > and was referenced by nothing.
  >
  > **A block `type` was rejected, and not merely as speculative generality — it is the wrong
  > shape.** The real modal requirement carried forward from the reference implementation is an
  > INLINE one: authored rich text embeds
  > `<a class="modal-link" href="#content" data-modal-target="…">`, and ONE document-level
  > capture-phase click delegation resolves it to a dialog
  > (`docs/process/FUTURE_PROJECTS.md` §262 item 6, and the Modal-Link Authoring Rule).
  > Modals are therefore launched from within a block's prose against a content-by-id map —
  > never declared as a standalone block sitting in a section. A `modal` block would also nest
  > a dialog inside `LoAccordion` (disclosure stacked on disclosure) and would pre-render to
  > meaningless static markup under Part D's `renderToStaticMarkup`.
  >
  > **Keeping it documented-but-unmounted was rejected too**: that is dead code plus a comment
  > promising a future that isn't planned, and it violates the repo's own anti-pattern #11
  > (`FUTURE_PROJECTS.md` §191) — sample scaffolding belongs in a dev-only sandbox entrypoint,
  > not the production module tree. The showcase entrypoint is a pure
  > `SHOWCASE_FIXTURES.map` over exercise engines, so parking a filler-text widget there would
  > have meant inventing a chrome-demo surface for it.
  >
  > **`src/components/ui/dialog.tsx` is deliberately KEPT.** It is the vendored Base UI
  > primitive the eventual `.modal-link` delegation hook will mount, and it sits alongside 11
  > other zero-consumer primitives in `ui/` — which is exactly what a vendored primitive
  > library is for. Nothing about the accessible dialog behaviour (focus trap, Escape, focus
  > restore) is lost by deleting the wrapper that demoed it.

- **Does a block `type` still need a renderer registry?** Exercises resolve via `lazyRegistry`;
  blocks currently have no equivalent. `prose`/`grammar`/`vocabulary` need something that maps
  `type` → a body renderer. Smallest thing that works, no speculative generality.

---

## 5. Acceptance criteria (one concern per commit)

- [ ] `LoManifestSchema` carries ordered `sections[]` with `id`/`label`/`navLabel?`/`blocks?`/
      `exercises?`; unique `id`s and non-empty `label` enforced by Zod.
- [ ] `lo-config/lo-00-example/lo.json` migrated to the new shape; `blocks/00-intro/block.json`
      added for the introduction.
- [ ] `loadLo(slug)` validates every part and fails with the offending file path named.
- [ ] `assembleLo()` returns one typed LO with sections and their items in declared order.
- [ ] Adapter maps the assembled LO to `PageSection[]`; one `LoAccordion` per block/exercise;
      exercise engines mount via `lazyRegistry`.
- [ ] Nav derives from `sections[]` (`navLabel ?? label`); `DEFAULT_SECTIONS` deleted, not
      merely bypassed.
- [ ] `App.tsx` renders from the LO; `SECTION_CONTENT` deleted.
- [ ] `example-lo.test.ts` updated + extended (section refs resolve, ids unique, labels present).
- [ ] Heading outline still h1 → h2 → h3, no skips; one `<h1>`; `aria-labelledby` per section.
- [ ] Verify `bun run test · lint · lint:css · build`, PLUS a real browser pass (this is the
      first part with visible output): landmarks, keyboard/Escape/focus contract, accordions
      collapse to 0px, dark mode persists, no console errors.

---

## 6. Guardrails / conventions

- **Schemas are the contract** — validate at load, fail fast and loud.
- **One source of truth:** the JSON owns the shape of the page; the code owns the set of things
  that can be rendered. No third place to check. If a decision can live in `lo.json`, it does.
- **Do NOT copy the reference's per-LO components.** `first-contact.json` names bespoke
  components (`FirstContactGrammarFormsOfAddress`, `FirstContactPronunciationFrenchR`) — a new
  React file per LO per topic. The generic ones in that same file (`WordOrderExercise`,
  `PhraseReorderExercise`, `WordSpotExercise`, `DraggableFillGaps`, `PhraseTable`) are the
  pattern to follow: generic engines + data.
- TDD guard is repo-local (Vitest + `tdd-guard-vitest`). **Note:** on 2026-08-04 its hook
  errored with `Not logged in` and was muted via `.claude/tdd-guard/data/config.json →
{"guardEnabled":false}` (gitignored, per-machine). Re-check whether it works before relying
  on it. **Never commit `.claude/tdd-guard/`.**
- Conventional commits, one concern each. Semantic HTML, tokens-only CSS, `<800`-line files.
- CI = `test + lint + build` on push; branch protection is the real gate.

Full Phase C map: `docs/process/2026-07-01-phase-c-brainstorm.md` §6.B–D. Part A conventions:
`docs/process/2026-07-12-phase-c-part-a-site-shell-handover.md`. Part B:
`docs/process/2026-08-02-phase-c-part-b-example-lo-handover.md`. JSON→DOM mapping:
`docs/specs/lo-semantic-structure.md` §1a (**note: its §1a example shows the OLD flat manifest —
update it as part of this task**).

---

## 7. What comes AFTER Part C (context — do NOT start)

- **Part D — static per-LO HTML.** Node post-build `renderToStaticMarkup` → real per-LO
  `dist/*.html` (mechanism spiked + decided 2026-07-03). The shell markup is already
  no-JS-safe by construction.
- **Guards b–h** — naming/render-mirror, asset-path, asset-existence, registry-complete,
  token-integrity, css-layer-discipline, w3c/a11y. Guard a is active; the Part B manifest test
  and the Part C additions are the b + e seed, and
  `src/showcase/showcase-audio-assets.test.ts` is the c seed.

---

## 8. Paste-ready resume prompt

> Build **Phase C · Part C — the LO loader + shell adapter** in `lc-base-template`. Full recipe:
> `docs/process/2026-08-04-phase-c-part-c-loader-handover.md` — **read §2 first: three schema
> decisions taken 2026-08-04 change `LoManifestSchema`, so Part C does NOT inherit Part B's
> manifest shape verbatim.** Contracts: `src/config/lo-schema.ts`; JSON→DOM mapping
> `docs/specs/lo-semantic-structure.md` §1a (its example shows the OLD flat manifest — update it
> as part of this task). FIRST: `git fetch origin`, confirm `main` == `origin/main` (Part B is
> merged at `fc79c19`), reconcile any unpushed work, branch `feat/phase-c-lo-loader` off main.
> `bun install`. TDD guard may be broken (`Not logged in` on 2026-08-04) — check, and if muting
> is needed use `.claude/tdd-guard/data/config.json → {"guardEnabled":false}` (gitignored, never
> commit). Work test-first: rewriting `src/config/example-lo.test.ts` for the new `sections[]`
> manifest is the natural RED driver. Then: rewrite `LoManifestSchema` with ordered `sections[]`
> (`id`, `label`, `navLabel?`, `blocks?`, `exercises?`; unique ids, non-empty labels); migrate
> `lo-config/lo-00-example/lo.json` + add `blocks/00-intro/block.json`; build `loadLo(slug)`
> (Zod-validate every part, fail loud naming the offending path) and `assembleLo()` (one typed
> ordered LO); build the shell adapter (LO → `PageSection[]`, one `LoAccordion` per
> block/exercise, engines via `lazyRegistry`); derive nav from `sections[]` using
> `navLabel ?? label` and DELETE `DEFAULT_SECTIONS`; wire `App.tsx` and delete `SECTION_CONTENT`.
> Settle §4's three open questions in-session — especially how the loader reads root-level
> `lo-config/` (Node `fs` vs Vite `import.meta.glob`), since **Part D must render the same LO
> from Node** — verify what resolves, don't decide blind. Conventional commits, one concern each.
> Verify `bun run test · lint · lint:css · build` PLUS a real browser pass — this is the first
> part with visible output, so check landmarks, heading outline (h1→h2→h3, no skips),
> keyboard/Escape/focus, accordion collapse, dark-mode persistence, and a clean console. Do NOT
> start Part D (static HTML) or guards b–h.
