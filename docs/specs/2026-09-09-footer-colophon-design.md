# Footer colophon — design

**Date:** 2026-09-09 · **Section:** §D (design & accessibility polish) · **Scope:** the
footer only. The nav and landing-page halves of §D are separate work.

Ports the institutional footer from `french-lo-1` into this template's token chain, and
closes the first of the three "known edges" recorded in
[`docs/process/TODO.md`](../process/TODO.md) §5.7.

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

Two deliberate decisions:

- **The whole `FOOTER_LINKS` array is deleted — all three rows, not only the two dead
  ones.** "Back to top" goes too (decision 2026-09-09): it pointed at `#content`, the
  skip-link and `<main tabindex="-1">` pair that `PageLayout.tsx` owns, so it was
  structural chrome sitting in a list a clone re-badges. Removing it also lets
  `footerHref` reject every bare fragment with no exception to carve out.
- **A separate file, not an extension of `course.config.ts`.** Different lifetime and
  different owner: `course.config.ts` describes _this course_ (title, language, hero
  copy); this describes _this institution_, and is identical across every course the
  Language Centre ships. Folding it in would roughly double that file and mix the two.

### 3.2 Components

Colocated in `src/components/shell/`, mirroring how `LoCard` and `LessonSideNav` split out
of `CourseHome`:

| File               | ~lines | Responsibility                                           |
| ------------------ | ------ | -------------------------------------------------------- |
| `Footer.tsx`       | 90     | reads the config; renders only the blocks that have data |
| `FooterMarks.tsx`  | 40     | lockup + the three square marks; the light/dark img pair |
| `FooterSocial.tsx` | 35     | `role="group" aria-label` icon row, via sprite `<use>`   |
| `footer.css`       | 180    | `@layer components`, flat single-class selectors         |

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

**The crest gets a real dark mode.** The reference sets `display: none` on both
pseudo-elements in dark, which ships half a design — the exact "a contrast pass that only
checked light is half a pass" trap. Instead: `::before` is `background: inherit`, so the
zigzag silhouette works on any surface colour unchanged, and only the `::after` gradient
stops re-mix (toward `--background` in dark instead of `--card`). One rule set, both
themes, no `display: none`, and one appearance pass covers both.

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

### 4.2 Three structures deleted rather than ported

1. **`--footer-social-dark-*` — six tokens (`#fff`, `rgb(255 255 255 / 86%)`, `#1a1a1a`,
   `#060606`, two composites).** Raw colour outside `palette.css`, _and dead_: nothing in
   the reference's own 513-line footer slice reads any of them.
2. **`filter: invert(1)` plus ten `.dark footer … display` toggle rules.** Unnecessary
   once the social marks are `currentColor` sprite symbols — see §4.3.
3. **The vertical lockup — two 130 KB PNGs and twelve toggle rules.** It existed only
   below 640px. A horizontal lockup at `max-width: 100%` inside a `13.5rem` box is
   expected to read at 320px; this is **verified by screenshot at 320px before the files
   are deleted**, and the vertical variant is kept if it does not.

Selectors flatten: `footer .footer-container .footer-links .footer-link-button` becomes
`.footer-social-link`. Five-level descendant chains do not survive the port; this repo
styles with flat single-class rules inside `@layer components`.

### 4.3 Assets

- Lockup and square marks → `public/images/footer/`.
- The five social marks → **`public/icons.svg`**, as `<symbol>`s with
  `fill="currentColor"`. `src/sandbox/IconsSection.tsx` already names the sprite as the
  home for "the brand and social marks Lucide" does not carry.
- Ids are `social-facebook`, `social-x`, `social-youtube`, `social-linkedin`,
  `social-instagram`. The `social-` prefix avoids colliding with the sprite's existing
  `x-icon`, which is a different drawing with a hardcoded `#08060d` fill.

**Why `currentColor` works, and why the reference could not use it.** The reference's five
SVG files are _already_ `fill="currentColor"`, but it loads them with `<img src>`, and an
`<img>`-loaded SVG cannot inherit colour from the host document. That is the sole reason
its `filter: invert(1)` dark hack exists. Referenced through `<use>` instead, the symbol
inherits the host's computed `color`.

Verified in Chrome 152 on 2026-09-09: a `<use>` inside a host with
`color: rgb(255, 0, 0)` reports `getComputedStyle(use).color === 'rgb(255, 0, 0)'`, so
`currentColor` in the referenced symbol resolves against it. **Re-verify in Firefox and
Safari** per the repo's cross-browser rule. Documented fallback if either fails: five
inline SVG components (~1.5 KB total), which trades the sandbox's Icons listing for
guaranteed theming.

**Licensing.** `LICENSE` already covers committing these files: "Any Cambridge mark that
ships in this repository does so for use by the University only", and forks "must remove
or replace them". Committed rather than git-ignored (the Feijoa pattern) so tests are
deterministic and the out-of-box course looks finished. Because each block renders only
when its config entry exists, a fork that deletes the files also deletes the config rows
and the footer simply gets shorter — there is no broken-image state.

### 4.4 The lockup's light/dark pair stays two `<img>`s

Two `<img>` elements with a `.dark` display toggle, both `loading="lazy"` (the footer is
below the fold).

The two obvious alternatives are both wrong here, and are recorded so they are not
re-tried:

- **`<picture>` + `prefers-color-scheme`** ignores the theme this app actually uses. The
  theme is class-based (`.dark`, set by `ThemeToggle`), so a media-query swap would
  disagree with the toggle.
- **Choosing `src` in JS** would make the first client render differ from the prerendered
  markup, which `docs/process/2026-08-06-post-phase-d-handover.md` §3 forbids.

### 4.5 `target="_blank"`

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
- All motion stays in CSS so `prefers-reduced-motion` is honoured without JS — the
  reference's reduced-motion block ports.
- Guard h re-renders the footer inside all 26 of its documents, so a landmark, label or
  heading-order mistake fails `bun run test` for free.

## 6. Tests

Colocated beside their components, **never** in `src/guards/` — that glob is
`bun run guards` and means the eight spec guards (a–h). It must stay at 211.

| File                    | Asserts                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `Footer.test.tsx`       | one footer landmark; **no heading**; absent config blocks render nothing; **no `href="#"` anywhere in the output** |
| `FooterMarks.test.tsx`  | lockup renders both theme variants; marks render one link each; absent `srcDark` reuses `src`                      |
| `FooterSocial.test.tsx` | group role + label; one named link per entry; sprite href goes through `resolveAsset()`                            |
| `footer.config.test.ts` | `'#'` and `'#anything'` rejected with the stated message; empty arrays valid; year computed not authored           |

The `href="#"` assertion is the regression test for the actual defect.
`src/sandbox/sandbox-catalog.test.ts` already fails in both directions until the five new
sprite ids are listed — that is the net working, not a nuisance.

## 7. Verification bar

Beyond the standard gate:

```bash
bun run format && bun run lint && bun run lint:css && bun run test && bun run build
BASE_URL=/course/ bun run build
```

`bun run test`, not `bun test` — Bun's runner throws on the `import.meta.glob` in
`load-lo-glob.ts`.

- **Keyboard only** — tab through the landing page and one LO page, into the footer. No
  focusable element may be invisible; focus never trapped.
- **Both themes**, via the sandbox theme switch.
- **Widths 320 · 375 · 768 · 1024 · 1440** — no horizontal body scroll. 320 additionally
  decides whether the vertical lockup can be deleted (§4.2).
- **`prefers-reduced-motion`** honoured with JS disabled.
- **Contrast** read from the palette's documented pairs, not by eye.
- **Perf** — `main-*.js` is ~39 KB raw today against a < 80 KB gzipped budget. The five
  sprite symbols add no JS; check the build output.

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

Two items found while reading, not in the §D handover:

- **`DESIGNER.md` contains duplicated paragraphs** — lines 115/116 and 130–133/134–137 are
  near-identical pairs left behind by the §C docs-hub commit. A real defect; own commit.
- The third §5.7 edge (landing chrome words hardcoded) now has company: the footer adds
  "Follow us" and the new-tab cue. If that edge is closed, both move into `ui-strings.ts`
  in **one** contract change, not two. Out of scope for this document.

## 9. Commit sequence

One concern each; the defect first.

```
1  docs: renumber branch protection to §E and open §D    (TODO.md:13, "job D1" → "job E1")
2  fix(footer): replace the placeholder footer with schema-validated config    ← THE DEFECT
3  feat(footer): institutional lockup, imprint marks and social row
4  feat(styles): footer surface and crest tokens
5  feat(footer): editorial colophon styling
6  feat(sandbox): list the five social marks and the footer surface pair
7  docs: DESIGNER footer tokens; drop the duplicated sandbox paragraphs
8  docs: STRUCTURE tree for public/images/footer
9  docs: close §D in TODO
```

Commit 1 renames in the same commit as the renumber so nothing points at a section letter
that moved. `docs/process/TODO.md:13` is the only reference in the repo.
