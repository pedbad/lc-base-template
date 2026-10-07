# Tabs block (slice 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a `tabs` block type that authors drop into an LO through config, with one plain example in the example LO's Grammar section.

**Architecture:** A per-type content schema (`tabs-block-schema.ts`) plus a thin renderer (`TabsBlock.tsx`) registered in `BLOCK_RENDERERS`, the same shape as `outcomes`. The renderer uses the vendored shadcn `tabs.tsx` (Base UI Tabs), woken by deleting its `@source not` line. Panel bodies reuse `RichTextEntries`, so each tab accepts exactly what a grammar block accepts.

**Tech Stack:** React 19, Base UI Tabs via shadcn wrapper, Zod 4, Tailwind v4 (container queries), Vitest (`renderToStaticMarkup`, no DOM).

**Spec:** `docs/specs/2026-10-07-tabs-block-design.md`

---

## File map

| File                                                                            | Action | Responsibility                                   |
| ------------------------------------------------------------------------------- | ------ | ------------------------------------------------ |
| `src/lo/blocks/tabs-block-schema.ts`                                            | create | the `tabs` content contract                      |
| `src/lo/blocks/tabs-block.test.tsx`                                             | create | contract + rendered markup                       |
| `src/lo/blocks/TabsBlock.tsx`                                                   | create | thin view over shadcn Tabs                       |
| `src/lo/blocks/block-renderers.ts`                                              | modify | register `tabs`                                  |
| `src/index.css`                                                                 | modify | delete `@source not "./components/ui/tabs.tsx";` |
| `lo-config/lo-00-example/blocks/04-tabs/block.json`                             | create | the worked example                               |
| `lo-config/lo-00-example/lo.json`                                               | modify | list `04-tabs` after `01-grammar`                |
| `CONTRIBUTING.md`, `public/llms.txt`, `docs/TOOLING.md`, `docs/process/TODO.md` | modify | docs, budget figures, worklist                   |

Run every command from the repo root. Never `bun test`; always `bun run test`.

---

### Task 1: The content schema

**Files:**

- Create: `src/lo/blocks/tabs-block-schema.ts`
- Test: `src/lo/blocks/tabs-block.test.tsx`

- [ ] **Step 1: Write the failing contract tests**

```tsx
/**
 * tabs-block.test.tsx — the `tabs` block's content contract and its markup.
 *
 * The contract: at least two tabs, every tab labelled and told apart by its label,
 * and a name for the tab set (a plain block has no heading to name it). The markup:
 * the WAI-ARIA tabs roles, the first tab selected, and every panel present in the
 * static page so later slices keep exercise state across a switch.
 *
 * Spec: docs/specs/2026-10-07-tabs-block-design.md §3, §4.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { getBlockRenderer } from './block-renderers';
import { TabsBlockContentSchema } from './tabs-block-schema';

/** A minimal valid content object, spread-and-overridden per case. */
const valid = {
  label: 'Forms of address',
  tabs: [
    { label: 'Tu', text: ['Informal.'] },
    { label: 'Vous', text: ['Formal.'] },
  ],
};

test('two labelled tabs with text parse', () => {
  expect(TabsBlockContentSchema.safeParse(valid).success).toBe(true);
});

test('one tab is rejected — a single tab is not a choice', () => {
  const result = TabsBlockContentSchema.safeParse({ ...valid, tabs: [valid.tabs[0]] });

  expect(result.success).toBe(false);
});

test('a blank tab label and an empty tab body are both rejected', () => {
  expect(
    TabsBlockContentSchema.safeParse({
      ...valid,
      tabs: [{ label: '', text: ['x'] }, valid.tabs[1]],
    }).success,
  ).toBe(false);
  expect(
    TabsBlockContentSchema.safeParse({ ...valid, tabs: [{ label: 'Tu', text: [] }, valid.tabs[1]] })
      .success,
  ).toBe(false);
});

test('two tabs with the same label are rejected, naming the second', () => {
  const result = TabsBlockContentSchema.safeParse({
    ...valid,
    tabs: [valid.tabs[0], { label: 'Tu', text: ['Again.'] }],
  });

  if (result.success) throw new Error('expected a validation failure');
  expect(result.error.issues[0]?.path).toEqual(['tabs', 1, 'label']);
});

test('the tab set needs a name, and a misspelt key fails instead of vanishing', () => {
  const { label: _label, ...nameless } = valid;
  expect(TabsBlockContentSchema.safeParse(nameless).success).toBe(false);
  expect(TabsBlockContentSchema.safeParse({ ...valid, tabz: [] }).success).toBe(false);
});

test('tab text and intro arrive as parsed rich-text entries, never as strings', () => {
  const parsed = TabsBlockContentSchema.parse({
    ...valid,
    intro: ['Read <em>both</em> tabs.'],
  });

  expect(parsed.intro?.[0]?.kind).toBe('paragraph');
  expect(parsed.tabs[0]?.text[0]?.kind).toBe('paragraph');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun run test src/lo/blocks/tabs-block.test.tsx`
Expected: FAIL — cannot resolve `./tabs-block-schema`.

- [ ] **Step 3: Write the schema**

```ts
/**
 * tabs-block-schema.ts — the per-type `content` contract for `type: "tabs"`,
 * mirroring the per-engine `*-schema.ts` convention.
 *
 * `label` NAMES THE TAB SET and is required. A tablist without an accessible name
 * fails WAI-ARIA, and a `plain` block has no heading of its own to borrow one from.
 *
 * AT LEAST TWO TABS: one tab is not a choice, it is a panel with a button on top.
 *
 * LABELS ARE UNIQUE within the block: the label is the only thing a learner tells
 * tabs apart by, so two "Tu" tabs is an authoring mistake, caught here.
 *
 * `text` is exactly a grammar block's `text` — reused, not copied — so a tab accepts
 * paragraphs, lists, tables, the audio player, inline audio and popup links.
 *
 * STRICT, so a misspelt key (`tabz`) fails at build time instead of silently
 * rendering nothing.
 *
 * Spec: docs/specs/2026-10-07-tabs-block-design.md §3.
 */
import { z } from 'zod';
import { TextBlockContentSchema } from './text-block-schema';

/** One authored rich-text entry array, parsed to `RichTextEntry[]`. */
const RichTextEntriesSchema = TextBlockContentSchema.shape.text;

export const TabSchema = z.strictObject({
  /** The tab's visible text. Also its accessible name. */
  label: z.string().min(1),
  /** The panel body: one entry per paragraph or block. */
  text: RichTextEntriesSchema,
});
export type Tab = z.infer<typeof TabSchema>;

export const TabsBlockContentSchema = z
  .strictObject({
    /** Block-level instructions, read generically by `sectionContent`. */
    instructions: z.string().min(1).optional(),
    /** The tab set's accessible name (`aria-label` on the tablist). */
    label: z.string().min(1),
    /** Optional rich text above the tabs. */
    intro: RichTextEntriesSchema.optional(),
    /** The tabs, in order. */
    tabs: z.array(TabSchema).min(2),
  })
  .superRefine((content, ctx) => {
    const seen = new Set<string>();
    content.tabs.forEach((tab, index) => {
      if (seen.has(tab.label)) {
        ctx.addIssue({
          code: 'custom',
          message: `duplicate tab label "${tab.label}" — learners tell tabs apart by label`,
          path: ['tabs', index, 'label'],
        });
      }
      seen.add(tab.label);
    });
  });
export type TabsBlockContent = z.infer<typeof TabsBlockContentSchema>;
```

- [ ] **Step 4: Run the schema tests to verify they pass**

Run: `bun run test src/lo/blocks/tabs-block.test.tsx`
Expected: the six contract tests PASS (the file has no render tests yet).

- [ ] **Step 5: Commit**

```bash
git add src/lo/blocks/tabs-block-schema.ts src/lo/blocks/tabs-block.test.tsx
git commit -m "feat(blocks): tabs block content schema"
```

---

### Task 2: The renderer, registered

**Files:**

- Create: `src/lo/blocks/TabsBlock.tsx`
- Modify: `src/lo/blocks/block-renderers.ts`, `src/index.css:40`
- Test: `src/lo/blocks/tabs-block.test.tsx`

- [ ] **Step 1: Append the failing render tests**

```tsx
/** Render the tabs body through the registry, as the adapter does. */
function renderTabs(content: unknown): string {
  const Renderer = getBlockRenderer('tabs');
  if (!Renderer) throw new Error('no renderer for "tabs"');
  return renderToStaticMarkup(<Renderer content={content} />);
}

const three = {
  label: 'Forms of address',
  intro: ['Pick a form.'],
  tabs: [
    { label: 'Tu', text: ['Informal text.'] },
    { label: 'Vous', text: ['Formal text.'] },
    { label: 'On', text: ['Impersonal text.'] },
  ],
};

test('renders one named tablist with one tab per authored tab', () => {
  const html = renderTabs(three);

  expect(html).toMatch(
    /role="tablist"[^>]*aria-label="Forms of address"|aria-label="Forms of address"[^>]*role="tablist"/,
  );
  expect(html.match(/role="tab"/g)).toHaveLength(3);
  expect(html).toContain('>Tu<');
  expect(html).toContain('>On<');
});

test('the first tab is selected and only its panel is visible', () => {
  const html = renderTabs(three);

  expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
  expect(html).toMatch(/aria-selected="true"[^>]*>Tu</);
  expect(html.match(/role="tabpanel"/g)).toHaveLength(3);
  expect(html.match(/role="tabpanel"[^>]*hidden|hidden[^>]*role="tabpanel"/g)).toHaveLength(2);
});

test('every panel is in the static page, so no content waits for a click', () => {
  const html = renderTabs(three);

  expect(html).toContain('Informal text.');
  expect(html).toContain('Formal text.');
  expect(html).toContain('Impersonal text.');
});

test('the intro renders above the tablist', () => {
  const html = renderTabs(three);

  expect(html.indexOf('Pick a form.')).toBeLessThan(html.indexOf('role="tablist"'));
});

test('content that breaks the contract fails loud, naming the type', () => {
  expect(() => renderTabs({ label: 'x', tabs: [] })).toThrow(/tabs/);
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `bun run test src/lo/blocks/tabs-block.test.tsx`
Expected: the render tests FAIL with `no renderer for "tabs"`.

- [ ] **Step 3: Wake the shadcn wrapper**

Delete this line from `src/index.css`:

```css
@source not "./components/ui/tabs.tsx";
```

- [ ] **Step 4: Write the renderer**

```tsx
/**
 * TabsBlock — `type: "tabs"`: labelled tabs, one panel showing at a time, each panel
 * the same rich text a grammar block takes.
 *
 * BUILT ON THE VENDORED shadcn `Tabs` (Base UI underneath), which supplies the
 * WAI-ARIA tabs pattern: roles, aria-selected / aria-controls, roving tabindex,
 * ←/→ and Home/End. `activateOnFocus` turns on automatic activation — panels are
 * instant, so arrowing to a tab shows it, as the french-lo-1 reference does.
 *
 * `keepMounted` keeps every panel in the DOM, `hidden` when inactive. That puts every
 * panel's text in the prerendered page, and it is what will keep a learner's answers
 * when a later slice puts an exercise in a tab and they switch away and back.
 *
 * STYLING IS OVERRIDDEN HERE, NOT IN `src/components/ui/`, which belongs to the shadcn
 * CLI (the `ThemeToggle` precedent). The look follows the reference: wide, a row of
 * folder tabs whose active one joins the bordered panel; narrow (a container query on
 * this block, since a card is narrower than a plain block), a stacked list with a
 * leading bar on the active tab. Every label stays visible at 320px.
 *
 * Spec: docs/specs/2026-10-07-tabs-block-design.md §4, §5.
 */
import { FOCUS_OUTLINE } from '@/components/shell/focus-outline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEntries } from '../rich-text/RichTextEntries';
import { parseBlockContent } from './parse-block-content';
import { TabsBlockContentSchema } from './tabs-block-schema';

const LIST_CLASSES =
  'w-full flex-col items-stretch gap-1 rounded-none bg-transparent p-0 group-data-horizontal/tabs:h-auto ' +
  '@xl:flex-row @xl:flex-wrap @xl:items-end @xl:gap-0 @xl:border-b-2 @xl:border-accent';

const TRIGGER_CLASSES =
  `h-auto flex-none justify-start whitespace-normal rounded-md border-s-4 border-transparent px-4 py-2 text-start text-base ` +
  `data-active:border-accent data-active:bg-muted data-active:font-semibold dark:data-active:border-accent dark:data-active:bg-muted ` +
  `group-data-[variant=default]/tabs-list:data-active:shadow-none focus-visible:ring-0 focus-visible:border-accent ${FOCUS_OUTLINE} ` +
  '@xl:rounded-none @xl:rounded-t-lg @xl:border-2 @xl:border-transparent @xl:px-5 @xl:py-3 @xl:text-center ' +
  '@xl:data-active:-mb-0.5 @xl:data-active:border-accent @xl:data-active:border-b-muted';

const PANEL_CLASSES =
  'mt-2 rounded-lg border-2 border-accent bg-muted p-4 text-base @xl:mt-0 @xl:rounded-t-none @xl:border-t-0';

export function TabsBlock({ content }: { content: unknown }) {
  const { label, intro, tabs } = parseBlockContent('tabs', TabsBlockContentSchema, content);

  return (
    <div className="@container space-y-4">
      {intro === undefined ? null : (
        <div className="space-y-3">
          <RichTextEntries entries={intro} paragraphClassName="text-foreground" />
        </div>
      )}
      {/* Values are the tab's index: stable, because tabs are static config. */}
      <Tabs defaultValue="0" className="gap-0">
        <TabsList aria-label={label} activateOnFocus className={LIST_CLASSES}>
          {tabs.map((tab, index) => (
            <TabsTrigger key={tab.label} value={String(index)} className={TRIGGER_CLASSES}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab, index) => (
          <TabsContent key={tab.label} value={String(index)} keepMounted className={PANEL_CLASSES}>
            <div className="space-y-3">
              <RichTextEntries entries={tab.text} paragraphClassName="text-foreground" />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 5: Register it**

In `src/lo/blocks/block-renderers.ts`, add the import and the entry:

```ts
import { TabsBlock } from './TabsBlock';
```

```ts
  outcomes: OutcomesBlock,
  tabs: TabsBlock,
```

- [ ] **Step 6: Run the file, then the source-negation check**

Run: `bun run test src/lo/blocks/tabs-block.test.tsx src/build/source-negation.test.ts`
Expected: all PASS. If a markup assertion fails because Base UI's server output differs (attribute order, `hidden` spelling), read the actual HTML (`console.log(renderTabs(three))` in a scratch test) and fix the ASSERTION's pattern, not the behaviour — the behaviour asserted (one named tablist, one selected tab, every panel present, inactive ones hidden) must hold.

- [ ] **Step 7: Commit**

```bash
git add src/lo/blocks/TabsBlock.tsx src/lo/blocks/block-renderers.ts src/lo/blocks/tabs-block.test.tsx src/index.css
git commit -m "feat(blocks): tabs block renderer on the shadcn Tabs wrapper"
```

---

### Task 3: The worked example

**Files:**

- Create: `lo-config/lo-00-example/blocks/04-tabs/block.json`
- Modify: `lo-config/lo-00-example/lo.json` (grammar section)

- [ ] **Step 1: Write the block**

```json
{
  "type": "tabs",
  "presentation": "plain",
  "content": {
    "label": "Placeholder forms of address",
    "intro": [
      "Placeholder tabs. Each tab below is one entry in <em>blocks/04-tabs/block.json</em>; click a tab, or use the arrow keys, to switch."
    ],
    "tabs": [
      {
        "label": "Placeholder form A",
        "text": [
          "Placeholder: the <strong>informal</strong> form — friends, family, children. <span data-audio=\"audio/lo-00-example/placeholder.m4a\" data-audio-label=\"Play the placeholder clip\"></span>",
          "A second placeholder paragraph in the same tab."
        ]
      },
      {
        "label": "Placeholder form B",
        "text": [
          "Placeholder: the <strong>formal</strong> form — strangers, officials, <em>anyone you are unsure about</em>.",
          "<ul><li>Placeholder rule one.</li><li>Placeholder rule two.</li></ul>"
        ]
      },
      {
        "label": "Placeholder form C",
        "text": [
          "A tab takes everything a grammar block does, popup links included: <a class=\"modal-link\" href=\"#content\" data-modal-target=\"example-popup\">open the example popup</a>."
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: List it after the grammar accordion**

In `lo-config/lo-00-example/lo.json`, the grammar section's `blocks` becomes:

```json
      "blocks": ["01-grammar", "04-tabs"]
```

- [ ] **Step 3: Run the LO-facing tests and the guards**

Run: `bun run test src/config src/lo src/guards`
Expected: all PASS — guard b sees folder `04-tabs` match its `type`, guard d finds the audio file, the rich-text guard finds `example-popup` declared.

- [ ] **Step 4: Commit**

```bash
git add lo-config/lo-00-example
git commit -m "feat(example-lo): plain tabs block in the Grammar section"
```

---

### Task 4: Build, measure, verify on the built site

- [ ] **Step 1: Full gate**

Run: `bun run format && bun run lint && bun run lint:css && bun run test && bun run build`
Expected: all green.

- [ ] **Step 2: Measure** — read the gzipped `main-*.js` and `main-*.css` sizes from the build output. **If CSS ≥ 17 kB or JS ≥ 105 kB, STOP and report the figures to the maintainer before going on.**

- [ ] **Step 3: Sub-path build**

Run: `BASE_URL=/course/ bun run build`
Expected: green.

- [ ] **Step 4: Built-site check** — `bun run build && bun run preview`, open `/example.html#grammar`:
  - 320 · 768 · 1024 · 1440 widths, light and dark: tabs stack narrow, row wide, no horizontal page scroll at 320.
  - Keyboard: Tab reaches the selected tab only; ←/→ move and select; Home/End; Tab again lands in the panel content.
  - axe: no violations on the tabs.
  - View source: every panel's text is in the HTML; no hydration warning in the console.
  - Adjust only the class strings in `TabsBlock.tsx` if the look is off; re-run the gate.

- [ ] **Step 5: Commit any styling adjustments**

```bash
git add src/lo/blocks/TabsBlock.tsx
git commit -m "fix(blocks): tabs styling after built-site check"
```

---

### Task 5: Docs

- [ ] **Step 1: `CONTRIBUTING.md`** — under "Authoring a Learning Object", add a "### Tabs block" subsection: the JSON from Task 3 trimmed to two tabs, the rules (`label` names the set, ≥ 2 tabs, unique labels, `text` = grammar rich text, `plain` or `card`), and a link to the spec.
- [ ] **Step 2: `public/llms.txt`** — add `tabs` to the list of block types the site renders, one line.
- [ ] **Step 3: `docs/TOOLING.md`** — update the "Measured" column of the bundle-budget table with Task 4's figures and a dated bullet saying the tabs block caused the change.
- [ ] **Step 4: `docs/process/TODO.md`** — add a "Done recently" row and a short open item for slice 2 (panel entries, phone dropdown, showcase page). Update the suite count in the header.
- [ ] **Step 5: Gate, then commit**

```bash
bun run format && bun run lint && bun run lint:css && bun run test && bun run build
git add CONTRIBUTING.md public/llms.txt docs
git commit -m "docs: tabs block authoring, budget figures, TODO"
```
