# DESIGNER.md — change the look without touching code

**For designers.** You do not need to know React, TypeScript or Vite to re-skin a
course built from this template. Colours, fonts and the button style all live in
CSS files you can open in any text editor, and everything else follows.

This is the promise the template is built around:

> **Change a colour in ONE file and every screen, button, card and form control
> re-skins with it.** No component is edited. No code is touched.

That file is **`src/styles/palette.css`**.

> **Developers:** this is the canonical theming doc. `src/styles/README.md` is a
> pointer to it, so there is one copy of these rules and nothing to drift.
> For the repo's everyday workflow see [`CONTRIBUTING.md`](CONTRIBUTING.md); for
> why each tool was chosen, [`docs/TOOLING.md`](docs/TOOLING.md).

---

## Before you start — the terminal, once

Three commands is the whole job. If you have never used a terminal, this is all
you need to know.

**Open it.** On macOS press `Cmd + Space`, type `Terminal`, press Return. A window
opens with a blinking cursor. You type a line and press Return; it runs.

**Go to the project.** Type `cd `, then drag the project folder onto the terminal
window (it pastes the path), then press Return:

```bash
cd /path/to/lc-base-template
```

**Install once, the first time only:**

```bash
bun install
```

If `bun` is not found, install it first — one line, from [bun.sh](https://bun.sh):

```bash
curl -fsSL https://bun.com/install | bash
```

**See your changes.** This is the command you will use every day:

```bash
bun run dev
```

It prints a `http://localhost:5173` address. Open that in a browser. Leave it
running — every time you save a CSS file the browser updates by itself. Press
`Ctrl + C` in the terminal to stop it.

---

## The three layers (why one edit is enough)

The theme is a chain of three links. Each link only ever reads the one above it.

```
palette.css          →   tokens.css              →   every component
Layer 1              Layer 2/3                       flashcards.css, home.css, …
RAW VALUES           MEANINGS                        USES the meanings
--slate-3: #546072       --border: var(--slate-3)        border-color: var(--border)
"this exact grey"        "the colour of borders"         "draw a border"
```

Read it right to left: a component asks for "the border colour", not for
"#546072". So changing `--slate-3` once at the top changes every border in the
course — and nothing downstream had to know.

That only holds while **no raw colour is ever written further down the chain**.
A `#546072` typed straight into a component becomes invisible from the top: the
next re-skin edits `palette.css`, that one component ignores it, and you get a
slightly-wrong colour nobody can find. The template enforces the rule
automatically — see [If a test goes red](#if-a-test-goes-red) below.

### The files

| File                                  | Layer                 | Edit it when…                                            |
| ------------------------------------- | --------------------- | -------------------------------------------------------- |
| `palette.css`                         | 1 · primitives        | re-skinning the brand — the **only** place raw hex lives |
| `tokens.css`                          | 2/3 · semantic ACTIVE | never by hand — it is a copy of one preset below         |
| `tokens-variant-a-cambridge-blue.css` | preset                | switching the primary / CTA colour                       |
| `tokens-variant-b-dark-blue.css`      | preset (default)      | switching the primary / CTA colour                       |
| `tokens-variant-c-warm-blue.css`      | preset                | switching the primary / CTA colour                       |

All five are in **`src/styles/`**. `index.css` imports `palette.css` then
`tokens.css`; the three variant files sit beside them as switchable presets.

---

## Job 1 — re-skin the brand (change the colours)

Open **`src/styles/palette.css`** and change the hex values. That is the whole job.

The palette is two ramps: `--slate-*` (the neutral greys the interface is built
from) and `--cam-*` (the Cambridge brand accents). Replace those values with
another institution's and the entire course follows — all 19 components, light
mode and dark mode.

```bash
bun run dev     # leave running; the browser updates as you save
```

**Rules for this file:**

- Raw hex belongs here and **nowhere else**. Not in `tokens.css`, not in a
  component's CSS.
- Both themes are defined: `:root` is light, `.dark` is dark. Dark inverts the
  Slate ramp, with `color-mix` lifting the dark surfaces (card, popover, muted)
  off the Slate-4 base. Change one, check the other.

---

## Job 2 — switch the primary preset (change the CTA / button colour)

Three presets ship. They differ **only** in `--primary` and `--ring` — the
palette underneath is identical, so this is a small, safe, reversible change.

| Preset                  | `--primary` (light)    | CTA on white          | Feel                       |
| ----------------------- | ---------------------- | --------------------- | -------------------------- |
| A · Cambridge Blue      | #8EE8D8 + Slate-4 text | 1.43:1 shape (soft)   | brand-pretty, low emphasis |
| B · Dark Blue (default) | #133844 + white text   | 12.5:1 shape (strong) | classic, high-emphasis CTA |
| C · Warm Blue           | #00BDB6 + Slate-4 text | 2.35:1 shape (medium) | saturated, energetic       |

"shape" is the button-against-the-white-page contrast (WCAG 1.4.11, target ≥ 3:1
so the button's _edge_ is visible, not just its label). **Preset A is below that
threshold** — it is brand-accurate but the button outline is faint, so choose it
knowingly. Text contrast passes comfortably in all three.

To switch, copy your chosen preset over the active file:

```bash
cp src/styles/tokens-variant-a-cambridge-blue.css src/styles/tokens.css
```

Swap `-a-cambridge-blue` for `-b-dark-blue` or `-c-warm-blue` as needed, then:

```bash
bun run dev
```

Nothing else changes — `index.css` already imports `tokens.css`. Because this
overwrites `tokens.css`, never hand-edit that file: your edit would be lost the
next time anyone switches preset. Edit the **variant** file instead, then copy it
across.

---

## Job 3 — change the fonts

Two official Cambridge typefaces, wired through the **same chain** as the colours.
Full rationale and the type-baseline decisions are in
[`docs/TOOLING.md`](docs/TOOLING.md) → "Cambridge typography".

| Font          | Role             | Licence           | In repo? | Delivery                              |
| ------------- | ---------------- | ----------------- | -------- | ------------------------------------- |
| **Open Sans** | body / UI text   | Free (Apache-2.0) | ✅ yes   | npm `@fontsource-variable/open-sans`  |
| **Feijoa**    | display/headings | Commercial (Klim) | ❌ never | `@font-face` → `public/fonts/feijoa/` |

The two font tokens live in **`palette.css`** (Layer 1), not in the per-preset
variant files — switching the `--primary` preset must never change the fonts:

```css
--font-display: 'Feijoa', 'Open Sans', 'Arial', sans-serif; /* headings */
--font-body: 'Open Sans', 'Arial', sans-serif; /* body */
```

`index.css` maps Tailwind's `--font-sans → --font-body` and
`--font-heading → --font-display`, which re-types all 19 components at once.

**To re-font a clone:** edit those two tokens, and swap the npm font package or
the `@font-face` files. Never set `font-family` on an individual component.

### Feijoa is never committed

Feijoa is commercial (spec §12 / decision #18), so `public/fonts/feijoa/*` is
git-ignored. On a fresh clone the files are absent and **headings fall back to
Open Sans automatically** — `font-display: swap`, so no flash and no
missing-glyph boxes. That is expected, not a bug. To enable real Feijoa, see
[`public/fonts/feijoa/README.md`](public/fonts/feijoa/README.md) for the exact
filenames the `@font-face` rules expect.

### Type baseline

Set on `<html>` in `index.css`: `font-size: 100%` (16px, but it scales with the
reader's own browser setting — Cambridge minimum 16px, spec §7.2) and a
**unitless** `line-height: 1.4` (140% leading; unitless so nested text scales
rather than freezing). Change these knowingly; they are accessibility floors.

---

## If a test goes red

**The tooling is not broken.** Two automated checks watch the token chain, and
they are the reason the one-file promise holds. If you hit one, it is telling you
a specific thing, and each has a one-line fix.

Both run when you commit, and again in CI.

### "raw-hex" — a colour outside `palette.css`

Something wrote a hex colour into `tokens.css` or a component. That value would
be invisible to the next re-skin.

**Fix:** move the colour into `palette.css` as a named value, and reference it by
name where you needed it.

### "raw-px" — a pixel length where a token belongs

A px value on a spacing or sizing property (`padding`, `margin`, `gap`, `width`,
`font-size`, `top`…).

**Fix:** use a spacing token instead. Note that px is **legitimate** and will not
be flagged on `border*`, `outline*`, `box-shadow`, `backdrop-filter`,
`perspective` and `transform` — a 1px hairline must not scale with font size —
inside a `calc()` that references a token, like `calc(var(--radius) + 4px)`, and
in a `@media` breakpoint like `@media (width >= 980px)`, which is a condition
rather than a value.

### "unlayered rule" or "!important"

Every CSS rule must sit inside `@layer`, and `!important` is banned. This is a
cascade rule, not tidiness: an unlayered rule beats every layered one no matter
how specific, so one stray rule can quietly override the whole design system.

**Fix:** wrap the rule in the appropriate `@layer`, and delete the `!important`.

These are guards **f** (token integrity) and **g** (CSS layer discipline), in
`src/guards/`. The full list of eight is in
[`CONTRIBUTING.md`](CONTRIBUTING.md#coming-as-the-template-grows).

---

## Before you commit — the verify gate

Run this one line. It formats, checks and builds everything. All five must pass.

```bash
bun run format && bun run lint && bun run lint:css && bun run test && bun run build
```

If you only changed CSS and want a fast answer first:

```bash
bun run lint:css && bun run guards
```

`guards` is the repo-wide invariant sweep — about a second. It is a _subset_ of
`test`, never a replacement for the full gate above.

> Use `bun run test`, **not** `bun test`. They are different runners, and the
> second reports a failure that is not real.

---

## What not to do

- **Do not set colours, fonts or spacing on individual components.** That breaks
  the one-file promise for everyone after you.
- **Do not hand-edit `tokens.css`.** It is overwritten whenever a preset is
  switched. Edit `palette.css` or a variant file.
- **Do not commit Feijoa font files.** They are commercial and git-ignored.
- **Do not use `!important`.** See above — it defeats the layer system.

## Where to go next

| You want to…                        | Read                                           |
| ----------------------------------- | ---------------------------------------------- |
| find your way around the repo       | [`STRUCTURE.md`](STRUCTURE.md)                 |
| set up, author content, commit      | [`CONTRIBUTING.md`](CONTRIBUTING.md)           |
| know why a tool was chosen          | [`docs/TOOLING.md`](docs/TOOLING.md)           |
| see what is still open on the build | [`docs/process/TODO.md`](docs/process/TODO.md) |
