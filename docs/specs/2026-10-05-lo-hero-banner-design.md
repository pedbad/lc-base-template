# LO hero banner — design

**Status:** shipped 2026-10-05 (see TODO §D9) · **Owner:** maintainer

## 1. Goal

Every LO page opens on a full-bleed hero banner directly under the sticky header: an
illustration with the LO's name on it. Today the page opens on a bare `<h1>` inside the
content column. The reference is french-lo-1's landing hero: a wide illustrated skyline
with the title set over a calm area of the image.

**Success means:**

- Every LO page has the same opening shape, whether or not its author supplied artwork.
- The LO name is announced once, as the page's single `<h1>`.
- Title contrast holds in both themes for ANY image, and is measured rather than hoped for.
- Prerendered markup equals the first client render, and every guard stays green.

## 2. Decisions taken (with the maintainer, 2026-10-05)

| #   | Question                         | Decision                                                                           |
| --- | -------------------------------- | ---------------------------------------------------------------------------------- |
| H1  | What is the text on the image?   | **The page's `<h1>` itself**, moved into the hero. The image is decorative.        |
| H2  | How wide?                        | **Full-bleed**, edge to edge. The title aligns to the `max-w-5xl` content column.  |
| H3  | Image source, and no-image case? | **New optional `hero` field** in `lo.json`; without it, a token-coloured **band**. |

**"shadcn hero section"** was read as intent, not as a dependency: shadcn/ui ships no hero
primitive (hero "blocks" online are community markup). The hero is hand-written markup
and CSS in the repo's token idiom, with no new package and no Base UI. That matches how
`LessonRail` was built (TOOLING.md, Sidebar note).

## 3. Config contract

`lo.json` gains one optional key, validated in `LoManifestSchema`
(`src/config/lo-schema.ts`):

```json
"hero": { "src": "images/lo-00-example/hero.svg", "alt": "optional" }
```

- **`src`** is required inside `hero`, and blank is rejected for the same reason `image`
  rejects it (a blank path resolves to the page itself). It is an author-relative asset
  path resolved through `resolveAsset()` at render, never used as written.
- **`alt`** is optional and **absent means decorative** (`alt=""`). The `<h1>` already
  names the page, so the default must not make a screen reader read the name twice.
  Supply `alt` only when the artwork carries meaning the title does not. A blank `alt` is
  rejected: omission already means "decorative", so `""` would be a second spelling of it.
- The object is `.strict()`, so a misspelt key (`scr`) fails at load.
- **`image` is unchanged.** It is still the landing-page card illustration. A card crop and
  a wide banner crop rarely suit one file, so the two stay separate fields.
- **Guard d needs no change.** It already collects values under `src` (`ASSET_KEYS`), so
  a missing hero file fails `bun run test`. This is verified by planting one, not
  assumed.

`AssembledLo` (`src/lo/assemble-lo.ts`) carries `hero` through the same way it carries
`image` (omitted when absent, never `undefined`). `App.tsx` passes `lo.hero` to
`PageLayout` as a new optional `hero` prop.

## 4. Markup

```html
<header>sticky nav — unchanged</header>
<main id="content" tabindex="-1">
  <!-- no longer max-w-5xl itself -->
  <div class="lo-hero" data-variant="image | band">
    <img
      class="lo-hero-image"
      src="…"
      alt=""
      loading="eager"
      fetchpriority="high"
      decoding="async"
    />
    <!-- img present only in the image variant -->
    <div class="lo-hero-inner">
      <!-- max-w-5xl + px-4: the content column -->
      <h1 class="lo-hero-title">{LO title}</h1>
    </div>
  </div>
  <div class="lo-content">
    <!-- max-w-5xl + px-4, takes over main's old box -->
    <section id aria-labelledby>…</section>
    <!-- unchanged -->
  </div>
</main>
```

- **A new component, `src/components/shell/LoHero.tsx`**, with props `title` and an
  optional `hero`. `PageLayout` renders it as `<main>`'s first child, in place of the
  current `<h1>`. One clear job: it renders the hero and nothing else.
- **The `<h1>` stays inside `<main>`**, as `lo-semantic-structure.md` §1/§2 and guard h
  require, and it stays the only `<h1>`. The outline is unchanged: h1 → h2 → h3. The
  skip link still targets `<main>`, so the first thing a skip-link user reaches is the
  title.
- **The wrapper is a `<div>`, not a `<header>`.** A `<header>` inside `<main>` is not a
  landmark, so it would add nothing for assistive technology. It would also give guard
  h's header-scoped checks (`nav-outside-header`) a second header to reason about. The
  hero introduces no section and needs no landmark of its own.
- **The decorative image is `alt=""`, never `aria-hidden` on its own**, which is the
  repo's existing convention for decorative `<img>` (`LoCard`, `flashcards`).
- **Nothing in the hero depends on the client.** There is no viewport measurement, no
  cookie, no `useIsHydrated` and no effect. The prerendered markup is the final markup.

## 5. Visual

All rules sit in a new `src/components/shell/lo-hero.css`, inside `@layer components`,
tokens only (guards f and g).

- **The image box** is `position: relative`, full width, with a fixed `aspect-ratio`
  (around 16 / 5, settled at implementation) and a `min-block-size` in rem. A wide crop
  at 320–375px would otherwise be a strip about 100px tall. The `<img>` fills it with
  `object-fit: cover`. Because the box reserves its own height, nothing shifts when the
  image arrives (CLS).
- **The title panel** is pinned to the bottom-start corner of the box, inside the
  content column, so its left edge lines up with every `<h2>` below. It is a solid
  surface in `--card` / `--card-foreground` with `--radius` and padding. **Solid, not a
  scrim**: a gradient's contrast depends on the pixels under it, while a solid panel's
  contrast is one token pair, the same for every image, and measurable once per theme.
- **The `<h1>` keeps its current type styles**, moving with it unchanged. Restyling the
  title (for example a coloured display serif like the reference) is a separate design
  decision and is not bundled in here.
- **The band variant** (no `hero` in `lo.json`) is the same box and the same panel on a
  solid background, a new component token `--hero-band` defined in `tokens.css` for both
  themes. It is not an image, so it has no aspect ratio, just block padding. The panel
  is identical, so the contrast verified for one variant holds for the other.
- **Spacing:** `<main>` loses its top padding so the hero sits flush under the header.
  `.lo-content` keeps the old column box and bottom padding, and the first section's
  `mt-12` stays.
- **Theme:** the panel and band follow the theme. The image does not, as artwork.
- **Motion:** none, so there is no reduced-motion case.

## 6. Performance

- The hero image is the page's largest element (LCP): `loading="eager"`,
  `fetchpriority="high"`, `decoding="async"`. The `<img>` is already in the prerendered
  HTML, so the browser finds it without waiting for JS.
- No `srcset` in this version (§9). Authors are told to supply WebP or AVIF sized for a
  wide desktop banner (about 2000px wide), in the authoring docs.
- **Budget (TOOLING.md, "Bundle budget"):** JS is expected to grow by a few hundred bytes,
  inside the 2.87 kB headroom. CSS is already 0.69 kB over its < 15 kB budget, and this
  adds an estimated 0.2 kB more. Both figures are measured off `bun run build` and
  recorded, as the budget entry requires.

## 7. Example LO and placeholder

- `lo-config/lo-00-example/lo.json` gains a `hero` pointing at a new placeholder,
  `public/images/lo-00-example/hero.svg`: a wide, quiet illustration that shows the crop
  and the panel without pretending to be course art. Authors copying the folder see the
  pattern immediately.
- **Implementation check:** confirm whether guard f's markup half reads `.svg` files in
  `public/`. If it does, the placeholder's colours must satisfy it. The existing
  `lo-placeholder.svg` is the precedent to follow.

## 8. Testing and verification

**Tests, colocated:**

- `lo-schema.test.ts`:
  - `hero` is optional.
  - A missing or blank `src` fails.
  - A blank `alt` fails.
  - An unknown key fails (strict).
  - A valid hero passes through `assembleLo` and appears on `AssembledLo`.
- `LoHero.test.tsx`:
  - The image variant renders one `<img alt="">` with the eager and high-priority
    attributes and a `resolveAsset`-ed `src`.
  - An authored `alt` is used.
  - The band variant renders no `<img>`.
  - Both variants render exactly one `<h1>` with the title.
- `PageLayout.test.tsx`: the existing frame tests must stay green unchanged (one `<main>`,
  one `<h1>` inside it, h1 before h2). Add one test that the hero is `<main>`'s first
  child and that the sections live inside `.lo-content`.

**Guards:**

- Guard h re-renders both pages, and the `example.html` page now carries the hero.
- Guard d is proven by planting a missing `hero.src` and watching it fail.
- Guard b is unaffected.

**Gate:** `bun run format && bun run lint && bun run lint:css && bun run test && bun run build`,
plus `BASE_URL=/course/ bun run build` to prove the hero `src` resolves under a sub-path.

**In-browser:**

- No horizontal overflow at 320 · 375 · 768 · 1024 · 1440. Set an explicit width, never
  preset `desktop` on a hidden pane (TODO §D2, trap 2).
- Both themes, both variants.
- Title contrast measured from rendered pixels on a 1x1 canvas (TODO §D2, trap 1), at or
  above AA 4.5:1.
- Prerender parity: `dist/example.html`'s hero matches the hydrated DOM byte for byte.

## 9. Not included

- **A per-LO title position** (the reference sets its title top-right). There is one
  position: bottom-start, aligned to the headings.
- `srcset` / responsive image sources.
- **Restyling the `<h1>`** (colour, display serif).
- **Showing the LO name in the header brand.**
- A hero on the course landing page, which has its own hero already.
- **Dimming the image in dark mode.**

## 10. Docs to update when it ships (no drift)

- `docs/specs/lo-semantic-structure.md` §1: the skeleton gains the hero wrapper around the
  `<h1>` and the `.lo-content` wrapper around the sections.
- **The LO authoring docs:** document the `hero` key wherever `image` is documented today
  (located at implementation by grepping for it), including the decorative-by-default
  `alt` rule and the image size advice.
- `DESIGNER.md`: no change — it lists no component tokens (not even `--footer`);
  `--hero-band` is documented in `tokens.css`, where it is defined.
- `STRUCTURE.md` and `bun run docs:tree`: the new files. The freshness test enforces this.
- `public/llms.txt`: only if its description of an LO page changes.
- `docs/process/TODO.md`: the §D row, its measured bundle figures, and a "Done recently"
  row.
