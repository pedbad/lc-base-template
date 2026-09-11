# The introduction's outcomes callout and illustration split

**Date:** 2026-09-11 · **Status:** approved, not yet implemented · **Baseline:** `b0be11a`

Follows `7e22990`, which un-carded the introduction (no accordion, no border, no
chevron, no `<h3>`, prose flush at the section's left edge). This spec covers the two
pieces deliberately cut from that job: the outcomes list and the illustration beside
it. Handover it supersedes: `docs/process/2026-09-11-intro-outcomes-and-split-handover.md`.

---

## 0. What the reference actually does — the handover was wrong

The handover describes two independent jobs and an illustration that sits beside the
intro **prose**, with `stackOnDesktop` as the only layout knob. Tracing french-lo-1
shows otherwise:

- `IntroSection.jsx:64-70` passes **both** `stackInfo: true` and `stackOnDesktop: true`.
- `HeroSection.jsx:65` — `splitInfoImage = stackInfo && Boolean(instructionsLayout?.image)`
  is therefore **true** for every intro that has artwork.
- `HeroSection.jsx:118` — because of that, `InstructionsMedia` is handed
  `image={undefined}`. The intro **prose** renders alone, full width, in the card
  header. `stackOnDesktop` never fires: it is a dead knob on this path.
- `HeroSection.jsx:139-160` — the split lives in `CardContent`: a `.intro-split` grid,
  `lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`, **left column the outcomes list
  (`<Info>`), right column the illustration**.

So french's introduction is: **prose full-width on top; outcomes beside illustration
below.** Three consequences, all of which shaped this design:

1. The two jobs are **not** independent. The illustration's partner in the grid is the
   outcomes box, not the prose.
2. The `max-w-[520px]` cap the handover warns about does not apply here —
   `index.css:4334` overrides it to `max-width: none; width: 100%` inside
   `.intro-split`. The cap only binds the `InstructionsMedia` figure, which the intro
   never renders.
3. The ticks are not a component: `index.css:4183-4204`, `.info-content ul li::before`,
   a CSS mask of `circle-check.svg` tinted `--ex-neutral`, with `list-style: none`.

The handover **was** right about the load-bearing fact: the outcomes list is raw
`informationHTML` in all 15 of french's `src/lo-config/*.json` and exists as no
component at all. There is nothing to port, and this repo structurally cannot take an
HTML blob — `TextBlockContentSchema` transforms every authored paragraph through
`parseRichText` specifically "so the renderer receives a validated tree, never a string
it might inject". An HTML field would be the first injection point in the codebase and
would walk straight into the XSS rule in `rules/ecc/web/security.md`.

---

## 1. Decisions

| #   | Decision                | Chosen                                                                                                        | Rejected                                                                                                                                              |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Where the outcomes live | **A new block `type: "outcomes"`**, holding the lead-in, the list and the image. Prose stays a `prose` block. | A new optional field on `TextBlockContentSchema`, which would silently give every prose block in a course an outcomes list and an image.              |
| 2   | Visual treatment        | **No new surface.** A titled `<ul>` with ticks, no tint, no border.                                           | A second callout primitive; a `variant` prop on `InstructionsCallout`.                                                                                |
| 3   | What image ships        | **`images/lo-placeholder.svg`**, already in `public/images/`.                                                 | Shipping no image (leaves the two-column path unexercised on the page it was built for); adding new artwork (new bytes against a live budget breach). |
| 4   | The lead-in line        | **An authored `lead` field**, inline rich text, rendered as `<p>`.                                            | A `ui-strings.ts` key — that file's own doc scopes it to "the words the exercise chrome shows", and a content lead-in is not chrome. Nothing at all.  |

### 1.1 Why decision 2 went to "no new surface"

`7e22990` un-carded the introduction precisely so it would stop reading as one more
panel among the exercises. Putting a tinted, bordered box straight back into it partly
undoes that commit. This is also the only option that adds no token: a new token must
land in all three variant presets **and** the generated `tokens.css`, or
`src/styles/token-presets.test.ts` fails parity both ways — and `tokens.css` must never
be hand-edited, because `DESIGNER.md` says it is generated and the edit is lost at the
next preset switch.

The panel's visual weight comes from the illustration beside it, not from a box.

### 1.2 Why the tick is a lucide icon, not a CSS mask

`CircleCheck` is already imported at `ExerciseInstructions.tsx:24` and
`ExerciseFooter.tsx:25`; `text-success` is an existing token. A mask would need a new
SVG in `public/images/`, which is new surface for guards c and d, to reproduce an icon
the bundle already carries. The tick is decorative — the list semantics come from
`<ul>`/`<li>` — so it takes `aria-hidden="true"` per `AGENTS.md`.

---

## 2. The schema

New file `src/lo/blocks/outcomes-block-schema.ts`, mirroring the per-type
`*-schema.ts` convention that `text-block-schema.ts` and `vocabulary-block-schema.ts`
already follow.

```ts
export const OutcomesBlockContentSchema = z.object({
  /** Block-level instructions, read generically by `sectionContent`. */
  instructions: z.string().min(1).optional(),
  /** The lead-in, e.g. "After completing this unit, you will be able to:". */
  lead: z.string().min(1).transform(parseRichText),
  /** One entry per outcome, each inline rich text. */
  items: z
    .array(z.string().min(1))
    .min(1)
    .transform((entries) => entries.map(parseRichText)),
  /** Optional illustration. Omit the whole object for a list-only block. */
  image: z
    .object({
      src: z.string().min(1),
      alt: z.string(),
    })
    .optional(),
});
```

**`lead` and every `items` entry go through `parseRichText`** — the same contract as
`TextBlockContentSchema.text`, and the reason §0's HTML blob cannot be ported. The
renderer receives a validated node tree; a plain string with no markup yields one text
node, so an author who wants no emphasis writes none.

**`instructions` is declared** because both existing block schemas declare it. Note it
is not _enforced_ here either way: `sectionContent` reads `content.instructions` off
the raw, loose envelope before any per-type schema runs, so the field works on any
block. Declaring it is documentation, and the absence of a declaration would be
misleading.

**`alt` is required but may be the empty string.** The author must type something;
`""` is an explicit "this is decoration", which renders `alt="" aria-hidden="true"` —
the pattern `LoCard.tsx:53` already uses. This is deliberate opposition to french,
which defaults to `"Learning object introduction illustration"`: a generic alt is
worse than an empty one, because it puts a sentence that says nothing into the
accessibility tree. An illustration that carries meaning gets real alt text; one that
is atmosphere gets `""` and stays out of the tree.

**Every image carries an `alt`; the empty string is a value, not an absence.** `alt`
being required means no image can ship without one, and the `<img>` always renders the
attribute. `alt=""` is the WCAG-correct treatment for a decorative image — forcing
non-empty text onto decoration is an accessibility regression, because the screen
reader then announces a sentence carrying no information. The shipped placeholder is
decorative by its own declaration: `lo-placeholder.svg` contains
`role="presentation" aria-hidden="true"`.

**Verified against the repo's Zod (4.6.2) rather than assumed**, since the whole
decision rests on it: `image` absent parses; `image` present with `alt` absent fails at
path `image.alt` ("expected string, received undefined"); `alt: ""` parses; `alt: null`
fails; `src: ""` fails as too small. No `.refine()` is needed.

### 2.1 Cut from the reference: `caption`

French supports `image.caption` and renders `<figure>` / `<figcaption>` for it. No LO
here needs one, and a `<figcaption>` adds a surface to guard h's 26-document sweep for
a field nothing uses. Dropping the caption also drops the `<figure>`, which is
semantically pointless without one — the image is a plain grid child.

---

## 3. The renderer

New file `src/lo/blocks/OutcomesBlock.tsx`, registered as `outcomes` in
`BLOCK_RENDERERS` (`src/lo/blocks/block-renderers.ts`).

**Tailwind utilities inline, no CSS file, no new token.** `VocabularyBlock.tsx` is the
precedent — a block renderer that lays itself out with utilities and ships no
stylesheet. This keeps the whole job out of guard f (token integrity, raw `px`) and
guard g (CSS layer discipline), because it authors no CSS rule at all.

Structure:

```
div   grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start
├── div    <p> lead
│           <ul> one <li> per outcome:
│             CircleCheck (aria-hidden, shrink-0, text-success) + <span><RichText/></span>
└── div    aspect-[3/2] wrapper
            <img> object-contain, loading="lazy", decoding="async",
                  src={resolveAsset(image.src)}, alt={image.alt},
                  aria-hidden when alt is ""
```

Three layout calls, each with a reason:

- **Split at `lg` (1024), not `md` (768).** French splits at `lg`. At 768 a
  two-column introduction with artwork is cramped. This also makes the five test
  widths meaningful: 320 / 375 / 768 stack, 1024 / 1440 split, rather than three
  widths showing the same thing.
- **`minmax(0,1fr)` twice, not `grid-cols-2`.** A long unbroken word in an outcome
  blows out a bare `1fr` track. `minmax(0,…)` is what prevents the horizontal overflow
  the responsive matrix checks for.
- **The image box is reserved by `aspect-[3/2]`, not `width`/`height` attributes.**
  An authored image has whatever intrinsic size it has, so hardcoding dimensions would
  state something false; `LoCard`'s band solves the identical problem the identical
  way and its comment says why. This is the CLS answer — the box is reserved before
  the image loads. `object-contain`, never `cover`: an introduction's illustration
  must not be cropped. `3/2` matches `lo-placeholder.svg`'s own `viewBox="0 0 600 400"`,
  so the shipped image fills its box exactly and a differently-shaped author image
  letterboxes rather than shifting the page.

The `src` goes through `resolveAsset()` — never a hand-built URL (guard c), and the
referenced file must exist (guard d).

---

## 4. Config

New `lo-config/lo-00-example/blocks/03-outcomes/block.json`:

- `"type": "outcomes"`, `"presentation": "plain"`.
- **No `title`, no `defaultOpen`.** `BlockConfigSchema`'s three refines already reject
  both on a plain block, by name, at build time.
- `"image": { "src": "images/lo-placeholder.svg", "alt": "" }` — decorative, per §2.
- `lead` and `items` carry placeholder copy in the register the existing intro uses:
  they describe the template to an author, they do not pretend to teach a language.

`lo.json`'s introduction section becomes `"blocks": ["00-intro", "03-outcomes"]`. The
`NN-` ordinal is unique per kind LO-wide, not per section, so `03-` follows
`02-vocabulary`.

The prose block is untouched: it stays `type: "prose"`, full width, above — which is
what french renders once `splitInfoImage` takes the image away from
`InstructionsMedia` (§0).

---

## 5. Tests

`src/lo/blocks/outcomes-block.test.tsx`, **beside the code, never in `src/guards/`** —
that glob _is_ `bun run guards` and means "the eight spec guards". The block's own
tests add nothing to it.

**One guard test does land in that glob, deliberately, taking it 211 → 212.** Guard d
(`asset-existence.ts`) collects an asset path only when the value directly under a key
in `ASSET_KEYS` (`['audio', 'image']`) is a **string**. This design's
`image: { src, alt }` is an object, so the walker recurses past it, finds `src`, and
collects nothing — the build stays green while the guard silently stops covering the
illustration, which is the precise staleness that file's own header warns about. The
fix is the one it prescribes: add `src` to `ASSET_KEYS`, with a test proving a nested
path is collected. Nothing else in `lo-config/` or the showcase fixtures uses the key.
That test is guard d's own, extending the guard rather than misfiling a feature test,
so the rise is correct — but it is stated here, and in `TODO.md`, because the repo's
bar is that a guard threshold never moves quietly.

Schema:

- a blank `lead` is rejected;
- an empty `items` array is rejected;
- `image` present with `alt` absent is rejected (the required-but-possibly-empty rule);
- `image` absent parses, and the block renders list-only.

Renderer:

- one `<li>` per `items` entry, in authored order;
- every tick carries `aria-hidden="true"`;
- `alt: ""` renders `alt=""` **and** `aria-hidden="true"`; a non-empty `alt` renders
  the text and no `aria-hidden`;
- the `src` is the `resolveAsset()` output, not the authored string;
- inline rich text in a `lead` or an item reaches `RichText` as nodes.

Already covered elsewhere, and expected to stay green rather than to grow: guard b
(naming + render-mirror), guard e (registry), guards c and d (asset path, asset
existence — the placeholder exists).

---

## 6. Verification gate

```bash
bun run format && bun run lint && bun run lint:css && bun run test && bun run build
```

then `BASE_URL=/course/ bun run build`.

Because this is visual work, additionally: both themes at **320 / 375 / 768 / 1024 /
1440**, confirming the grid stacks below `lg`, splits at and above it, and overflows at
no width.

**Measurement traps** — all four produced confident wrong numbers during §D, and all
four are live here. A hidden Browser pane fires no `requestAnimationFrame`, delivers no
`IntersectionObserver` callbacks, advances no CSS transition and samples no
`ViewTimeline`. `resize_window` with preset `desktop` while hidden leaves the tab at
**zero width**, so every geometry read is nonsense without erroring — always set an
explicit width before measuring layout, which matters directly to the five-width pass
above. `getComputedStyle` returns `color-mix()` and `oklab()` **unconverted**, so a
naive numeric parse yields fictional contrast ratios; paint the value on a 1×1 canvas
and read `getImageData`. `window.scrollTo({behavior: 'auto'})` now resolves to the
document's `smooth` and silently does nothing in a probe — pass `'instant'`.

This design introduces no animation, so the §D4 lesson ("get a human to look at
anything animated") applies only to the static layout: **have a human confirm the
split at 1024 and 1440 in both themes.**

No new tinted surface means no new contrast measurement is owed. Existing tokens
(`text-success`, `text-foreground`, `text-muted-foreground`) are already measured.

---

## 7. Explicitly out of scope

No new token. No second callout primitive and no change to `InstructionsCallout`. No
`<h3>` — `semantic-dom`'s heading floor stays at **14**, where `7e22990` left it when
it deliberately removed the introduction's heading, and this job does not re-litigate
that. No change to any guard threshold. No `caption`/`<figure>`. No change to the
`prose` block, to `TextBlockContentSchema`, or to the `plain` presentation branch in
`sectionContent`.

D5's two budget breaches (`main-*.js` 96.19 kB gzipped against < 80 kB; CSS 20.22 kB
against < 15 kB) are untouched and remain open. This job adds no CSS and one
already-bundled icon, so it should move neither materially — but the build's reported
sizes are worth recording in the follow-up, as §D did.

---

## 8. Finishing the pass

- `docs/process/TODO.md` — add a "Done recently" row with the real SHA and update the
  header suite count. **Re-read it immediately before editing**: an exact-string edit
  against a stale copy fails, and the table rows reflow their column widths.
- `AGENTS.md` — only if a new house rule emerges. On this design none should: the
  second-callout-primitive rule was the likely candidate and decision 2 avoided it.
- `STRUCTURE.md` + `bun run docs:tree` — only if a folder appears. `blocks/03-outcomes/`
  under `lo-config/` is config, not source; check whether the tree covers it.
- `DESIGNER.md` — not needed, since no token lands.

Constraints that hold throughout: files under 800 lines; conventional commits, one
concern each; nothing reachable from `vite.config.ts` may use `@/…` imports; tokens
only, no raw hex outside `palette.css`; every CSS rule inside `@layer`, no
`!important`. `bun run test`, never `bun test` — Bun's runner throws on the
`import.meta.glob` in `load-lo-glob.ts` and reports a false failure.
