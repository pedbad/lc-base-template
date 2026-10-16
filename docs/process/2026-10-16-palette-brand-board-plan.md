# Palette brand board (E19) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the debug sandbox's flat Colour grids with a brand board — a
proportion bar, a card per primitive with live HEX/RGB and a contrast verdict, and each
semantic role shown in use — as designed in
[`2026-10-16-palette-brand-board-design.md`](../specs/2026-10-16-palette-brand-board-design.md).

**Architecture:** The catalog (`sandbox-catalog.ts`) stays names-only and gains a
plain name, a job, a partner and an optional share per primitive. A small store reads
every token's colour from the page after hydration (a hidden probe resolves `var()`, a
1×1 canvas turns any colour syntax into sRGB bytes) and re-reads on theme and preset
changes; `useSyncExternalStore` returns `null` on the server and during hydration, so
the prerender shows "—". Pure colour maths lives apart from the DOM so Vitest (node
environment, no jsdom) tests it directly.

**Tech Stack:** React 19, TypeScript strict, Tailwind v4 classes, Vitest
(`renderToStaticMarkup`, node env), lucide-react icons already listed in
`src/sandbox/app-assets.ts`.

**Deviation from the spec, decided while planning:** spec §6 says the hook is tested
"jsdom, canvas stubbed". This repo's Vitest runs in the **node** environment and adds a
DOM library only for a real need (`vite.config.ts`, `test.environment`). So the logic
moves into `live-colours.ts` with its page access injected, tested with stubs and a
plain `EventTarget`; `useLiveColours.ts` is a thin wrapper. Task 9 updates the spec.

**Rules every task obeys** (AGENTS.md): no hex literal in shipped `.ts/.tsx` (guard f
— tests may hold them); no raw px on spacing/sizing; tests beside the code;
`bun run test`, never `bun test`; one concern per commit; Conventional Commits with the
`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` trailer.

---

## File structure

| File                                             | Responsibility                                                   |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| `src/sandbox/palette/colour-math.ts` (new)       | pure: bytes → HEX/RGB text, WCAG luminance, ratio, verdict       |
| `src/sandbox/palette/token-value.ts` (new)       | `var(--token)` helper and why inline `style` is used             |
| `src/sandbox/palette/live-colours.ts` (new)      | read colours through an injected reader; the change subscription |
| `src/sandbox/palette/useLiveColours.ts` (new)    | the browser reader and the React hook                            |
| `src/sandbox/palette/ContrastBadge.tsx` (new)    | verdict chip + ratio, or "—"                                     |
| `src/sandbox/palette/PaletteAtAGlance.tsx` (new) | ① the proportion bar and its legend                              |
| `src/sandbox/palette/ColourCard.tsx` (new)       | ② one primitive's card                                           |
| `src/sandbox/palette/in-use-specimens.tsx` (new) | ③ the six specimen drawings, decorative                          |
| `src/sandbox/palette/ColourInUse.tsx` (new)      | ③ one panel per role group, specimen + token fold                |
| `src/sandbox/sandbox-catalog.ts` (modify)        | primitive names/jobs/partners/shares; specimen kind per group    |
| `src/sandbox/PaletteSection.tsx` (rewrite)       | the section shell: intro, three parts, one live read             |
| `DESIGNER.md`, `docs/process/TODO.md`, the spec  | docs                                                             |

---

### Task 1: Colour maths

**Files:**

- Create: `src/sandbox/palette/colour-math.ts`
- Test: `src/sandbox/palette/colour-math.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
/**
 * colour-math.test.ts — the arithmetic behind the brand board's values and badges
 * (§E19). Pure, so every boundary is pinned here rather than in a browser.
 */
import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  formatRatio,
  relativeLuminance,
  toHex,
  toRgbText,
  verdictFor,
} from './colour-math';

const WHITE = { r: 255, g: 255, b: 255 };
const BLACK = { r: 0, g: 0, b: 0 };

describe('colour text', () => {
  it('writes HEX in upper case with two digits a channel', () => {
    expect(toHex({ r: 142, g: 232, b: 216 })).toBe('#8EE8D8');
    expect(toHex({ r: 1, g: 2, b: 3 })).toBe('#010203');
  });

  it('writes RGB as three plain numbers', () => {
    expect(toRgbText({ r: 142, g: 232, b: 216 })).toBe('RGB 142 232 216');
  });
});

describe('WCAG contrast', () => {
  it('gives black 0 and white 1 for luminance', () => {
    expect(relativeLuminance(BLACK)).toBe(0);
    expect(relativeLuminance(WHITE)).toBeCloseTo(1, 10);
  });

  it('gives 21 for white on black, either way round, and 1 for a colour on itself', () => {
    expect(contrastRatio(WHITE, BLACK)).toBeCloseTo(21, 10);
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 10);
    expect(contrastRatio(WHITE, WHITE)).toBe(1);
  });

  // #767676 on white is the textbook "just passes AA" grey, 4.54:1.
  it('puts the classic AA grey just over 4.5 on white', () => {
    const ratio = contrastRatio({ r: 118, g: 118, b: 118 }, WHITE);
    expect(ratio).toBeGreaterThan(4.5);
    expect(ratio).toBeLessThan(4.6);
  });
});

describe('verdicts', () => {
  it.each([
    [21, 'AAA'],
    [7, 'AAA'],
    [6.99, 'AA'],
    [4.5, 'AA'],
    [4.49, 'AA large'],
    [3, 'AA large'],
    [2.99, 'Decorative only'],
    [1, 'Decorative only'],
  ] as const)('%s:1 is %s', (ratio, verdict) => {
    expect(verdictFor(ratio)).toBe(verdict);
  });

  // Rounding up would print 4.5 for a pair that fails AA.
  it('prints the ratio to one decimal, rounded down', () => {
    expect(formatRatio(4.49)).toBe('4.4');
    expect(formatRatio(21)).toBe('21.0');
    expect(formatRatio(8.76)).toBe('8.7');
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `bun run test src/sandbox/palette/colour-math.test.ts`
Expected: FAIL — `Failed to resolve import "./colour-math"`.

- [ ] **Step 3: Write the implementation**

```ts
/**
 * colour-math.ts — pure colour arithmetic for the sandbox's brand board (§E19): sRGB
 * bytes to the text a client reads (HEX, RGB), and the WCAG 2.2 contrast between two
 * colours with its verdict. No DOM and no values: the bytes come from live-colours.ts,
 * read off the page, so this file cannot hold a stale colour.
 */

/** One colour as sRGB bytes, 0–255 a channel. */
export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** WCAG 2.2 levels, for normal text; "AA large" is ≥ 18.66px bold or 24px. */
export type Verdict = 'AAA' | 'AA' | 'AA large' | 'Decorative only';

const AAA_RATIO = 7;
const AA_RATIO = 4.5;
const AA_LARGE_RATIO = 3;

const byteHex = (byte: number) => byte.toString(16).padStart(2, '0').toUpperCase();

export function toHex({ r, g, b }: Rgb): string {
  return `#${byteHex(r)}${byteHex(g)}${byteHex(b)}`;
}

export function toRgbText({ r, g, b }: Rgb): string {
  return `RGB ${r} ${g} ${b}`;
}

/** sRGB byte → linear light, the WCAG 2.2 formula. */
function linear(byte: number): number {
  const channel = byte / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance, 0 for black to 1 for white. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** Contrast ratio, 1 to 21, the same whichever colour is the text. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
  const darker = Math.min(relativeLuminance(a), relativeLuminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

export function verdictFor(ratio: number): Verdict {
  if (ratio >= AAA_RATIO) return 'AAA';
  if (ratio >= AA_RATIO) return 'AA';
  if (ratio >= AA_LARGE_RATIO) return 'AA large';
  return 'Decorative only';
}

/** One decimal, rounded DOWN: a 4.49 pair must never read as 4.5 and seem to pass. */
export function formatRatio(ratio: number): string {
  return (Math.floor(ratio * 10) / 10).toFixed(1);
}
```

- [ ] **Step 4: Run it and see it pass**

Run: `bun run test src/sandbox/palette/colour-math.test.ts`
Expected: PASS, 14 tests.

- [ ] **Step 5: Commit**

```bash
git add src/sandbox/palette/colour-math.ts src/sandbox/palette/colour-math.test.ts
git commit -m "feat(sandbox): colour maths for the brand board (E19)

HEX and RGB text from sRGB bytes, WCAG 2.2 luminance and contrast, the
verdict levels, and a ratio printed rounded down so a failing pair never
reads as a pass.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Reading colours live, and knowing when to read again

**Files:**

- Create: `src/sandbox/palette/live-colours.ts`
- Test: `src/sandbox/palette/live-colours.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
/**
 * live-colours.test.ts — the store behind the brand board's live values (§E19). The
 * page is injected (a reader and the change sources), so this runs in Vitest's node
 * environment with stubs and a plain EventTarget; useLiveColours.ts supplies the real
 * browser pieces.
 */
import { describe, expect, it } from 'vitest';
import { PRESET_CHANGE_EVENT } from '../preset-choice';
import {
  createColourStore,
  readColours,
  type ChangeSources,
  type ColourReader,
} from './live-colours';
import type { Rgb } from './colour-math';

/** A reader over a table the test can change, as a theme switch changes the page. */
function tableReader(table: Map<string, Rgb>): ColourReader {
  return {
    resolve: (css) => css,
    toBytes: (resolved) => table.get(resolved) ?? null,
  };
}

function stubSources() {
  const win = new EventTarget();
  let onRootClass: (() => void) | null = null;
  const sources: ChangeSources = {
    win,
    observeRootClass: (onChange) => {
      onRootClass = onChange;
      return () => {
        onRootClass = null;
      };
    },
  };
  return {
    win,
    sources,
    flipTheme: () => onRootClass?.(),
    isObserving: () => onRootClass !== null,
  };
}

const BLUE = { r: 142, g: 232, b: 216 };
const DARK = { r: 19, g: 56, b: 68 };

describe('readColours', () => {
  it('reads each token through var() and leaves out what it cannot read', () => {
    const reader = tableReader(new Map([['var(--cam-blue)', BLUE]]));
    const colours = readColours(['--cam-blue', '--missing'], reader);
    expect([...colours]).toEqual([['--cam-blue', BLUE]]);
  });
});

describe('createColourStore', () => {
  it('returns the same snapshot until something changes', () => {
    const { sources } = stubSources();
    const store = createColourStore(
      ['--cam-blue'],
      tableReader(new Map([['var(--cam-blue)', BLUE]])),
      sources,
    );
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it('reads again on a theme flip, a preset change and a storage event', () => {
    const table = new Map([['var(--primary)', BLUE]]);
    const { win, sources, flipTheme } = stubSources();
    const store = createColourStore(['--primary'], tableReader(table), sources);
    let notified = 0;
    store.subscribe(() => {
      notified += 1;
    });
    expect(store.getSnapshot().get('--primary')).toEqual(BLUE);

    table.set('var(--primary)', DARK);
    flipTheme();
    expect(store.getSnapshot().get('--primary')).toEqual(DARK);

    win.dispatchEvent(new Event(PRESET_CHANGE_EVENT));
    win.dispatchEvent(new Event('storage'));
    expect(notified).toBe(3);
  });

  it('stops listening when unsubscribed', () => {
    const { win, sources, isObserving } = stubSources();
    const store = createColourStore(['--primary'], tableReader(new Map()), sources);
    let notified = 0;
    const unsubscribe = store.subscribe(() => {
      notified += 1;
    });
    unsubscribe();
    win.dispatchEvent(new Event(PRESET_CHANGE_EVENT));
    expect(notified).toBe(0);
    expect(isObserving()).toBe(false);
  });

  // A browser that gives no 2D canvas: the board still renders, its values stay "—".
  it('holds no colours when there is no reader', () => {
    const { sources } = stubSources();
    expect(createColourStore(['--primary'], null, sources).getSnapshot().size).toBe(0);
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `bun run test src/sandbox/palette/live-colours.test.ts`
Expected: FAIL — `Failed to resolve import "./live-colours"`.

- [ ] **Step 3: Write the implementation**

```ts
/**
 * live-colours.ts — the brand board's live values (§E19). The catalog holds token
 * NAMES only; the colours are read off the page after hydration, so a value shown here
 * is what the browser paints right now, through every `var()` and `color-mix()` in
 * tokens.css, under the current theme and preview preset. Nothing can go stale.
 *
 * The page is INJECTED — a reader and the change sources — so Vitest's node
 * environment tests all of this with stubs. useLiveColours.ts supplies the browser's.
 *
 * A store for useSyncExternalStore: `getSnapshot` returns the same Map until a change
 * source fires, so React re-renders once per theme or preset change, not per call.
 */
import { PRESET_CHANGE_EVENT } from '../preset-choice';
import type { Rgb } from './colour-math';

/** How a colour is read: resolve a CSS colour on the page, then turn it into bytes. */
export interface ColourReader {
  /** `var(--x)` → the computed colour string, e.g. `rgb(142, 232, 216)` or `oklab(…)`. */
  readonly resolve: (cssColour: string) => string;
  /** A computed colour string → sRGB bytes, or null when it cannot be read. */
  readonly toBytes: (resolved: string) => Rgb | null;
}

/** What can change a colour: a preset or storage event on `win`, a class on `<html>`. */
export interface ChangeSources {
  readonly win: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;
  /** Calls `onChange` when `<html>`'s class changes (the theme); returns a stop. */
  readonly observeRootClass: (onChange: () => void) => () => void;
}

/** Token name → its colour now. A token the page cannot read is absent. */
export type LiveColours = ReadonlyMap<string, Rgb>;

export interface ColourStore {
  readonly subscribe: (onChange: () => void) => () => void;
  readonly getSnapshot: () => LiveColours;
}

const NO_COLOURS: LiveColours = new Map();

export function readColours(tokens: readonly string[], reader: ColourReader): LiveColours {
  return new Map(
    tokens.flatMap((token) => {
      const rgb = reader.toBytes(reader.resolve(`var(${token})`));
      return rgb ? [[token, rgb] as const] : [];
    }),
  );
}

export function createColourStore(
  tokens: readonly string[],
  reader: ColourReader | null,
  sources: ChangeSources,
): ColourStore {
  const read = () => (reader ? readColours(tokens, reader) : NO_COLOURS);
  let snapshot: LiveColours | null = null;
  return {
    subscribe(onChange) {
      const refresh = () => {
        snapshot = read();
        onChange();
      };
      sources.win.addEventListener(PRESET_CHANGE_EVENT, refresh);
      sources.win.addEventListener('storage', refresh);
      const stopObserving = sources.observeRootClass(refresh);
      return () => {
        sources.win.removeEventListener(PRESET_CHANGE_EVENT, refresh);
        sources.win.removeEventListener('storage', refresh);
        stopObserving();
      };
    },
    getSnapshot() {
      snapshot ??= read();
      return snapshot;
    },
  };
}
```

- [ ] **Step 4: Run it and see it pass**

Run: `bun run test src/sandbox/palette/live-colours.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/sandbox/palette/live-colours.ts src/sandbox/palette/live-colours.test.ts
git commit -m "feat(sandbox): a store that reads token colours off the page (E19)

The catalog keeps names only; this reads each token's colour through an
injected reader and reads again on a theme flip, a preset change or a
storage event. One cached snapshot per change, for useSyncExternalStore.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: The browser reader and the hook

No unit test: every line here touches `document`, `window` or a canvas, which the node
test environment does not have, and `src/sandbox/**` is outside the coverage bars.
Task 8's static render proves the server path ("—"), and Task 10 checks the browser path
by hand.

**Files:**

- Create: `src/sandbox/palette/useLiveColours.ts`

- [ ] **Step 1: Write it**

```ts
/**
 * useLiveColours — the brand board's live colours, for React (§E19). live-colours.ts
 * holds the logic; this file supplies the browser's pieces and the hook.
 *
 * READING A COLOUR. A hidden probe `<span>` takes `color: var(--token)`; its computed
 * colour is whatever the browser resolved (hex, `color-mix()`, `oklch()` all arrive as
 * a colour string). A 1×1 canvas painted with that string turns any syntax into sRGB
 * bytes, so there is no CSS colour parser to write. Alpha is dropped: the board names
 * colours, and no token it shows is translucent.
 *
 * SERVER-SAFE. `getServerSnapshot` is null, and the store is built only when `window`
 * exists, so the prerender and the hydration pass render "—" and the first client
 * render equals the prerendered markup (AGENTS.md hard constraint 4). Nothing touches
 * `window` or `document` at module scope.
 */
import { useMemo, useSyncExternalStore } from 'react';
import {
  createColourStore,
  type ChangeSources,
  type ColourReader,
  type LiveColours,
} from './live-colours';

/** One reader for the page's life, so a re-render never adds a second probe. */
let browserReader: ColourReader | null | undefined;

function createBrowserReader(doc: Document): ColourReader | null {
  const canvas = doc.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  const probe = doc.createElement('span');
  probe.hidden = true;
  probe.dataset.slot = 'colour-probe';
  doc.body.append(probe);
  return {
    resolve(cssColour) {
      probe.style.color = cssColour;
      return getComputedStyle(probe).color;
    },
    toBytes(resolved) {
      if (!resolved) return null;
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = resolved;
      context.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data;
      return { r, g, b };
    },
  };
}

function pageReader(): ColourReader | null {
  browserReader ??= createBrowserReader(document);
  return browserReader;
}

function pageSources(): ChangeSources {
  return {
    win: window,
    observeRootClass(onChange) {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    },
  };
}

const noSubscription = () => () => {};
const noColours = (): LiveColours | null => null;

/** Each token's colour now, or null before hydration (render "—" then). */
export function useLiveColours(tokens: readonly string[]): LiveColours | null {
  const key = tokens.join(' ');
  const store = useMemo(
    () =>
      typeof window === 'undefined'
        ? null
        : createColourStore(key.split(' '), pageReader(), pageSources()),
    [key],
  );
  return useSyncExternalStore(
    store?.subscribe ?? noSubscription,
    store?.getSnapshot ?? noColours,
    noColours,
  );
}
```

- [ ] **Step 2: Type-check and lint it**

Run: `bunx tsc -b && bunx eslint src/sandbox/palette/useLiveColours.ts`
Expected: no output from either (`tsc -b` is the type-check `bun run build` runs).

- [ ] **Step 3: Commit**

```bash
git add src/sandbox/palette/useLiveColours.ts
git commit -m "feat(sandbox): read live colours in the browser, null before hydration (E19)

A hidden probe resolves var() to a computed colour and a 1x1 canvas turns
it into sRGB bytes, whatever syntax tokens.css used. The hook returns null
on the server and while hydrating, so the prerender stays equal to the
first client render.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: The catalog learns names, jobs, partners and shares

**Files:**

- Modify: `src/sandbox/sandbox-catalog.ts` (the `PrimitiveGroup`, `SemanticGroup` and
  `StripGroup` interfaces; `PRIMITIVE_SWATCHES`; a `specimen` on each semantic and strip
  group)
- Modify: `src/sandbox/sandbox-catalog.test.ts`
- Modify: `src/sandbox/PaletteSection.tsx:71-84` (keep it compiling until Task 8)

- [ ] **Step 1: Write the failing tests**

In `sandbox-catalog.test.ts`, change the two lines that read primitives:

```ts
const primitives = PRIMITIVE_SWATCHES.flatMap((group) => group.colours);
const primitiveNames = primitives.map((colour) => colour.token);
```

and add, after the `primitive swatches` describe block:

```ts
// §E19: the brand board shows each primitive to a client, so each needs a plain name,
// a job and a partner (the colour it pairs with for the "Aa" and the contrast badge).
describe('primitive colours as a client reads them', () => {
  it('each has a name and a one-sentence job', () => {
    const incomplete = primitives.filter((c) => !c.name.trim() || !/^[A-Z].*\.$/.test(c.job));
    expect(incomplete.map((c) => c.token)).toEqual([]);
  });

  it('names are unique', () => {
    const names = primitives.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('each partner is another primitive palette.css declares', () => {
    const bad = primitives.filter((c) => c.partner === c.token || !paletteNames.has(c.partner));
    expect(bad.map((c) => c.token)).toEqual([]);
  });

  it('shares are positive, and the bar carries the brand', () => {
    const shared = primitives.filter((c) => c.share !== undefined);
    expect(shared.filter((c) => !((c.share ?? 0) > 0))).toEqual([]);
    expect(shared.map((c) => c.token)).toEqual(
      expect.arrayContaining(['--paper', '--slate-4', '--cam-blue', '--cam-dark-blue']),
    );
  });
});

describe('colour in use', () => {
  it('draws each semantic group and each strip as a different specimen', () => {
    const kinds = [...SEMANTIC_SWATCHES, ...SWATCH_STRIPS].map((group) => group.specimen);
    expect(new Set(kinds).size).toBe(kinds.length);
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `bun run test src/sandbox/sandbox-catalog.test.ts`
Expected: FAIL — TypeScript/Vitest reports `group.colours` is undefined (`Cannot read
properties of undefined (reading 'map')`) and `specimen` is missing.

- [ ] **Step 3: Change the catalog**

Replace the `PrimitiveGroup` interface with:

```ts
/** One primitive as the brand board shows it (§E19). Names only, never a value. */
export interface PrimitiveColour {
  readonly token: string;
  /** What a client calls it: "Cambridge Blue", not `--cam-blue`. */
  readonly name: string;
  /** Its job in one plain sentence. */
  readonly job: string;
  /** The primitive it pairs with: the swatch's "Aa" and the contrast badge use it. */
  readonly partner: string;
  /**
   * Its share of the course's visual weight, for the "at a glance" bar. A design
   * judgement, tuned by eye; a primitive without one is not in the bar.
   */
  readonly share?: number;
}

/** A group of primitive colours — Layer 1, the only place real values live. */
export interface PrimitiveGroup {
  readonly title: string;
  readonly note: string;
  readonly colours: readonly PrimitiveColour[];
}

/** How the brand board draws a group of semantic tokens in use (§E19). */
export type SpecimenKind = 'surfaces' | 'actions' | 'states' | 'sidebar' | 'lines' | 'chart';
```

Add `readonly specimen: SpecimenKind;` to both `SemanticGroup` and `StripGroup`.

Replace `PRIMITIVE_SWATCHES` with:

```ts
export const PRIMITIVE_SWATCHES: readonly PrimitiveGroup[] = [
  {
    title: 'Core — the Cambridge Blue family',
    note: 'The brand. Cambridge Blue leads; Dark Blue carries text and the main buttons.',
    colours: [
      {
        token: '--cam-blue',
        name: 'Cambridge Blue',
        job: 'The prominent brand colour.',
        partner: '--cam-dark-blue',
        share: 16,
      },
      {
        token: '--cam-light-blue',
        name: 'Cambridge Light Blue',
        job: 'A soft brand tint for highlights.',
        partner: '--cam-dark-blue',
      },
      {
        token: '--cam-warm-blue',
        name: 'Cambridge Warm Blue',
        job: 'A brighter brand blue for details.',
        partner: '--slate-4',
        share: 6,
      },
      {
        token: '--cam-dark-blue',
        name: 'Cambridge Dark Blue',
        job: 'The accent, and the colour of the main buttons.',
        partner: '--white',
        share: 10,
      },
    ],
  },
  {
    title: 'Neutrals — Cambridge Slate and paper',
    note: 'Most of every page. Text is Slate 4, never pure black; the page ground is Paper.',
    colours: [
      {
        token: '--paper',
        name: 'Paper',
        job: 'The page ground, off-white to spare dyslexic readers glare.',
        partner: '--slate-4',
        share: 40,
      },
      {
        token: '--white',
        name: 'White',
        job: 'Cards, so they lift off the paper.',
        partner: '--slate-4',
      },
      { token: '--slate-1', name: 'Slate 1', job: 'The lightest surface.', partner: '--slate-4' },
      { token: '--slate-2', name: 'Slate 2', job: 'Lines and borders.', partner: '--slate-4' },
      { token: '--slate-3', name: 'Slate 3', job: 'Secondary text.', partner: '--white' },
      { token: '--slate-4', name: 'Slate 4', job: 'Body text.', partner: '--paper', share: 22 },
    ],
  },
  {
    title: 'Accents',
    note: 'Used alongside the core, never alone: charts, states and the odd highlight.',
    colours: [
      {
        token: '--cam-crest',
        name: 'Crest',
        job: 'A warm accent for charts.',
        partner: '--slate-4',
        share: 2,
      },
      {
        token: '--cam-cherry',
        name: 'Cherry',
        job: 'A strong accent for charts.',
        partner: '--white',
        share: 2,
      },
      {
        token: '--cam-purple',
        name: 'Purple',
        job: 'A cool accent for charts.',
        partner: '--slate-4',
        share: 2,
      },
      {
        token: '--cam-indigo',
        name: 'Indigo',
        job: 'A deep accent for charts.',
        partner: '--white',
        share: 2,
      },
      {
        token: '--cam-dark-crest',
        name: 'Dark Crest',
        job: 'Errors and wrong answers.',
        partner: '--white',
        share: 2,
      },
    ],
  },
  {
    title: 'Feedback — greens and ambers',
    note: 'Two or three of each on purpose: one per job, each passing AA where it is used.',
    colours: [
      {
        token: '--cam-green',
        name: 'Green',
        job: 'Bright green for charts.',
        partner: '--slate-4',
      },
      {
        token: '--cam-green-deep',
        name: 'Deep Green',
        job: 'Correct answers on light surfaces.',
        partner: '--white',
      },
      {
        token: '--cam-green-soft',
        name: 'Soft Green',
        job: 'Correct answers on dark surfaces.',
        partner: '--slate-4',
      },
      {
        token: '--amber-deep',
        name: 'Deep Amber',
        job: 'Warnings on light surfaces.',
        partner: '--white',
      },
      {
        token: '--amber-soft',
        name: 'Soft Amber',
        job: 'Warnings on dark surfaces.',
        partner: '--slate-4',
      },
    ],
  },
] as const;
```

Add `specimen:` to each semantic group — `Surfaces` → `'surfaces'`, `Actions` →
`'actions'`, `States` → `'states'`, `Sidebar` → `'sidebar'` — and to each strip —
`Lines and rings` → `'lines'`, `Data viz ramp` → `'chart'`.

In `PaletteSection.tsx`, change the primitive map so it still compiles:

```tsx
{
  group.colours.map(({ token }) => <PrimitiveSwatch key={token} token={token} />);
}
```

- [ ] **Step 4: Run it and see it pass**

Run: `bunx prettier --write src/sandbox/sandbox-catalog.ts && bun run test src/sandbox src/styles`
Expected: PASS, all tests (including `token-contrast.test.ts`, which reads
`SEMANTIC_SWATCHES` pairs and is unaffected).

- [ ] **Step 5: Commit**

```bash
git add src/sandbox/sandbox-catalog.ts src/sandbox/sandbox-catalog.test.ts src/sandbox/PaletteSection.tsx
git commit -m "feat(sandbox): name each primitive for a client, with a job and partner (E19)

Each primitive gains a plain name, a one-sentence job, the primitive it
pairs with, and an optional share for the at-a-glance bar; each semantic
group and strip names the specimen it is drawn as. Still names only.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Token value helper, contrast badge, the at-a-glance bar

**Files:**

- Create: `src/sandbox/palette/token-value.ts`
- Create: `src/sandbox/palette/ContrastBadge.tsx`
- Create: `src/sandbox/palette/PaletteAtAGlance.tsx`
- Test: `src/sandbox/palette/ContrastBadge.test.tsx`
- Test: `src/sandbox/palette/PaletteAtAGlance.test.tsx`

- [ ] **Step 1: Write the failing tests**

`ContrastBadge.test.tsx`:

```tsx
/**
 * ContrastBadge.test.tsx — the verdict chip on every card and token fold (§E19).
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ContrastBadge } from './ContrastBadge';

const WHITE = { r: 255, g: 255, b: 255 };

describe('ContrastBadge', () => {
  it('shows a dash until both colours are known', () => {
    const html = renderToStaticMarkup(<ContrastBadge a={WHITE} b={undefined} withName="Paper" />);
    expect(html).toContain('Contrast with Paper: —');
  });

  it('names the verdict and the ratio, rounded down', () => {
    const html = renderToStaticMarkup(
      <ContrastBadge a={WHITE} b={{ r: 0, g: 0, b: 0 }} withName="Slate 4" />,
    );
    expect(html).toMatch(/>AAA<\/span>/);
    expect(html).toContain('21.0:1 with Slate 4');
  });

  it('colours a failing verdict as muted, not as a pass', () => {
    const html = renderToStaticMarkup(<ContrastBadge a={WHITE} b={WHITE} withName="White" />);
    expect(html).toMatch(/class="[^"]*\bbg-muted\b[^"]*">Decorative only</);
  });
});
```

`PaletteAtAGlance.test.tsx`:

```tsx
/**
 * PaletteAtAGlance.test.tsx — the proportion bar (§E19): a named list a screen reader
 * hears as "name, percent", one item per primitive with a share, painted from var().
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PaletteAtAGlance } from './PaletteAtAGlance';

const html = renderToStaticMarkup(
  <PaletteAtAGlance
    colours={[
      { token: '--paper', name: 'Paper', job: 'Ground.', partner: '--slate-4', share: 3 },
      { token: '--slate-4', name: 'Slate 4', job: 'Text.', partner: '--paper', share: 1 },
      { token: '--white', name: 'White', job: 'Cards.', partner: '--slate-4' },
    ]}
  />,
);

describe('PaletteAtAGlance', () => {
  it('is a named list with one item per primitive that has a share', () => {
    const list = /<ul[^>]*aria-label="([^"]+)"[^>]*>(.*?)<\/ul>/s.exec(html);
    expect(list?.[1]).toMatch(/at a glance/i);
    expect(list?.[2].match(/<li/g)).toHaveLength(2);
  });

  it('says each name and its percentage to a screen reader', () => {
    expect(html).toMatch(/class="sr-only">Paper, 75%</);
    expect(html).toMatch(/class="sr-only">Slate 4, 25%</);
    expect(html).not.toContain('White');
  });

  it('paints each segment from its token, never a value', () => {
    expect(html).toMatch(/style="[^"]*flex-grow:3;[^"]*background:var\(--paper\)/);
  });
});
```

- [ ] **Step 2: Run them and see them fail**

Run: `bun run test src/sandbox/palette`
Expected: FAIL — cannot resolve `./ContrastBadge` and `./PaletteAtAGlance`.

- [ ] **Step 3: Write the implementation**

`token-value.ts`:

```ts
/**
 * token-value.ts — `--slate-2` → `var(--slate-2)`, the only colour value the brand
 * board writes (§E19).
 *
 * INLINE `style` RATHER THAN A STYLESHEET, deliberately. The token name is DATA here
 * (sandbox-catalog.ts), so a class per token would be 40-odd near-identical rules for
 * guards f and g to police, edited every time a token is added. `var()` keeps the
 * no-raw-hex rule intact, which is what those guards protect.
 */
export const tokenValue = (token: string) => `var(${token})`;
```

`ContrastBadge.tsx`:

```tsx
/**
 * ContrastBadge — a WCAG verdict and ratio for two live colours (§E19), or a dash
 * while they are unknown (the prerender, a browser with no canvas). The chip's colour
 * says pass or not at a glance; the words say it for everyone else.
 */
import { contrastRatio, formatRatio, verdictFor, type Rgb, type Verdict } from './colour-math';

export const PLACEHOLDER = '—';

const VERDICT_CLASS: Readonly<Record<Verdict, string>> = {
  AAA: 'bg-success text-success-foreground',
  AA: 'bg-success text-success-foreground',
  'AA large': 'bg-warning text-warning-foreground',
  'Decorative only': 'bg-muted text-muted-foreground',
};

interface ContrastBadgeProps {
  readonly a: Rgb | undefined;
  readonly b: Rgb | undefined;
  /** What `b` is called, e.g. "Cambridge Dark Blue" or "its text". */
  readonly withName: string;
}

export function ContrastBadge({ a, b, withName }: ContrastBadgeProps) {
  if (!a || !b) {
    return (
      <p data-slot="contrast" className="text-xs text-muted-foreground">
        Contrast with {withName}: {PLACEHOLDER}
      </p>
    );
  }
  const ratio = contrastRatio(a, b);
  const verdict = verdictFor(ratio);
  return (
    <p data-slot="contrast" className="flex flex-wrap items-center gap-2 text-xs">
      <span className={`rounded-sm px-1.5 py-0.5 font-semibold ${VERDICT_CLASS[verdict]}`}>
        {verdict}
      </span>
      <span>
        {formatRatio(ratio)}:1 with {withName}
      </span>
    </p>
  );
}
```

`PaletteAtAGlance.tsx`:

```tsx
/**
 * PaletteAtAGlance — ① of the brand board (§E19): the palette in proportion, one
 * segment per primitive sized by its share, so a client sees how the course FEELS —
 * mostly paper and slate, Cambridge Blue prominent, accents as slivers — before any
 * single colour. Shares are catalog data, a design judgement.
 *
 * A list, not a picture: a screen reader hears "Paper, 39%" per segment. The legend
 * under the bar repeats the names for sighted readers, so it is hidden from the
 * accessibility tree to avoid reading them twice.
 */
import type { PrimitiveColour } from '../sandbox-catalog';
import { tokenValue } from './token-value';

interface PaletteAtAGlanceProps {
  readonly colours: readonly PrimitiveColour[];
}

export function PaletteAtAGlance({ colours }: PaletteAtAGlanceProps) {
  const shared = colours.filter((colour) => colour.share !== undefined);
  const total = shared.reduce((sum, colour) => sum + (colour.share ?? 0), 0);
  const percent = (colour: PrimitiveColour) => Math.round(((colour.share ?? 0) / total) * 100);
  return (
    <figure className="mt-4">
      <ul
        aria-label="The palette at a glance, by share of the page"
        className="flex h-20 overflow-hidden rounded-xl border border-border"
      >
        {shared.map((colour) => (
          <li
            key={colour.token}
            title={`${colour.name}, ${percent(colour)}%`}
            className="min-w-1"
            style={{ flexGrow: colour.share, background: tokenValue(colour.token) }}
          >
            <span className="sr-only">
              {colour.name}, {percent(colour)}%
            </span>
          </li>
        ))}
      </ul>
      <figcaption
        aria-hidden="true"
        className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"
      >
        {shared.map((colour) => (
          <span key={colour.token} className="inline-flex items-center gap-2">
            <span
              className="size-3 rounded-full border border-border"
              style={{ background: tokenValue(colour.token) }}
            />
            {colour.name} <span className="tabular-nums">{percent(colour)}%</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 4: Run them and see them pass**

Run: `bun run test src/sandbox/palette`
Expected: PASS. If the `style` regex in the bar test fails only on attribute order
(React writes `flex-grow:3;background:var(--paper)`), fix the regex, not the component.

- [ ] **Step 5: Commit**

```bash
git add src/sandbox/palette/token-value.ts src/sandbox/palette/ContrastBadge.tsx src/sandbox/palette/ContrastBadge.test.tsx src/sandbox/palette/PaletteAtAGlance.tsx src/sandbox/palette/PaletteAtAGlance.test.tsx
git commit -m "feat(sandbox): contrast badge and the palette-at-a-glance bar (E19)

The bar shows the primitives in proportion as a named list a screen reader
hears as name and percent; the badge gives a WCAG verdict and a ratio
rounded down, or a dash until both colours are read.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: The colour card

**Files:**

- Create: `src/sandbox/palette/ColourCard.tsx`
- Test: `src/sandbox/palette/ColourCard.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
/**
 * ColourCard.test.tsx — ② of the brand board (§E19): one primitive's name, job, live
 * values and contrast, with the token folded away for designers.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ColourCard } from './ColourCard';

const colour = {
  token: '--cam-blue',
  name: 'Cambridge Blue',
  job: 'The prominent brand colour.',
  partner: '--cam-dark-blue',
};
const live = new Map([
  ['--cam-blue', { r: 142, g: 232, b: 216 }],
  ['--cam-dark-blue', { r: 19, g: 56, b: 68 }],
]);

const render = (values: typeof live | null) =>
  renderToStaticMarkup(
    <ColourCard colour={colour} partnerName="Cambridge Dark Blue" live={values} />,
  );

describe('ColourCard', () => {
  it('leads with the name and the job, not the token', () => {
    const html = render(live);
    expect(html).toMatch(/<h5[^>]*>Cambridge Blue<\/h5>/);
    expect(html).toContain('The prominent brand colour.');
  });

  it('shows dashes before the colours are read', () => {
    const html = render(null);
    expect(html).toMatch(/data-slot="hex"[^>]*>—</);
    expect(html).toContain('Contrast with Cambridge Dark Blue: —');
    expect(html).not.toMatch(/#[0-9A-F]{6}/);
  });

  it('shows HEX, RGB and the verdict once they are', () => {
    const html = render(live);
    expect(html).toMatch(/data-slot="hex"[^>]*>#8EE8D8</);
    expect(html).toContain('RGB 142 232 216');
    expect(html).toMatch(/>AAA<\/span>/);
  });

  it('paints the swatch and its "Aa" from the colour and its partner, hidden from screen readers', () => {
    const swatch = /<div[^>]*aria-hidden="true"[^>]*style="([^"]*)"[^>]*>Aa<\/div>/.exec(
      render(live),
    );
    expect(swatch?.[1]).toContain('background:var(--cam-blue)');
    expect(swatch?.[1]).toContain('color:var(--cam-dark-blue)');
  });

  it('folds the token and its file into a details element', () => {
    expect(render(live)).toMatch(
      /<details[^>]*><summary[^>]*>Token<\/summary>.*<code>--cam-blue<\/code>.*src\/styles\/palette\.css/s,
    );
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `bun run test src/sandbox/palette/ColourCard.test.tsx`
Expected: FAIL — cannot resolve `./ColourCard`.

- [ ] **Step 3: Write the implementation**

```tsx
/**
 * ColourCard — ② of the brand board (§E19): one primitive as a client reads it. The
 * swatch shows "Aa" in the colour's partner; then the name, the job, the live HEX and
 * RGB, and the contrast with the partner. The token name — what a designer edits — is
 * one fold away, so a stakeholder is not handed `--cam-blue` first.
 *
 * Values are "—" until the page has been read (`live` is null in the prerender).
 */
import { FOCUS_OUTLINE } from '@/components/shell/focus-outline';
import type { PrimitiveColour } from '../sandbox-catalog';
import { toHex, toRgbText } from './colour-math';
import { ContrastBadge, PLACEHOLDER } from './ContrastBadge';
import type { LiveColours } from './live-colours';
import { tokenValue } from './token-value';

interface ColourCardProps {
  readonly colour: PrimitiveColour;
  /** The partner's plain name, for the badge ("with Cambridge Dark Blue"). */
  readonly partnerName: string;
  readonly live: LiveColours | null;
}

export function ColourCard({ colour, partnerName, live }: ColourCardProps) {
  const rgb = live?.get(colour.token);
  return (
    <li className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div
        aria-hidden="true"
        className="flex h-24 items-end border-b border-border p-3 font-heading text-3xl"
        style={{ background: tokenValue(colour.token), color: tokenValue(colour.partner) }}
      >
        Aa
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 text-sm">
        <h5 className="font-heading text-base font-semibold">{colour.name}</h5>
        <p className="text-muted-foreground">{colour.job}</p>
        <p className="font-mono text-xs tabular-nums">
          <span data-slot="hex">{rgb ? toHex(rgb) : PLACEHOLDER}</span>
          <span className="text-muted-foreground"> · {rgb ? toRgbText(rgb) : PLACEHOLDER}</span>
        </p>
        <ContrastBadge a={rgb} b={live?.get(colour.partner)} withName={partnerName} />
        <details className="mt-auto text-xs text-muted-foreground">
          <summary className={`w-fit cursor-pointer rounded-sm ${FOCUS_OUTLINE}`}>Token</summary>
          <p className="mt-1">
            <code>{colour.token}</code> in <code>src/styles/palette.css</code>
          </p>
        </details>
      </div>
    </li>
  );
}
```

- [ ] **Step 4: Run it and see it pass**

Run: `bun run test src/sandbox/palette/ColourCard.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/sandbox/palette/ColourCard.tsx src/sandbox/palette/ColourCard.test.tsx
git commit -m "feat(sandbox): a colour card with name, job, live values and contrast (E19)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Colour in use

**Files:**

- Create: `src/sandbox/palette/in-use-specimens.tsx`
- Create: `src/sandbox/palette/ColourInUse.tsx`
- Test: `src/sandbox/palette/ColourInUse.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
/**
 * ColourInUse.test.tsx — ③ of the brand board (§E19): every semantic group and strip
 * drawn as the UI it paints, with its tokens and live contrast one fold away.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SEMANTIC_SWATCHES, SWATCH_STRIPS } from '../sandbox-catalog';
import { ColourInUse } from './ColourInUse';

const html = renderToStaticMarkup(<ColourInUse live={null} />);
const groups = [...SEMANTIC_SWATCHES, ...SWATCH_STRIPS];

describe('ColourInUse', () => {
  it('has one titled panel per semantic group and strip', () => {
    for (const group of groups) {
      expect(html).toMatch(new RegExp(`<h4[^>]*>${group.title}</h4>`));
    }
    expect(html.match(/data-slot="in-use-specimen"/g)).toHaveLength(groups.length);
  });

  it('keeps every token a designer needs in a fold', () => {
    const named = [
      ...SEMANTIC_SWATCHES.flatMap((g) => g.pairs.flatMap((p) => [p.token, p.on])),
      ...SWATCH_STRIPS.flatMap((g) => g.tokens),
    ];
    const folds = [...html.matchAll(/<details[^>]*>.*?<\/details>/gs)].map((m) => m[0]).join('');
    expect(named.filter((token) => !folds.includes(`<code>${token}</code>`))).toEqual([]);
  });

  it('shows a dash for every pair before the colours are read', () => {
    const pairs = SEMANTIC_SWATCHES.flatMap((g) => g.pairs).length;
    expect(html.match(/Contrast with its text: —/g)).toHaveLength(pairs);
  });

  // Decorative samples, like the preset picker's: nothing inside may take focus.
  it('hides each specimen from screen readers, with nothing focusable inside', () => {
    const specimens = [...html.matchAll(/<div[^>]*data-slot="in-use-specimen"[^>]*>/g)];
    expect(specimens.every((m) => m[0].includes('aria-hidden="true"'))).toBe(true);
    // The folds' <summary> is the only interactive element the panels hold.
    expect(html).not.toMatch(/<button|<a |<input|tabindex/);
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `bun run test src/sandbox/palette/ColourInUse.test.tsx`
Expected: FAIL — cannot resolve `./ColourInUse`.

- [ ] **Step 3: Write the specimens**

`in-use-specimens.tsx`:

```tsx
/**
 * in-use-specimens — the drawings in ③ of the brand board (§E19), one per
 * `SpecimenKind`. Each paints the catalog's tokens as the UI they colour: nested
 * surfaces, buttons, answer feedback, a sidebar, inputs and rings, a chart. All of it
 * is decorative — spans and divs, no control — and the caller hides it from screen
 * readers; the token fold beside it carries the same facts as text.
 */
import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, CircleX, Info, Volume2 } from 'lucide-react';
// A separate type import: app-assets.test.ts reads every name inside
// `import { … } from 'lucide-react'` as an icon, `type LucideIcon` included.
import type { LucideIcon } from 'lucide-react';
import type { SemanticPair } from '../sandbox-catalog';
import { tokenValue } from './token-value';

const paint = (pair: SemanticPair) => ({
  background: tokenValue(pair.token),
  color: tokenValue(pair.on),
});

/** Page ⊃ card ⊃ popover: each pair nested in the one before, as the course stacks them. */
export function SurfacesSpecimen({ pairs }: { readonly pairs: readonly SemanticPair[] }) {
  return pairs.reduceRight<ReactNode>(
    (inner, pair) => (
      <div className="rounded-lg border border-border p-3 text-sm" style={paint(pair)}>
        <p>{pair.use}</p>
        {inner && <div className="mt-2">{inner}</div>}
      </div>
    ),
    null,
  );
}

/** Each action pair as a button-shaped label, the first also as an icon-only one. */
export function ActionsSpecimen({ pairs }: { readonly pairs: readonly SemanticPair[] }) {
  const [first] = pairs;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {pairs.map((pair) => (
        <span
          key={pair.token}
          className="rounded-lg px-3 py-1.5 text-sm font-medium"
          style={paint(pair)}
        >
          {pair.use}
        </span>
      ))}
      {first && (
        <span
          className="inline-flex size-8 items-center justify-center rounded-lg"
          style={paint(first)}
        >
          <Volume2 className="size-4" />
        </span>
      )}
    </div>
  );
}

const STATE_ICONS: Readonly<Record<string, LucideIcon>> = {
  '--success': CircleCheck,
  '--destructive': CircleX,
  '--warning': CircleAlert,
};

/** The feedback a learner sees, one chip per state. */
export function StatesSpecimen({ pairs }: { readonly pairs: readonly SemanticPair[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {pairs.map((pair) => {
        const Icon = STATE_ICONS[pair.token] ?? Info;
        return (
          <span
            key={pair.token}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm"
            style={paint(pair)}
          >
            <Icon className="size-4" />
            {pair.use}
          </span>
        );
      })}
    </div>
  );
}

/** The sidebar surface holding its action and its hover row. */
export function SidebarSpecimen({ pairs }: { readonly pairs: readonly SemanticPair[] }) {
  const [surface, ...rows] = pairs;
  if (!surface) return null;
  return (
    <div
      className="flex max-w-60 flex-col gap-1 rounded-lg border border-border p-2 text-sm"
      style={paint(surface)}
    >
      <span className="px-2 py-1">{surface.use}</span>
      {rows.map((pair) => (
        <span key={pair.token} className="rounded-md px-2 py-1" style={paint(pair)}>
          {pair.use}
        </span>
      ))}
    </div>
  );
}

/** Lines as bordered fields, rings as a focus outline: what each token draws. */
export function LinesSpecimen({ tokens }: { readonly tokens: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {tokens.map((token) =>
        token.endsWith('ring') ? (
          <span
            key={token}
            className="h-9 w-32 rounded-md border border-border bg-card outline-2 outline-offset-2 outline-solid"
            style={{ outlineColor: tokenValue(token) }}
          />
        ) : (
          <span
            key={token}
            className="h-9 w-32 rounded-md border-2 bg-card"
            style={{ borderColor: tokenValue(token) }}
          />
        ),
      )}
    </div>
  );
}

/** Bar heights for the mini chart, cycling: a chart shape, not data. */
const BAR_HEIGHTS = ['h-8', 'h-14', 'h-10', 'h-16', 'h-12'] as const;

/** The five chart slots, in slot order, as a small bar chart. */
export function ChartSpecimen({ tokens }: { readonly tokens: readonly string[] }) {
  return (
    <div className="flex h-16 items-end gap-2">
      {tokens.map((token, index) => (
        <span
          key={token}
          className={`w-8 rounded-t-sm ${BAR_HEIGHTS[index % BAR_HEIGHTS.length]}`}
          style={{ background: tokenValue(token) }}
        />
      ))}
    </div>
  );
}
```

If `Info` or `Volume2` is not in `src/sandbox/app-assets.ts`'s `APP_ICONS`, the
app-assets test fails; both are listed today (checked 2026-10-16), as are the three
Circle icons. `outline-solid` and `outline-2` are Tailwind v4 utilities; if `bun run
lint:css` or the build rejects one, use `outline` + `outline-2`.

- [ ] **Step 4: Write `ColourInUse.tsx`**

```tsx
/**
 * ColourInUse — ③ of the brand board (§E19): the semantic layer shown as the UI it
 * paints, one panel per group in the catalog, so a preset or theme change shows its
 * real effect. Each panel's fold lists its tokens.css names — and, for a pair, the live
 * contrast between surface and text — so everything the old pair grid showed a
 * designer is still here.
 */
import type { ReactNode } from 'react';
import { FOCUS_OUTLINE } from '@/components/shell/focus-outline';
import {
  SEMANTIC_SWATCHES,
  SWATCH_STRIPS,
  type SemanticGroup,
  type StripGroup,
} from '../sandbox-catalog';
import { toHex } from './colour-math';
import { ContrastBadge, PLACEHOLDER } from './ContrastBadge';
import {
  ActionsSpecimen,
  ChartSpecimen,
  LinesSpecimen,
  SidebarSpecimen,
  StatesSpecimen,
  SurfacesSpecimen,
} from './in-use-specimens';
import type { LiveColours } from './live-colours';

interface ColourInUseProps {
  readonly live: LiveColours | null;
}

const SUMMARY_CLASS = `w-fit cursor-pointer rounded-sm ${FOCUS_OUTLINE}`;

function PairSpecimen({ group }: { readonly group: SemanticGroup }) {
  switch (group.specimen) {
    case 'surfaces':
      return <SurfacesSpecimen pairs={group.pairs} />;
    case 'actions':
      return <ActionsSpecimen pairs={group.pairs} />;
    case 'states':
      return <StatesSpecimen pairs={group.pairs} />;
    default:
      return <SidebarSpecimen pairs={group.pairs} />;
  }
}

function Panel({
  title,
  note,
  children,
}: {
  readonly title: string;
  readonly note: string;
  readonly children: ReactNode;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div>
        <h4 className="font-heading text-base font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">{note}</p>
      </div>
      {children}
    </article>
  );
}

function PairPanel({
  group,
  live,
}: {
  readonly group: SemanticGroup;
  readonly live: LiveColours | null;
}) {
  return (
    <Panel title={group.title} note={group.note}>
      <div aria-hidden="true" data-slot="in-use-specimen">
        <PairSpecimen group={group} />
      </div>
      <details className="text-xs text-muted-foreground">
        <summary className={SUMMARY_CLASS}>Tokens</summary>
        <ul className="mt-2 flex flex-col gap-2">
          {group.pairs.map((pair) => (
            <li key={pair.token}>
              <code>{pair.token}</code> with <code>{pair.on}</code> — {pair.use}
              <ContrastBadge a={live?.get(pair.token)} b={live?.get(pair.on)} withName="its text" />
            </li>
          ))}
        </ul>
      </details>
    </Panel>
  );
}

function StripPanel({
  group,
  live,
}: {
  readonly group: StripGroup;
  readonly live: LiveColours | null;
}) {
  return (
    <Panel title={group.title} note={group.note}>
      <div aria-hidden="true" data-slot="in-use-specimen">
        {group.specimen === 'chart' ? (
          <ChartSpecimen tokens={group.tokens} />
        ) : (
          <LinesSpecimen tokens={group.tokens} />
        )}
      </div>
      <details className="text-xs text-muted-foreground">
        <summary className={SUMMARY_CLASS}>Tokens</summary>
        <ul className="mt-2 flex flex-col gap-1 font-mono">
          {group.tokens.map((token) => {
            const rgb = live?.get(token);
            return (
              <li key={token}>
                <code>{token}</code> {rgb ? toHex(rgb) : PLACEHOLDER}
              </li>
            );
          })}
        </ul>
      </details>
    </Panel>
  );
}

export function ColourInUse({ live }: ColourInUseProps) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      {SEMANTIC_SWATCHES.map((group) => (
        <PairPanel key={group.title} group={group} live={live} />
      ))}
      {SWATCH_STRIPS.map((group) => (
        <StripPanel key={group.title} group={group} live={live} />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run it and see it pass**

Run: `bunx prettier --write src/sandbox/palette && bun run test src/sandbox`
Expected: PASS, including `app-assets.test.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/sandbox/palette/in-use-specimens.tsx src/sandbox/palette/ColourInUse.tsx src/sandbox/palette/ColourInUse.test.tsx
git commit -m "feat(sandbox): show each semantic role as the UI it paints (E19)

Surfaces nested as the course stacks them, buttons, answer feedback, a
sidebar, inputs and rings, and a mini chart. Decorative and hidden from
screen readers; each panel's fold lists its tokens and the live contrast.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: The section shell

**Files:**

- Rewrite: `src/sandbox/PaletteSection.tsx`
- Test: `src/sandbox/PaletteSection.test.tsx` (new)

- [ ] **Step 1: Write the failing test**

```tsx
/**
 * PaletteSection.test.tsx — the Colour section as a brand board (§E19), as the
 * prerender writes it: three parts in order, and no colour value before hydration.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import PaletteSection from './PaletteSection';
import { PRIMITIVE_SWATCHES } from './sandbox-catalog';

const html = renderToStaticMarkup(<PaletteSection />);

describe('PaletteSection', () => {
  it('keeps its id and heading, so the jump menu still lands on it', () => {
    expect(html).toMatch(/<section[^>]*id="palette"/);
    expect(html).toMatch(/<h2[^>]*id="palette-heading"[^>]*>Colour<\/h2>/);
  });

  it('reads at a glance, then the colours, then the colours in use', () => {
    const parts = [...html.matchAll(/<h3[^>]*>([^<]*)<\/h3>/g)].map((m) => m[1]);
    expect(parts).toEqual(['At a glance', 'The colours', 'In use']);
  });

  it('has a card for every primitive', () => {
    const count = PRIMITIVE_SWATCHES.flatMap((g) => g.colours).length;
    expect(html.match(/<h5/g)).toHaveLength(count);
  });

  // Hard constraint 4: the prerender cannot know a colour, so it must not print one.
  it('prints no colour value before hydration', () => {
    expect(html).not.toMatch(/#[0-9A-F]{6}\b|RGB \d/);
    expect(html).toContain('—');
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `bun run test src/sandbox/PaletteSection.test.tsx`
Expected: FAIL — the `<h3>` list is `['Layer 1 — primitives (', …]` and there are no
`<h5>` cards.

- [ ] **Step 3: Rewrite `PaletteSection.tsx`**

```tsx
/**
 * PaletteSection — the sandbox's Colour section, as a brand board (§E19; it began as
 * buildlist 16's swatch grids). Written for a client first and a designer second:
 *
 *   ① At a glance — the palette in proportion (PaletteAtAGlance)
 *   ② The colours — a card per primitive: name, job, live values, contrast (ColourCard)
 *   ③ In use      — each semantic role as the UI it paints (ColourInUse)
 *
 * Token names, which a designer edits, sit in each card's and panel's fold.
 *
 * NAMES HERE, VALUES FROM THE PAGE. The catalog holds names only; one `useLiveColours`
 * call reads every colour the board shows after hydration, and again on a theme or
 * preset change, so nothing on it can be stale. Before that — the prerender — every
 * value reads "—".
 */
import { ColourCard } from './palette/ColourCard';
import { ColourInUse } from './palette/ColourInUse';
import { PaletteAtAGlance } from './palette/PaletteAtAGlance';
import { useLiveColours } from './palette/useLiveColours';
import { PRIMITIVE_SWATCHES, SEMANTIC_SWATCHES, SWATCH_STRIPS } from './sandbox-catalog';

const PRIMITIVES = PRIMITIVE_SWATCHES.flatMap((group) => group.colours);
const NAME_BY_TOKEN = new Map(PRIMITIVES.map((colour) => [colour.token, colour.name]));

/** Every token the board reads, once each. */
const LIVE_TOKENS = [
  ...new Set([
    ...PRIMITIVES.map((colour) => colour.token),
    ...SEMANTIC_SWATCHES.flatMap((group) => group.pairs.flatMap((pair) => [pair.token, pair.on])),
    ...SWATCH_STRIPS.flatMap((group) => group.tokens),
  ]),
];

const PART_HEADING = 'mt-10 font-heading text-xl font-semibold';

export default function PaletteSection() {
  const live = useLiveColours(LIVE_TOKENS);
  return (
    <section aria-labelledby="palette-heading" className="scroll-mt-8" id="palette">
      <h2 id="palette-heading" className="font-heading text-2xl font-bold">
        Colour
      </h2>
      <p className="mt-2 max-w-(--measure) text-muted-foreground">
        The course is mostly calm paper and slate, with Cambridge Blue as the brand and a few
        accents for feedback and charts. Every value, contrast check and sample below is read from
        the page as it is now, so the theme switch and the preset picker change all of it.
      </p>

      <h3 className={PART_HEADING}>At a glance</h3>
      <PaletteAtAGlance colours={PRIMITIVES} />

      <h3 className={PART_HEADING}>The colours</h3>
      {PRIMITIVE_SWATCHES.map((group) => (
        <article key={group.title} className="mt-6">
          <h4 className="font-heading text-lg font-semibold">{group.title}</h4>
          <p className="max-w-(--measure) text-sm text-muted-foreground">{group.note}</p>
          <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
            {group.colours.map((colour) => (
              <ColourCard
                key={colour.token}
                colour={colour}
                partnerName={NAME_BY_TOKEN.get(colour.partner) ?? colour.partner}
                live={live}
              />
            ))}
          </ul>
        </article>
      ))}

      <h3 className={PART_HEADING}>In use</h3>
      <p className="mt-2 max-w-(--measure) text-sm text-muted-foreground">
        What lessons actually paint with. These are the meanings in{' '}
        <code>src/styles/tokens.css</code>; each one points at a colour above, and a preset changes
        which.
      </p>
      <ColourInUse live={live} />
    </section>
  );
}
```

- [ ] **Step 4: Run it and see it pass**

Run: `bunx prettier --write src/sandbox && bun run test src/sandbox src/styles src/guards`
Expected: PASS, all. Guard f must stay green (no hex in shipped files).

- [ ] **Step 5: Commit**

```bash
git add src/sandbox/PaletteSection.tsx src/sandbox/PaletteSection.test.tsx
git commit -m "feat(sandbox): the Colour section as a brand board (E19)

At a glance, a card per colour with live values and contrast, and each
role in use, in that order. One live read for the whole section; the
prerender prints a dash, never a value.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Docs

**Files:**

- Modify: `DESIGNER.md` ("How to read the sandbox": the **Colour** table row and the
  "Layer 1 is what you edit" bullet)
- Modify: `docs/specs/2026-10-16-palette-brand-board-design.md` (status line, §5, §6)
- Modify: `docs/process/TODO.md` (§E19 entry and the log table)

Re-read each file immediately before editing it (AGENTS.md: Prettier reflows tables).

- [ ] **Step 1: DESIGNER.md**

Colour row, "What it shows" cell → `The palette at a glance, a card per colour with
live values and contrast, and each colour in use`; "Read it when…" cell → `you need a
colour's value or token name, or want to check a re-skin`.

Replace the "Layer 1 is what you edit" bullet with:

```markdown
- **The cards are what you edit; "In use" is what you check.** Each card is one
  primitive in `palette.css` — its name, its job, its live value and its contrast
  with its partner. "In use" below them is the result: the semantic tokens in
  `tokens.css` drawn as the buttons, feedback and surfaces they paint. Token names
  are one click away, in each card's **Token** fold and each panel's **Tokens**
  fold. Change a primitive, save, and every value and badge updates in front of you.
```

- [ ] **Step 2: The spec**

Status line → `**Status:** built 2026-10-16 (<first and last commit of Tasks 1–8>)`.
In §5 add rows for `live-colours.ts` (the store, page injected),
`useLiveColours.ts` (browser reader and hook), `token-value.ts`, `ContrastBadge.tsx`,
`in-use-specimens.tsx`, and remove the single `useLiveColours.ts` "canvas read" row's
wording. In §3's table, the "Accent, muted" row → `button-shaped labels beside the other actions`
(the actions specimen draws every action pair the same way). In §6 replace the `useLiveColours.test.ts (jsdom, canvas stubbed)` bullet
with: `live-colours.test.ts (node env, injected reader and an EventTarget — the repo
adds no DOM library): reads on first snapshot, re-reads on a class change on <html>,
on PRESET_CHANGE_EVENT and on storage, stops on unsubscribe, holds nothing without a
reader. useLiveColours.ts is browser glue, checked by hand.`

- [ ] **Step 3: TODO.md**

Change `**E19 — … OPEN** (maintainer, 2026-10-16).` to `**E19 — … DONE 2026-10-16**
(<Task 8 commit>).` and append one sentence: `Checked by hand in Chromium, light and
dark, with presets C and Z; the automated browser check waits for E12c.` Add a log row
under the 2026-10-16 rows:

```markdown
| 2026-10-16 | `<Task 8 commit>` | **brand board** — sandbox Colour section: proportion bar, a card per colour with live HEX/RGB and contrast, each role in use (E19) |
```

- [ ] **Step 4: Format and check links**

Run: `bun run format && bun run test src/docs src/guards`
Expected: PASS (`md-links` lives in the suite).

- [ ] **Step 5: Commit**

```bash
git add DESIGNER.md docs/specs/2026-10-16-palette-brand-board-design.md docs/process/TODO.md
git commit -m "docs: describe the brand board and mark E19 done

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

(Fill the commit hashes in Steps 2–3 from `git log --oneline -8` before committing.)

---

### Task 10: Check it by hand and run the gate

- [ ] **Step 1: Browser, light**

`preview_start` the `dev` configuration, open `/debug-sandbox.html#palette` at
1440×900. Confirm: the bar shows ~8 segments with Paper widest; every card shows a HEX
(Cambridge Blue `#8EE8D8`) and a badge; "In use" shows six panels; opening a **Token**
fold shows `--cam-blue`. No console errors (`read_console_messages`).

- [ ] **Step 2: Browser, dark and presets**

Flip the theme switch: the "In use" panels and their fold values change; the cards'
primitives do not (they are theme-independent). Pick preset **Z · Test**: the primary
button specimen and its fold HEX change. Pick **As built** again and clear the stored
choice afterwards.

- [ ] **Step 3: Phone width**

Resize to 375×812: cards one column, the bar still one row, no horizontal scroll
(`document.documentElement.scrollWidth <= innerWidth` in `javascript_tool`).

- [ ] **Step 4: The gate**

Run: `bun run format && bun run lint && bun run lint:css && bun run test:coverage && bun run build && bun run test:e2e`
Expected: every step exits 0. Also run `DEBUG=1 bun run build` to prove the sandbox
bundle builds.

- [ ] **Step 5: Report**

Tell the maintainer what was checked and what was not (no automated browser test of
the sandbox until E12c). Do not push without being asked.
