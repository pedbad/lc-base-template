# Introduction outcomes block and illustration split — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `outcomes` block type that renders a lead-in, a ticked list of learning outcomes, and an optional illustration beside them — two columns at `lg`, stacked below it — and author one into the example LO's introduction.

**Architecture:** A new per-type schema + renderer pair registered in `BLOCK_RENDERERS`, following the `vocabulary` block exactly: Zod validates `content` at render through `parseBlockContent`, authored strings become `RichTextNode[]` via `parseRichText` so nothing is ever injected, and the renderer lays itself out with Tailwind utilities and ships no stylesheet. The intro's existing `prose` block is untouched and stays full-width above.

**Tech Stack:** React 19 + TypeScript, Zod 4.6, Vitest (`renderToStaticMarkup` + string assertions), Tailwind v4, lucide-react.

**Spec:** `docs/specs/2026-09-11-intro-outcomes-and-split-design.md`

---

## Before you start

Read the spec. Then three things about this repo that will bite you:

1. **`bun run test`, never `bun test`.** Bun's own runner throws on the `import.meta.glob` in `src/lo/load-lo-glob.ts` and reports a false failure.
2. **Tests go beside the code, never in `src/guards/`.** That glob _is_ `bun run guards` and means "the eight spec guards". Task 1 is the one exception and it is deliberate — see its note.
3. **`src/styles/tokens.css` is generated.** Do not hand-edit it. This plan adds no token, so you should never need to.

Full gate, run before every commit:

```bash
bun run format && bun run lint && bun run lint:css && bun run test && bun run build
```

---

## File structure

| File                                                    | Responsibility                                                                                    | Task |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---- |
| `src/guards/asset-existence.ts`                         | Modify — teach guard d that an asset path can sit at `image.src`, not only directly under `image` | 1    |
| `src/guards/asset-existence.test.ts`                    | Modify — prove a nested path is collected                                                         | 1    |
| `src/lo/blocks/outcomes-block-schema.ts`                | Create — the `content` contract for `type: "outcomes"`                                            | 2    |
| `src/lo/blocks/outcomes-block.test.tsx`                 | Create — schema rejections + rendered markup                                                      | 2, 3 |
| `src/lo/blocks/OutcomesBlock.tsx`                       | Create — the renderer                                                                             | 3    |
| `src/lo/blocks/block-renderers.ts`                      | Modify — register `outcomes`                                                                      | 3    |
| `lo-config/lo-00-example/blocks/03-outcomes/block.json` | Create — the authored block                                                                       | 4    |
| `lo-config/lo-00-example/lo.json`                       | Modify — reference it from the introduction section                                               | 4    |
| `docs/process/TODO.md`                                  | Modify — record the job                                                                           | 5    |

---

## Task 1: Teach guard d that an asset path can be nested

**Why this is first and why it is not optional.** `src/guards/asset-existence.ts:74-80` collects a path only when the value directly under an asset key is a **string**:

```ts
const isAssetKey = (ASSET_KEYS as readonly string[]).includes(key);
if (isAssetKey && typeof entry === 'string') { … }
collectAssetPaths(entry, found);
```

`ASSET_KEYS` is `['audio', 'image']`. Task 4 authors `"image": { "src": …, "alt": … }` — an **object** under `image` — so the walker recurses past it, sees key `src`, and collects nothing. The build stays green while guard d silently stops covering the introduction's illustration. That file's own header names this exact failure: "a guard that collects by key silently passes if a schema renames its field… Adding an asset field to a schema means adding its key here."

**`bun run guards` goes 211 → 212 as a result, and that is correct.** The 211 rule means "do not misfile feature tests into `src/guards/`". This test is guard d's own, extending the guard's coverage. Record the new number in Task 5.

**Files:**

- Modify: `src/guards/asset-existence.ts:39`
- Modify: `src/guards/asset-existence.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/guards/asset-existence.test.ts`, inside the same top-level `describe` the other `collectAssetPaths` tests use (match the surrounding file — if they are bare `test()` calls, append a bare `test()`):

```ts
test('collects an asset path nested under an image object, not only a bare string', () => {
  // A block authoring `image: { src, alt }` — the shape an illustration with
  // required alt text has. Before `src` was an asset key this returned [], and
  // guard d silently stopped covering every such image.
  expect(collectAssetPaths({ image: { src: 'images/lo-placeholder.svg', alt: '' } })).toEqual([
    'images/lo-placeholder.svg',
  ]);
});

test('a bare string under an asset key still collects, unchanged', () => {
  expect(collectAssetPaths({ image: 'images/lo-placeholder.svg' })).toEqual([
    'images/lo-placeholder.svg',
  ]);
});
```

Check the file's existing imports already bring in `collectAssetPaths`; add it to the import if not.

- [ ] **Step 2: Run it and watch the first one fail**

```bash
bun run test src/guards/asset-existence.test.ts
```

Expected: the nested test FAILS with `expected [] to deeply equal [ 'images/lo-placeholder.svg' ]`. The bare-string test PASSES already — it is there to prove Step 3 does not break what works.

- [ ] **Step 3: Add `src` to the asset keys**

In `src/guards/asset-existence.ts`, change line 39:

```ts
export const ASSET_KEYS = ['audio', 'image', 'src'] as const;
```

and extend the doc comment directly above it so the next reader knows why a generic-looking word is on the list:

```ts
/**
 * Config keys whose value is an asset path resolved against `public/`.
 *
 * Adding an asset field to a schema means adding its key here. The repo sweep asserts
 * a minimum find count so that omission surfaces as a failure, not as silence.
 *
 * `src` is here because an image that carries alt text cannot be a bare string: the
 * outcomes block authors `image: { src, alt }`, and the walker only collects a STRING
 * sitting directly under an asset key. Without `src` the nested path is walked past
 * and the guard reports green having checked nothing — the precise staleness this
 * file's header warns about. Nothing else in `lo-config/` or the showcase fixtures
 * uses the key, so it collects exactly the paths intended.
 */
```

- [ ] **Step 4: Run the guard suite**

```bash
bun run test src/guards/asset-existence.test.ts
```

Expected: PASS, both new tests included.

```bash
bun run guards
```

Expected: PASS, **212 tests** (was 211).

- [ ] **Step 5: Commit**

```bash
git add src/guards/asset-existence.ts src/guards/asset-existence.test.ts
git commit -m "fix(guards): let guard d see an asset path nested under image.src

An image that carries alt text is an object, not a bare string, so the
collector walked past it and reported green having checked nothing — the
staleness the guard's own header warns about. Adds \`src\` to ASSET_KEYS,
which nothing else in lo-config or the fixtures uses.

Guard count 211 -> 212: the new tests are guard d's own, extending the
guard rather than misfiling feature tests into its glob.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: The outcomes schema

**Files:**

- Create: `src/lo/blocks/outcomes-block-schema.ts`
- Create: `src/lo/blocks/outcomes-block.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/lo/blocks/outcomes-block.test.tsx`:

```tsx
/**
 * outcomes-block.test.tsx — the `outcomes` block's content contract and its markup.
 *
 * Two things carry the weight here. The CONTRACT: `alt` is required but may be the
 * empty string, so no image can ship without an alt and a decorative one is still
 * expressible. The MARKUP: the tick is decoration, so the list semantics must come
 * from <ul>/<li> and every icon must be out of the accessibility tree.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { test, expect } from 'vitest';
import { OutcomesBlockContentSchema } from './outcomes-block-schema';

/** A minimal valid content object, spread-and-overridden per case. */
const valid = {
  lead: 'After completing this unit, you will be able to:',
  items: ['Greet someone formally.', 'Greet someone informally.'],
};

test('a list-only block parses — the image is optional', () => {
  const result = OutcomesBlockContentSchema.safeParse(valid);

  expect(result.success).toBe(true);
});

test('an image with alt text parses, and an empty alt is a valid decorative choice', () => {
  expect(
    OutcomesBlockContentSchema.safeParse({
      ...valid,
      image: { src: 'images/lo-placeholder.svg', alt: '' },
    }).success,
  ).toBe(true);

  expect(
    OutcomesBlockContentSchema.safeParse({
      ...valid,
      image: { src: 'images/two-people.svg', alt: 'Two people greeting each other' },
    }).success,
  ).toBe(true);
});

test('an image without alt is rejected, naming the field the author must fix', () => {
  const result = OutcomesBlockContentSchema.safeParse({
    ...valid,
    image: { src: 'images/lo-placeholder.svg' },
  });

  expect(result.success).toBe(false);
  // Narrow before reading `.error`: safeParse returns a discriminated union, so
  // `result.error?.` does not type-check and would fail `bun run lint`.
  if (result.success) throw new Error('expected a validation failure');
  // The path is what makes the failure actionable — "somewhere in this block" is not
  // a useful build error.
  expect(result.error.issues[0]?.path).toEqual(['image', 'alt']);
});

test('a blank lead and an empty outcome list are both rejected', () => {
  expect(OutcomesBlockContentSchema.safeParse({ ...valid, lead: '' }).success).toBe(false);
  expect(OutcomesBlockContentSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
});

test('authored strings arrive as parsed rich-text nodes, never as strings', () => {
  const parsed = OutcomesBlockContentSchema.parse({
    lead: 'You will be able to:',
    items: ['Use <em>je voudrais</em> politely.'],
  });

  // The no-raw-HTML contract: the renderer must receive a validated tree.
  expect(Array.isArray(parsed.lead)).toBe(true);
  expect(Array.isArray(parsed.items[0])).toBe(true);
  expect(JSON.stringify(parsed.items[0])).toContain('"em"');
});
```

`renderToStaticMarkup` is imported now and used in Task 3; if your linter objects to an unused import at this step, add it in Task 3 instead.

- [ ] **Step 2: Run them and watch them fail**

```bash
bun run test src/lo/blocks/outcomes-block.test.tsx
```

Expected: FAIL — `Cannot find module './outcomes-block-schema'`.

- [ ] **Step 3: Write the schema**

Create `src/lo/blocks/outcomes-block-schema.ts`:

```ts
/**
 * outcomes-block-schema.ts — the per-type `content` contract for `type: "outcomes"`,
 * mirroring the per-engine `*-schema.ts` convention the exercises use.
 *
 * `lead` and every `items` entry are INLINE RICH TEXT: the schema transforms each to
 * `RichTextNode[]` so the renderer receives a validated tree, never a string it might
 * inject. This is the reason french-lo-1's outcomes list cannot be ported as-is — it
 * is a raw `informationHTML` blob in all 15 of its LO configs, and an HTML field here
 * would be the first injection point in the codebase.
 *
 * `alt` IS REQUIRED BUT MAY BE THE EMPTY STRING. Required means no image can ship
 * without an alt; empty means "this is decoration", which renders `alt=""` plus
 * `aria-hidden` and keeps it out of the accessibility tree. Forcing non-empty text
 * onto a decorative image is an accessibility regression, not an improvement — the
 * screen reader then announces a sentence carrying no information. This is deliberate
 * opposition to the reference, which defaults to "Learning object introduction
 * illustration" and so puts that sentence into every page.
 *
 * Spec: docs/specs/2026-09-11-intro-outcomes-and-split-design.md §2.
 */
import { z } from 'zod';
import { parseRichText } from '../rich-text/parse-rich-text';

/** The block's illustration. Omit the whole object for a list-only block. */
export const OutcomesImageSchema = z.object({
  /** Project-relative asset path; the renderer resolves it through `resolveAsset()`. */
  src: z.string().min(1),
  /** Required. `""` is the explicit decorative choice — see this file's header. */
  alt: z.string(),
});
export type OutcomesImage = z.infer<typeof OutcomesImageSchema>;

export const OutcomesBlockContentSchema = z.object({
  /** Block-level instructions, read generically by `sectionContent`. */
  instructions: z.string().min(1).optional(),
  /** The lead-in, e.g. "After completing this unit, you will be able to:". */
  lead: z
    .string()
    .min(1)
    .transform((value) => parseRichText(value)),
  /** One entry per outcome. At least one — an empty outcomes block is a bug. */
  items: z
    .array(z.string().min(1))
    .min(1)
    .transform((entries) => entries.map((entry) => parseRichText(entry))),
  image: OutcomesImageSchema.optional(),
});
export type OutcomesBlockContent = z.infer<typeof OutcomesBlockContentSchema>;
```

**Do not write `.map(parseRichText)`.** `parseRichText(html, source?)` takes a second argument, so `map` would hand it the array index as `source` and corrupt every error message. Pass the entry explicitly, as `text-block-schema.ts` does.

- [ ] **Step 4: Run the tests**

```bash
bun run test src/lo/blocks/outcomes-block.test.tsx
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lo/blocks/outcomes-block-schema.ts src/lo/blocks/outcomes-block.test.tsx
git commit -m "feat(lo): add the outcomes block's content contract

lead and every items entry transform through parseRichText, so the renderer
receives a validated tree and never a string — the same no-injection contract
TextBlockContentSchema holds.

alt is required but may be empty: required so no image ships without one,
empty so a decorative image can stay out of the accessibility tree.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: The renderer

**Files:**

- Create: `src/lo/blocks/OutcomesBlock.tsx`
- Modify: `src/lo/blocks/block-renderers.ts:19-33`
- Modify: `src/lo/blocks/outcomes-block.test.tsx`

- [ ] **Step 1: Write the failing tests**

Append to `src/lo/blocks/outcomes-block.test.tsx`:

```tsx
import { getBlockRenderer } from './block-renderers';

/** Render the outcomes body through the registry, as the adapter does. */
function renderOutcomes(content: unknown): string {
  const Renderer = getBlockRenderer('outcomes');
  if (!Renderer) throw new Error('no renderer for "outcomes"');
  return renderToStaticMarkup(<Renderer content={content} />);
}

test('renders the lead as a <p> and one <li> per outcome, in authored order', () => {
  const html = renderOutcomes(valid);

  expect(html).toContain('<p');
  expect(html).toContain('After completing this unit, you will be able to:');
  expect(html).toContain('<ul');
  expect(html.match(/<li/g)).toHaveLength(2);
  expect(html.indexOf('Greet someone formally.')).toBeLessThan(
    html.indexOf('Greet someone informally.'),
  );
});

test('every tick is out of the accessibility tree — the list carries the semantics', () => {
  const html = renderOutcomes(valid);

  expect(html.match(/<svg/g)).toHaveLength(2);
  expect(html.match(/aria-hidden="true"/g)).toHaveLength(2);
});

test('a decorative image renders an empty alt AND is hidden from the tree', () => {
  const html = renderOutcomes({
    ...valid,
    image: { src: 'images/lo-placeholder.svg', alt: '' },
  });

  expect(html).toMatch(/<img[^>]*alt=""/);
  expect(html).toMatch(/<img[^>]*aria-hidden="true"/);
});

test('a meaningful image keeps its alt text and stays in the tree', () => {
  const html = renderOutcomes({
    ...valid,
    image: { src: 'images/two-people.svg', alt: 'Two people greeting each other' },
  });

  expect(html).toContain('alt="Two people greeting each other"');
  expect(html).not.toMatch(/<img[^>]*aria-hidden/);
});

test('the image src goes through resolveAsset, never the authored string', () => {
  const html = renderOutcomes({
    ...valid,
    image: { src: '/images/lo-placeholder.svg', alt: '' },
  });

  // resolveAsset strips the leading slash and resolves against BASE_URL.
  expect(html).toContain('src="/images/lo-placeholder.svg"');
  expect(html).not.toContain('src="//images');
});

test('a list-only block renders no <img> at all', () => {
  expect(renderOutcomes(valid)).not.toContain('<img');
});

test('content that does not match the type fails loud, naming the type', () => {
  expect(() => renderOutcomes({ text: ['wrong shape'] })).toThrow(/outcomes/);
});
```

- [ ] **Step 2: Run them and watch them fail**

```bash
bun run test src/lo/blocks/outcomes-block.test.tsx
```

Expected: FAIL — `no renderer for "outcomes"` on every new test.

- [ ] **Step 3: Write the renderer**

Create `src/lo/blocks/OutcomesBlock.tsx`:

```tsx
/**
 * OutcomesBlock — `type: "outcomes"`. The lead-in, a ticked list of what a learner
 * will be able to do, and an optional illustration beside them.
 *
 * TWO COLUMNS AT `lg`, STACKED BELOW IT. The reference splits at `lg` too, and 768 is
 * too narrow for a two-column introduction carrying artwork. Tracks are
 * `minmax(0,1fr)` rather than a bare `1fr` because a long unbroken word in an outcome
 * blows out a `1fr` track and takes the page into horizontal overflow with it.
 *
 * NO STYLESHEET AND NO TOKEN. `VocabularyBlock` is the precedent: a block renderer
 * lays itself out with utilities. That keeps this out of guard f (raw `px`) and guard
 * g (layer discipline) by authoring no CSS rule at all, and out of
 * `token-presets.test.ts`, which enforces preset parity in both directions over every
 * token.
 *
 * THE TICK IS DECORATION. List semantics come from <ul>/<li>, so every icon takes
 * `aria-hidden` — a tick read aloud before each item says nothing the list has not
 * already said.
 *
 * THE IMAGE BOX IS RESERVED BY ASPECT RATIO, NOT BY width/height ATTRIBUTES. An
 * authored image has whatever intrinsic size it has, so stating dimensions would be a
 * lie that buys nothing; `LoCard`'s band solves the identical problem the identical
 * way. This is what keeps CLS at zero. `object-contain`, never `cover` — an
 * introduction's illustration must not be cropped.
 *
 * Spec: docs/specs/2026-09-11-intro-outcomes-and-split-design.md §3.
 */
import { CircleCheck } from 'lucide-react';
import { resolveAsset } from '@/lib/assets';
import { RichText } from '../rich-text/RichText';
import { OutcomesBlockContentSchema } from './outcomes-block-schema';
import { parseBlockContent } from './parse-block-content';

export function OutcomesBlock({ content }: { content: unknown }) {
  const { lead, items, image } = parseBlockContent('outcomes', OutcomesBlockContentSchema, content);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      <div>
        <p className="font-medium text-foreground">
          <RichText nodes={lead} />
        </p>
        <ul className="mt-3 grid gap-2">
          {items.map((item, index) => (
            // Outcome text is the only identity an outcome has; index is stable
            // because the list is static config, never reordered at runtime.
            <li key={index} className="flex items-start gap-2 text-muted-foreground">
              <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
              <span>
                <RichText nodes={item} />
              </span>
            </li>
          ))}
        </ul>
      </div>

      {image === undefined ? null : (
        <div className="aspect-[3/2] w-full">
          <img
            src={resolveAsset(image.src)}
            alt={image.alt}
            // An empty alt is the author saying "decoration"; take it out of the tree
            // entirely rather than leaving a nameless <img> in it.
            aria-hidden={image.alt === '' ? true : undefined}
            loading="lazy"
            decoding="async"
            className="size-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Register it**

In `src/lo/blocks/block-renderers.ts`, add the import beside the others and one entry to the map:

```ts
import { OutcomesBlock } from './OutcomesBlock';
```

```ts
export const BLOCK_RENDERERS: Readonly<Record<string, BlockRenderer>> = {
  prose: ProseBlock,
  grammar: GrammarBlock,
  vocabulary: VocabularyBlock,
  outcomes: OutcomesBlock,
};
```

- [ ] **Step 5: Run the tests**

```bash
bun run test src/lo/blocks/
```

Expected: PASS — the 5 schema tests, the 7 renderer tests, and the existing `block-renderers.test.tsx` untouched and green.

- [ ] **Step 6: Commit**

```bash
git add src/lo/blocks/OutcomesBlock.tsx src/lo/blocks/block-renderers.ts src/lo/blocks/outcomes-block.test.tsx
git commit -m "feat(lo): render the outcomes block, list beside illustration

Two columns at lg, stacked below. minmax(0,1fr) tracks so a long unbroken
outcome cannot take the page into horizontal overflow; aspect-[3/2] reserves
the image box so an authored illustration costs no layout shift.

Ticks are decoration and carry aria-hidden — the <ul>/<li> carries the
semantics. Utilities only, no stylesheet and no token, following
VocabularyBlock.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: Author it into the example LO

Guard b compares the refs `lo.json` names against the folders on disk **in both directions** — a folder nobody references fails just as loudly as a ref with no folder. So the new folder and the manifest edit must land in the **same commit**.

**Files:**

- Create: `lo-config/lo-00-example/blocks/03-outcomes/block.json`
- Modify: `lo-config/lo-00-example/lo.json:6-10`

- [ ] **Step 1: Create the block**

`lo-config/lo-00-example/blocks/03-outcomes/block.json`:

```json
{
  "type": "outcomes",
  "presentation": "plain",
  "content": {
    "lead": "After working through this template, you will be able to:",
    "items": [
      "Copy <em>lo-config/lo-00-example</em> and turn it into a real Learning Object.",
      "Declare a page's sections, and their order, in <em>lo.json</em>.",
      "Choose whether a block renders as a card or as page copy, with <em>presentation</em>.",
      "Author an outcomes list like this one, with or without an illustration beside it."
    ],
    "image": {
      "src": "images/lo-placeholder.svg",
      "alt": ""
    }
  }
}
```

`alt` is `""` because this image is decoration: `public/images/lo-placeholder.svg` declares `role="presentation" aria-hidden="true"` inside the file itself. An author replacing it with artwork that carries meaning writes real alt text here instead.

No `title` and no `defaultOpen`: `BlockConfigSchema`'s refines reject both on a `plain` block, by name.

- [ ] **Step 2: Reference it from the introduction**

In `lo-config/lo-00-example/lo.json`, the introduction section becomes:

```json
    {
      "id": "introduction",
      "label": "Introduction",
      "blocks": ["00-intro", "03-outcomes"]
    },
```

The `NN-` ordinal is unique per kind LO-wide, not per section, so `03-` follows `02-vocabulary`.

- [ ] **Step 3: Run the full suite**

```bash
bun run test
```

Expected: PASS throughout. Specifically green, and each for a reason worth knowing:

- **guard b** — the new folder is referenced and the ref has a folder, so both set differences stay empty.
- **guard d** — `images/lo-placeholder.svg` is now collected (Task 1) and exists, so it resolves.
- **guard h** — the example LO is re-rendered from disk through `App`, so the new block is in the swept markup automatically. It adds no heading, so `semantic-dom`'s heading floor stays at **14**, where `7e22990` left it. It adds no `aria-*` reference, so nothing can dangle.

If guard h fails on heading count, stop: something added a heading this plan did not intend, and the fix is to remove it, not to move the floor.

- [ ] **Step 4: Build, including under a sub-path**

```bash
bun run build && BASE_URL=/course/ bun run build
```

Expected: both succeed. Check the sub-path build actually rewrote the image URL:

```bash
grep -o 'src="[^"]*lo-placeholder[^"]*"' dist/example.html
```

Expected: `src="/course/images/lo-placeholder.svg"` — not `/images/…`, which would mean the path skipped `resolveAsset()`.

- [ ] **Step 5: Commit**

```bash
git add lo-config/lo-00-example/blocks/03-outcomes/block.json lo-config/lo-00-example/lo.json
git commit -m "feat(lo): author an outcomes block into the example introduction

The introduction section now holds the prose block and an outcomes block:
prose full width on top, outcomes beside the illustration below, which is
what the reference actually renders.

Ships the existing lo-placeholder.svg rather than new artwork — the point of
the block is the layout, and D5's budget breaches are still open. Its alt is
empty because the file declares role=presentation itself.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: Verify on screen, then finish the pass

No code in this task. It is the part §D proved gets skipped.

- [ ] **Step 1: Run the whole gate**

```bash
bun run format && bun run lint && bun run lint:css && bun run test && bun run build
```

Expected: all five clean.

```bash
bun run guards
```

Expected: **212** (211 before Task 1). If it is 213+, a feature test was misfiled into `src/guards/` — move it beside the code.

- [ ] **Step 2: Look at it, at five widths, in both themes**

Start the preview and open the example LO. **Set an explicit viewport width before measuring anything**: `resize_window` with preset `desktop` while the Browser pane is hidden leaves the tab at zero width, every section reads 0px, and geometry comes back as confident nonsense without erroring.

At **320 / 375 / 768** — one column, outcomes above the illustration, no horizontal overflow.
At **1024 / 1440** — two columns, list left, illustration right, tops aligned.
Both themes at 1024.

Check for overflow at each width:

```js
document.documentElement.scrollWidth <= document.documentElement.clientWidth;
```

Expected: `true` at every width.

- [ ] **Step 3: Have a human look at 1024 and 1440**

§D's lesson, learned three times over on the back-to-top fade: everything _around_ a broken visual measured green. This design has no animation, so the risk is lower — but the two-column composition is the entire point of the job and a machine reading `scrollWidth` cannot tell you it looks wrong. Ask.

- [ ] **Step 4: Record the bundle sizes**

Read the gzipped `main-*.js` and CSS figures off the `bun run build` output and note them in the TODO row. D5's breaches (96.19 kB against < 80 kB; 20.22 kB against < 15 kB) are open and untouched by this job — it adds no CSS and one already-bundled icon — but §D's standard is to state the number rather than assume it did not move.

- [ ] **Step 5: Update `docs/process/TODO.md`**

**Re-read the file immediately before editing.** An exact-string edit against a stale copy fails, and the table rows reflow their column widths.

Add a "Done recently" row naming the real SHAs, and update the header line: the suite count rises by the tests this plan added, and **`bun run guards` is now 212, not 211** — that line explicitly explains the 211, so leaving it stale would mislead the next session.

- [ ] **Step 6: Check whether anything else is owed**

- `AGENTS.md` — only if a new house rule emerged. None should have: the likely candidate was a second callout primitive, and the design deliberately avoided one.
- `STRUCTURE.md` + `bun run docs:tree` — only if the tree covers `lo-config/`. Check before assuming; `blocks/03-outcomes/` is config, not source.
- `DESIGNER.md` — not owed. No token landed.

- [ ] **Step 7: Commit the docs, show the diff, then push**

```bash
git add docs/process/TODO.md
git commit -m "docs: record the outcomes block and the guard d fix

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

```bash
git log --oneline origin/main..HEAD && git diff origin/main...HEAD --stat
```

Show that diff before pushing. `main` is unprotected by decision (§E), so a direct push works. CI is `.github/workflows/ci.yml`, job `Lint, test, build`, ~50s.

---

## What this plan does not do

No new token, no second callout primitive, no change to `InstructionsCallout`, no `<h3>`, no `caption`/`<figure>`, no change to the `prose` block, `TextBlockContentSchema`, or the `plain` branch in `sectionContent`. `semantic-dom`'s heading floor stays at 14. D5's two budget breaches stay open.
