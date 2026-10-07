# Tabs slice 2a — media in a tab — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A tab can hold an optional media group — portrait or figure image, long audio player, and a Show/Hide transcript toggle — after its instruction box.

**Architecture:** A reusable `media-schema.ts` (strict Zod, cross-field rules) plugged into `TabSchema` as optional `media`. A presentational `MediaPanel.tsx` renders it: portrait beside the player in its own `@container`, figure full width in `<figure>`. The transcript toggle is native `<details>/<summary>` with both labels rendered and swapped by Tailwind `group-open:`, so no React state and prerender parity holds. Labels come from two new ui-strings keys.

**Tech Stack:** React 19, Zod 4, Tailwind v4 (container queries, `group-open:`), lucide-react (`Eye`, `EyeOff`), Vitest with `renderToStaticMarkup`.

**Spec:** `docs/specs/2026-10-07-tabs-media-design.md`

---

## File map

| File                                                                            | Action | Responsibility                              |
| ------------------------------------------------------------------------------- | ------ | ------------------------------------------- |
| `src/config/ui-strings.ts`                                                      | modify | `showTranscript`, `hideTranscript` keys     |
| `src/config/ui-strings.test.ts`                                                 | modify | the two keys exist                          |
| `src/lo/blocks/media-schema.ts`                                                 | create | the media contract                          |
| `src/lo/blocks/media-schema.test.ts`                                            | create | every rule in spec §3                       |
| `src/lo/blocks/MediaPanel.tsx`                                                  | create | renders one media group                     |
| `src/lo/blocks/MediaPanel.test.tsx`                                             | create | markup per layout                           |
| `src/lo/blocks/tabs-block-schema.ts`                                            | modify | `media` optional on a tab                   |
| `src/lo/blocks/TabsBlock.tsx`                                                   | modify | callout → media → text                      |
| `src/lo/blocks/tabs-block.test.tsx`                                             | modify | media in a tab: schema path, order, example |
| `public/images/lo-00-example/04-tabs/speaker.svg`                               | create | placeholder portrait                        |
| `public/images/lo-00-example/04-tabs/chart.svg`                                 | create | placeholder chart                           |
| `lo-config/lo-00-example/blocks/04-tabs/block.json`                             | modify | tabs A–D demo every layout                  |
| `CONTRIBUTING.md`, `public/llms.txt`, `docs/TOOLING.md`, `docs/process/TODO.md` | modify | docs, measured budget, worklist             |

Run every command from the repo root. Never `bun test`; always `bun run test`.
Commits: Conventional Commits, one concern each, **no `Co-Authored-By` trailer**
(`CONTRIBUTING.md`). The pre-commit hook runs Prettier on staged files.

---

### Task 0: Baseline sizes

`docs/TOOLING.md`'s table says 107.39 / 17.48 kB; the handover says 107.73 / 17.57 kB.
Measure, so the slice's cost is a real delta.

- [ ] **Step 1: Build and measure**

```bash
bun run build >/dev/null && for f in dist/assets/main-*.js dist/assets/main-*.css; do printf '%s %s\n' "$f" "$(gzip -c "$f" | wc -c)"; done
```

Expected: two lines. Divide bytes by 1000 for kB. Write both numbers down as the
baseline; Task 7 records them.

---

### Task 1: ui-strings keys

**Files:**

- Modify: `src/config/ui-strings.ts`
- Test: `src/config/ui-strings.test.ts`

- [ ] **Step 1: Write the failing test** (append to `src/config/ui-strings.test.ts`)

```ts
// The media transcript toggle's two labels (tabs spec 2a §4).
test('ui-strings: transcript toggle labels exist', () => {
  expect(resolveLabel('showTranscript')).toBe('Show transcript');
  expect(resolveLabel('hideTranscript')).toBe('Hide transcript');
});
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `bun run test src/config/ui-strings.test.ts`
Expected: FAIL (type error / `undefined` for the unknown key).

- [ ] **Step 3: Add the keys**

In `UiStringsSchema`, after `audioProgress: z.string().min(1),`:

```ts
  // Media transcript toggle (tab media, spec 2026-10-07-tabs-media-design §4)
  showTranscript: z.string().min(1),
  hideTranscript: z.string().min(1),
```

In `raw`, after `audioProgress: 'Audio progress',`:

```ts
  showTranscript: 'Show transcript',
  hideTranscript: 'Hide transcript',
```

- [ ] **Step 4: Run it — expect PASS**

Run: `bun run test src/config/ui-strings.test.ts`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
git add src/config/ui-strings.ts src/config/ui-strings.test.ts
git commit -m "feat(ui-strings): show/hide transcript labels"
```

---

### Task 2: The media schema

**Files:**

- Create: `src/lo/blocks/media-schema.ts`
- Test: `src/lo/blocks/media-schema.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
/**
 * media-schema.test.ts — the media group's contract: image and/or audio, a transcript
 * exactly when there is audio, alt rules per image kind.
 *
 * Spec: docs/specs/2026-10-07-tabs-media-design.md §3.
 */
import { expect, test } from 'vitest';
import { MediaSchema } from './media-schema';

const portrait = { kind: 'portrait', src: 'images/x/speaker.svg', alt: '' };
const figure = {
  kind: 'figure',
  src: 'images/x/chart.svg',
  alt: 'Visits peak on Saturday',
  caption: 'Visits per day',
};
const audio = { src: 'audio/x/clip.m4a', label: 'Listen' };
const transcript = ['Line one.', 'Line <em>two</em>.'];

/** The issue paths of a failed parse. */
function issuePaths(input: unknown): unknown[] {
  const result = MediaSchema.safeParse(input);
  if (result.success) throw new Error('expected a validation failure');
  return result.error.issues.map((issue) => issue.path);
}

test('every valid combination parses', () => {
  expect(MediaSchema.safeParse({ image: portrait, audio, transcript }).success).toBe(true);
  expect(MediaSchema.safeParse({ image: figure, audio, transcript }).success).toBe(true);
  expect(MediaSchema.safeParse({ audio, transcript }).success).toBe(true);
  expect(MediaSchema.safeParse({ image: figure }).success).toBe(true);
  expect(MediaSchema.safeParse({ audio: { src: audio.src }, transcript }).success).toBe(true);
});

test('empty media is rejected — it needs an image or audio', () => {
  expect(issuePaths({})).toEqual([[]]);
});

test('audio without a transcript is rejected, naming the transcript', () => {
  expect(issuePaths({ audio })).toEqual([['transcript']]);
});

test('a transcript without audio is rejected — nothing to transcribe', () => {
  expect(issuePaths({ image: figure, transcript })).toEqual([['transcript']]);
});

test('a figure needs real alt text; a portrait may be decorative', () => {
  expect(issuePaths({ image: { ...figure, alt: ' ' } })).toEqual([['image', 'alt']]);
  expect(MediaSchema.safeParse({ image: portrait }).success).toBe(true);
});

test('alt is required on every image, even a portrait', () => {
  const noAlt = { kind: 'portrait', src: portrait.src };
  expect(issuePaths({ image: noAlt })).toEqual([['image', 'alt']]);
});

test('a caption belongs to a figure only', () => {
  expect(issuePaths({ image: { ...portrait, caption: 'Claire' } })).toEqual([['image', 'caption']]);
});

test('an unknown kind and a misspelt key both fail', () => {
  expect(MediaSchema.safeParse({ image: { ...figure, kind: 'photo' } }).success).toBe(false);
  expect(MediaSchema.safeParse({ audio, transcript, transcrpt: [] }).success).toBe(false);
  expect(MediaSchema.safeParse({ audio: { ...audio, scr: 'x' }, transcript }).success).toBe(false);
});

test('the transcript arrives as parsed rich-text entries', () => {
  const parsed = MediaSchema.parse({ audio, transcript });
  expect(parsed.transcript?.[1]?.kind).toBe('paragraph');
});
```

- [ ] **Step 2: Run them — expect FAIL**

Run: `bun run test src/lo/blocks/media-schema.test.ts`
Expected: FAIL — cannot resolve `./media-schema`.

- [ ] **Step 3: Write the schema**

```ts
/**
 * media-schema.ts — one media group: an optional image, an optional long audio
 * player, and the player's transcript. Used by a tab's `media` today, and by a
 * standalone media block later — which is why it is its own file.
 *
 * TWO IMAGE KINDS, because a face and a chart need different layouts (spec §1):
 * a `portrait` of the speaker sits beside the player; a `figure` the dialogue is
 * about spans the panel in a `<figure>`.
 *
 * ALT IS REQUIRED ON EVERY IMAGE. A portrait may say `""` — the explicit decorative
 * choice, as in the outcomes block — because the speaker's words are in the
 * transcript. A figure may not: a chart carries information, so its alt states the
 * takeaway (WCAG 1.1.1), and only a figure takes a caption.
 *
 * AUDIO AND TRANSCRIPT COME TOGETHER. Audio without a transcript locks out a learner
 * who cannot hear it; a transcript without audio transcribes nothing. Both fail the
 * build with the path named, as does an empty group.
 *
 * Every path is under the key `src`, which guard d already collects, so a missing
 * file fails the build too. STRICT throughout: a misspelt key fails.
 *
 * Spec: docs/specs/2026-10-07-tabs-media-design.md §3.
 */
import { z } from 'zod';
import { TextBlockContentSchema } from './text-block-schema';

/** One authored rich-text entry array, parsed to `RichTextEntry[]`. */
const RichTextEntriesSchema = TextBlockContentSchema.shape.text;

export const MediaImageSchema = z.strictObject({
  /** `portrait` sits beside the player; `figure` spans the panel. */
  kind: z.enum(['portrait', 'figure']),
  /** Project-relative asset path; rendered through `resolveAsset()`. */
  src: z.string().min(1),
  /** Required. `""` is allowed on a portrait only — see the header. */
  alt: z.string(),
  /** A figure's visible caption. */
  caption: z.string().min(1).optional(),
});
export type MediaImage = z.infer<typeof MediaImageSchema>;

export const MediaAudioSchema = z.strictObject({
  /** Project-relative asset path; rendered through `resolveAsset()`. */
  src: z.string().min(1),
  /** The player's visible label and accessible name. */
  label: z.string().min(1).optional(),
});
export type MediaAudio = z.infer<typeof MediaAudioSchema>;

export const MediaSchema = z
  .strictObject({
    image: MediaImageSchema.optional(),
    audio: MediaAudioSchema.optional(),
    /** What the audio says, one entry per paragraph. */
    transcript: RichTextEntriesSchema.optional(),
  })
  .superRefine((media, ctx) => {
    const { image, audio, transcript } = media;
    if (image === undefined && audio === undefined) {
      ctx.addIssue({ code: 'custom', path: [], message: 'media needs an image, audio or both' });
    }
    if (audio !== undefined && transcript === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['transcript'],
        message: 'audio needs a transcript — a learner who cannot hear the clip reads it',
      });
    }
    if (audio === undefined && transcript !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['transcript'],
        message: 'a transcript needs audio to transcribe',
      });
    }
    if (image?.kind === 'figure' && image.alt.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['image', 'alt'],
        message: 'a figure carries information — its alt must state the takeaway',
      });
    }
    if (image?.kind === 'portrait' && image.caption !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['image', 'caption'],
        message: 'only a figure takes a caption',
      });
    }
  });
export type Media = z.infer<typeof MediaSchema>;
```

- [ ] **Step 4: Run them — expect PASS**

Run: `bun run test src/lo/blocks/media-schema.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lo/blocks/media-schema.ts src/lo/blocks/media-schema.test.ts
git commit -m "feat(blocks): media schema — portrait or figure, audio with transcript"
```

---

### Task 3: MediaPanel

**Files:**

- Create: `src/lo/blocks/MediaPanel.tsx`
- Test: `src/lo/blocks/MediaPanel.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
/**
 * MediaPanel.test.tsx — one media group's markup for each layout: portrait beside
 * the player, figure in <figure>, audio alone, and the transcript toggle.
 *
 * Spec: docs/specs/2026-10-07-tabs-media-design.md §4.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { MediaPanel } from './MediaPanel';
import { MediaSchema } from './media-schema';

const audio = { src: 'audio/lo-00-example/placeholder.m4a', label: 'Listen to Claire' };
const transcript = ['Bonjour, je suis Claire.'];

/** Parse like the block does, then render. */
function render(input: unknown): string {
  return renderToStaticMarkup(<MediaPanel media={MediaSchema.parse(input)} />);
}

test('a decorative portrait renders beside the player, out of the a11y tree', () => {
  const html = render({
    image: { kind: 'portrait', src: 'images/x/speaker.svg', alt: '' },
    audio,
    transcript,
  });

  expect(html).toMatch(/<img[^>]*alt=""[^>]*aria-hidden="true"/);
  expect(html).toContain('speaker.svg');
  expect(html).not.toContain('<figure');
  expect(html).toContain('<audio');
  expect(html).toContain('placeholder.m4a');
  expect(html).toContain('Listen to Claire');
});

test('a figure renders in <figure> with its caption and alt', () => {
  const html = render({
    image: {
      kind: 'figure',
      src: 'images/x/chart.svg',
      alt: 'Visits peak on Saturday',
      caption: 'Visits per day',
    },
    audio,
    transcript,
  });

  expect(html).toContain('<figure');
  expect(html).toMatch(/<figcaption[^>]*>Visits per day<\/figcaption>/);
  expect(html).toMatch(/<img[^>]*alt="Visits peak on Saturday"/);
  // Real alt: the image stays in the accessibility tree.
  expect(html).toMatch(/<img(?![^>]*aria-hidden)[^>]*>/);
  expect(html.indexOf('<figure')).toBeLessThan(html.indexOf('<audio'));
});

test('audio alone renders the player and toggle, no image', () => {
  const html = render({ audio, transcript });

  expect(html).not.toContain('<img');
  expect(html).toContain('<audio');
  expect(html).toContain('<details');
});

test('an image without audio renders no player and no toggle', () => {
  const html = render({
    image: { kind: 'figure', src: 'images/x/chart.svg', alt: 'A chart' },
  });

  expect(html).not.toContain('<audio');
  expect(html).not.toContain('<details');
});

test('the transcript sits closed behind a summary carrying both labels', () => {
  const html = render({ audio, transcript });

  expect(html).toMatch(/<details(?![^>]*\bopen\b)[^>]*>/);
  const summary = /<summary[^>]*>([\s\S]*?)<\/summary>/.exec(html)?.[1] ?? '';
  expect(summary).toContain('Show transcript');
  expect(summary).toContain('Hide transcript');
  // Icons repeat the words, so they stay out of the accessible name.
  const icons = summary.match(/<svg[^>]*>/g) ?? [];
  expect(icons).toHaveLength(2);
  icons.forEach((icon) => expect(icon).toContain('aria-hidden="true"'));
  // The text is in the static page, after the summary.
  expect(html.indexOf('Bonjour, je suis Claire.')).toBeGreaterThan(html.indexOf('</summary>'));
});
```

- [ ] **Step 2: Run them — expect FAIL**

Run: `bun run test src/lo/blocks/MediaPanel.test.tsx`
Expected: FAIL — cannot resolve `./MediaPanel`.

- [ ] **Step 3: Write the component**

```tsx
/**
 * MediaPanel — one media group: an image, a long audio player and its transcript.
 * Used inside a tab today; a standalone media block can render it unchanged.
 *
 * TWO LAYOUTS, picked by the image's kind (spec §1). A `portrait` sits beside the
 * player once this group's own container is `@md` wide, and stacks above it below
 * that — a container query, because a tab panel inside a card is narrower than the
 * viewport. A `figure` (a chart the dialogue is about) spans the group in `<figure>`
 * with its caption, the player beneath.
 *
 * THE TRANSCRIPT TOGGLE IS NATIVE `<details>`. The summary carries BOTH labels, each
 * with its icon, and `group-open:` shows the right one, so the accessible name is
 * always the visible label. No React state: it works before hydration, the prerender
 * equals the first client render, and the browser announces expanded/collapsed.
 *
 * The player is `AudioClip`'s native variant inside `.rich-text-player`, the same
 * element a rich-text audio player renders, so the two look identical.
 *
 * Spec: docs/specs/2026-10-07-tabs-media-design.md §4.
 */
import { Eye, EyeOff } from 'lucide-react';
import { AudioClip } from '@/components/audio/AudioClip';
import { FOCUS_OUTLINE } from '@/components/shell/focus-outline';
import { resolveLabel } from '@/config/ui-strings';
import { resolveAsset } from '@/lib/assets';
import { cn } from '@/lib/utils';
import { RichTextEntries } from '../rich-text/RichTextEntries';
import type { RichTextEntry } from '../rich-text/rich-text-nodes';
import type { Media, MediaAudio, MediaImage } from './media-schema';

/** The summary, styled as an outlined button; full width when narrow. */
const SUMMARY_CLASSES = [
  'inline-flex w-full cursor-pointer list-none items-center justify-center gap-2',
  'rounded-md border-2 border-primary px-4 py-2 font-semibold text-foreground',
  'hover:bg-primary/10 [&::-webkit-details-marker]:hidden @md:w-auto',
  FOCUS_OUTLINE,
].join(' ');

function MediaImg({ image, className }: { image: MediaImage; className: string }) {
  return (
    <img
      src={resolveAsset(image.src)}
      alt={image.alt}
      // An empty alt is the author saying "decoration": out of the tree entirely.
      aria-hidden={image.alt === '' ? true : undefined}
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
}

function Transcript({ entries }: { entries: readonly RichTextEntry[] }) {
  return (
    <details className="group">
      <summary className={SUMMARY_CLASSES}>
        <span className="inline-flex items-center gap-2 group-open:hidden">
          <Eye aria-hidden="true" className="size-4" />
          {resolveLabel('showTranscript')}
        </span>
        <span className="hidden items-center gap-2 group-open:inline-flex">
          <EyeOff aria-hidden="true" className="size-4" />
          {resolveLabel('hideTranscript')}
        </span>
      </summary>
      <div className="mt-3 space-y-3 border-s-4 border-primary ps-4">
        <RichTextEntries entries={entries} paragraphClassName="text-foreground" />
      </div>
    </details>
  );
}

function Listening({
  audio,
  transcript,
}: {
  audio: MediaAudio;
  transcript: readonly RichTextEntry[];
}) {
  return (
    <div className="space-y-3">
      <div className="rich-text-player">
        <AudioClip soundFile={audio.src} listenText={audio.label ?? ''} />
      </div>
      <Transcript entries={transcript} />
    </div>
  );
}

export function MediaPanel({ media, className }: { media: Media; className?: string }) {
  const { image, audio, transcript } = media;
  // The schema pairs audio with a transcript; the types cannot, so check both.
  const listening =
    audio !== undefined && transcript !== undefined ? (
      <Listening audio={audio} transcript={transcript} />
    ) : null;

  if (image?.kind === 'portrait') {
    return (
      <div className={cn('@container', className)}>
        <div className="grid gap-4 @md:grid-cols-3 @md:items-center">
          <MediaImg image={image} className="h-auto w-full max-w-48 rounded-lg @md:max-w-none" />
          <div className="@md:col-span-2">{listening}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('@container space-y-4', className)}>
      {image === undefined ? null : (
        <figure className="space-y-2">
          <MediaImg image={image} className="h-auto w-full rounded-lg border border-border" />
          {image.caption === undefined ? null : (
            <figcaption className="text-sm text-muted-foreground">{image.caption}</figcaption>
          )}
        </figure>
      )}
      {listening}
    </div>
  );
}
```

- [ ] **Step 4: Run them — expect PASS**

Run: `bun run test src/lo/blocks/MediaPanel.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 5: Lint the new file**

Run: `bun run lint`
Expected: no errors (jsx-a11y included).

- [ ] **Step 6: Commit**

```bash
git add src/lo/blocks/MediaPanel.tsx src/lo/blocks/MediaPanel.test.tsx
git commit -m "feat(blocks): MediaPanel — portrait or figure, player, transcript toggle"
```

---

### Task 4: Media in a tab

**Files:**

- Modify: `src/lo/blocks/tabs-block-schema.ts`
- Modify: `src/lo/blocks/TabsBlock.tsx`
- Test: `src/lo/blocks/tabs-block.test.tsx`

- [ ] **Step 1: Write the failing tests** (append to `tabs-block.test.tsx`)

```tsx
const withMedia = {
  ...three,
  tabs: [
    {
      ...three.tabs[0],
      media: { audio: { src: 'audio/lo-00-example/placeholder.m4a' }, transcript: ['Said.'] },
    },
    three.tabs[1],
  ],
};

test('a tab may carry media; a bad media group is reported under the tab', () => {
  expect(TabsBlockContentSchema.safeParse(withMedia).success).toBe(true);

  const result = TabsBlockContentSchema.safeParse({
    ...withMedia,
    tabs: [{ ...withMedia.tabs[0], media: { audio: { src: 'a.m4a' } } }, three.tabs[1]],
  });
  if (result.success) throw new Error('expected a validation failure');
  expect(result.error.issues[0]?.path).toEqual(['tabs', 0, 'media', 'transcript']);
});

test('a panel runs instruction box, then media, then text', () => {
  const html = renderTabs(withMedia);
  const panel = html.split(/<[a-z]+[^>]*role="tabpanel"/)[1] ?? '';

  const instructions = panel.indexOf(three.tabs[0].instructions);
  const media = panel.indexOf('<audio');
  const text = panel.indexOf(three.tabs[0].text[0]);
  expect(instructions).toBeGreaterThan(-1);
  expect(media).toBeGreaterThan(instructions);
  expect(text).toBeGreaterThan(media);
});

test('a tab without media renders no player', () => {
  const html = renderTabs(three);

  expect(html).not.toContain('<audio');
  expect(html).not.toContain('<details');
});
```

- [ ] **Step 2: Run them — expect FAIL**

Run: `bun run test src/lo/blocks/tabs-block.test.tsx`
Expected: FAIL — the strict `TabSchema` rejects the unknown key `media`.

- [ ] **Step 3: Add `media` to the tab schema**

In `src/lo/blocks/tabs-block-schema.ts`, add the import:

```ts
import { MediaSchema } from './media-schema';
```

Add to the header comment, after the `text` paragraph:

```ts
 * `media` is OPTIONAL: an image and/or a long audio player with its transcript,
 * rendered after the instruction box and before the text. Its rules live in
 * `media-schema.ts` (spec docs/specs/2026-10-07-tabs-media-design.md §3).
```

In `TabSchema`, between `instructions` and `text`:

```ts
  /** Optional image and/or audio with transcript, after the instructions. */
  media: MediaSchema.optional(),
```

- [ ] **Step 4: Render it in the panel**

In `src/lo/blocks/TabsBlock.tsx`, add the import:

```ts
import { MediaPanel } from './MediaPanel';
```

Replace the `InstructionsCallout` line inside `TabsContent` with:

```tsx
{
  /* The accordions' instruction box, first in every panel. */
}
<InstructionsCallout className="mt-0 mb-3">{tab.instructions}</InstructionsCallout>;
{
  tab.media === undefined ? null : <MediaPanel media={tab.media} className="mb-4" />;
}
```

(The existing comment line above `InstructionsCallout` stays exactly once.)

- [ ] **Step 5: Run them — expect PASS**

Run: `bun run test src/lo/blocks/tabs-block.test.tsx`
Expected: PASS, all tests.

- [ ] **Step 6: Commit**

```bash
git add src/lo/blocks/tabs-block-schema.ts src/lo/blocks/TabsBlock.tsx src/lo/blocks/tabs-block.test.tsx
git commit -m "feat(blocks): a tab can hold media after its instruction box"
```

---

### Task 5: Placeholder images

**Files:**

- Create: `public/images/lo-00-example/04-tabs/speaker.svg`
- Create: `public/images/lo-00-example/04-tabs/chart.svg`

- [ ] **Step 1: Write the portrait**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <!--
    speaker.svg — placeholder portrait for the example tabs block (tab B,
    lo-00-example/blocks/04-tabs). Authors replace it with a photo of the speaker.
    Hex literals are deliberate HERE, as in hero.svg: an <img> is a separate document
    and cannot read the page's CSS tokens.
  -->
  <rect width="400" height="400" fill="#e6eef2" />
  <circle cx="200" cy="155" r="70" fill="#8aa4b4" />
  <path d="M70 400c0-80 58-140 130-140s130 60 130 140z" fill="#8aa4b4" />
</svg>
```

- [ ] **Step 2: Write the chart**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
  <!--
    chart.svg — placeholder bar chart for the example tabs block (tab C,
    lo-00-example/blocks/04-tabs): café visits per day, peaking on Saturday. The alt
    text and caption in block.json carry its meaning. Hex literals are deliberate
    HERE, as in hero.svg: an <img> cannot read the page's CSS tokens.
  -->
  <rect width="800" height="450" fill="#ffffff" />
  <g fill="#1f4e6b">
    <rect x="70" y="250" width="70" height="150" />
    <rect x="170" y="230" width="70" height="170" />
    <rect x="270" y="210" width="70" height="190" />
    <rect x="370" y="190" width="70" height="210" />
    <rect x="470" y="140" width="70" height="260" />
    <rect x="570" y="60" width="70" height="340" />
    <rect x="670" y="170" width="70" height="230" />
  </g>
  <line x1="50" y1="400" x2="760" y2="400" stroke="#333333" stroke-width="2" />
  <g fill="#333333" font-family="sans-serif" font-size="22" text-anchor="middle">
    <text x="105" y="430">Mon</text>
    <text x="205" y="430">Tue</text>
    <text x="305" y="430">Wed</text>
    <text x="405" y="430">Thu</text>
    <text x="505" y="430">Fri</text>
    <text x="605" y="430">Sat</text>
    <text x="705" y="430">Sun</text>
  </g>
</svg>
```

- [ ] **Step 3: Commit**

```bash
git add public/images/lo-00-example/04-tabs
git commit -m "feat(example): placeholder portrait and chart for the tabs block"
```

---

### Task 6: The example demos every layout

**Files:**

- Modify: `lo-config/lo-00-example/blocks/04-tabs/block.json`
- Test: `src/lo/blocks/tabs-block.test.tsx`

- [ ] **Step 1: Write the failing test** (append to `tabs-block.test.tsx`)

Add to the imports at the top:

```ts
import { readFileSync } from 'node:fs';
```

Then:

```tsx
test('the example tabs block demos every media layout, tabs A to D', () => {
  const json: unknown = JSON.parse(
    readFileSync('lo-config/lo-00-example/blocks/04-tabs/block.json', 'utf8'),
  );
  const { content } = json as { content: unknown };
  const { tabs } = TabsBlockContentSchema.parse(content);

  expect(tabs.map((tab) => tab.label)).toEqual([
    'Placeholder tab A',
    'Placeholder tab B',
    'Placeholder tab C',
    'Placeholder tab D',
  ]);
  expect(tabs[0]?.media).toBeUndefined();
  expect(tabs[1]?.media?.image?.kind).toBe('portrait');
  expect(tabs[2]?.media?.image?.kind).toBe('figure');
  expect(tabs[2]?.media?.image?.caption).toBeDefined();
  expect(tabs[3]?.media?.image).toBeUndefined();
  expect(tabs[3]?.media?.audio).toBeDefined();
});
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `bun run test src/lo/blocks/tabs-block.test.tsx`
Expected: FAIL — labels are still "Placeholder form A…C".

- [ ] **Step 3: Rewrite the example** (full file)

```json
{
  "type": "tabs",
  "presentation": "plain",
  "content": {
    "label": "Placeholder tabs",
    "intro": [
      "Placeholder tabs. Each tab below is one entry in <em>blocks/04-tabs/block.json</em>; click a tab, or use the arrow keys, to switch. Tabs B to D show the media layouts."
    ],
    "tabs": [
      {
        "label": "Placeholder tab A",
        "instructions": "Placeholder instructions for tab A — tell the learner what to do here, e.g. read the examples and play the clip.",
        "text": [
          "Placeholder: the <strong>informal</strong> form — friends, family, children. <span data-audio=\"audio/lo-00-example/placeholder.m4a\" data-audio-label=\"Play the placeholder clip\"></span>",
          "A second placeholder paragraph in the same tab. No media here: text only."
        ]
      },
      {
        "label": "Placeholder tab B",
        "instructions": "Placeholder instructions for tab B — look at the speaker, play the recording, then open the transcript to check what you heard.",
        "media": {
          "image": {
            "kind": "portrait",
            "src": "images/lo-00-example/04-tabs/speaker.svg",
            "alt": ""
          },
          "audio": {
            "src": "audio/lo-00-example/placeholder.m4a",
            "label": "Listen to the placeholder speaker"
          },
          "transcript": [
            "Placeholder transcript, line one: what the speaker says.",
            "Placeholder transcript, line two, with <em>emphasis</em> where the speaker stresses a word."
          ]
        },
        "text": [
          "A portrait sits beside the player on a wide screen and above it on a phone. Its alt is empty because the transcript carries the speaker's words."
        ]
      },
      {
        "label": "Placeholder tab C",
        "instructions": "Placeholder instructions for tab C — study the chart, play the discussion, then open the transcript.",
        "media": {
          "image": {
            "kind": "figure",
            "src": "images/lo-00-example/04-tabs/chart.svg",
            "alt": "Bar chart of café visits per day: they rise through the week and peak on Saturday.",
            "caption": "Placeholder figure: café visits per day, one week."
          },
          "audio": {
            "src": "audio/lo-00-example/placeholder.m4a",
            "label": "Listen to the discussion of the chart"
          },
          "transcript": [
            "Placeholder transcript: two speakers discuss the chart — visits climb from Monday and peak on Saturday."
          ]
        },
        "text": [
          "A figure spans the panel with its caption, the player below. A tab still takes everything a grammar block does, popup links included: <a class=\"modal-link\" href=\"#content\" data-modal-target=\"example-popup\">open the example popup</a>."
        ]
      },
      {
        "label": "Placeholder tab D",
        "instructions": "Placeholder instructions for tab D — play the recording, then open the transcript.",
        "media": {
          "audio": {
            "src": "audio/lo-00-example/placeholder.m4a",
            "label": "Listen to the placeholder recording"
          },
          "transcript": ["Placeholder transcript for an audio-only tab: no image at all."]
        },
        "text": ["Audio only: the player and the transcript toggle, nothing else."]
      }
    ]
  }
}
```

- [ ] **Step 4: Run the tests and guards — expect PASS**

Run: `bun run test src/lo/blocks/tabs-block.test.tsx && bun run guards`
Expected: PASS. Guard d finds the two new SVGs (key `src`); a typo in a path fails here.

- [ ] **Step 5: Commit**

```bash
git add lo-config/lo-00-example/blocks/04-tabs/block.json src/lo/blocks/tabs-block.test.tsx
git commit -m "feat(example): tabs A–D demo portrait, figure and audio-only media"
```

---

### Task 7: Gate, budget, built-site check

- [ ] **Step 1: Full gate**

```bash
bun run format && bun run lint && bun run lint:css && bun run test && bun run build
```

Expected: all green.

- [ ] **Step 2: Measure** (plain build, never `DEBUG=1`)

```bash
for f in dist/assets/main-*.js dist/assets/main-*.css; do printf '%s %s\n' "$f" "$(gzip -c "$f" | wc -c)"; done
```

**Stop and report to the maintainer** if JS ≥ 110 kB or CSS ≥ 18 kB. Do not commit
past the line.

- [ ] **Step 3: Built site, by hand** (`bun run preview`, the in-app browser)

At 320 · 768 · 1024 · 1440, light and dark, on the example LO's Grammar section:

- Tab B: portrait beside the player when wide, above it when narrow; no sideways scroll at 320.
- Tab C: chart full width, caption under it, player below.
- Tab D: player and toggle only.
- Toggle: Tab reaches the summary; Enter and Space open and close it; the label and
  icon flip; focus outline visible in both themes.
- Caption (`text-muted-foreground`) ≥ 4.5:1 on the panel's `bg-card` in both themes.
- axe: no violations on the page.
- `BASE_URL=/course/ bun run build && bun run preview`: images and audio still load.

---

### Task 8: Docs

**Files:**

- Modify: `CONTRIBUTING.md` (Tabs block section)
- Modify: `public/llms.txt` (Content blocks)
- Modify: `docs/TOOLING.md` (budget table + a bullet)
- Modify: `docs/process/TODO.md` (§F)

Re-read each file immediately before editing it (Prettier reflows markdown).

- [ ] **Step 1: CONTRIBUTING.md** — after the bullet "Each tab's `text` takes what a
      grammar block's `text` takes…", add:

```md
- A tab may add `media`, shown after its instructions: an `image`
  (`"kind": "portrait"` beside the player, or `"figure"` full width with an optional
  `caption`), an `audio` player (`src`, optional `label`) and its `transcript` (rich
  text, behind a Show/Hide transcript toggle). Image, audio or both; audio needs a
  transcript; every image needs `alt` (`""` only on a decorative portrait). Tabs B–D
  in `lo-00-example` show each layout.
```

And change the closing line's parenthesis from "(callouts, media, exercises in a tab)"
to "(callouts and exercises in a tab)", adding the media spec link:
`Media: [`docs/specs/2026-10-07-tabs-media-design.md`](docs/specs/2026-10-07-tabs-media-design.md).`

- [ ] **Step 2: public/llms.txt** — replace "whose panels hold rich text;" with
      "whose panels hold rich text and optional media (an image, an audio player and a
      transcript in a native `<details>` toggle);".

- [ ] **Step 3: docs/TOOLING.md** — set the table's measured column and headroom to
      the Task 7 numbers, and add a bullet above "CSS 17.98 → 17.48 kB": "**Tab media
      (2026-10-07):** JS <baseline> → <after> kB, CSS <baseline> → <after> kB (spec
      `docs/specs/2026-10-07-tabs-media-design.md`)." — with the real measured
      numbers from Tasks 0 and 7 in place of the angle brackets.

- [ ] **Step 4: docs/process/TODO.md §F** — mark the F2 media entry done:
      "**F2a — media in a tab. DONE 2026-10-07** (`feat/tabs-media`). Plan:
      `2026-10-07-tabs-media-plan.md`." Leave callout and exercise-by-ref open under
      F2, and correct the Budget line's headroom to the Task 7 numbers. Add a row to
      "Done recently".

- [ ] **Step 5: Gate and commit**

```bash
bun run format && bun run lint && bun run lint:css && bun run test && bun run build
git add CONTRIBUTING.md public/llms.txt docs/TOOLING.md docs/process/TODO.md
git commit -m "docs: tab media — authoring, llms.txt, budget, TODO"
```

- [ ] **Step 6: Ask the maintainer before merging to `main` and pushing.**
