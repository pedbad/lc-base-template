# §D · D4 — the back-to-top button (handover)

**Date:** 2026-09-10 · **HEAD at write time:** `c9a72bf`, clean and synced ·
**Suite:** 94 files · 928 tests · `bun run guards` = 211 (7 files)

§A (eight guards), §B (the three books), §C (sandbox + docs hub) and **§D1 (the footer
colophon)** are closed. This document is D4 only.

---

## Read first

- [`../specs/2026-09-09-footer-colophon-design.md`](../specs/2026-09-09-footer-colophon-design.md)
  **§3.4** — this job. **Note what it does NOT say:** it describes the reference's
  `IntersectionObserver` but never argues for keeping it, and §4.6 is about reduced
  motion, not the observer. Do not read the spec as endorsing the fade.
- [`TODO.md`](TODO.md) §D — D4 is this job, **D2 owns mounting**, D3 is the motion
  sweep, D5 is the budget breach.
- The reference, 60 lines exactly:
  `/Users/ped/Sites/french/french-lo-1/src/components/layout/page-shell/BackToTopButton/BackToTopButton.jsx`

---

## Start by deleting the observer

The reference fades the button in when it scrolls into view, via an
`IntersectionObserver` watching **its own container** (`threshold: 0.15`,
`rootMargin: "0px 0px -8% 0px"`). For an **in-flow** element that is machinery
re-implementing scrolling: it is visible when you scroll to it.

Deleting it removes two defects **outright rather than fixing them** — the
`duration-[3600ms]` fade (3.6s reveal, 300ms hide) and the
`opacity-0` + `pointer-events-none` + `tabIndex={-1}` hidden state that stays in the
accessibility tree. It also removes the `inert` question, the `useState`/`useEffect`,
and the prerender question. What is left is a plain `<button onClick>`, roughly 20 lines.

If the entrance is wanted later, do it as a CSS animation — then
`prefers-reduced-motion` is honoured without JS, exactly as `footer.css` does. Do not
reintroduce it in JS.

---

## Three things that mislead on a skim of the reference

- **It is not a floating button.** `top-button-container` matches **zero** CSS rules —
  grep it and confirm; the only hit is the JSX itself. It is `mt-3 flex justify-end`:
  inline, right-aligned, in normal flow.
- **It mounts three times, none of them in the shell** — `Section.jsx:169`,
  `HeroSection.jsx:163`, `ExerciseShowcase.jsx:372`.
- **The observer watches its own container**, so `isIntersecting` means "I am on
  screen". Fade-on-reveal, not a scroll-depth threshold.

---

## Defects to correct

1. **`scrollTo({ behavior: 'smooth' })` has no reduced-motion guard** — none anywhere in
   the file. Call `prefersReducedMotion()` and pass `behavior: 'auto'` when it is set.
   Extract that helper from `LoAccordion.tsx:60` in its **own commit first** (second
   consumer is the threshold). It is currently called only from effects (`:98`, `:126`),
   never at module scope or during render — **keep it that way**; a module-scope
   `matchMedia` read breaks the prerender.

2. **Duplicate accessible names.** One button per static block is roughly 5 per LO, all
   announcing "Back to top" with nothing to distinguish them. Guard h checks landmarks,
   labels and heading order — it will **not** catch duplicate button names. One prop
   fixes it: `aria-describedby={headingId(section.id)}`, which announces "Back to top,
   Exercises". `headingId` already exists (`src/lib/headingId.ts`, used at
   `PageLayout.tsx:19` and `LoAccordion.tsx:83`) and is what `<section aria-labelledby>`
   consumes, so there is no second id scheme to invent.

3. **No `:focus-visible` rule.** The reference has none — it inherits shadcn `Button`'s
   ring. Go to a plain `<button>` and the ring is lost, and **nothing in the gate catches
   it**. `no-descending-specificity` applies to `:focus-visible` (0,2,0) exactly as it
   bit `:hover` twice in §D1: declare it **after** the plain class.

4. **A `Tooltip` wrapping a button that already has `aria-label="Back to top"`.**
   Redundant for assistive technology, and a dependency for an arrow icon.
   `src/components/ui/button.tsx` and `src/components/ui/tooltip.tsx` both exist if you
   disagree — but decide, do not inherit.

---

## The placement rule, so D2 does not re-derive it

In the reference the button lands in `Section` + `HeroSection` only — once per **static**
block — and deliberately never inside `AccordionArticle`.

The mechanism is **opt-out, not opt-in**, which is easy to get backwards:
`renderLearningObject.jsx:193` reads `const { expandable = true } = value`, so `:58`
sends a block to `AccordionArticle` **unless** its config explicitly sets
`expandable: false`.

Verified across all 15 LOs: every one carries about 5 explicit `expandable: false`
blocks and **zero** `expandable: true` — that value only ever comes from the default, or
from `:205-209` force-wrapping registry exercises.

So the rule is **static blocks yes, accordions no**, because collapsing an accordion
already returns the reader upward, and inside a closed one the button is unreachable
(Radix unmounts the content).

---

## Scope, and the gate that follows from it

**D4 is the component plus its colocated tests, mounted nowhere.** Choosing mount points
touches `PageLayout`'s section loop and `CourseHome`, which `TODO.md` assigns to **D2**.

D4's gate is therefore:

```bash
bun run format && bun run lint && bun run lint:css && bun run test && bun run build
BASE_URL=/course/ bun run build
```

**and nothing else.** The keyboard-only pass, both themes, the five widths and the
in-browser reduced-motion check **transfer to D2 with the mount** — you cannot tab to a
component mounted nowhere, and pretending otherwise means either faking the verification
or silently folding in the mount.

Say which you are doing in the first commit. If you fold the mount in, update `TODO.md`'s
D2 row in the same commit so the two rows do not disagree.

Unit tests can still assert the real contract: `aria-label` present, `aria-describedby`
wired, `behavior: 'auto'` under reduced motion, and the focus-ring class applied.

---

## Traps that fail the suite rather than fail quietly

- **`useIsHydrated` is not needed**, and adding it would be cargo-cult — with the
  observer gone there is no client-only state at all. It exists at
  `src/hooks/useIsHydrated.ts` for things that genuinely cannot render server-side.
- **Guard h renders 26 documents.** Irrelevant while unmounted; the moment you mount it,
  both pages are in that set and a landmark or heading slip names the **document**, not
  your diff.
- **Tests go beside the component, never in `src/guards/`.** That glob **is**
  `bun run guards` and means the eight spec guards (a–h). Keeping it at **211** is the
  check that you filed things correctly.
- **Guard f** allows raw `px` only on `border*`, `outline*`, `box-shadow`,
  `backdrop-filter`, `perspective`, `transform`, inside a token-referencing `calc()`, or
  in a `@media` prelude.
- **WCAG 2.2 SC 2.5.8** (Target Size Minimum, AA) wants **24×24 CSS px**. The footer's
  social links are 28px for exactly this reason.
- **`bun run test`, not `bun test`** — Bun's own runner throws on the `import.meta.glob`
  in `load-lo-glob.ts` and reports a false failure.
- **`src/styles/token-presets.test.ts` enforces preset parity in both directions.** A new
  token goes in all three variant files **and** `tokens.css`, or the suite fails.

---

## Two measurement traps that cost real money in the §D1 session

Both produce **confident wrong numbers rather than errors**, so they are invisible unless
you know:

- **`requestAnimationFrame` never fires while the Browser pane is hidden.** A probe that
  awaits it times out at 45s.
- **CSS transitions are throttled there too.** A transform or colour read mid-transition
  lags one state behind and looks exactly like an inverted-token bug — one was nearly
  reported as such. Inject
  `*{transition:none!important;animation:none!important}` before probing, then remove it.

Also: `computer{action:"zoom"}` does not crop in the Browser pane — it returns the full
screenshot. To inspect one region, hide the rest
(`main,header{display:none!important}`) at 1440×900. Short viewports (~460px) return
blank captures.

---

## Finish the pass

- **`TODO.md`** — retire D4, update the header suite count, add a "Done recently" row
  with the real SHA. **RE-READ IT IMMEDIATELY BEFORE EDITING** — Prettier reflows
  markdown tables, so an exact-string edit against a stale copy fails. Six times now.
- `AGENTS.md` only if a new house rule emerges.
- `STRUCTURE.md` only if a folder appears; then `bun run docs:tree` and commit the result
  plus a prose-table row.
- No `public/llms.txt` change — no new page appears.

---

## Constraints

Files under 800 lines. Conventional commits, **one concern per commit**. Nothing
reachable from `vite.config.ts` may use `@/…` imports. Do not touch course content,
exercise grading logic, the generated `tokens.css` values, or the guards.

---

## Housekeeping

`main` is unprotected by decision (§E), so a direct push works — **show the diff before
pushing**. CI is `.github/workflows/ci.yml`, job `Lint, test, build`, ~50s. No new step
needed.

**D5 is live and unfixed.** `main-*.js` is **295.37 kB raw / 95.86 kB gzipped** against a
**< 80 kB gzipped** target; CSS is **118.91 kB raw / 20.00 kB gzipped** against
**< 15 kB**. The §D handover's "`main-*.js` is ~39kb raw" compares against 295.37 kB raw
— stale by roughly 7.6× on a like-for-like basis. This component adds about 1 kB, which
is fine, but the budget is already breached and the deferred per-LO-chunking trigger
("~a dozen LOs") is met at **one** LO, by a different cause.
