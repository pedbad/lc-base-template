# Phase C — Example LO Brainstorm

**Status:** brainstorm only — nothing in this doc has been built yet. Captures
decisions made while planning Phase C (13b example LO + 13c loader/stitcher + 15
static pre-render) before any code lands, so the next BUILD session starts from
agreed decisions instead of re-litigating them.

**Context:** Phase A (foundation) and Phase B (all 12 exercise engines) are done —
see `docs/process/LC_BASE_TEMPLATE_BUILD_HANDOVER.md`. Phase C is next.

---

## 1. Placeholder-only, not real content

The example LO ships with filler text throughout — grammar/vocab blocks, exercise
prompts, nav labels, alert/info box copy, modal popup copy. The goal is to show
authors what the CHROME looks like (instructions, alerts, popups, labels), not to
teach a real language topic. No real Spanish/French content, no real audio/image
assets beyond what's already reused from existing showcase fixtures.

## 2. Numbering — the example LO is `lo-00`, not `lo-01`

`lo-config/lo-00-example/` — keeps `lo-01` free for the first real LO a course
author adds. Everything _inside_ the LO folder keeps its own ordinal, unaffected
by the LO itself being `00`:

```
lo-config/lo-00-example/
  lo.json                       ← manifest
  blocks/01-grammar/block.json  ← position-in-page ordinal, NOT tied to lo-00
  blocks/02-vocabulary/block.json
  exercises/01-<type>/exercise.json
  exercises/02-<type>/exercise.json
  … one folder per exercise picked (see §5) …
```

## 3. Semantic DOM — see the dedicated reference doc

The full page skeleton (header/nav/main/sections/accordions/footer), heading
depth rules, the `instructions` field, `lang` handling, and the accordion
mechanics decision (native `<details>/<summary>`, animated via progressive
enhancement; `Switch` for the dark-mode toggle) are now spelled out in
**`docs/specs/lo-semantic-structure.md`** — that file is the canonical reference
to build against. This section stays only as a pointer so the two docs don't
drift against each other.

## 4. Mistakes to NOT repeat (found in french-lo-1)

- **One accordion component, heading built in — not optional.** french-lo-1 has
  TWO accordion implementations: the one actually used for LO content (renders
  `<article>`/`<section>` + `<h3>` correctly), and a second generic shadcn-style
  one sitting unused in the codebase that renders **no heading at all** around its
  trigger. Having two similar-looking components is how the wrong one eventually
  gets reached for. We ship exactly one accordion wrapper, and it always renders
  its own heading — never a bare trigger with no heading ancestor.
- **No decorative heading before the real `<h1>`.** french-lo-1's hero banner
  renders an `aria-hidden` `<h2>` with the site title, positioned in the DOM
  _before_ the real `<h1>` in `<main>`. `aria-hidden` hides it from screen readers,
  but the raw document heading order still goes h2-then-h1 — fails a strict
  heading-order/outline check. If we want a decorative title-echo anywhere above
  `<main>`, it must not be a heading element at all (a styled `<p>`/`<div>`, or
  the `<h1>` itself styled differently in two places via CSS, not two elements).
- **One rule for whether an accordion panel body gets its own heading.**
  french-lo-1's own code comments admit this differs LO-to-LO (some panels get an
  `<h3>` inside the body content, others explicitly don't, "by design"). We pick
  one rule for the template and every accordion panel follows it.
- **One heading-id helper, not hand-built strings per component.** french-lo-1
  computes heading ids two different ways depending on whether a `target` prop is
  supplied (`${target}-heading` vs a `section-title-${id}` fallback) — a
  fragile-by-convention split that risks silently orphaning an `aria-labelledby`
  reference. We generate every heading id through one small shared function.
- **`<p>` for prose, always.** french-lo-1 has a documented case of swapping `<p>`
  for `<div>` purely to dodge a WAVE checker false-positive (bold short paragraph
  flagged as a "possible heading"). Right instinct (don't let a heuristic checker
  force real headings into existence), wrong fix (losing paragraph semantics for
  everyone). Our guidance: use `<p>` for prose; if an automated tool flags a false
  positive, suppress that specific finding, don't strip the element.
- **No `onClick` on a non-interactive `<div>` with no keyboard equivalent.**
  Found once in french-lo-1 (a div used purely to `stopPropagation()`). Harmless
  there, but the pattern is how fake-buttons get born later. If something needs
  click-swallowing, it shouldn't double as the semantic content container.
- **Toggling panels needs `hidden`/`inert`, not just `aria-hidden` + CSS.**
  french-lo-1's mobile nav panel sets `aria-hidden` when closed but leaves its
  links focusable — a real keyboard trap (tab lands on invisible links). Any
  collapsible panel we build (mobile nav, accordion, modal) must remove closed
  content from the tab order for real, not just from the accessibility tree.

## 5. Exercise picks for the 4(-6) example accordions — still open

Spec (`docs/specs/2026-06-15-lc-base-template-design.md` §4) says 4 accordions;
you're open to 5–6. Not decided yet. Candidates on the table:

- Text-only, zero new assets: `select`, `inline-choice`, `radio-quiz`, `word-order`
- Add a game / own-model engine: `memory-match`
- Add a typed/audio engine: `inline-gap` (needs one demo audio clip, already have
  reusable demo clips from the showcase fixtures)

Decide count + exact picks before authoring the exercise-file steps in §6.B below.

## 6. Baby steps (nothing started — plan only)

**A. Site shell** _(new scope — not in the original checklist; needed before any
LO page can render)_

1. `Header.tsx` — `<header><nav aria-label="Main navigation">`, placeholder
   logo/title + nav-menu links (reuse `navigation-menu.tsx`), mobile via
   `sheet.tsx`
2. `Footer.tsx` — plain `<footer>`, placeholder links/copyright
3. `PageLayout.tsx` wiring Header + `<main>` + Footer — replaces the default Vite
   `App.tsx` scaffold
4. Placeholder chrome pass: one instructional alert box (reuse `alert.tsx`) and
   one demo modal (reuse `dialog.tsx`) — shows what "info box" and "popup" chrome
   look like with filler text
5. Build the ONE accordion wrapper per `docs/specs/lo-semantic-structure.md` §4 —
   `<article><details><summary><h3>…</h3></summary>…</details></article>`, animated
   via the `grid-template-rows` progressive-enhancement technique
6. Build the dark-mode toggle using the `Switch` component (already in
   `src/components/ui/switch.tsx`, unused so far)
7. Verify in preview: landmarks present (header>nav, main, footer), heading order
   h1→h2→h3 with no skips, keyboard-only pass (tab order sane, no trapped/hidden
   focusables), accordion works with JS disabled (native `<details>` fallback)

**B. Example LO folder (13b)** — placeholder text only

1. `lo-config/lo-00-example/lo.json` manifest — filler title/description, ordered
   `blocks[]`/`exercises[]` refs
2. `blocks/01-grammar/block.json` — a few filler sentences
3. `blocks/02-vocabulary/block.json` — filler vocab list
4. One step **per exercise type** picked in §5 (one commit each) —
   `exercises/0N-<type>/exercise.json`, filler content
5. One exercise gets a `labels` override — demonstrates the per-exercise
   chrome-text override in practice

**C. Loader/stitcher (13c)**

1. `loadLo(slug)` — reads one LO folder, Zod-validates `lo.json` + every
   referenced part
2. `assembleLo()` — stitches into one typed, ordered LO object
3. `bun test`: valid LO loads clean; a deliberately-broken part fails loudly
4. Decide: loader is build-time only (Node/SSG), or also usable client-side in
   dev — pick one

**D. Static pre-render (15)**

1. Decide SSG mechanism — Vite's `rollupOptions.input` is static, so either
   (a) a Vite plugin generating entries from `lo-config/` at config time, or
   (b) a Node post-build script rendering each LO via
   `ReactDOMServer.renderToStaticMarkup` into a shared template. Spike/decide,
   don't build yet.
2. Implement for the one example LO — prove `dist/example.html` (or whatever the
   `lo-00-example` slug resolves to) has real content
3. Fix `%BASE_URL%` on favicon (currently hardcoded `/favicon.svg`, see handover
   step 32 note) + verify `resolveAsset()` correctness in the pre-rendered output
   while here
4. Verify: inspect `bun run build` output — real per-LO HTML, not the current
   blank Vite shell; run an automated a11y check (axe/pa11y) and an HTML
   validator (W3C validator or `html-validate`) against the rendered output —
   this is a pass/fail gate for the placeholder, not optional polish

---

## Open decisions before building

- [ ] Final exercise-type picks + count (4, 5, or 6) — §5
- [ ] SSG mechanism (Vite plugin vs. Node post-build script) — §6.D step 1
