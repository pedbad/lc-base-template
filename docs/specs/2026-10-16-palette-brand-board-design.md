# Debug sandbox — the Colour section as a brand board (E19)

**Date:** 2026-10-16 · **Status:** design approved 2026-10-16, not built
**TODO:** §E19 · **Builds on:** the sandbox (buildlist 16) and its palette preview (§E18)

## 1. Why

The sandbox's Colour section is three flat grids: a square and a token name per
primitive, a "surface + sample sentence" card per semantic pair, and bars for lines and
the chart ramp. It is accurate, but it is a stylesheet drawn as squares. A client — a
course owner approving the look — cannot tell from it which colour is the brand, how
much of each the course uses, what a colour is for, or whether it is accessible. A
designer cannot read a value off it at all: the page shows names, never HEX.

The maintainer asked (2026-10-16) for a presentation that serves both, layered: a
brand board for the stakeholder, with the technical detail one fold away for the
designer.

## 2. Decisions

- **Brand board, not a table** (approach A, chosen over a dense reference table and
  over polishing the grids).
- **One theme at a time.** The section follows the header's theme toggle; no light/dark
  side-by-side (maintainer, 2026-10-16: the toggle already does that).
- **Live values, never stored values.** HEX, RGB and contrast are read from the browser
  after hydration. The catalog still holds names only, so the page cannot go stale and
  guards f and g need no exception.
- **Out:** copy-to-clipboard, OKLCH or HSL readouts, a printable/exported brand sheet.
  Each is easy to add later and none was asked for.

## 3. What the section shows

The `#palette` section keeps its id, heading and place in the sandbox. Its intro is
shortened to two sentences a stakeholder can read: what the palette is, and that the
toggle and preset picker change what follows.

### ① At a glance

A single horizontal bar, each segment one primitive, its width that primitive's
**share** of the course's visual weight. Draft shares (a design judgement, tuned by the
maintainer): Paper 40, Slate 4 22, Cambridge Blue 16, Dark Blue 10, Warm Blue 6, then
the accents at 2 each. Primitives without a share do not appear in the bar. Plain names
sit under the bar. The bar is a `<ul>` with an accessible name; each segment is an
`<li>` whose text (visually hidden) is "name, share" — a screen reader hears a list,
not a picture. Segments paint from `var(--token)`, so a preset or an edit repaints them.

### ② The colours

A card per primitive, in four groups: **Core** (the Cambridge Blue family),
**Neutrals** (White, Paper, Slates), **Accents** (crest, cherry, purple, indigo, dark
crest), **Feedback** (the three greens, the two ambers). Each card holds:

- a swatch, with "Aa" in the colour's **partner** — the colour text or ground it is
  meant to pair with (Dark Blue on Cambridge Blue, Slate 4 on Paper);
- the **name** ("Cambridge Blue"), and the **job** in one plain sentence;
- the **live values**: HEX and `RGB r g b`;
- a **contrast badge** against the partner: the ratio to one decimal and a verdict —
  **AAA** (≥ 7), **AA** (≥ 4.5), **AA large** (≥ 3), **Decorative only** (< 3);
- a native `<details>` "Token" holding the token name and `src/styles/palette.css`.

### ③ In use

Replaces the semantic-pair grids and the strips. Each role is shown as real UI, built
from the real components, so a preset or theme change shows its true effect:

| Role                          | Shown as                                                |
| ----------------------------- | ------------------------------------------------------- |
| Page, card, popover           | nested surfaces with a line of body text on each        |
| Primary, secondary            | the real `Button` variants, with an icon-only one       |
| Accent, muted                 | a hovered-looking row and helper text                   |
| Success, destructive, warning | the feedback a learner sees: correct, try again, a note |
| Border, input, ring           | an input at rest and one drawn with the focus ring      |
| Chart 1–5                     | a five-bar mini chart, in slot order                    |
| Sidebar trio                  | a compact sidebar row                                   |

Every role has a `<details>` "Tokens" listing its `tokens.css` pair (or tokens, for
lines and the chart) and the live contrast between surface and foreground. Everything
Layer 2 shows today is still reachable; only the presentation changes. The specimens
are decorative samples: real components where the markup allows it without adding a
focusable control, `aria-hidden` and non-focusable where it does not (as the preset
picker's samples are, §E18).

## 4. How values stay live and honest

- **Reading a colour.** After hydration, a hook paints `var(--token)` onto a 1×1
  `<canvas>` and reads back the sRGB bytes. One path for a plain HEX, a `color-mix()`
  (tokens.css uses them) or an `oklch()` value, with no CSS colour parser to write.
- **Before hydration** every value and badge reads "—". The prerendered markup equals
  the first client render (hard constraint 4) because the values are behind
  `useIsHydrated` and are read in an effect.
- **Re-reading.** On a theme change (a `MutationObserver` on `<html>`'s `class`), on
  `PRESET_CHANGE_EVENT`, and on `storage`. One subscription for the section, not one
  per card.
- **No canvas** (a browser that refuses `getContext('2d')`): the values stay "—" and
  the section still renders. Not an error worth surfacing on a debug page.

## 5. Files

New folder `src/sandbox/palette/`, so no file grows large:

| File                    | Holds                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| `colour-math.ts`        | pure: bytes → HEX / RGB text, WCAG luminance, ratio, verdict       |
| `useLiveColours.ts`     | the canvas read, the subscriptions, a map token → bytes            |
| `PaletteAtAGlance.tsx`  | ① the proportion bar                                               |
| `ColourCard.tsx`        | ② one card                                                         |
| `ColourInUse.tsx`       | ③ the role specimens                                               |
| `../PaletteSection.tsx` | the section shell, intro and order (stays the import Sandbox uses) |

`sandbox-catalog.ts` grows, still names only: each primitive gains `name`, `job`,
`partner` (a token) and an optional `share`; the groups are renamed to the four above.
The semantic groups gain the specimen kind each role renders as. No value appears.

## 6. Tests (written first, beside the code)

- `colour-math.test.ts`: HEX and RGB text from bytes; luminance and ratio for known
  pairs (white on black is 21, white on white is 1); every verdict boundary.
- `sandbox-catalog.test.ts`: the existing joins to `palette.css` and `tokens.css` in
  both directions stay; every primitive has a name, a job and a partner that
  `palette.css` declares; shares are positive and the bar's primitives exist.
- `PaletteAtAGlance.test.tsx`, `ColourCard.test.tsx`, `ColourInUse.test.tsx`
  (static render): placeholders "—" before hydration; the bar is a named list with one
  item per shared primitive; a card's name, job, badge slot and token fold; every role
  present with its token fold; no focusable control inside an `aria-hidden` specimen.
- `useLiveColours.test.ts` (jsdom, canvas stubbed): reads on mount, re-reads on a
  `class` change on `<html>` and on `PRESET_CHANGE_EVENT`, stays "—" without a canvas.
- **Browser:** the sandbox is built only under `DEBUG=1`, which CI's browser job does
  not build yet (§E12c). Checked by hand in Chromium, light and dark, with a preset;
  the automated check (real HEX after load, axe clean) is added to E12c's list.

## 7. Docs

`DESIGNER.md` "How to read the sandbox": the **Colour** row of the table says "the
palette at a glance, a card per colour with live values and contrast, and each colour in
use", and the "Layer 1 is what you edit" bullet says the token names are in each card's
and role's fold. `TODO.md` holds §E19 as open now, and is marked done with a log row
when built.
