# Sources block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development, then
> superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status (2026-10-12, late): BUILT** (Tasks 1–4, and Task 5's gate and budget). Built
with the tdd-guard hook muted locally because its API credit ran out; re-enable it when
topped up. `BASE_URL=/course/` build checked (Sources markup prerendered). Browser: seen at 1024,
no overflow at 320; still open: 768/1440 and an axe pass.
Deviations from the plan below: every schema object is `strictObject` (as in tabs), with
a test for it; the print icon is imported as `BookOpenIcon`, the name `LoCard` already
uses, so the sandbox inventory gains only `Globe`.

**Goal:** Ship a `sources` block type, a references list for the LOs being ported. It is
grouped under optional subheadings, and each entry has a print or web icon, a rich-text
citation (italics, links) and an optional note ("This extract from p165, first 3
paragraphs"). Authors add it through config like any block, and `lo-00-example` gets one
worked example in a new "Sources" section.

**Why a block and not plain prose:** a `prose` block could hold the citations as HTML
strings today. But the icon would be markup copied into every entry, the note's style
would drift between LOs, and nothing would catch a web source with no link. It is not an
exercise (nothing is graded), so it belongs beside `outcomes` and `tabs` in
`BLOCK_RENDERERS`.

**Architecture:** A per-type content schema (`sources-block-schema.ts`) plus a thin
renderer (`SourcesBlock.tsx`) registered in `BLOCK_RENDERERS`, the same shape as
`outcomes`. The citation and note reuse `parseRichText`. `<a href>` already renders as a
new-tab link with the external-link icon and the sr-only "(opens in a new tab)"
(`RichText.tsx`, `case 'link'`), so a web source carries its link INLINE in `citation`
and needs no separate `link` object.

**Reference:** maintainer's screenshot of a legacy LO "Sources" page (2026-10-12). It has
groups headed "Strategies" and "Structure and Language", a book icon for print, an
external-link icon for web, and a small note line under each citation.

---

## Decisions already made

| Decision                 | Choice                                                                                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Config shape             | `content.groups[]`, each `{ heading?, items[] }`; each item `{ kind, citation, note? }`. At least one group, at least one item per group.                                                                          |
| `kind`                   | `z.enum(['print', 'web'])`. A typo fails the build.                                                                                                                                                                |
| Web source link          | Required: a `web` item's parsed `citation` must contain a `link` node (search the tree recursively). The issue path is `['groups', i, 'items', j, 'citation']`.                                                    |
| Group headings           | Free text, optional. Not tied to section ids (more coupling than it is worth for now).                                                                                                                             |
| Heading level            | `<h3>` when the block is `plain` (under the section's `<h2>`), `<h4>` when `card` (under the accordion's `<h3>`).                                                                                                  |
| How the renderer knows   | Add `presentation: 'card' \| 'plain'` to `BlockRendererProps` and pass `config.presentation` in `blockBody()` (`src/lo/lo-page-sections.tsx`). Existing renderers ignore it.                                       |
| Icons                    | lucide `BookOpen` (print) and `Globe` (web), `aria-hidden`. The kind is INFORMATION here, so it also goes out as sr-only text from two new UI strings: `sourcePrint: 'Print source:'`, `sourceWeb: 'Web source:'`. |
| Recommended presentation | `plain`. It reads as page copy under a "Sources" section heading, as in the screenshot.                                                                                                                            |
| Showcase / sandbox       | Example LO only for now. A page rendering every block type is already §F4 `ui-showcase.html` in `TODO.md`; do not add it here.                                                                                     |

## Budget warning (read before styling)

CSS headroom is **0.09 kB** (`docs/TOOLING.md`, "Bundle budget"). Style the block with
Tailwind utilities **already used elsewhere** (`OutcomesBlock.tsx` is the model:
`grid gap-2`, `flex items-start gap-2`, `mt-0.5 size-5 shrink-0`, `min-w-0`,
`text-muted-foreground`), and author no new CSS rule. JS headroom is under 5 kB; two
lucide icons are small, but measure after `bun run build`.

---

## File map

| File                                                   | Action | Responsibility                                                                       |
| ------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------ |
| `src/lo/blocks/sources-block.test.tsx`                 | create | contract + rendered markup (draft below)                                             |
| `src/lo/blocks/sources-block-schema.ts`                | create | the `sources` content contract                                                       |
| `src/lo/blocks/SourcesBlock.tsx`                       | create | thin view                                                                            |
| `src/lo/blocks/block-renderers.ts`                     | modify | `presentation` in `BlockRendererProps`; register `sources`                           |
| `src/lo/lo-page-sections.tsx`                          | modify | pass `presentation={config.presentation}` in `blockBody()`                           |
| `src/config/ui-strings.ts`                             | modify | `sourcePrint`, `sourceWeb` (schema + defaults)                                       |
| `lo-config/lo-00-example/blocks/08-sources/block.json` | create | the worked example                                                                   |
| `lo-config/lo-00-example/lo.json`                      | modify | new last section `{ "id": "sources", "label": "Sources", "blocks": ["08-sources"] }` |
| `CONTRIBUTING.md`                                      | modify | a "Sources block" subsection after "Tabs block"                                      |
| `public/llms.txt`                                      | modify | add `sources` to the block-type list (line ~30)                                      |
| `docs/process/TODO.md`                                 | modify | tick §F5, update the suite count                                                     |

Run every command from the repo root. Never `bun test`; always `bun run test`.

---

## Task 1 — failing tests

- [ ] Create `src/lo/blocks/sources-block.test.tsx` with the draft below.
- [ ] `bunx vitest run src/lo/blocks/sources-block.test.tsx` fails (module not found). That
      is the RED run.

```tsx
/**
 * sources-block.test.tsx — the `sources` block's content contract and its markup.
 *
 * The CONTRACT: `kind` is a closed set, so a typo fails the build instead of rendering
 * an iconless entry; a `web` source must carry a link, because a web citation the
 * learner cannot follow is the one mistake an author cannot see in their own JSON.
 *
 * The MARKUP: a list of citations is a list, so <ul>/<li>. The icon says print or
 * web to the eye; the same fact goes to a screen reader as sr-only text, because here
 * the icon is information, not decoration. Group headings sit one level below
 * whatever heads the block — the section's <h2> for a plain block, the accordion's
 * <h3> for a card.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { test, expect } from 'vitest';
import { getBlockRenderer } from './block-renderers';
import { SourcesBlockContentSchema } from './sources-block-schema';

const printItem = {
  kind: 'print',
  citation: 'Fabricius, K.E., et al. (2011) Losers and winners. <em>Nature Climate Change</em>',
  note: 'This extract from p165, first 3 paragraphs',
};

const webItem = {
  kind: 'web',
  citation:
    'Daily Telegraph article entitled <a href="https://example.org/coral">Coral reefs on edge of extinction</a>',
};

const valid = { groups: [{ heading: 'Strategies', items: [printItem, webItem] }] };

/** Render through the registry, as the page adapter does. */
function renderSources(content: unknown, presentation: 'card' | 'plain' = 'plain'): string {
  const Renderer = getBlockRenderer('sources');
  if (!Renderer) throw new Error('no renderer for "sources"');
  return renderToStaticMarkup(<Renderer content={content} presentation={presentation} />);
}

test('a block with headed groups of print and web sources parses', () => {
  expect(SourcesBlockContentSchema.safeParse(valid).success).toBe(true);
});

test('a group heading and an item note are both optional', () => {
  const result = SourcesBlockContentSchema.safeParse({
    groups: [{ items: [{ kind: 'print', citation: 'Pax Leonard, S. (2012)' }] }],
  });

  expect(result.success).toBe(true);
});

test('an unknown kind is rejected, naming the field', () => {
  const result = SourcesBlockContentSchema.safeParse({
    groups: [{ items: [{ ...printItem, kind: 'book' }] }],
  });

  if (result.success) throw new Error('expected a validation failure');
  expect(result.error.issues[0]?.path).toEqual(['groups', 0, 'items', 0, 'kind']);
});

test('a web source with no link in its citation is rejected', () => {
  const result = SourcesBlockContentSchema.safeParse({
    groups: [{ items: [{ kind: 'web', citation: 'Daily Telegraph, 30/05/2011' }] }],
  });

  if (result.success) throw new Error('expected a validation failure');
  expect(result.error.issues[0]?.path).toEqual(['groups', 0, 'items', 0, 'citation']);
});

test('empty groups and empty item lists are rejected', () => {
  expect(SourcesBlockContentSchema.safeParse({ groups: [] }).success).toBe(false);
  expect(SourcesBlockContentSchema.safeParse({ groups: [{ items: [] }] }).success).toBe(false);
});

test('renders each group as a headed <ul>, one <li> per source', () => {
  const html = renderSources(valid);

  expect(html).toContain('Strategies');
  expect(html.match(/<ul/g)).toHaveLength(1);
  expect(html.match(/<li/g)).toHaveLength(2);
  expect(html).toContain('<em>Nature Climate Change</em>');
  expect(html).toContain('This extract from p165, first 3 paragraphs');
});

test('a web citation link opens in a new tab and says so', () => {
  const html = renderSources(valid);

  expect(html).toContain('href="https://example.org/coral"');
  expect(html).toContain('target="_blank"');
  expect(html).toContain('(opens in a new tab)');
});

test('icons are hidden, and the kind reaches a screen reader as text', () => {
  const html = renderSources(valid);

  const svgs = html.match(/<svg[^>]*>/g) ?? [];
  // Two source icons plus the rich-text link's external-link icon.
  expect(svgs.length).toBeGreaterThanOrEqual(2);
  for (const svg of svgs) expect(svg).toContain('aria-hidden="true"');
  expect(html).toContain('Print source:');
  expect(html).toContain('Web source:');
});

test('group headings are <h3> in a plain block and <h4> inside a card', () => {
  expect(renderSources(valid, 'plain')).toMatch(/<h3[^>]*>Strategies<\/h3>/);
  expect(renderSources(valid, 'card')).toMatch(/<h4[^>]*>Strategies<\/h4>/);
});

test('a group with no heading renders no heading element', () => {
  const html = renderSources({ groups: [{ items: [printItem] }] });

  expect(html).not.toMatch(/<h[1-6]/);
});
```

## Task 2 — schema

- [ ] `sources-block-schema.ts`, header comment in the style of `outcomes-block-schema.ts`.
- [ ] `citation` and `note`: `z.string().min(1).transform(parseRichText)`.
- [ ] Web-link rule: a `.superRefine` on the item (after the transform) that walks the
      `RichTextNode[]` tree for `kind === 'link'` and adds an issue at `path: ['citation']`.
      Check that Zod 4 reports it as `['groups', i, 'items', j, 'citation']`.
- [ ] The schema tests pass.

## Task 3 — renderer and wiring

- [ ] `block-renderers.ts`: add `presentation: 'card' | 'plain'` to `BlockRendererProps`,
      register `sources: SourcesBlock`.
- [ ] `lo-page-sections.tsx`: `blockBody()` passes `presentation={config.presentation}`.
      Update the existing `<Renderer content={…} />` calls in `block-renderers.test.tsx`
      and others if the type now requires the prop.
- [ ] `ui-strings.ts`: add `sourcePrint` and `sourceWeb` to the schema and defaults, next to
      `opensInNewTab`.
- [ ] `SourcesBlock.tsx`: `parseBlockContent('sources', …)`. One `<section>`-less wrapper per
      group: a heading (`h3`/`h4` from `presentation`) if present, then a `<ul>`. Each
      `<li>` is `flex items-start gap-2`: the icon, then a `min-w-0` span holding the sr-only
      kind label, `<RichText nodes={citation} />` and, if present, a note `<p>` in
      `text-sm text-muted-foreground`.
- [ ] All tests in the file pass.

## Task 4 — example LO and docs

- [ ] `blocks/08-sources/block.json`: `"type": "sources"`, `"presentation": "plain"`, two
      groups modelled on the screenshot (placeholder citations; use `https://example.org/…`
      for web links).
- [ ] `lo.json`: append the `sources` section last.
- [ ] `CONTRIBUTING.md` "Sources block", `public/llms.txt` block list, `TODO.md` §F5.
- [ ] Check `src/config/example-lo.test.ts` and guard b (folder ↔ config naming) still pass.

## Task 5 — verify

- [ ] Gate: `bun run format && bun run lint && bun run lint:css && bun run test && bun run build`.
- [ ] Bundle budget: compare `main-*.css` and `main-*.js` with `docs/TOOLING.md`.
- [ ] `BASE_URL=/course/ bun run build` (AGENTS.md hard constraint 3).
- [ ] Browser: the example LO's Sources section at 320, 768 and 1440, axe clean, nav shows
      "Sources", the web link opens in a new tab. See TODO.md "Browser verification" for the
      headed-Chromium recipe.
- [ ] Commit `feat(blocks): sources block for references lists`.
