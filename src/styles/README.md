# Theme tokens — Cambridge Slate

The visual theme is a **3-layer token chain** (spec §7.1). Change a colour in
**one** place and every shadcn component reskins automatically.

```
primitive    →   semantic    →   component
palette.css      tokens.css      Tailwind utilities (@theme inline in index.css)
```

## Files

| File                                  | Layer                 | Edit when…                                               |
| ------------------------------------- | --------------------- | -------------------------------------------------------- |
| `palette.css`                         | 1 · primitives        | re-skinning the brand — the **only** place raw hex lives |
| `tokens.css`                          | 2 · semantic (ACTIVE) | don't hand-edit — it's a copy of one preset below        |
| `tokens-variant-a-cambridge-blue.css` | preset                | switching the primary colour                             |
| `tokens-variant-b-dark-blue.css`      | preset (default)      | switching the primary colour                             |
| `tokens-variant-c-warm-blue.css`      | preset                | switching the primary colour                             |

`index.css` imports `palette.css` then `tokens.css`. Only `tokens.css` is
imported; the variant files sit beside it as switchable presets.

## Re-skin the brand (change the colours)

Edit the values in **`palette.css` only**. The semantic layer and all 19
components follow automatically. Never put hex in `tokens.css` or in components
(guard f, later).

To rebrand from Cambridge to another institution: replace the `--slate-*` and
`--cam-*` hex values in `palette.css`. One file, done.

## Switch the primary preset (change the button / CTA colour)

Three presets ship. They differ **only** in `--primary`/`--ring`; the palette is
identical.

| Preset                  | `--primary` (light)    | CTA on white          | Feel                       |
| ----------------------- | ---------------------- | --------------------- | -------------------------- |
| A · Cambridge Blue      | #8EE8D8 + Slate-4 text | 1.43:1 shape (soft)   | brand-pretty, low emphasis |
| B · Dark Blue (default) | #133844 + white text   | 12.5:1 shape (strong) | classic, high-emphasis CTA |
| C · Warm Blue           | #00BDB6 + Slate-4 text | 2.35:1 shape (medium) | saturated, energetic       |

"shape" = button-vs-white-page contrast (WCAG 1.4.11, target ≥3:1). Text
contrast passes comfortably in all three.

To switch, copy the chosen preset over the active file:

```sh
cp src/styles/tokens-variant-a-cambridge-blue.css src/styles/tokens.css
# (or the -b / -c file), then:
bun run dev
```

`index.css` already imports `tokens.css`, so nothing else changes. Re-run
`bun run lint:css` to confirm it's clean.

## Rules (enforced later by guards f + g)

- Every rule inside `@layer base`; zero `!important`.
- Raw hex/px lives **only** in `palette.css` — never in `tokens.css` or components.
- Light + dark both defined (`:root` + `.dark`); dark inverts the Slate ramp,
  with `color-mix` lifting dark surfaces (card/popover/muted) off the Slate-4 base.

## Fonts

Two official Cambridge typefaces, wired through the **same token chain** as the
colours (edit one place, everything follows). Full rationale + the type-baseline
decisions live in `docs/TOOLING.md → Cambridge typography`.

| Font          | Role             | Licence           | In repo? | Delivery                              |
| ------------- | ---------------- | ----------------- | -------- | ------------------------------------- |
| **Open Sans** | body / UI text   | Free (Apache-2.0) | ✅ yes   | npm `@fontsource-variable/open-sans`  |
| **Feijoa**    | display/headings | Commercial (Klim) | ❌ never | `@font-face` → `public/fonts/feijoa/` |

### The two font tokens (in `palette.css`, Layer 1 — shared across presets)

```css
--font-display: 'Feijoa', 'Open Sans', 'Arial', sans-serif; /* headings */
--font-body: 'Open Sans', 'Arial', sans-serif; /* body */
```

These live in `palette.css` (not the per-preset `tokens-variant-*` files) on purpose:
switching the `--primary` preset must never change the fonts. `index.css`'s
`@theme inline` maps Tailwind's `--font-sans → --font-body` and
`--font-heading → --font-display`, which re-skins the type of **all 19 components**.

### Feijoa is never committed

Feijoa is commercial (spec §12 / decision #18). `public/fonts/feijoa/*` is
git-ignored. Until the licensed files are dropped in (per Cambridge deploy),
headings **fall back to Open Sans** automatically (`font-display: swap` → no
flash, no missing-glyph boxes). To enable real Feijoa, see
`public/fonts/feijoa/README.md` for the exact filenames the `@font-face` rules expect.

### Type baseline (size + leading)

Set on `<html>` in `index.css`: `font-size: 100%` (= 16px but scales with the
user's browser preference — Cambridge min 16px, spec §7.2) and **unitless**
`line-height: 1.4` (140% leading; unitless so children scale, not freeze). See
the TOOLING.md section for why each choice is made the way it is.

### Re-font a clone (change the typefaces)

Edit the two tokens in **`palette.css` only**, and swap the npm font package /
`@font-face` files. Components and headings follow automatically — never set
`font-family` on individual components.
