# Tabs block — slice 2a: media in a tab

**Date:** 2026-10-07 · **Status:** agreed, building on `feat/tabs-media`
**Builds on:** [`2026-10-07-tabs-block-design.md`](2026-10-07-tabs-block-design.md)
(slice 1). This is the first of the F2 panel entries (`docs/process/TODO.md` §F2).

## 1. What this slice is

A tab can hold one optional **media** group, rendered after the tab's instruction box
and before its text: an optional image, an optional long audio player, and the
player's transcript behind a "Show transcript" / "Hide transcript" toggle.

Two kinds of image, because a face and a chart need different layouts:

| `kind`       | For                                             | Layout                                                  |
| ------------ | ----------------------------------------------- | ------------------------------------------------------- |
| `"portrait"` | a photo of the speaker                          | modest, beside the player; stacks above it when narrow  |
| `"figure"`   | a chart, graph or diagram the dialogue is about | full panel width in `<figure>`, optional `<figcaption>` |

Any combination is valid except an empty one: image only, audio only, or both.

## 2. Out of scope

| Later                                          | Why not now                                                     |
| ---------------------------------------------- | --------------------------------------------------------------- |
| Transcript in the popup (`{ "modal": "id" }`)  | inline covers the request; the popup variant is a second shape  |
| `media` as a standalone block                  | the schema lives in its own file so a block can reuse it later  |
| Ordered panel entries (`body` array)           | adopt when the exercise-by-ref entry lands (§F2); one migration |
| Callout entry, exercise entry                  | later F2 steps                                                  |
| Phone dropdown (§F3), `ui-showcase.html` (§F4) | separate slices                                                 |

## 3. Config shape

```json
{
  "label": "Placeholder tab B",
  "instructions": "Look at the speaker, play the clip, then open the transcript.",
  "media": {
    "image": {
      "kind": "portrait",
      "src": "images/lo-00-example/04-tabs/speaker.svg",
      "alt": ""
    },
    "audio": { "src": "audio/lo-00-example/placeholder.m4a", "label": "Listen to the speaker" },
    "transcript": ["Placeholder line one.", "Placeholder line <em>two</em>."]
  },
  "text": ["…"]
}
```

`media` is optional on every tab. Inside it (all strict objects — a misspelt key fails):

- `image` — optional. `kind`, `src`, `alt` required; `caption` optional.
  - `alt` may be `""` on a `portrait` only: the explicit decorative choice, the
    outcomes-block precedent. The speaker's words are in the transcript.
  - `alt` must be non-empty on a `figure`: a chart carries information, so its alt
    states the takeaway; the caption and transcript carry the detail (WCAG 1.1.1).
  - `caption` is allowed on a `figure` only (a portrait has no `<figure>` to caption).
- `audio` — optional. `src` required, `label` optional (the player's visible label).
- `transcript` — rich-text entries (exactly a grammar block's `text`).
- Cross-field rules, each failing the build with the path named:
  - `image` or `audio` must be present;
  - `audio` requires `transcript`, and `transcript` requires `audio`.

Every path uses the key `src`, which guard d already collects
(`src/guards/asset-existence.ts`), so a missing file fails the build with no guard
change. Paths render through `resolveAsset()`.

## 4. Rendering

`src/lo/blocks/MediaPanel.tsx`, one component, used by `TabsBlock` and later by a
standalone media block. Panel order: instruction box → media → text.

- **Portrait:** the media group is its own `@container`. At `@md` and wider, a grid of
  photo (~⅓) beside a column of player then toggle. Narrower, the photo sits on top,
  capped in width, and the toggle spans the column.
- **Figure:** `<figure>` full width, image `w-full h-auto`, `<figcaption>` when
  authored, then the player and toggle below.
- **No image:** player and toggle only.
- **Player:** the existing `AudioClip` native variant (the same element the rich-text
  audio player renders), `listenText` from `audio.label`.
- **Transcript toggle:** native `<details>` / `<summary>`, the summary styled as a
  button. It carries both labels, each with its lucide icon (`aria-hidden`):
  `Eye` + "Show transcript" when closed, `EyeOff` + "Hide transcript" when open; CSS
  `group-open:` swaps which is displayed, so the accessible name is always the visible
  one. No React state: it works before hydration, and the prerender equals the first
  client render. The browser announces expanded/collapsed itself.
- **Labels** come from two new ui-strings keys, `showTranscript` and
  `hideTranscript` (`src/config/ui-strings.ts`), never hardcoded.
- **Images** get `loading="lazy"` and `decoding="async"`; an `alt=""` image also gets
  `aria-hidden`, as in `OutcomesBlock`.
- Styling is token-only Tailwind classes; the focus ring is the shared `FOCUS_OUTLINE`.

## 5. Example

`lo-config/lo-00-example/blocks/04-tabs/block.json`, tabs renamed "Placeholder tab A"
onwards:

| Tab | Shows                                 |
| --- | ------------------------------------- |
| A   | text only (unchanged content)         |
| B   | portrait + audio + transcript         |
| C   | figure + caption + audio + transcript |
| D   | audio + transcript, no image          |

New assets under `public/images/lo-00-example/04-tabs/` (mirroring the block folder):
`speaker.svg`, `chart.svg`, both token-free placeholder SVGs. Audio reuses
`audio/lo-00-example/placeholder.m4a`.

## 6. Verification

Tests first: ui-strings keys; the media schema (every rule in §3); `MediaPanel` markup
(figure/figcaption, alt and `aria-hidden`, both summary labels, transcript in the
static markup); `TabsBlock` order (callout → media → text); the example LO loads.
Then the gate, gzipped sizes against `docs/TOOLING.md` (stop if JS ≥ 110 kB or
CSS ≥ 18 kB), and the built site at 320 · 768 · 1024 · 1440, both themes, axe,
keyboard (Tab to the summary, Enter and Space toggle it).
