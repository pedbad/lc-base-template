# Feijoa — Cambridge display font (NOT shipped in this repo)

Feijoa is the official University of Cambridge **display** typeface (headings,
titles). It is **commercial** (Klim Type Foundry). Per spec §12 / decision #18 the
font files are **never committed** to this public template — doing so would
redistribute a licensed commercial font to the entire internet, which the Klim
EULA does not permit. **You supply your own licensed copy** (see below).

Everything in this folder except this README is git-ignored
(`.gitignore` rule `public/fonts/feijoa/*`), so dropped-in font files cannot be
committed or pushed by accident.

## What renders without it

Until you add the files, headings fall back to **Open Sans** (declared in
`--font-display`, see `src/styles/palette.css`). `font-display: swap` means no
invisible-text flash and no missing-glyph boxes — a fresh clone looks correct.

## To enable real Feijoa (you must hold a valid Cambridge/Klim licence)

Drop your licensed font files into **this folder** with these exact names — they
match the `@font-face` rules in `src/index.css`:

| File                                | weight | style  |
| ----------------------------------- | ------ | ------ |
| `Feijoa-Medium-Cambridge.otf`       | 500    | normal |
| `Feijoa-MediumItalic-Cambridge.otf` | 500    | italic |
| `Feijoa-Bold-Cambridge.otf`         | 700    | normal |

These are the official Cambridge-distributed filenames — drop them in exactly as
downloaded, no renaming.

No code change needed — the `@font-face` `src` URLs already point here. Restart
`bun run dev` (or rebuild) and headings switch to Feijoa automatically.

### Optional: optimise for the web (`.woff2`)

`.otf` files are large. For production, convert each to `.woff2` (~40–50% smaller,
faster load) and update the three `src: url(... .otf) format('opentype')` lines in
`src/index.css` to `url(... .woff2) format('woff2')`. Use any tool you trust, e.g.
`woff2_compress Feijoa-Medium-Cambridge.otf` (from Google's `woff2` utils) or `fonttools`.

## Rules

- **Do NOT commit these files.** The `.gitignore` rule protects against it; do not
  weaken it, and never `git add -f` a font binary into history (it's effectively
  permanent once pushed to a public repo).
- **Do NOT add Open Sans here** — it ships via the `@fontsource-variable/open-sans`
  npm package and is bundled at build. A local copy would double-ship it.
