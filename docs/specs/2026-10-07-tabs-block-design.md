# Tabs block — slice 1 design

**Date:** 2026-10-07 · **Status:** agreed, building on `feat/tabs-block`
**Reference:** french-lo-1 "Pronunciation Focus — Demystifying French Pronunciation"
(`Group` + `displayAsTabs` in `src/render/renderLearningObject.jsx`).

## 1. What this slice is

A new block type, `tabs`: a set of labelled tabs, one panel showing at a time, each
panel holding rich text. Authors drop it into an LO through config exactly like
`intro`, `grammar` or `outcomes`: a `blocks/NN-tabs/block.json` folder listed in a
section's `blocks` array. No per-lesson code, no registration beyond the folder.

Slice 1 is deliberately small. It ships the tabs and nothing they could later hold.

## 2. Out of scope (later slices, agreed in the brainstorm)

| Later                     | Decided so far                                                                  |
| ------------------------- | ------------------------------------------------------------------------------- |
| Panel entries beyond text | callout, media (image + audio + transcript), exercise by folder ref             |
| Exercise state            | survives a tab switch (panels stay mounted — already true in slice 1)           |
| Transcript                | both: inline disclosure (array) or existing popup (`{ "modal": id }`)           |
| Phones                    | a dropdown was chosen; slice 1 stacks the tabs instead (§5), revisit in slice 2 |
| Showcase page             | `ui-showcase.html` behind `DEBUG_ENTRY_FILES`                                   |
| Further components        | word gloss, reveal box; slider and resizable wait for a lesson that needs them  |
| Nesting                   | depth 1: a tab never holds tabs                                                 |

## 3. Config shape

```json
{
  "type": "tabs",
  "presentation": "plain",
  "content": {
    "label": "Forms of address",
    "intro": ["Optional rich text above the tabs."],
    "tabs": [
      { "label": "Tu", "text": ["Rich text, as in a grammar block."] },
      { "label": "Vous", "text": ["…"] }
    ]
  }
}
```

- `label` — **required**. The tab set's accessible name (`aria-label` on the tablist).
  A plain block has no heading of its own to label it, and a nameless tablist fails
  WAI-ARIA.
- `intro` — optional rich-text entries rendered above the tablist.
- `tabs` — at least **two** (one tab is not a choice). Each `label` is non-empty and
  unique within the block (it is what a learner tells tabs apart by). Each `text` is
  the same rich-text entry array `TextBlockContentSchema.text` accepts: paragraphs,
  lists, tables, the audio player, inline audio and popup links.
- The schema is strict: a misspelt key fails rather than being dropped.
- `presentation` works as for every block: `plain` renders bare under the section
  `<h2>`; `card` wraps it in `LoAccordion`. Slice 1's example uses `plain`.

Content is validated by `parseBlockContent` in the renderer, the same path every
shipped block uses, so a malformed `tabs` block fails the build at prerender with the
block type named. (Load-time validation of block content is a repo-wide change, not
this slice's.)

## 4. Rendering

- Built on the vendored shadcn `src/components/ui/tabs.tsx` (Base UI `Tabs`). Waking it
  means deleting its `@source not` line in `src/index.css`;
  `src/build/source-negation.test.ts` enforces the pair.
- Base UI supplies the WAI-ARIA tabs pattern: `role="tablist"/"tab"/"tabpanel"`,
  `aria-selected`, `aria-controls`/`aria-labelledby`, roving tabindex, ←/→, Home/End.
  `activateOnFocus` is on (automatic activation — panels are instant, matching the
  reference's Radix default).
- Panels use `keepMounted`, so inactive panels stay in the DOM with `hidden`. This
  keeps later exercise state across switches and makes the prerender carry every
  panel's text.
- Values are the tab index as a string; ids come from Base UI (`useId`), which match
  between prerender and hydration.
- Styling is token-only Tailwind on the wrapper's `className`, the precedent set by
  `ThemeToggle` overriding the vendored Switch (`src/components/ui/` belongs to the
  shadcn CLI and is not edited).

## 5. Look (after the reference)

- **Wide** (container ≥ the breakpoint): one row of folder tabs; the active tab is
  tinted, bordered on three sides and joins the bordered panel beneath it.
- **Narrow:** the tabs stack as a full-width vertical list above the panel, the active
  one tinted with a leading bar — what the reference does below 1170px. Every label
  stays visible and nothing scrolls sideways at 320px.
- Focus uses the shared `FOCUS_OUTLINE`, which survives forced colours.
- No JS: the prerender shows the first panel; the tabs do nothing until hydration.

## 6. Example

`lo-config/lo-00-example/blocks/04-tabs/block.json`, listed in the Grammar section
after `01-grammar`. Three placeholder tabs, rich text only.

## 7. Verification

Tests first: schema contract, renderer markup (roles, names, hidden panels), keyboard,
registry entry, example-LO load. Then the built site (`bun run build && bun run
preview`, plus `DEBUG=1` and `BASE_URL=/course/`) at 320 · 768 · 1024 · 1440, both
themes, axe, keyboard. Measure gzipped `main-*.js` and `main-*.css` against the budget
in `docs/TOOLING.md`; if CSS crosses 17 kB, stop and report before committing.
