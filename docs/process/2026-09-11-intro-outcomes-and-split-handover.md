# The introduction's outcomes callout and illustration split (handover)

**Date:** 2026-09-11 · **HEAD at write time:** `c6a9e2d`, clean, pushed, CI green ·
**Suite:** 97 files · 971 tests · `bun run guards` = 211 (7 files)

The introduction is already **un-carded** (`7e22990`): no accordion, no border, no
chevron, no `<h3>`, prose flush at the section's left edge. This document is the two
pieces deliberately cut from that job — the **outcomes callout** and the **two-column
illustration split**.

---

## Read first

- [`TODO.md`](TODO.md) — §D is 3 of 6 open (D3, D5, D6). This job is **not** in §D; it
  is new work off the back of `7e22990`.
- `src/lo/lo-page-sections.tsx` — `sectionContent()`, where the `plain` branch lives.
  Roughly 20 lines, and the whole mechanism.
- `src/config/lo-schema.ts` — `BlockConfigSchema`, including `presentation` and the
  three refines that reject accordion-only fields on a plain block.
- `src/lo/blocks/text-block-schema.ts` — the prose block's `content` contract. **Read
  the `text` field's comment before designing anything**, for the reason in the next
  section.
- The reference: `/Users/ped/Sites/french/french-lo-1/src/components/layout/page-shell/IntroSection/IntroSection.jsx`
  (79 lines) and `src/components/Section/instructions-media.jsx` (53 lines).

---

## Two things about the reference that change the job

**1. THE OUTCOMES LIST IS NOT A COMPONENT IN FRENCH. IT IS RAW HTML.** Grep it and
confirm: `grep -rl "After completing this unit" src/` in french-lo-1 matches **all 15
`src/lo-config/*.json` files and no component at all**. It is authored as
`informationHTML` in the LO's JSON, passed through as `informationTextHTML`, and
injected. There is nothing to port. (Use that phrase, not "will be able to" — the
looser one also hits unrelated prose in
`src/components/custom/pronunciation/first-contact-pronunciation.jsx`.)

That matters because **this repo structurally cannot do that**. `TextBlockContentSchema`
transforms every authored paragraph through `parseRichText` specifically "so the
renderer receives a validated tree, never a string it might inject". An HTML-blob
field would be the first injection point in the codebase and would walk straight into
the XSS rule in `rules/ecc/web/security.md`. So the outcomes list has to be designed
as **structured content** — an array of strings, each parsed as inline rich text like
`text[]` already is — not as HTML.

**2. THE ILLUSTRATION IS ITSELF A CARD, even though the intro's card is transparent.**
`instructions-media.jsx:32` gives the `<figure>` `rounded-2xl border bg-surface-elevated/70
p-4 shadow-sm` and `max-w-[520px]`. So french's intro is transparent prose sitting
beside an opaque, bordered, shadowed picture panel. That asymmetry is the design, and
it is easy to miss from the screenshot. Decide whether you want it here — this repo's
`--card` and `--border` tokens give you the same effect, but §D1's editorial direction
may argue for something plainer.

`stackOnDesktop` is the only layout knob: it toggles `md:flex-row md:items-start
md:gap-8` on the wrapper and `md:w-1/2` on the figure. That is the entire split.

---

## The two jobs are independent — do them in either order, or only one

**A. The outcomes callout.** A titled list ("After completing this unit, you will be
able to:") with a tick per item. No image, no layout change. Touches
`text-block-schema.ts` (a new optional field), the prose renderer, and one new
presentational component.

**B. The illustration split.** An image beside the prose, stacking on narrow screens.
Touches the block schema (an image field), the renderer, and the LO's asset story.

A is smaller and lands on its own. B is where the sharp edges are.

---

## Decisions this job has to make, not inherit

1. **Where does the outcomes list live?** Two defensible homes:
   - a new optional field on `TextBlockContentSchema` (e.g. `outcomes: string[]`),
     which keeps the intro one block; or
   - a new block `type` with its own schema and renderer, registered in
     `BLOCK_RENDERERS`.

   The first is fewer moving parts. The second stops every prose block in the course
   from silently gaining an outcomes list. Pick deliberately.

2. **Is the outcomes callout `InstructionsCallout` again, or a new primitive?**
   `src/components/shell/InstructionsCallout.tsx` already exists, is deliberately NOT
   `role="alert"`, and carries the stable `.instructions` class. The french screenshot
   shows a _different_ treatment — green tint, ticks, a lead-in line. If that is a
   second primitive, it needs its own class and its own tokens; if it is a variant,
   say so in one place rather than forking the component.

3. **Does a tick belong in the accessibility tree?** It is decorative: the list
   semantics come from `<ul>`/`<li>`. Icons get `aria-hidden` per `AGENTS.md`.

4. **Where does the image come from, and does it have alt text?** `LoCard` is the
   pattern to copy (`src/components/home/LoCard.tsx:52`): `src={resolveAsset(...)}`
   with `alt=""` because the card's illustration is decorative. An intro illustration
   that carries meaning needs real alt text; one that is atmosphere should be `alt=""`
   and stay out of the tree. Do not default to a generic string the way the reference
   does (`"Learning object introduction illustration"` says nothing).

---

## Traps that will cost you real time

- **`public/images/` holds only `lo-placeholder.svg` plus two folders.** There is no
  intro artwork in this repo. **Guard c** checks asset paths go through
  `resolveAsset()`; **guard d** checks the referenced file actually EXISTS. So a
  config field pointing at art you have not added fails the build — which is correct,
  and is the guard doing its job, not an obstacle to work around.
- **`bun run test`, not `bun test`** — Bun's runner throws on the `import.meta.glob`
  in `load-lo-glob.ts` and reports a false failure.
- **Tests go beside the code, never in `src/guards/`.** That glob IS `bun run guards`
  and means the eight spec guards. Keeping it at **211** is the check that you filed
  things correctly.
- **Guard f** allows raw `px` only on `border*`, `outline*`, `box-shadow`,
  `backdrop-filter`, `perspective`, `transform`, inside a token-referencing `calc()`,
  or in a `@media` prelude. A `max-w-[520px]` ported from the reference is a Tailwind
  arbitrary value, not CSS, so guard f will not see it — decide whether you want it
  anyway.
- **Guard h renders 26 documents** and sweeps for dangling `aria-*` references,
  landmarks and heading order. An `<h3>` or a `<figcaption>` added here lands in that
  set.
- **`src/styles/token-presets.test.ts` enforces preset parity both ways.** A new token
  goes in all three variant files **and** `tokens.css`, or the suite fails.
- **Do not hand-edit `tokens.css`** — `DESIGNER.md` says it is generated and your edit
  is lost at the next preset switch.

### Measurement traps, all four of which produced confident WRONG numbers this week

They are listed in full in `TODO.md` under D2. In short: a hidden Browser pane does
not fire `requestAnimationFrame`, does not deliver `IntersectionObserver` callbacks,
does not advance CSS transitions and does not sample a `ViewTimeline`; `resize_window`
with preset `desktop` while hidden leaves the tab at **zero width**, so geometry reads
as nonsense; `getComputedStyle` returns `color-mix()` and `oklab()` UNCONVERTED, so a
naive numeric parse produces fictional contrast ratios; and
`window.scrollTo({behavior: 'auto'})` now resolves to the document's `smooth`, so it
silently does nothing in a probe — pass `'instant'`.

**The lesson, learned the expensive way: get a human to look at anything animated or
visual. Everything AROUND a broken animation measured green three times running.**

---

## Scope and the gate

```bash
bun run format && bun run lint && bun run lint:css && bun run test && bun run build
BASE_URL=/course/ bun run build
```

Plus, because this is visual work: **both themes, and 320 / 375 / 768 / 1024 / 1440**,
checking the split actually stacks and that nothing overflows. Contrast on any new
tinted surface must be **computed from rendered pixels**, not eyeballed — §D1 set that
precedent and the numbers are in its spec.

---

## Finish the pass

- **`TODO.md`** — add a "Done recently" row with the real SHA and update the header
  suite count. **RE-READ IT IMMEDIATELY BEFORE EDITING** — an exact-string edit
  against a stale copy fails, and the table rows get their column widths reflowed.
- `AGENTS.md` only if a new house rule emerges (a second callout primitive probably is
  one).
- `STRUCTURE.md` only if a folder appears; then `bun run docs:tree`.
- `DESIGNER.md` if a new token lands.

---

## Constraints

Files under 800 lines. Conventional commits, **one concern per commit**. Nothing
reachable from `vite.config.ts` may use `@/…` imports. Tokens only — no raw hex
outside `palette.css`. Every CSS rule inside `@layer`, no `!important`. Do not touch
the guards' thresholds without saying so out loud: `7e22990` lowered
`semantic-dom`'s heading floor 15 → 14 for a deliberately removed `<h3>`, and that is
the bar for how visible such a change should be.

---

## Housekeeping

`main` is unprotected by decision (§E), so a direct push works — **show the diff
before pushing**. CI is `.github/workflows/ci.yml`, job `Lint, test, build`, ~50s.

**D5 is live and unfixed.** `main-*.js` is **96.19 kB gzipped** against a **< 80 kB**
target; CSS is **20.22 kB** against **< 15 kB**. An illustration adds bytes to neither
bundle, but check the image's own weight: the footer assets were downscaled 264 → 52 kB
in `4c70955`, and that is the standard.
