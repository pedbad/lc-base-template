# LO Hero Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every LO page opens on a full-bleed hero banner under the sticky header. The banner holds the page's single `<h1>` on a solid token panel, over an optional decorative image, with a token-coloured band when there is no image.

**Architecture:**

- A new optional `hero: { src, alt? }` key in `lo.json` is validated by Zod and carried through `assembleLo` to `App`, then to `PageLayout`.
- A new `LoHero` component renders the banner as `<main>`'s first child, in place of the bare `<h1>`.
- `<main>` loses its column box, and a `.lo-content` wrapper takes it over for the sections.
- Styling is plain CSS in `@layer components` with one new token, `--hero-band`. There is no new dependency and nothing in it depends on the client.

**Tech Stack:** React 19, TypeScript, Zod 4, Tailwind v4 + plain CSS layers, Vitest (`bun run test` — **never** `bun test`).

**Spec:** `docs/specs/2026-10-05-lo-hero-banner-design.md`. Read it first. It records why each decision went the way it did.

**Before starting:** read `AGENTS.md`, which has the hard constraints. The ones that bite here:

- Tokens only: no raw hex outside `palette.css`, and no raw px on spacing or sizing.
- Every CSS rule goes inside `@layer`, and `!important` is never used.
- Prerendered markup must equal the first client render.
- Every URL goes through `resolveAsset()`.

Run the full gate before every commit:

```bash
bun run format && bun run lint && bun run lint:css && bun run test && bun run build
```

---

## File structure

| File                                                       | Change     | Responsibility                                               |
| ---------------------------------------------------------- | ---------- | ------------------------------------------------------------ |
| `src/config/lo-schema.ts`                                  | modify     | `LoHeroSchema` + `hero` on `LoManifestSchema`                |
| `src/config/lo-schema.test.ts`                             | modify     | hero contract tests                                          |
| `src/lo/assemble-lo.ts`                                    | modify     | carry `hero` onto `AssembledLo`                              |
| `src/lo/assemble-lo.test.ts`                               | modify     | hero carry-through tests                                     |
| `src/styles/tokens.css` + the three `tokens-variant-*.css` | modify     | `--hero-band` token (preset parity requires all four)        |
| `src/components/shell/LoHero.tsx`                          | **create** | the banner: optional image + the `<h1>` panel                |
| `src/components/shell/lo-hero.css`                         | **create** | banner layout and surfaces                                   |
| `src/components/shell/LoHero.test.tsx`                     | **create** | both variants' markup                                        |
| `src/components/shell/PageLayout.tsx`                      | modify     | render `LoHero` first in `<main>`, sections in `.lo-content` |
| `src/components/shell/PageLayout.test.tsx`                 | modify     | frame position tests                                         |
| `src/App.tsx`                                              | modify     | pass `lo.hero` through                                       |
| `public/images/lo-00-example/hero.svg`                     | **create** | wide decorative placeholder                                  |
| `lo-config/lo-00-example/lo.json`                          | modify     | author the example's `hero`                                  |
| `docs/specs/lo-semantic-structure.md`                      | modify     | skeleton §1                                                  |
| `CONTRIBUTING.md`                                          | modify     | authoring table: the `hero` key                              |
| `docs/process/TODO.md`                                     | modify     | §D9 row, measured bundle figures, done row                   |

---

### Task 1: The `hero` config contract

**Files:**

- Modify: `src/config/lo-schema.ts` (the `LoManifestSchema` object, around line 232–249)
- Test: `src/config/lo-schema.test.ts` (insert after the card-image tests, around line 64)

- [ ] **Step 1: Write the failing tests.** Insert after the `rejects a blank image path` test in `src/config/lo-schema.test.ts`:

```ts
// The page hero (spec 2026-10-05 §3): optional; src required inside it; alt optional
// and absent-means-decorative; strict, so a misspelt key fails at load.
test('lo-schema: manifest accepts an optional hero with src only', () => {
  const parsed = LoManifestSchema.parse({
    title: 'Salutations',
    hero: { src: 'images/lo-01/hero.webp' },
    sections: oneSection,
  });
  expect(parsed.hero).toEqual({ src: 'images/lo-01/hero.webp' });
});

test('lo-schema: manifest accepts a hero with an authored alt', () => {
  const parsed = LoManifestSchema.parse({
    title: 'Salutations',
    hero: { src: 'images/lo-01/hero.webp', alt: 'A café terrace in Lyon' },
    sections: oneSection,
  });
  expect(parsed.hero?.alt).toBe('A café terrace in Lyon');
});

test('lo-schema: manifest without a hero parses, leaving it undefined', () => {
  const parsed = LoManifestSchema.parse({ title: 'Salutations', sections: oneSection });
  expect(parsed.hero).toBeUndefined();
});

test('lo-schema: manifest rejects a hero with no src', () => {
  expect(() =>
    LoManifestSchema.parse({ title: 'Salutations', hero: {}, sections: oneSection }),
  ).toThrow();
});

// Same reason as the blank card image: an empty path resolves to the page itself.
test('lo-schema: manifest rejects a blank hero src', () => {
  expect(() =>
    LoManifestSchema.parse({ title: 'Salutations', hero: { src: '' }, sections: oneSection }),
  ).toThrow();
});

// Omission already means decorative, so "" would be a second spelling of it.
test('lo-schema: manifest rejects a blank hero alt', () => {
  expect(() =>
    LoManifestSchema.parse({
      title: 'Salutations',
      hero: { src: 'images/lo-01/hero.webp', alt: '' },
      sections: oneSection,
    }),
  ).toThrow();
});

test('lo-schema: manifest rejects an unknown hero key', () => {
  expect(() =>
    LoManifestSchema.parse({
      title: 'Salutations',
      hero: { src: 'images/lo-01/hero.webp', scr: 'typo' },
      sections: oneSection,
    }),
  ).toThrow();
});
```

- [ ] **Step 2: Run them and watch them fail.**

Run: `bunx vitest run src/config/lo-schema.test.ts`
Expected: FAIL. Specifically, `accepts an optional hero with src only` fails because `parsed.hero` is `undefined` (the manifest strips the unknown key), and the three reject cases fail with "expected function to throw". The `without a hero` case passes already, which is fine.

- [ ] **Step 3: Implement.** In `src/config/lo-schema.ts`, add this directly above `export const LoManifestSchema`:

```ts
/**
 * The LO page's hero banner art (spec docs/specs/2026-10-05-lo-hero-banner-design.md §3).
 *
 * `src` is an author-relative asset path resolved through `resolveAsset()` at render,
 * like the card's `image`. Blank is rejected for the same reason: an empty path resolves
 * to the page itself.
 *
 * `alt` is optional and ABSENT MEANS DECORATIVE. The hero carries the page's <h1>, so
 * the image's default name must be empty or a screen reader reads the title twice.
 * Supply it only when the artwork says something the title does not. Blank is rejected:
 * omission already means decorative, and "" would be a second spelling of it.
 *
 * Strict, so a misspelt key (`scr`) fails at load instead of silently dropping the art.
 * `src` sits under a key guard d already collects (`ASSET_KEYS`), so a missing file
 * fails the suite with no guard change.
 */
export const LoHeroSchema = z.strictObject({
  src: z.string().min(1),
  alt: z.string().min(1).optional(),
});
export type LoHero = z.infer<typeof LoHeroSchema>;
```

Then, inside `LoManifestSchema`'s object, directly after the `image: z.string().min(1).optional(),` line:

```ts
    /**
     * Optional hero banner art for this LO's page — a wide crop, separate from the
     * card's `image` because a card crop and a banner crop rarely suit one file. Omit
     * it and the hero renders as a token-coloured band, so every LO page opens the
     * same way and no LO is blocked on artwork.
     */
    hero: LoHeroSchema.optional(),
```

- [ ] **Step 4: Run them and watch them pass.**

Run: `bunx vitest run src/config/lo-schema.test.ts`
Expected: PASS, with all tests green.

- [ ] **Step 5: Commit.**

```bash
git add src/config/lo-schema.ts src/config/lo-schema.test.ts
git commit -m "feat(config): add an optional hero to the LO manifest"
```

---

### Task 2: Carry `hero` onto `AssembledLo`

**Files:**

- Modify: `src/lo/assemble-lo.ts` (`AssembledLo` interface around line 68–76, and the return object around line 188–194)
- Test: `src/lo/assemble-lo.test.ts` (after the `omits the image key` test, around line 62)

- [ ] **Step 1: Write the failing tests.** Insert after `assembleLo: omits the image key entirely when the manifest declares none`:

```ts
test('assembleLo: carries the manifest hero through to the assembled LO', () => {
  const tree = validTree();
  const lo = assembleLo('lo-01-salutations', {
    ...tree,
    manifest: { ...(tree.manifest as object), hero: { src: 'images/lo-01/hero.webp' } },
  });

  expect(lo.hero).toEqual({ src: 'images/lo-01/hero.webp' });
});

test('assembleLo: omits the hero key entirely when the manifest declares none', () => {
  const lo = assembleLo('lo-01-salutations', validTree());

  expect('hero' in lo).toBe(false);
});
```

- [ ] **Step 2: Run them and watch the first one fail.**

Run: `bunx vitest run src/lo/assemble-lo.test.ts`
Expected: FAIL on `carries the manifest hero through` (`lo.hero` is `undefined`). The `omits` case passes already. Also expect a TypeScript complaint in the editor that `hero` does not exist on `AssembledLo`; Vitest does not type-check, and `bun run build` will.

- [ ] **Step 3: Implement.** In `src/lo/assemble-lo.ts`, extend the existing import from `@/config/lo-schema` (or add a type import if none exists) with `type LoHero`. Then add to `AssembledLo`, directly after the `image?` member:

```ts
  /** Page hero banner art; absent when the author declared none (the band renders). */
  readonly hero?: LoHero;
```

In the returned object, directly after the `...(manifest.image === undefined ? {} : { image: manifest.image }),` line:

```ts
    ...(manifest.hero === undefined ? {} : { hero: manifest.hero }),
```

- [ ] **Step 4: Run them and watch them pass, then type-check.**

Run: `bunx vitest run src/lo/assemble-lo.test.ts && bunx tsc -b --noEmit`
Expected: tests PASS, and tsc exits 0 with no output. If the repo's tsconfig rejects `-b --noEmit`, use `bun run build` instead.

- [ ] **Step 5: Commit.**

```bash
git add src/lo/assemble-lo.ts src/lo/assemble-lo.test.ts
git commit -m "feat(lo): carry the manifest hero onto the assembled LO"
```

---

### Task 3: The `--hero-band` token

**Files:**

- Modify: `src/styles/tokens.css`, `src/styles/tokens-variant-a-cambridge-blue.css`, `src/styles/tokens-variant-b-dark-blue.css`, `src/styles/tokens-variant-c-warm-blue.css`
- Test: `src/styles/token-presets.test.ts` (existing; it asserts every preset defines the same SET of custom properties as `tokens.css`)

- [ ] **Step 1: Add the token to `tokens.css` only, then watch parity fail.** In `src/styles/tokens.css`, inside the light `:root` block, directly after the `--footer-crest-linear-mid` line, add:

```css
/* Page hero band (spec 2026-10-05 §5) — the banner's surface when an LO has no hero
       art. DERIVED from --primary, so it follows every preset and both themes with no
       .dark copy: a custom property is substituted where it is USED. The title panel
       on it is --card / --card-foreground in both variants, so the contrast verified
       for the image variant holds here too. */
--hero-band: var(--primary);
```

Run: `bunx vitest run src/styles/token-presets.test.ts`
Expected: FAIL. The three presets are reported as missing `--hero-band`. That is the parity test doing its job.

- [ ] **Step 2: Add the identical line and comment to each of the three `tokens-variant-*.css` files**, in the same position: the light `:root` block, after `--footer-crest-linear-mid`.

- [ ] **Step 3: Watch parity pass.**

Run: `bunx vitest run src/styles/token-presets.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit.**

```bash
git add src/styles/tokens.css src/styles/tokens-variant-*.css
git commit -m "feat(tokens): add --hero-band, derived from --primary in every preset"
```

---

### Task 4: The `LoHero` component

**Files:**

- Create: `src/components/shell/LoHero.tsx`
- Create: `src/components/shell/lo-hero.css`
- Test: `src/components/shell/LoHero.test.tsx`

- [ ] **Step 1: Write the failing tests.** Create `src/components/shell/LoHero.test.tsx`:

```tsx
/**
 * Tests for LoHero (spec docs/specs/2026-10-05-lo-hero-banner-design.md §4). Rendered
 * to static markup — the hero has no client-only state, so the string IS the page.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { resolveAsset } from '@/lib/assets';
import LoHero from './LoHero';

const count = (html: string, needle: RegExp): number => (html.match(needle) ?? []).length;

describe('LoHero — image variant', () => {
  const html = renderToStaticMarkup(
    <LoHero title="First Contact" hero={{ src: 'images/lo-01/hero.webp' }} />,
  );

  test('marks itself as the image variant', () => {
    expect(html).toMatch(/^<div class="lo-hero" data-variant="image"/);
  });

  test('renders one decorative <img> through resolveAsset', () => {
    expect(count(html, /<img/g)).toBe(1);
    expect(html).toContain(`src="${resolveAsset('images/lo-01/hero.webp')}"`);
    expect(html).toContain('alt=""');
  });

  test('loads the image as the LCP element: eager, high priority, async decode', () => {
    expect(html).toContain('loading="eager"');
    expect(html).toContain('fetchpriority="high"');
    expect(html).toContain('decoding="async"');
  });

  test('holds exactly one <h1> carrying the title, after the image', () => {
    expect(count(html, /<h1/g)).toBe(1);
    expect(html).toMatch(/<h1[^>]*>First Contact<\/h1>/);
    expect(html.indexOf('<img')).toBeLessThan(html.indexOf('<h1'));
  });

  test('uses an authored alt when one is given', () => {
    const withAlt = renderToStaticMarkup(
      <LoHero title="First Contact" hero={{ src: 'images/x.webp', alt: 'A café terrace' }} />,
    );
    expect(withAlt).toContain('alt="A café terrace"');
  });
});

describe('LoHero — band variant (no hero art)', () => {
  const html = renderToStaticMarkup(<LoHero title="First Contact" />);

  test('marks itself as the band variant and renders no <img>', () => {
    expect(html).toMatch(/^<div class="lo-hero" data-variant="band"/);
    expect(html).not.toContain('<img');
  });

  test('still holds exactly one <h1> carrying the title', () => {
    expect(count(html, /<h1/g)).toBe(1);
    expect(html).toMatch(/<h1[^>]*>First Contact<\/h1>/);
  });
});
```

- [ ] **Step 2: Run them and watch them fail.**

Run: `bunx vitest run src/components/shell/LoHero.test.tsx`
Expected: FAIL with "Failed to resolve import './LoHero'".

- [ ] **Step 3: Create the stylesheet** `src/components/shell/lo-hero.css`:

```css
/**
 * lo-hero.css — the LO page's hero banner (spec docs/specs/2026-10-05-lo-hero-banner-design.md §5).
 * Co-located with LoHero.tsx and imported by it, the same pattern as shell.css and
 * footer.css. Tokens only, every rule inside @layer components, no motion — so there
 * is no reduced-motion case.
 *
 * THE TITLE SITS ON A SOLID PANEL, NOT A SCRIM, deliberately. A gradient's contrast
 * depends on whatever pixels the author's art puts under it, so it can be verified for
 * one image and fail on the next. A solid --card panel's contrast is one token pair,
 * the same for every image and both variants, and is measured once per theme.
 */
@layer components {
  .lo-hero {
    position: relative;
    display: flex;
    align-items: flex-end;
    inline-size: 100%;
  }

  /* The box reserves its own height, so nothing shifts when the image arrives (CLS).
     The min-block-size keeps a wide crop from collapsing to a strip at 320–375px;
     the max stops it dominating a 1920px screen. */
  .lo-hero[data-variant='image'] {
    aspect-ratio: 16 / 5;
    min-block-size: 14rem;
    max-block-size: 28rem;
  }

  .lo-hero[data-variant='band'] {
    padding-block-start: 4rem;
    background-color: var(--hero-band);
  }

  .lo-hero-image {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  /* The content column (Tailwind's max-w-5xl + px-4 = 64rem + 1rem), so the panel's
     leading edge lines up with every <h2> below it. */
  .lo-hero-inner {
    position: relative;
    inline-size: 100%;
    max-inline-size: 64rem;
    margin-inline: auto;
    padding-inline: 1rem;
    padding-block-end: 1.5rem;
  }

  .lo-hero-title {
    display: inline-block;
    max-inline-size: 100%;
    padding: 0.75rem 1.25rem;
    border-radius: var(--radius);
    background-color: var(--card);
    color: var(--card-foreground);
  }
}
```

- [ ] **Step 4: Create the component** `src/components/shell/LoHero.tsx`:

```tsx
/**
 * LoHero — the full-bleed banner every LO page opens on, directly under the sticky
 * header (spec docs/specs/2026-10-05-lo-hero-banner-design.md). It holds the page's
 * ONE <h1>, moved here from PageLayout, so the LO's name is announced exactly once.
 *
 * Two variants, one shape. With `hero` art: a decorative image filling a fixed-ratio
 * box, the title on a solid panel at its bottom-start corner. Without: the same panel
 * on a --hero-band surface. Every LO page therefore opens the same way and no LO is
 * blocked on artwork.
 *
 * A <div>, NOT a <header>. A <header> inside <main> is no landmark, so it would add
 * nothing for assistive technology, and it would hand guard h's header-scoped checks
 * (`nav-outside-header`) a second header to reason about. The hero introduces no
 * section and needs no landmark of its own.
 *
 * The image is alt="" unless the author supplies `hero.alt` — the <h1> already names
 * the page. alt="" alone is the repo's decorative-<img> convention; no aria-hidden.
 *
 * Nothing here reads the client: no viewport, no cookie, no effect, no useIsHydrated.
 * The prerendered markup is the final markup.
 */
import type { LoHero as LoHeroConfig } from '@/config/lo-schema';
import { resolveAsset } from '@/lib/assets';
import './lo-hero.css';

interface LoHeroProps {
  /** The LO title — rendered as the page's single <h1>. */
  title: string;
  /** Optional banner art from lo.json. Absent → the band variant. */
  hero?: LoHeroConfig;
}

export default function LoHero({ title, hero }: LoHeroProps) {
  return (
    <div className="lo-hero" data-variant={hero === undefined ? 'band' : 'image'}>
      {hero === undefined ? null : (
        <img
          className="lo-hero-image"
          src={resolveAsset(hero.src)}
          alt={hero.alt ?? ''}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      )}
      <div className="lo-hero-inner">
        {/* Type styles unchanged from the <h1> PageLayout used to render. Colour is NOT
            a utility here: utilities outrank @layer components, and the panel's colour
            pair lives in lo-hero.css so it stays one verified pair. */}
        <h1 className="lo-hero-title font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the tests and watch them pass.**

Run: `bunx vitest run src/components/shell/LoHero.test.tsx`
Expected: PASS, all 7.

If `fetchpriority="high"` is missing from the markup, React has not mapped the prop. Confirm `react-dom` is 19.x (`grep '"react-dom"' package.json`). Do NOT switch to a lowercase `fetchpriority` attribute to force it, because that trips React's unknown-prop warning.

- [ ] **Step 6: Run guards f and g against the new stylesheet.**

Run: `bun run guards && bun run lint:css`
Expected: PASS. Guard f finds no raw px on a sizing property (all lengths are rem), and guard g finds every rule inside `@layer components`.

- [ ] **Step 7: Commit.**

```bash
git add src/components/shell/LoHero.tsx src/components/shell/lo-hero.css src/components/shell/LoHero.test.tsx
git commit -m "feat(shell): add LoHero, the LO page's hero banner holding the h1"
```

---

### Task 5: Mount the hero in `PageLayout` and pass it from `App`

**Files:**

- Modify: `src/components/shell/PageLayout.tsx` (header comment lines 1–16, props lines 31–38, the `<main>` block lines 73–108)
- Modify: `src/App.tsx:30`
- Test: `src/components/shell/PageLayout.test.tsx`

- [ ] **Step 1: Write the failing tests.** Append inside the `describe('PageLayout', …)` block in `src/components/shell/PageLayout.test.tsx`:

```tsx
test('opens <main> with the hero, which holds the single <h1> (hero spec §4)', () => {
  const html = renderToStaticMarkup(<PageLayout title="Lesson" sections={sections} />);
  const main = html.slice(html.indexOf('<main'));
  expect(main).toMatch(/^<main[^>]*><div class="lo-hero"/);
  expect(html.indexOf('class="lo-hero"')).toBeLessThan(html.indexOf('<h1'));
});

test('renders every section inside .lo-content, after the hero', () => {
  const html = renderToStaticMarkup(<PageLayout title="Lesson" sections={sections} />);
  const content = html.indexOf('class="lo-content');
  expect(content).toBeGreaterThan(html.indexOf('</h1>'));
  expect(content).toBeLessThan(html.indexOf('<section'));
});

test('main no longer carries the content column box — .lo-content does', () => {
  const html = renderToStaticMarkup(<PageLayout title="Lesson" sections={sections} />);
  expect(html).not.toMatch(/<main[^>]*max-w-5xl/);
  expect(html).toMatch(/class="lo-content[^"]*max-w-5xl/);
});

test('passes hero art through: image variant when given, band when not', () => {
  const withArt = renderToStaticMarkup(
    <PageLayout title="Lesson" sections={sections} hero={{ src: 'images/h.webp' }} />,
  );
  const without = renderToStaticMarkup(<PageLayout title="Lesson" sections={sections} />);
  expect(withArt).toContain('data-variant="image"');
  expect(without).toContain('data-variant="band"');
});
```

- [ ] **Step 2: Run them and watch them fail.**

Run: `bunx vitest run src/components/shell/PageLayout.test.tsx`
Expected: the four new tests FAIL (no `lo-hero` in the markup), and every existing test still PASSES.

- [ ] **Step 3: Implement in `PageLayout.tsx`.**

Add the imports alongside the existing shell imports:

```tsx
import type { LoHero as LoHeroConfig } from '@/config/lo-schema';
import LoHero from './LoHero';
```

Add to `PageLayoutProps`, after `title`:

```tsx
  /** Optional hero banner art from lo.json; absent → the hero renders as a band. */
  hero?: LoHeroConfig;
```

Change the signature to `export default function PageLayout({ title, hero, sections, themeToggle }: PageLayoutProps) {`.

Replace the whole `<main …>…</main>` element with:

```tsx
<main id="content" tabIndex={-1} className="focus:outline-none">
  {/* Hero spec §4: the hero is <main>'s first child and holds the ONE <h1>, so a
            skip-link user lands on the title. It is full-bleed, which is why <main>
            no longer carries the column box — .lo-content below does. */}
  <LoHero title={title} hero={hero} />

  <div className="lo-content mx-auto max-w-5xl px-4 pb-8">
    {sections.map((section) => (
      <section
        key={section.id}
        id={section.id}
        aria-labelledby={headingId(section.id)}
        className="mt-12 scroll-mt-20"
      >
        <h2
          id={headingId(section.id)}
          tabIndex={-1}
          className="font-heading text-2xl font-semibold text-foreground focus:outline-none"
        >
          {section.label}
        </h2>
        <div className="mt-4">
          {section.content ?? (
            <p className="text-muted-foreground">
              Placeholder content for the {section.label} section.
            </p>
          )}
        </div>
        {/* §D · D2. Inside the <section>, after its content, so the button's
                  aria-describedby names the heading of the section it closes — five
                  identically-named buttons per page are otherwise indistinguishable.
                  It lands outside every accordion by construction, because the
                  accordions are inside `section.content`. */}
        <BackToTopButton sectionId={section.id} />
      </section>
    ))}
  </div>
</main>
```

Update the skeleton in the file's header comment so it stays true:

```
 *   <main id="content" tabindex="-1">
 *     <div class="lo-hero">…<h1>{title}</h1></div>  ← the ONE h1 (§2), in the hero
 *     <div class="lo-content">                       ← the content column
 *       <section id aria-labelledby>…<h2>…</section> ← one per section
 *     </div>
 *   </main>
```

- [ ] **Step 4: Pass the hero from `App.tsx`.** Replace line 30:

```tsx
<PageLayout title={lo.title} hero={lo.hero} sections={sections} themeToggle={<ThemeToggle />} />
```

- [ ] **Step 5: Run the shell tests, then the whole suite.**

Run: `bunx vitest run src/components/shell && bun run test`
Expected: everything PASSES, including guard h (`src/guards/semantic-dom.test.ts`), which re-renders both pages and must still find one `<h1>` inside `<main>` and an unchanged heading outline.

If guard h fails, read its message before touching anything. Per `AGENTS.md`, a guard that fires means the code is wrong, and the guard must not be weakened.

- [ ] **Step 6: Check prerender parity and the absence of a stray preload.** React 19 may emit `<link rel="preload">` for a high-priority image during server rendering. That would be markup the client never renders.

Run: `bun run build && grep -c 'rel="preload" as="image"' dist/example.html; grep -o '<div class="lo-hero"[^>]*>' dist/example.html`
Expected: a count of `0` (no image preload link injected), and one `lo-hero` opening tag with `data-variant="band"`. The example has no hero art until Task 6.

If the count is not 0, stop and report it. Whether a head preload is acceptable is a parity decision, not something to patch around.

- [ ] **Step 7: Commit.**

```bash
git add src/components/shell/PageLayout.tsx src/components/shell/PageLayout.test.tsx src/App.tsx
git commit -m "feat(shell): open every LO page on the hero, sections in .lo-content"
```

---

### Task 6: Example LO hero art, and prove guard d covers it

**Files:**

- Create: `public/images/lo-00-example/hero.svg`
- Modify: `lo-config/lo-00-example/lo.json`

Guard f only scans `.ts`/`.tsx` under `src/` (`token-integrity.ts`, around line 277), so an SVG in `public/` is outside it. Hex inside the file is correct for the same reason `lo-placeholder.svg` documents: an `<img>` is a separate document and cannot read CSS custom properties.

- [ ] **Step 1: Create `public/images/lo-00-example/hero.svg`:**

```svg
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 1600 500"
  width="1600"
  height="500"
  role="presentation"
  aria-hidden="true"
>
  <!--
    hero.svg — the example LO's hero banner art (`"hero"` in lo-00-example/lo.json).
    A wide, quiet placeholder that shows the crop and the title panel without
    pretending to be course art. Authors replace it per LO with a WebP/AVIF about
    2000px wide.

    Decorative: LoHero renders it with alt="" because the <h1> names the page.

    Hex literals are deliberate HERE, as in lo-placeholder.svg: an <img> is a separate
    document and cannot read the page's CSS custom properties. Values are copied from
    src/styles/palette.css (Cambridge Light Blue / Blue / Dark Blue) — keep them in
    step if the palette changes. The calm lower-left keeps the title panel's corner
    uncluttered.
  -->
  <defs>
    <linearGradient id="lo-hero-sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#d1f9f1" />
      <stop offset="1" stop-color="#8ee8d8" />
    </linearGradient>
  </defs>

  <rect width="1600" height="500" fill="url(#lo-hero-sky)" />

  <!-- Two speech bubbles on the right: the conversation motif of the card placeholder. -->
  <g fill="none" stroke="#133844" stroke-linecap="round" stroke-linejoin="round">
    <g opacity="0.14" stroke-width="22">
      <path d="M1004 262h196a36 36 0 0 0 36-36v-96a36 36 0 0 0-36-36h-196a36 36 0 0 0-36 36v96a36 36 0 0 0 36 36h6l-20 52 58-52" />
    </g>
    <g opacity="0.28" stroke-width="18">
      <path d="M1250 362h220a36 36 0 0 0 36-36v-112a36 36 0 0 0-36-36h-220a36 36 0 0 0-36 36v112a36 36 0 0 0 36 36h8l-18 44 50-44" />
    </g>
  </g>

  <g stroke="#00bdb6" stroke-linecap="round" stroke-width="14" opacity="0.55">
    <path d="M1264 256h164" />
    <path d="M1264 302h118" />
  </g>
</svg>
```

Before saving, open `src/styles/palette.css` and confirm the four hex values (`#d1f9f1`, `#8ee8d8`, `#133844`, `#00bdb6`) are still the current Cambridge Light Blue, Blue (both gradient ends), Dark Blue and Warm Blue. If any has changed, use the palette's value.

- [ ] **Step 2: Author the example's hero.** In `lo-config/lo-00-example/lo.json`, add directly after the `"image"` line:

```json
  "hero": { "src": "images/lo-00-example/hero.svg" },
```

- [ ] **Step 3: Run the suite.**

Run: `bun run test`
Expected: PASS. Guard d resolves `images/lo-00-example/hero.svg` on disk, and guard h now renders `example.html` with the image variant.

- [ ] **Step 4: Plant a missing file and watch guard d fail, then revert.** Temporarily edit the `lo.json` hero to `{ "src": "images/lo-00-example/nope.svg" }`.

Run: `bunx vitest run src/guards/asset-existence.test.ts`
Expected: FAIL, naming `images/lo-00-example/nope.svg` and `lo-00-example`.

Restore `"hero": { "src": "images/lo-00-example/hero.svg" }`, re-run, and expect PASS. Then `git diff lo-config/` must show only the intended `hero` line.

- [ ] **Step 5: Run the gate, including under a sub-path.**

Run: `bun run format && bun run lint && bun run lint:css && bun run test && bun run build && BASE_URL=/course/ bun run build && grep -o 'class="lo-hero-image" src="[^"]*"' dist/example.html`
Expected: everything green, and the grep prints `src="/course/images/lo-00-example/hero.svg"`. Run a plain `bun run build` afterwards so `dist/` is back at the root base.

- [ ] **Step 6: Record the bundle figures.** From the plain `bun run build` output, note the gzipped `main-*.js` and `main-*.css` sizes. Baseline before this work: JS 97.13 kB and CSS 15.69 kB. Budget: JS < 100 kB and CSS < 15 kB (`docs/TOOLING.md`, "Bundle budget"). They go into the TODO in Task 8.

- [ ] **Step 7: Commit.**

```bash
git add public/images/lo-00-example/hero.svg lo-config/lo-00-example/lo.json
git commit -m "feat(example): give the example LO placeholder hero art"
```

---

### Task 7: Verify in the browser

No files change unless something is wrong.

- [ ] **Step 1:** Start the dev server through the Browser pane's `preview_start`, using the repo's `.claude/launch.json` entry, or `bun run dev` if none exists. Open `http://localhost:5173/example.html`.

- [ ] **Step 2: Structure.** Read the page and confirm:
  - the hero is directly under the sticky header
  - one `<h1>`, inside the hero
  - Tab from the top: the skip link, then focus lands on `<main>` with the hero title first
  - the console is silent (no hydration-mismatch warning)

- [ ] **Step 3: Widths.** For each of 320, 375, 768, 1024 and 1440, set an **explicit** width with `resize_window`. Never use preset `desktop` on a hidden pane, which reads as 0 width (TODO §D2, trap 2). Then check in `javascript_tool`:

```js
({
  w: innerWidth,
  overflow: document.documentElement.scrollWidth > innerWidth,
  heroH: document.querySelector('.lo-hero').getBoundingClientRect().height,
  panelLeft: Math.round(document.querySelector('.lo-hero-title').getBoundingClientRect().left),
  h2Left: Math.round(document.querySelector('main h2').getBoundingClientRect().left),
});
```

Expected at every width:

- `overflow: false`
- `heroH` ≥ 224 (14rem)
- `panelLeft === h2Left`, meaning the title lines up with the section headings

- [ ] **Step 4: Contrast, both themes.** Read the colours by painting on a canvas. `getComputedStyle` returns `color-mix`/`oklab` unconverted (TODO §D2, trap 1):

```js
const rgb = (css) => {
  const c = document.createElement('canvas').getContext('2d');
  c.fillStyle = css;
  c.fillRect(0, 0, 1, 1);
  return [...c.getImageData(0, 0, 1, 1).data.slice(0, 3)];
};
const lum = ([r, g, b]) => {
  const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const t = getComputedStyle(document.querySelector('.lo-hero-title'));
const [a, b] = [lum(rgb(t.color)), lum(rgb(t.backgroundColor))];
((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2);
```

Expected: ≥ 4.5 in light. Toggle the theme, re-run, and expect ≥ 4.5 in dark. Record both numbers.

- [ ] **Step 5: Band variant.** Temporarily remove the `hero` line from `lo-config/lo-00-example/lo.json` and reload. Confirm:
  - `data-variant="band"`
  - no `<img>`
  - the band shows `--hero-band` in both themes
  - the panel contrast is unchanged

  Restore the line, and confirm with `git diff lo-config/` that it is empty.

- [ ] **Step 6: Screenshot** the image variant at 1440 in light and dark, and show them to the maintainer. A human should look at the result once; the numbers above do not judge the crop.

---

### Task 8: Docs, so nothing drifts

**Files:**

- Modify: `docs/specs/lo-semantic-structure.md` (§1 skeleton, the `<main>` block around line 60)
- Modify: `CONTRIBUTING.md` (the "Three `lo.json` fields" table, around lines 85–97)
- Modify: `docs/process/TODO.md` (§D header count, a new §D9 row, the "Done recently" table)
- Modify: `docs/specs/2026-10-05-lo-hero-banner-design.md` (§10's DESIGNER line, and the status line)

Re-read each doc immediately before editing it. Prettier reflows tables, so an edit written against a stale copy fails (`AGENTS.md`).

- [ ] **Step 1: `lo-semantic-structure.md` §1.** In the skeleton, replace the `<main …>` opening and its `<h1>` line with:

```html
<main id="content" tabindex="-1">
  <div class="lo-hero">
    <!-- Full-bleed hero banner (spec 2026-10-05). Optional decorative
             <img alt=""> from lo.json `hero`; without it, a --hero-band band. -->
    <h1>{LO title}</h1>
  </div>
  <div class="lo-content">
    <!-- the content column; every <section> lives in here -->
  </div>
</main>
```

Close the new `<div class="lo-content">` immediately before `</main>` in the same block. Leave the `<section>` markup between them unchanged.

- [ ] **Step 2: `CONTRIBUTING.md`.** The table heading says three fields "do double duty as that LO's card". `hero` is page-only, so do not add it to that table. Add this paragraph directly after the paragraph that ends "…drop your own file into `public/images/` and name it there.":

```markdown
`hero` is the page's banner art and is not on the card. Write it as an object,
`"hero": { "src": "images/lo-NN-slug/hero.webp" }`, using a wide crop (about 2000px across,
WebP or AVIF), separate from the card's `image`. It is decorative by default, because the
banner already carries the LO title as the page's `<h1>`. Add `"alt"` only when the art
says something the title does not, and never write `"alt": ""`, which the schema rejects.
Omit `hero` entirely and the banner renders as a plain brand-coloured band.
`lo-00-example` points at `images/lo-00-example/hero.svg`.
```

- [ ] **Step 3: Check the remaining docs the spec names, and record what you find.**

Run: `grep -n "\-\-footer\|\-\-primary" DESIGNER.md; grep -n "h1\|heading\|hero" public/llms.txt; bun run docs:tree && git diff --stat STRUCTURE.md`

Expected:

- **`DESIGNER.md`:** no hits, because it lists no component tokens (not even `--footer`). So `--hero-band` gets no entry, and it is documented where it is defined in `tokens.css`.
- **`llms.txt`:** describes pages and engines, not an LO page's opening markup, so no edit.
- **`STRUCTURE.md`:** `docs:tree` shows no diff, because it lists folders and the new files sit in existing ones.

If any expectation is wrong, update that doc instead. Then correct the spec's §10 to match reality: replace its `DESIGNER.md` bullet with "`DESIGNER.md`: no change — it lists no component tokens; `--hero-band` is documented in `tokens.css` where it is defined." Also set the spec's status line to `**Status:** shipped 2026-10-05 (see TODO §D9)`, using the actual date.

- [ ] **Step 4: `TODO.md`.**
  - Change the §D header from `2 of 8 open` to `2 of 9 open`.
  - Add a D9 entry after D8's closing paragraph. Use the real commit hashes from `git log --oneline` and the real figures from Tasks 6 and 7:

```markdown
- **D9 — the LO hero banner. DONE <date>, `<first>`…`<last>`.** Spec:
  `docs/specs/2026-10-05-lo-hero-banner-design.md`; plan:
  `docs/process/2026-10-05-lo-hero-banner-plan.md`.
  - **What shipped:** every LO page opens on a full-bleed `LoHero` under the sticky
    header, holding the page's one `<h1>` on a solid `--card` panel. The art comes from an
    optional `hero: { src, alt? }` in `lo.json`, and without it the hero is a
    `--hero-band` band.
  - **Verified:**
    - 320 · 375 · 768 · 1024 · 1440 with no overflow, and the panel's leading edge
      aligned with the `<h2>`s.
    - Title contrast <light>:1 light and <dark>:1 dark, painted on a canvas.
    - Prerender parity, with no injected image preload.
    - `BASE_URL=/course/` resolves the art, and guard d was planted and seen failing.
  - **Bundle (TOOLING "Bundle budget"):** `main-*.js` <js> kB gzipped (was 97.13) and
    CSS <css> kB (was 15.69, budget < 15).
```

- Append a "Done recently" row: `| <date> | <last hash> | **LO hero banner** — full-bleed, holds the h1, band fallback (§D9) |`.

- [ ] **Step 5: Run the gate and commit.**

Run: `bun run format && bun run lint && bun run lint:css && bun run test && bun run build`
Expected: green.

```bash
git add docs/specs/lo-semantic-structure.md CONTRIBUTING.md docs/process/TODO.md docs/specs/2026-10-05-lo-hero-banner-design.md
git commit -m "docs: record the LO hero banner in the skeleton, authoring guide and TODO"
```

---

## Self-review (done while writing)

**Spec coverage:**

| Spec                        | Task(s)                                               |
| --------------------------- | ----------------------------------------------------- |
| §3 contract                 | 1, 2                                                  |
| §4 markup                   | 4, 5                                                  |
| §5 visual                   | 3, 4                                                  |
| §6 performance              | 4 (attributes), 5 (preload check), 6 (bundle figures) |
| §7 example and placeholder  | 6                                                     |
| §8 testing and verification | 1, 2, 4, 5, 6, 7                                      |
| §10 docs                    | 8                                                     |

The §7 open question (does guard f read SVGs in `public/`?) is answered in Task 6's preamble: it does not.

**Spec correction found while planning:** spec §10 says to update `DESIGNER.md` for the new token, but `DESIGNER.md` lists no component tokens. Task 8, Step 3 verifies this and corrects the spec rather than inventing a token table.

**Type and name consistency:**

- `LoHeroSchema` / `LoHero` are defined in Task 1 and imported as `LoHeroConfig` in Tasks 4 and 5, which avoids a clash with the `LoHero` component.
- `hero?` on `AssembledLo` (Task 2) and on `PageLayoutProps` (Task 5).
- The `lo-hero` class names and `data-variant` values match between `LoHero.tsx`, `lo-hero.css` and every test.
