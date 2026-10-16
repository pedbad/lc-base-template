# Image comparison slider (E20) Implementation Plan

**Goal:** Show each light/dark image pair in the sandbox's Images section as one
comparison slider, as designed in
[`2026-10-16-image-compare-slider-design.md`](../specs/2026-10-16-image-compare-slider-design.md).

**Architecture:** Two pure modules (pairing by file name, pointer → position) carry the
logic and its tests. A small `ImageCompare` component stacks the two images, clips the
top one with `clip-path`, and keeps its position in a native range input that pointer
drag also sets. `ImagesSection` splits the image list into pairs and singles. Two new
semantic tokens give each side a ground that does not flip with the theme.

**Rules** (AGENTS.md): test first, beside the code; `bun run test`, never `bun test`;
tokens only; every CSS rule in `@layer`; prerender equals the first client render; one
concern per commit.

## Tasks

- [x] **1. Ground tokens.** Add `--mark-ground-light: var(--paper)` and
      `--mark-ground-dark: var(--slate-4)` to the `:root` block of `tokens.css` and every
      `tokens-variant-*.css`, no `.dark` copy. `token-presets.test.ts` holds the parity.
      Commit `feat(styles): …`.
- [x] **2. Pairing.** `image-pairs.test.ts` first (unit cases plus "`APP_IMAGES` has no
      orphans and four pairs"), see it fail, then `image-pairs.ts`.
- [x] **3. Position maths.** `compare-position.test.ts` first, then
      `compare-position.ts`: `positionFromPointer(clientX, left, width)` and
      `clipRight(position)`.
- [x] **4. Slider.** `ImageCompare.test.tsx` first (markup at 50, name, `aria-hidden`
      handle, chips), then `ImageCompare.tsx` and `useNaturalSize.ts`.
- [x] **5. Section.** Update `ImagesSection.test.tsx` (tile counts, grounds), then
      `ImagesSection.tsx`. Commit tasks 2–5 as one `feat(sandbox): …`.
- [x] **6. Check.** Full gate plus `DEBUG=1 bun run build`; by hand in the dev server at
      `/debug-sandbox.html`: drag, arrow keys, light and dark, 375px and 1440px.
- [x] **7. Docs.** `DESIGNER.md`'s sandbox table gains the Images row; TODO §E20 done
      with a log row. Commit `docs: …`.
