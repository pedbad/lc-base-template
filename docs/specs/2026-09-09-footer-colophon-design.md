# Footer colophon — design

**Date:** 2026-09-09 · **Section:** §D (design & accessibility polish) · **Scope:** the
footer, plus a reusable back-to-top component. The nav and landing-page halves of §D are
separate work.

Ports the institutional footer from `french-lo-1` into this template's token chain, and
closes the first of the three "known edges" recorded in
[`docs/process/TODO.md`](../process/TODO.md) §5.7.

**Revision 2 (2026-09-09)** — six corrections from review, each marked **[R2]** where it
changed a decision. The largest: the reference's reduced-motion block is backwards and
must not port; no image had intrinsic dimensions; and a `<symbol>` conversion that drops
the root `fill` fails silently rather than loudly.

---

## 1. The defect being fixed

`src/components/shell/Footer.tsx` ships on **every page of a live course**:

```
© <course title>. Placeholder footer — real links land in a later Phase C part.
```

plus a `FOOTER_LINKS` array in which **Accessibility** and **Privacy** are both
`href: '#'`.

Two separate faults:

- **Internal build chatter is user-visible copy.** A learner reads "later Phase C part".
- **Two dead links.** This is an accessibility defect, not a cosmetic one: a screen
  reader announces a link, the user activates it, and nothing happens.

Everything else in this document is an improvement. This is the only item that is a
defect, so it lands first.

## 2. Design direction

**Editorial masthead — the footer is the colophon.**

`src/components/home/home.css` already commits to this direction in its own comments:
the hero is an "editorial masthead … so the landing page reads as a cover rather than a
card dump". A cover implies a closing plate. The footer becomes that plate, and every
choice below is justified against it:

| Choice                                   | Editorial justification                                |
| ---------------------------------------- | ------------------------------------------------------ |
| A distinct coloured band, not a hairline | A colophon is a separate plate, not the last paragraph |
| The crest as the band's top edge         | The deckle edge between page block and colophon        |
| Three square marks as one cluster        | An imprint block — publisher, licence, series          |
| Type-led licence sentence, not an icon   | Editorial pages state their terms in prose             |
| Generous vertical rhythm, asymmetric     | Continues the hero's rhythm rather than a uniform grid |

This is the **existing** direction finished, not a new one. It works with the committed
Cambridge palette and the Open Sans / Feijoa pairing rather than against them.

## 3. Architecture

### 3.1 `src/config/footer.config.ts` — new

The footer's content becomes data, validated at import exactly as
`src/config/course.config.ts` is. A template whose footer is hand-edited per clone is
precisely the drift the guards exist to prevent.

```ts
const footerHref = z
  .string()
  .min(1)
  .refine((h) => !h.startsWith('#'), {
    message:
      'A footer link must go somewhere — an in-page fragment is not a footer destination, and "#" is a dead link.',
  });

const FooterLogoSchema = z.object({
  href: footerHref,
  /** %BASE_URL%-relative; rendered through resolveAsset(). */
  src: z.string().min(1),
  /** The LINK's accessible name — it must say where the link goes. */
  alt: z.string().min(1),
  /** Dark-theme variant. Absent → the same file is used in both themes. */
  srcDark: z.string().min(1).optional(),
  /** [R2] Intrinsic pixel dimensions. REQUIRED — this is the CLS fix (§4.2). */
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const FooterConfigSchema = z.object({
  /** Institutional lockup. Omit the key entirely and the block does not render. */
  lockup: FooterLogoSchema.optional(),
  /** © line beneath the lockup. The YEAR is computed, never authored. */
  copyrightHolder: z.string().min(1).optional(),
  /** Square imprint marks. An empty array renders nothing. */
  marks: z.array(FooterLogoSchema).default([]),
  /** Social accounts. `icon` is a `<symbol>` id in public/icons.svg. */
  social: z
    .array(z.object({ href: footerHref, label: z.string().min(1), icon: z.string().min(1) }))
    .default([]),
  /** Licence sentence plus the deed link. */
  licence: z
    .object({ text: z.string().min(1), href: footerHref, linkLabel: z.string().min(1) })
    .optional(),
  /** Utility links — an Accessibility Statement, a Privacy Notice. NONE ship. */
  links: z.array(z.object({ href: footerHref, label: z.string().min(1) })).default([]),
});
```

**`href: '#'` now fails the build.** That is the §5.7 edge closed by construction rather
than by nicer styling around a dead link, and it cannot be reintroduced. Cambridge values
ship as the out-of-box defaults, so this repo's footer matches the reference; a fork that
empties the config gets a shorter footer, never a broken one.

**[R2] What the schema does not catch, stated so the claim is not oversold:** a
well-formed URL that 404s. `footerHref` proves a link has a destination, not that the
destination exists. That is the correct scope — it closes the stated defect (`'#'`, which
has no destination at all) and stops short of a link-checker, which would need the
network. `src/docs/md-links.ts` makes the same trade for prose and records the same
reasoning.

Two deliberate decisions:

- **The whole `FOOTER_LINKS` array is deleted — all three rows, not only the two dead
  ones.** "Back to top" goes too: it pointed at `#content`, the skip-link and
  `<main tabindex="-1">` pair that `PageLayout.tsx` owns, so it was structural chrome
  sitting in a list a clone re-badges. Removing it also lets `footerHref` reject every
  bare fragment with no exception to carve out. **[R2] The affordance is not dropped** —
  it becomes a real component; see §3.4.
- **A separate file, not an extension of `course.config.ts`.** Different lifetime and
  different owner: `course.config.ts` describes _this course_ (title, language, hero
  copy); this describes _this institution_, and is identical across every course the
  Language Centre ships. Folding it in would roughly double that file and mix the two.

### 3.2 Components

Colocated in `src/components/shell/`, mirroring how `LoCard` and `LessonSideNav` split out
of `CourseHome`:

| File                  | ~lines | Responsibility                                           |
| --------------------- | ------ | -------------------------------------------------------- |
| `Footer.tsx`          | 90     | reads the config; renders only the blocks that have data |
| `FooterMarks.tsx`     | 45     | lockup + the three square marks; the light/dark img pair |
| `FooterSocial.tsx`    | 35     | `role="group" aria-label` icon row, via sprite `<use>`   |
| `BackToTopButton.tsx` | 55     | **[R2]** the ported affordance; see §3.4                 |
| `footer.css`          | 190    | `@layer components`, flat single-class selectors         |

Plus `src/lib/prefersReducedMotion.ts` — **[R2]** extracted from `LoAccordion.tsx:60`,
which already has this helper inline. `BackToTopButton` is the second consumer, so the
repetition is real rather than speculative. Two sites is the threshold, not three: the
alternative is a copied `matchMedia` string, and a typo in one copy fails silently by
simply never matching. (`footer.css` is not a consumer — its motion is entirely CSS, per
§4.6, which is the point.)

All far below the 800-line limit; one concern each.

### 3.3 Tokens

No new primitives — `--cam-light-blue` already exists in `src/styles/palette.css`.

New semantic tokens are added to **all three variant files**, then the default
(`tokens-variant-b-dark-blue.css`) is copied over `tokens.css`. `tokens.css` is generated
from a preset and is never hand-edited — see [`DESIGNER.md`](../../DESIGNER.md) Job 2.

```
:root  --footer: var(--cam-light-blue);   --footer-foreground: var(--slate-4);
.dark  --footer: var(--sidebar);          --footer-foreground: var(--slate-1);

both   --footer-crest-a-start / -a-mid
       --footer-crest-b-start / -b-mid
       --footer-crest-linear-start / -linear-mid   ← color-mix() from --footer
```

**[R2] Two reference tokens that need an equivalent here, and get one without a new
token:**

- **`--footer-social-icon-fg: var(--primary-foreground)`** — not needed. The social marks
  are `currentColor` symbols, so they take `--footer-foreground` by inheritance. One
  token instead of two, and it cannot disagree with the surrounding text.
- **`--footer-hover-color` (`--ex-neutral` light / `--ex-active` dark)** — those
  primitives do not exist in this repo. Use `--primary`, which already flips per theme
  (`--cam-dark-blue` on light, `--cam-blue` on dark) and is what the reference's own
  `.license a:hover` uses. No `--footer-hover` token is added.
- **`text-footerText`** — the reference's licence `<p>` carries this Tailwind class
  **and** a `.license { color: color-mix(…) }` rule, two competing colour sources. This
  repo's Tailwind theme has no `footerText` key, so the class would generate nothing and
  the licence colour would silently fall back. **Not carried.** `footer.css` sets
  `color: var(--footer-foreground)` once.

**The crest gets a real dark mode.** The reference sets `display: none` on both
pseudo-elements in dark, which ships half a design — the exact "a contrast pass that only
checked light is half a pass" trap. Instead: `::before` is `background: inherit`, so the
zigzag silhouette works on any surface colour unchanged, and only the `::after` gradient
stops re-mix (toward `--background` in dark instead of `--card`). One rule set, both
themes, no `display: none`, and one appearance pass covers both.

### 3.4 `BackToTopButton` — **[R2]** ported, corrected

The reference ships `src/components/layout/page-shell/BackToTopButton/`. Removing the
footer _link_ was right — that link was this template's own invention, pointing at
`#content` — but the affordance exists upstream and its absence was previously treated as
settled. It is ported.

**What the reference actually is**, since the shape is not what the name suggests:

- **Not a floating button.** `top-button-container` has **zero CSS** in the reference —
  `grep` finds no rule for it anywhere in `index.css`. It is `mt-3 flex justify-end` and
  nothing else: an inline, right-aligned button in normal flow.
- **Mounted once per section**, at `Section.jsx:169`, plus the hero and the showcase — not
  once in the page shell.
- Its `IntersectionObserver` observes **its own container**, so `isIntersecting` means "I
  am on screen". That is a fade-in-on-reveal, not a scroll-depth threshold.

**Four defects corrected in the port**, each against a rule this repo already holds:

1. **No reduced-motion guard on `scrollTo({ behavior: 'smooth' })`.** An unconditional
   smooth scroll is exactly what `prefers-reduced-motion` exists to suppress. The port
   calls `prefersReducedMotion()` and passes `behavior: 'auto'` when set.
2. **`duration-[3600ms]`** — a 3.6-second fade. Almost certainly a typo for `360ms`; the
   port uses a token-scale duration in CSS, not an arbitrary Tailwind value.
3. **The hidden state stays in the accessibility tree.** `opacity-0` +
   `pointer-events-none` + `tabIndex={-1}` removes it from the tab order but leaves it
   announced to a screen reader. This repo has already solved this twice and better —
   `Header.tsx` uses the `hidden` attribute ("so its links are truly unfocusable") and
   `LessonSideNav` uses `inert`. The port uses `inert`, which unlike `hidden` does not
   kill the fade.
4. **`shadcn` `Tooltip` wrapping a button that already has `aria-label="Back to top"`.**
   Redundant for assistive technology and it adds a dependency for a control whose icon
   is a plain arrow. Dropped; the `aria-label` stays.

**Prerender safety.** Visibility is scroll-derived, so it cannot exist server-side. The
initial state is `false`, which the prerender and the hydration render both emit, and the
observer only fires after mount — so first client render already matches. `useIsHydrated`
is therefore **not** needed here, and adding it would be cargo-cult.

**It is built and tested but wired nowhere in this section** ("a component to use for
later"). Choosing its mount points touches `PageLayout`'s section loop and
`CourseHome`, both of which guard h re-renders, so that is its own decision in the nav or
landing half of §D.

## 4. Port corrections

### 4.1 Every px that guard f rejects

Guard f allows px only on `border*`, `outline*`, `box-shadow`, `backdrop-filter`,
`perspective`, `transform`, inside a token-referencing `calc()`, and in a `@media`
prelude. The reference's footer CSS violates that throughout.

| Reference                                             | Here                                                  |
| ----------------------------------------------------- | ----------------------------------------------------- |
| `padding: 40px 36px 60px`                             | `2.5rem 2.25rem 3.75rem`                              |
| `--footer-common-width: 216px` → `320px`              | `13.5rem` → `20rem`                                   |
| logo `height: 45/50/52/54/58/80px` over 4 breakpoints | one `--footer-mark-height`, stepping at 3 breakpoints |
| social button `34px`, icon `22px`                     | `2.125rem`, `1.375rem`                                |
| `border-radius: 8px`                                  | `var(--radius)`                                       |
| crest `height: 64px` / `42px`                         | `4rem` / `2.625rem`                                   |
| `@media (min-width: 640/768/1024/1440px)`             | `@media (width >= 40/48/64/90rem)`                    |

`rem` matters here rather than being a formality: a logo height in px does not grow when
the reader raises their browser font size, so the footer's type would scale away from its
own marks. The range syntax matches `home.css`. `clip-path: polygon(…)` is all
percentages and ports verbatim.

### 4.2 **[R2]** Intrinsic dimensions and CLS

Neither the reference nor revision 1 of this document gave any footer image a `width` or
`height`. Combined with `loading="lazy"` on a below-the-fold element, that is a layout
shift the moment the footer scrolls into view — and this repo's own performance rules say
"all images have explicit dimensions". Inherited defect, fixed here.

`FooterLogoSchema` therefore makes `width` and `height` **required** (§3.1), so a fork
supplying its own mark must state its size. Measured from the reference files:

| File                             | Intrinsic  | Ratio    |
| -------------------------------- | ---------- | -------- |
| `ucam-…-horizontal-light.png`    | 2750 × 397 | 6.93 : 1 |
| `ucam-…-horizontal-dark.png`     | 2741 × 383 | 7.16 : 1 |
| `cc-logo-*.svg` (viewBox)        | 64 × 64    | 1.00 : 1 |
| `elearning-logo-*.svg` (viewBox) | 385 × 394  | 0.98 : 1 |
| `lc-logo-*.svg` (viewBox)        | 595 × 831  | 0.72 : 1 |

Three findings from those numbers:

1. **The two lockup crops disagree — 6.93:1 against 7.16:1.** So `width`/`height`
   attributes alone do _not_ remove the shift: toggling the theme swaps one box shape for
   another. The two PNGs must be re-exported to a single common ratio, or the container
   must pin `aspect-ratio` and both images `object-fit: contain`. The re-export is
   preferred — pinning the ratio letterboxes one of them.
2. **The PNGs are ~5× oversized.** 2750px wide for a box that renders at 13.5–20rem
   (216–320px), or ~554px at the widest `5rem`-height breakpoint. Even at 2× DPR that
   needs ~1100px. At 130 KB each this breaks "never ship source images far beyond
   rendered size". Downscale to ~1200px wide on the way in.
3. **The "square logos" are not square.** LC is portrait at 0.72:1. The reference hides
   this behind fixed heights and `align-items: flex-end`; per-mark `width`/`height` makes
   it explicit and is why the schema takes both rather than a single height.

**A claim to verify rather than assert:** `display: none` + `loading="lazy"` should mean
the hidden theme variant is never fetched, which would also settle the weight objection to
keeping two `<img>`s (§4.5). Confirmed by reading the network panel in the verification
pass, not assumed — if both are fetched, the pair costs double and the decision is
revisited.

### 4.3 Three structures deleted rather than ported

1. **`--footer-social-dark-*` — six tokens (`#fff`, `rgb(255 255 255 / 86%)`, `#1a1a1a`,
   `#060606`, two composites).** Raw colour outside `palette.css`, _and dead_: nothing in
   the reference's own 513-line footer slice reads any of them.
2. **`filter: invert(1)` plus ten `.dark footer … display` toggle rules.** Unnecessary
   once the social marks are `currentColor` sprite symbols — see §4.4.
3. **The vertical lockup — two 130 KB PNGs and twelve toggle rules.** It existed only
   below 640px. A horizontal lockup at `max-width: 100%` inside a `13.5rem` box is
   expected to read at 320px; this is **verified by screenshot at 320px before the files
   are deleted**, and the vertical variant is kept if it does not.

Selectors flatten: `footer .footer-container .footer-links .footer-link-button` becomes
`.footer-social-link`. Five-level descendant chains do not survive the port; this repo
styles with flat single-class rules inside `@layer components`.

### 4.4 Assets, and the `<symbol>` conversion trap

- Lockup and square marks → `public/images/footer/`.
- The five social marks → **`public/icons.svg`**, as `<symbol>`s. `IconsSection.tsx`
  already names the sprite as the home for "the brand and social marks Lucide" does not
  carry.
- Ids are `social-facebook`, `social-x`, `social-youtube`, `social-linkedin`,
  `social-instagram`. The `social-` prefix avoids colliding with the sprite's existing
  `x-icon`, which is a different drawing with a hardcoded `#08060d` fill.

**[R2] The conversion drops the fill, and fails silently when it does.** The source files
carry `fill="currentColor"` on the **root `<svg>`**, not on the `<path>`. Rewriting
`<svg>` → `<symbol>` discards root attributes unless they are carried across deliberately.

Measured in Chrome 152 on 2026-09-09 by rendering three sprite variants on hosts with
`color: red` and `color: green` and **screenshotting the result** — the earlier
`getComputedStyle(use).color` check was weaker than its claim, since it proved colour
reaches the `<use>` and not that the symbol's `fill` resolves against it:

| Sprite variant                      | on red host | on green host |
| ----------------------------------- | ----------- | ------------- |
| `fill="currentColor"` on `<symbol>` | red         | green         |
| `fill="currentColor"` on `<path>`   | red         | green         |
| **fill dropped in conversion**      | **black**   | **black**     |

Both placements work. A dropped fill does not throw — it paints **black**, which on the
dark band is a near-invisible icon that renders, passes every existing test, and looks
like a styling nit rather than a broken port.

**So it gets a regression test, not care:** `sandbox-catalog.test.ts` gains an assertion
that every `social-*` symbol in `public/icons.svg` carries `fill="currentColor"` on the
symbol or on every path beneath it. Convention: `fill` goes on the `<symbol>`.

**Re-verify in Firefox and Safari** per the repo's cross-browser rule. Documented fallback
if either fails: five inline SVG components (~1.5 KB total), trading the sandbox's Icons
listing for guaranteed theming.

**Licensing.** `LICENSE` already covers committing these files: "Any Cambridge mark that
ships in this repository does so for use by the University only", and forks "must remove
or replace them". Committed rather than git-ignored (the Feijoa pattern) so tests are
deterministic and the out-of-box course looks finished. Because each block renders only
when its config entry exists, a fork that deletes the files also deletes the config rows
and the footer simply gets shorter — there is no broken-image state.

### 4.5 The lockup's light/dark pair stays two `<img>`s

Two `<img>` elements with a `.dark` display toggle, both `loading="lazy"` (the footer is
below the fold) and both carrying `width`/`height` from the config (§4.2).

The two obvious alternatives are both wrong here, and are recorded so they are not
re-tried:

- **`<picture>` + `prefers-color-scheme`** ignores the theme this app actually uses. The
  theme is class-based (`.dark`, set by `ThemeToggle`), so a media-query swap would
  disagree with the toggle.
- **Choosing `src` in JS** would make the first client render differ from the prerendered
  markup, which `docs/process/2026-08-06-post-phase-d-handover.md` §3 forbids.

### 4.6 **[R2]** Reduced motion — the reference block is backwards

Revision 1 said the reference's reduced-motion block "ports". It must not. The reference
_adds_ declarations inside `reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  footer … .square-logos a {
    transition: color 120ms ease;
  } /* 180ms → 120ms */
}
```

Narrowing a transition from 180ms to 120ms inside `reduce` is pointless churn, and writing
motion _into_ the reduce branch is the wrong direction of travel.

Two correct shapes exist, and this picks the repo's:

- **`no-preference` opt-in** — no transform in base, motion added under
  `@media (prefers-reduced-motion: no-preference)`. Strictly safer: it fails closed on a
  user agent that does not support the query.
- **`reduce` override** — motion in base, `transition: none; transform: none` under
  `reduce`. This is what `home.css:221-239` and `shell.css:31-35` already do.

**Decision: the `reduce` override, matching the repo.** Introducing a second motion idiom
in one new file is worse than either shape used consistently, and the repo's version is
already strictly stronger than the reference's (it kills the transition outright rather
than shortening it). The `no-preference` shape is the better default and is recorded here
as a candidate **repo-wide** change — all of `home.css`, `shell.css` and `footer.css` in
one commit — which is out of scope for this document.

Separately, §3.4 fixes a real reduced-motion defect: the reference's smooth `scrollTo`
has no guard at all.

### 4.7 `target="_blank"`

Applied to all external links, with `rel="noopener noreferrer"`, plus a visually-hidden
"(opens in a new tab)" appended to each accessible name.

Reasoning: leaving a lesson mid-exercise is the worse outcome, so a new tab is right for
institutional links even though `LoCard` deliberately keeps _lesson_ links in-tab. WCAG
3.2.5 is AAA and does not require the warning, but announcing it costs one `sr-only` span
and this is the accessibility section.

## 5. Accessibility contract

- **No heading element anywhere in the footer.** Spec §5: a decorative `<h2>` in the
  footer was a french-lo-1 mistake that broke strict heading-outline checks.
  `Footer.test.tsx`'s `not.toMatch(/<h[1-6][\s/>]/)` stays the load-bearing assertion.
- **Not a `<nav>`.** Spec §17 allows exactly one primary nav landmark per page and the
  header already owns it. The footer's link list is a plain `<ul>`.
- The social row is `role="group" aria-label="Follow us"` — ported from the reference,
  which gets this right: a labelled group needs no heading.
- Each mark is a link whose accessible name comes from its `alt`, so the name says where
  the link goes ("Licence: CC BY-NC 4.0", not "Creative Commons").
- Decorative icons carry `aria-hidden="true"`; every icon-only control has an `sr-only`
  name.
- All footer motion stays in CSS so `prefers-reduced-motion` is honoured without JS
  (§4.6). `BackToTopButton`'s scroll is the one JS-side case and is guarded (§3.4).
- **[R2]** `BackToTopButton`'s hidden state uses `inert`, so it leaves the accessibility
  tree rather than only the tab order.
- Guard h re-renders the footer inside all 26 of its documents, so a landmark, label or
  heading-order mistake fails `bun run test` for free.

## 6. Tests

Colocated beside their components, **never** in `src/guards/` — that glob is
`bun run guards` and means the eight spec guards (a–h). It must stay at 211.

| File                       | Asserts                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `Footer.test.tsx`          | one footer landmark; **no heading**; absent config blocks render nothing; **no `href="#"` anywhere in the output** |
| `FooterMarks.test.tsx`     | lockup renders both theme variants; **every `<img>` has `width` and `height`** [R2]; absent `srcDark` reuses `src` |
| `FooterSocial.test.tsx`    | group role + label; one named link per entry; sprite href goes through `resolveAsset()`                            |
| `footer.config.test.ts`    | `'#'` and `'#anything'` rejected with the stated message; empty arrays valid; year computed not authored           |
| `BackToTopButton.test.tsx` | **[R2]** `inert` when hidden; `aria-label` present; `behavior: 'auto'` under reduced motion                        |
| `sandbox-catalog.test.ts`  | **[R2]** every `social-*` symbol carries `fill="currentColor"` (the silent-black regression, §4.4)                 |

The `href="#"` assertion is the regression test for the actual defect.
`sandbox-catalog.test.ts` already fails in both directions until the five new sprite ids
are listed — that is the net working, not a nuisance.

## 7. Verification bar

Beyond the standard gate:

```bash
bun run format && bun run lint && bun run lint:css && bun run test && bun run build
BASE_URL=/course/ bun run build
```

`bun run test`, not `bun test` — Bun's runner throws on the `import.meta.glob` in
`load-lo-glob.ts`.

- **Keyboard only** — tab through the landing page and one LO page, into the footer. No
  focusable element may be invisible; focus never trapped. `BackToTopButton` must be
  unreachable while `inert`.
- **Both themes**, via the sandbox theme switch.
- **Widths 320 · 375 · 768 · 1024 · 1440** — no horizontal body scroll. 320 additionally
  decides whether the vertical lockup can be deleted (§4.3).
- **[R2] CLS.** Scroll the footer into view from cold and confirm no shift, then **toggle
  the theme with the footer in view** and confirm the lockup swap shifts nothing (§4.2 is
  the reason this is a separate check). Also confirm from the network panel whether the
  `display: none` variant is fetched.
- **`prefers-reduced-motion`** honoured with JS disabled for the CSS motion, and with JS
  enabled for `BackToTopButton`'s scroll.
- **[R2] Contrast, with the licence block named explicitly.** It is the largest text mass
  in the footer at `text-xs` (~12px), so it is normal text and needs **4.5:1**, not 3:1.
  Computed for the chosen light pair:

  | Pair                                                   | Ratio     | Verdict   |
  | ------------------------------------------------------ | --------- | --------- |
  | `--slate-4` on `--cam-light-blue`                      | 13.06 : 1 | AAA       |
  | licence at the reference's `color-mix(foreground 85%)` | 8.40 : 1  | passes AA |

  The light theme is therefore safe **by number, not by eye**. The dark pair
  (`--slate-1` on `--sidebar`) is the same pair already shipping as
  `--card` / `--card-foreground` in dark; because `--sidebar` is an oklab `color-mix`,
  it is **measured in-browser** rather than hand-computed. Hover state is `--primary` in
  both themes (§3.3) and is measured on the band too.

- **Perf** — `main-*.js` is ~39 KB raw today against a < 80 KB gzipped budget. The five
  sprite symbols add no JS; `BackToTopButton` adds ~1 KB. Check the build output, and
  check the downscaled PNG weights (§4.2).

## 8. Documentation to update

| File                             | Why                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| `DESIGNER.md`                    | the new `--footer*` token rows, and how to re-badge the footer                            |
| `src/sandbox/sandbox-catalog.ts` | five sprite ids + the `--footer` / `--footer-foreground` pair                             |
| `STRUCTURE.md`                   | new `public/images/footer/` — `bun run docs:tree` + a prose row                           |
| `AGENTS.md`                      | house rule: institutional content lives in `footer.config.ts`, and `#` is schema-rejected |
| `docs/process/TODO.md`           | last — renumber, suite count, §5.7 edge cleared, Done-recently rows                       |

**No `public/llms.txt` change.** It describes the deployed site's pages, and no new page
appears; the utility links point at institutional URLs rather than in-repo pages.

Three items found while reading, not in the §D handover:

- **`DESIGNER.md` contains duplicated paragraphs** — lines 115/116 and 130–133/134–137 are
  near-identical pairs left behind by the §C docs-hub commit. A real defect; own commit.
- The third §5.7 edge (landing chrome words hardcoded) now has company: the footer adds
  "Follow us", "Back to top" and the new-tab cue. If that edge is closed, all of them move
  into `ui-strings.ts` in **one** contract change, not two. Out of scope for this
  document.
- **[R2]** The `no-preference` motion shape (§4.6) is a candidate repo-wide change across
  `home.css`, `shell.css` and `footer.css`. Also out of scope, recorded so it is not lost.

## 9. Commit sequence

One concern each; the defect first.

```
 1  docs: renumber branch protection to §E and open §D    (TODO.md:13, "job D1" → "job E1")
 2  fix(footer): replace the placeholder footer with schema-validated config   ← THE DEFECT
 3  chore(assets): footer marks, downscaled and ratio-normalised               [R2]
 4  feat(footer): institutional lockup, imprint marks and social row
 5  feat(styles): footer surface and crest tokens
 6  feat(footer): editorial colophon styling
 7  refactor(lib): extract prefersReducedMotion from LoAccordion               [R2]
 8  feat(shell): back-to-top button, reduced-motion safe and inert when hidden [R2]
 9  feat(sandbox): list the five social marks and the footer surface pair
10  docs: DESIGNER footer tokens; drop the duplicated sandbox paragraphs
11  docs: STRUCTURE tree for public/images/footer
12  docs: close §D in TODO
```

Commit 1 renames in the same commit as the renumber so nothing points at a section letter
that moved. `docs/process/TODO.md:13` is the only reference in the repo.

Commit 2 includes the `Footer.tsx` rewrite, not only the new config file — the config
landing unused would be a half-commit, and the defect would still be shipping after it.

Commit 3 lands before 4 so the markup is never written against oversized or
mismatched-ratio files. Commit 7 lands before 8 because 8 is the helper's second consumer.
