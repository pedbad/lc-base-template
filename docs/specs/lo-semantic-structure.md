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
  `course.config.ts`) so assistive tech pronounces it correctly (WCAG 3.1.2).
  **Currently missing across all 12 shipped exercise engines** — a real gap,
  tracked as follow-up work, not blocking Phase C.

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
