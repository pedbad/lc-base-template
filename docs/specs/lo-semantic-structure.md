# LO Page — Semantic HTML Structure (reference)

**Purpose:** the canonical DOM skeleton for any rendered Learning Object page —
header/nav, main/sections/headings, accordions, footer. A reference to build
against and check against, not a decision log (see
`docs/process/2026-07-01-phase-c-brainstorm.md` for the reasoning/history behind
these choices).

**Source decisions:** `docs/specs/2026-06-15-lc-base-template-design.md` §17
(locks `header>nav → main → section → article` and non-negotiable a11y), refined
against a semantic-structure audit of the french-lo-1 reference implementation
(kept what's correct there, fixed what wasn't — see §5 below).

---

## 1. The skeleton

```html
<html lang="en">
  <!-- lang = UI chrome language. Target-language CONTENT inside sections/
       accordions gets its own lang="{course.config languageCode}" wrapper —
       see §3. -->

  <body>
    <a class="skip-link" href="#content">Skip to main content</a>
    <!-- Visually hidden until :focus. Present in the DOM always. -->

    <header>
      <nav aria-label="Main navigation">
        <a href="#content">{Course/site title}</a>

        <!-- One entry per top-level <section>, in page order. Generated FROM
             the section list — not hand-authored separately. -->
        <a href="#introduction" aria-current="true">Introduction</a>
        <a href="#grammar">Grammar</a>
        <a href="#vocabulary">Vocabulary</a>
        <a href="#exercises">Exercises</a>

        <!-- Dark-mode toggle: the Switch component (role="switch",
             aria-checked), not a plain button with changing label text. -->
        <Switch aria-label="Dark mode" />

        <button
          type="button"
          aria-expanded="false"
          aria-controls="mobile-nav-panel"
          aria-label="Toggle navigation menu"
        >
          …
        </button>
      </nav>

      <div id="mobile-nav-panel" hidden>
        <!-- Same nav entries, mobile layout. `hidden` attribute when closed —
             not aria-hidden alone (real focus removal, not just AT hiding). -->
      </div>
    </header>

    <main id="content" tabindex="-1">
      <h1>{LO title}</h1>

      <section id="introduction" aria-labelledby="introduction-heading">
        <h2 id="introduction-heading">Introduction</h2>
        <!-- intro content -->
        <button aria-label="Back to top" tabindex="-1">…</button>
      </section>

      <section id="grammar" aria-labelledby="grammar-heading">
        <h2 id="grammar-heading">Grammar</h2>

        <!-- SECTION-level instructions: optional, at most one, before any
             accordions. -->
        <div class="instructions">{Section-wide instructions}</div>

        <article aria-labelledby="grammar-1-heading">
          <details>
            <summary>
              <h3 id="grammar-1-heading">{Accordion title}</h3>
            </summary>
            <div class="details-content">
              <!-- ACCORDION-level instructions: optional, at most one, before
                   the block/exercise body. Same field as section-level — one
                   name, not two similarly-named fields (see §3). -->
              <div class="instructions">{Accordion-specific instructions}</div>
              <!-- grammar block content -->
            </div>
          </details>
        </article>
        <!-- one <article><details>…</details></article> per accordion, sibling
             to the one above -->

        <button aria-label="Back to top" tabindex="-1">…</button>
      </section>

      <section id="vocabulary" aria-labelledby="vocabulary-heading">
        <h2 id="vocabulary-heading">Vocabulary</h2>
        <!-- content — accordion(s) if it needs one, plain content if not -->
        <button aria-label="Back to top" tabindex="-1">…</button>
      </section>

      <section id="exercises" aria-labelledby="exercises-heading">
        <h2 id="exercises-heading">Exercises</h2>
        <div class="instructions">{Section-wide instructions}</div>

        <article aria-labelledby="ex-1-heading">
          <details>
            <summary>
              <h3 id="ex-1-heading">{Exercise label}</h3>
            </summary>
            <div class="details-content">
              <div class="instructions">{Exercise-specific instructions}</div>
              <!-- exercise engine renders here -->
            </div>
          </details>
        </article>
        <!-- one per exercise -->

        <button aria-label="Back to top" tabindex="-1">…</button>
      </section>
    </main>

    <footer>
      <!-- logos/links/copyright. No heading element anywhere in here — see §5. -->
    </footer>
  </body>
</html>
```

---

## 1a. JSON → DOM mapping

**Grounding status:** every shape below is REAL and shipped — `src/config/lo-schema.ts`
for the manifest and part envelopes, `src/lo/blocks/*-schema.ts` for block `content`,
`src/exercises/select/select-schema.ts` for the select exercise. The loader
(`src/lo/`) validates all of it at load and the adapter
(`src/lo/lo-page-sections.tsx`) is what turns it into the DOM in §1.

A folder-per-LO (spec §6/§9) drives the skeleton in §1 like this:

```
lo-config/lo-01-salutations/
  lo.json                           → <h1>, <head>, the SECTIONS and their order
  blocks/00-intro/block.json        → the "Introduction" <section>'s one <article>
  blocks/01-grammar/block.json      → the "Grammar" <section>'s one <article>
  blocks/02-vocabulary/block.json   → the "Vocabulary" <section>
  exercises/01-select/exercise.json → the "Exercises" <section>'s one <article>
```

`lo.json` (manifest — `LoManifestSchema`):

```json
{
  "title": "Salutations",
  "description": "Greet people and introduce yourself in Spanish.",
  "sections": [
    { "id": "introduction", "label": "Introduction", "blocks": ["00-intro"] },
    {
      "id": "grammar",
      "label": "Grammar: ser and estar",
      "navLabel": "Grammar",
      "blocks": ["01-grammar"]
    },
    { "id": "vocabulary", "label": "Vocabulary", "blocks": ["02-vocabulary"] },
    { "id": "exercises", "label": "Exercises", "exercises": ["01-select"] }
  ]
}
```

- `title` → the page's one `<h1>{LO title}</h1>` (§1) and the `<head>` title.
- `sections[]` — the page, IN ORDER. The LO declares what sections exist; there is no
  code-side `type → section` map and no `section` field inside a block. Order is the
  ARRAY order, never JS object key insertion order (the french-lo-1 reference relied on
  that by accident — reorder two keys there and the page silently reorders).
- `sections[].id` → the `<section id>` anchor, the nav link's `href="#id"`, and via
  `headingId()` the `<h2 id="{id}-heading">` that `aria-labelledby` points at. URL-safe
  kebab-case, unique across the manifest (both enforced by Zod).
- `sections[].label` → the section's `<h2>` text AND its nav text. Required, never
  derived from `id`: an id has already lost case and accents (`going-to-a-cafe` dropped
  the é in _café_; `faq` → "Faq").
- `sections[].navLabel` (optional) → nav text ONLY, for a heading too long for a nav
  bar. Resolution is `navLabel ?? label`, in one place (`Header`).
- **The introduction is an ordinary section.** It is declared, ordered, renamed and
  reordered like any other — never a hardcoded first nav entry (which is what
  french-lo-1 does, leaving two sources of truth for "what sections exist" and emitting
  an `#introduction` link even when there is no intro content). A section with neither
  `blocks` nor `exercises` is rejected, so a nav entry exists because CONTENT exists.
- `blocks[]` / `exercises[]` — ORDERED refs, scoped to their section. Each is a
  render-mirror folder name resolving to `blocks/<ref>/block.json` or
  `exercises/<ref>/exercise.json`; the two lists stay separate because that split
  mirrors the two on-disk folders. Ordinal prefixes (`01-`, `02-`) are LO-wide per kind;
  the array orders items within a section. Inside a section, blocks render before
  exercises. Reorder an array without renaming the folder → guard b fails.

`blocks/01-grammar/block.json` (`BlockConfigSchema` + `TextBlockContentSchema`):

```json
{
  "type": "grammar",
  "title": "Ser vs estar",
  "content": {
    "instructions": "Use «ser» for permanent traits.",
    "text": ["Yo soy de Madrid.", "Tú eres muy amable."]
  }
}
```

- `type` → which body renderer fills the accordion, resolved through
  `getBlockRenderer()` (`src/lo/blocks/block-renderers.ts`) — the block-side
  counterpart of the exercise `lazyRegistry`, not the same map: blocks are content,
  not engines. Shipped types: `prose` (UI-language commentary), `grammar`
  (target-language prose), `vocabulary` (term/gloss `<dl>`). An unregistered `type`
  renders a visible error, never silence.
- `title` → the accordion's `<h3>` inside `<summary>`. Required, same reasoning as
  `label` above.
- `defaultOpen` (optional, `prose`/blocks only) → the accordion starts open. For an
  introduction the learner should not have to unfold. Exercises have no equivalent: a
  page of pre-opened exercises is a wall of controls.
- `content.instructions` → the ONE shared `<div class="instructions">` slot (§3),
  accordion-level here since it sits in this block's own file, not the manifest.
- `content.text` → one `<p>` PER ARRAY ENTRY, the whole block wrapped
  `lang={TARGET_LANG}` (§3) for `grammar` but NOT for `prose` (an introduction is UI
  language). An array, not one string the renderer splits: sentence-splitting in code
  guesses wrong on abbreviations and quotations, and the author knows where the breaks
  belong.
- `labels` (optional) → per-block UI-string override, same `resolveLabel(key, labels)`
  resolution as exercises (spec §9).

For a vocabulary block, `content.items[] = { term, gloss }` → a `<dl>`, with `<dt>`
carrying `lang={TARGET_LANG}` (the target-language term) and its `<dd>` gloss left in
the UI language — `lang` is per-part, not per-block.

`exercises/01-select/exercise.json` (`LoExerciseConfigSchema` + the real, shipped
`SelectContentSchema` — this shape is final):

```json
{
  "type": "select",
  "title": "Ser or estar?",
    "layoutMode": "rows",
    "footnote": "El verbo «ser» cambia según la persona."
  },
  "options": { "shuffle": true, "allowShowAnswers": true }
}
```

- `type: "select"` → `lazyRegistry` resolves this to `SelectExercise.tsx`
  (guard e enforces every `type` used here has a registry entry + showcase
  fixture). The exercise mounts through `ExerciseHost`, which also renders the
  instruction box — so the accordion's own `instructions` slot stays empty for
  exercises. One instruction box, not two.
- `title` → the accordion's `<h3>`. Required for an LO exercise
  (`LoExerciseConfigSchema`); the shared envelope keeps it optional because a
  showcase card supplies its title out-of-band and is not an LO accordion.
- `content.items[].text` → one `<p>`/row per item inside the accordion body;
  the `[a|*b|c]` blanks become the rendered `<Select>` dropdowns (engine #1).
  Every text segment + the dropdown's chosen value render `lang={TARGET_LANG}`
  (fixed in the lang retrofit, 2026-07-01) — the sr-only "Answer for blank N"
  label stays plain English chrome.
- `content.footnote` → the `<p>` under the exercise body, also
  `lang={TARGET_LANG}` — confirmed via this course's fixtures that footnotes
  are author-written IN the target language, not English instructions.
- `options.shuffle` / `options.allowShowAnswers` → wired straight into the
  engine's Reset/Show-answers behavior (spec §5.2/§5.3); not DOM structure,
  but they gate which `<ExerciseFooter>` buttons render.
- `labels` (optional, omitted above) → same two-layer override as blocks;
  `config.labels?.check ?? uiStrings.check` (spec §9) decides the Check
  button's text.

Still open: block types beyond the three shipped ones (`prose`, `grammar`,
`vocabulary`) — pronunciation, dialogue and monologue blocks each need a `type`
string, a `content` schema and a registry entry when they arrive. The envelope
(`type`, `title`, `defaultOpen`, `labels?`, `content`) is locked; only per-type
`content` stays deferred, the same pattern the 12 exercise engines went through.

## 2. Heading depth — fixed, never skipped, never repeated

**h1 (page, inside `<main>`) → h2 (one per `<section>`) → h3 (one per
accordion, inside `<summary>`) → h4 (optional, only if an accordion's own
content genuinely needs internal sub-structure).**

- Every `<section>` MUST have a heading (`aria-labelledby` + a real `h2`). If
  content doesn't need a landmark-worthy heading, it isn't a `<section>` — use a
  plain `<div>` instead. A heading-less `<section>` is semantically empty.
- The accordion panel body never repeats its own `<summary>`'s `h3` as a second
  heading at the same level.
- No decorative heading elements anywhere outside this tree (see §5 — no hidden
  `<h2>` echoing the page title above `<h1>`).

## 3. Content rules

- **One `instructions` field**, usable at both section-level and
  accordion-level, optional at each. Rendered as a plain instructional callout
  (a `<div>`, not `role="alert"` — that ARIA role is for assertive live
  announcements, wrong semantics for static instructions). NOT two
  similarly-named fields (french-lo-1 has `instructionsText` AND
  `informationText` doing near-identical jobs — exactly the key-drift bug our
  own guard-a is designed to catch; the template ships with only one name).
- **`lang` on target-language content.** UI chrome inherits `lang="en"` from
  `<html>`. Actual target-language text (grammar examples, vocab words, exercise
  content) needs its own `lang="{languageCode}"` wrapper (from
  `course.config.ts`, exposed as `TARGET_LANG` via `src/lib/lang.ts`) so
  assistive tech pronounces it correctly (WCAG 3.1.2). **Fixed 2026-07-01
  across all 12 shipped exercise engines** — wrapped only target-language
  content subtrees, never chrome/`aria-label`/sr-only text. Grammar/vocab
  blocks outside the exercise engines (Phase C content) still need the same
  treatment when authored.

## 4. Accordion mechanics

- `<article>` wraps `<details>` — the `<article>` is the semantic "one
  self-contained accordion item" per spec §17; `<details>`/`<summary>` handles
  the disclosure mechanics (open/closed, keyboard, accessible name) natively.
- `<summary>` contains exactly one heading element (`h3`) — valid per the HTML
  Living Standard's content model for `<summary>`. No manual
  `aria-expanded`/`aria-controls` bookkeeping needed; the browser provides
  correct semantics for free.
- No `role="region"` on the panel content. Per the WAI-ARIA APG Accordion
  Pattern: region-per-panel is fine for a few complex panels, but explicitly
  **not recommended** for pages with many small accordions (our case — a
  section can hold many exercises/grammar items) because it pollutes
  screen-reader landmark navigation.
- Animation: progressive enhancement over native `<details>`. Baseline (no JS):
  instant native open/close — never broken, never inaccessible. With JS: the
  panel content wrapper (`.details-content`) uses
  `display: grid; grid-template-rows: 0fr` → `1fr` with a CSS transition,
  driven by intercepting the `<summary>` click — smooth animation without
  giving up no-JS resilience.
- One accordion implementation only — no second, similar-looking
  component with weaker semantics sitting unused in the codebase (french-lo-1
  has exactly that trap).

## 5. Mistakes found in french-lo-1 — deliberately not repeated

- **No decorative heading before the real `<h1>`.** Its hero banner renders an
  `aria-hidden` `<h2>` echoing the site title, positioned before the real `<h1>`
  in document order. Hidden from screen readers, but still wrong order for a
  strict heading-outline/W3C-style check. Any decorative title-echo above
  `<main>` must not be a heading element at all.
- **No two near-identical instruction fields** — see §3.
- **No fragile hand-built heading-id schemes.** french-lo-1 computes heading ids
  two different ways depending on whether a `target` prop is supplied. One
  shared id-generation helper, always.
- **Collapsed/hidden panels need `hidden` (or `inert`), not `aria-hidden` +
  CSS alone** — french-lo-1's mobile nav panel leaves closed-panel links
  tab-focusable, a real keyboard trap.
- **Escape closes the mobile panel and returns focus to its toggle button** —
  state the full open/close focus contract explicitly, don't half-build it.
- **Focus moves to the target heading on in-page navigation** (nav-link click,
  hash deep-link) — otherwise keyboard/AT users jump visually but their focus
  position doesn't follow.
- **`<p>` for prose, always** — don't swap to `<div>` to dodge an automated
  checker's false-positive (french-lo-1 has a documented case of this). Suppress
  the specific false-positive finding instead of losing paragraph semantics.
