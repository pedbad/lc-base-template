# Debug sandbox — light/dark image pairs as a comparison slider (E20)

**Date:** 2026-10-16 · **Status:** built 2026-10-16 (`af6f63d`, `99d1b68`)
**TODO:** §E20 · **Builds on:** the sandbox's Images section (2026-10-08) and E19

## 1. Why

The Images section shows every image as its own tile, so a mark drawn twice — once for
a light ground, once for a dark one — appears as two unrelated tiles. A client cannot
see at a glance that they are one mark, and a designer cannot check that the two
versions line up. The maintainer asked (2026-10-16) for the effect of shadcn's
image-comparison slider: the two images stacked exactly, a vertical handle, drag to
reveal one or the other.

**A bug this also fixes.** Today a `-black` mark sits on `bg-muted` and a `-white` mark
on `bg-foreground`. Both tokens flip in the dark theme, so with the toggle on dark every
footer mark sits on the wrong ground and disappears.

## 2. Decisions

- **Our own small component**, not a copied gallery component or a new dependency.
- **The top layer is clipped with `clip-path: inset(…)`**, which the compositor handles.
  No animation, so no `prefersReducedMotion()` read.
- **A native `<input type="range">` holds the position**, so keyboard, touch and screen
  readers work for free. Its accessible name is "Compare light and dark: <name>".
  Pointer drag on the frame sets the same value. The visible handle is `aria-hidden`.
- **Pairs come from the file names**, not a hand-kept list: `<name>-black` with
  `<name>-white`, and `<name>-light` with `<name>-dark`, same folder and extension. A
  test fails if a variant's other half is missing.
- **The handle starts at 50%**, half light and half dark (maintainer, 2026-10-16).
- **Corner chips "Light" and "Dark"**, each inside its own layer, so a chip hides when
  its side is dragged away (maintainer, 2026-10-16).
- **Pairs get wider tiles in their own grid** above the single images: two across, one
  on a phone (maintainer, 2026-10-16). Images without a pair keep today's tiles.
- **Two new semantic tokens, the same in both themes:** `--mark-ground-light`
  (`--paper`) and `--mark-ground-dark` (`--slate-4`). Every preset declares them, with
  no `.dark` copy, like `--hero-art-ground`. No existing token stays put across themes,
  and a primitive named in a component would skip the semantic layer.
- **Out:** a vertical (top/bottom) mode, comparing anything other than a variant pair,
  hover-to-reveal.

## 3. What the section shows

The intro gains one sentence: marks drawn for both grounds appear once, as a slider.

**Pairs** (first, `grid-cols-1 sm:grid-cols-2`). Each tile is an `<li>` holding:

- the comparison frame, `h-48`: the dark-ground image on `--mark-ground-dark` fills it;
  over it the light-ground image on `--mark-ground-light`, clipped to
  `inset(0 calc(100% - <pos>%) 0 0)`. "Light" sits top-left in the top layer, "Dark"
  top-right in the bottom one;
- a handle at `<pos>%`: a vertical line and a round knob in `--primary`;
- the range input, visually hidden but focusable; the frame shows the focus ring when
  it has keyboard focus;
- under the frame, each file's `public/` path and its pixel size badge, light first.

**Singles** (below, today's grid and tile, unchanged apart from the ground: every single
sits on `bg-muted`, since no single is a variant once pairing is enforced).

## 4. Units

| File                              | Job                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `src/sandbox/image-pairs.ts`      | pure: `groupImages(files)` → `{ pairs, singles, orphans }`                   |
| `src/sandbox/compare-position.ts` | pure: pointer x → clamped whole percent; the clip-path text for a position   |
| `src/sandbox/ImageCompare.tsx`    | the slider: two layers, handle, range input, pointer capture                 |
| `src/sandbox/useNaturalSize.ts`   | the pixel-size read today's tile does inline, shared by both tiles           |
| `src/sandbox/ImagesSection.tsx`   | splits `APP_IMAGES` with `groupImages`, renders pair tiles then single tiles |
| `src/styles/tokens*.css`          | `--mark-ground-light` / `--mark-ground-dark` in every preset                 |

An orphan (a `-white` with no `-black`, say) still renders, as a single, so a missing
file breaks a test, not the page.

## 5. Constraints

- Prerender equals the first client render: the position starts at a constant 50, the
  sizes read after mount as today.
- Tokens only; every class is a Tailwind utility, so no new CSS file.
- Vitest runs in the node environment with no DOM library, so the pure units carry the
  logic tests and the components are tested through `renderToStaticMarkup`. Drag,
  arrow keys, both themes and both widths are checked by hand in the dev server.

## 6. Tests

- `image-pairs.test.ts`: black/white and light/dark pair, the light side is
  `-black`/`-light`; order kept; a lone variant is an orphan and still a single;
  **`APP_IMAGES` has no orphans** and four pairs.
- `compare-position.test.ts`: clamps below 0 and above 100, rounds, survives a
  zero-width frame; the inset text.
- `ImageCompare.test.tsx`: a range 0–100 at 50 with the accessible name; the top layer's
  clip at 50%; the handle `aria-hidden`; both chips; both images.
- `ImagesSection.test.tsx`: one tile per pair plus one per single; every path still
  shown; one size badge per image; pair tiles use the two ground tokens.
- `token-presets.test.ts` already fails if one preset misses a token.
