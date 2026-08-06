# Handover — Phase D: course landing page (LO index + sliding side nav)

**Date:** 2026-08-06
**Repo:** `lc-base-template` · branch `main` · in sync with `origin/main` (clean, all pushed).
**HEAD:** `9fa562a` — end of Phase C (Parts A–D) plus the doc-drift pass.
**Reference implementation:** https://github.com/pedbad/French-Basic-2026 — the landing page and
left sliding nav to match. **Read it before designing anything** (§2).

**Start with §5 — the dev-server routing wrinkle is the one decision that changes how authors
work day to day. Everything else is ordinary component work.**

---

## 0. Where the template is now (verified at `9fa562a`)

### Phase C is complete, all four parts

| Part  | Delivered                                                                                                                                             |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | Site shell — `PageLayout`, `Header`, `Footer`, `LoAccordion`, `InstructionsCallout`, `ThemeToggle`. Semantic, no-JS-safe by construction.             |
| **B** | `lo-config/lo-00-example/` on disk, schema-validated.                                                                                                 |
| **C** | The JSON drives the page. `loadLo` → `assembleLo` → `toPageSections` → `PageLayout`. `DEFAULT_SECTIONS` / `SECTION_CONTENT` deleted, not bypassed.    |
| **D** | **Static per-LO HTML.** `bun run build` emits one real `.html` per folder in `lo-config/`, readable with JavaScript off, hydrating into the live app. |

Unplanned addition along the way: inline rich text + modal popups
(`docs/specs/lo-rich-text-modals.md`).

### What Part D built, that this phase reuses

| Piece                     | Where                         | Note                                                                            |
| ------------------------- | ----------------------------- | ------------------------------------------------------------------------------- |
| Post-build prerender pass | `scripts/prerender.tsx`       | Walks `listLoSlugs()`, one `dist/<slug>.html` each. Wired into `bun run build`. |
| HTML injection            | `src/build/prerender-html.ts` | Injects rendered markup into the BUILT `dist/index.html`. **Two anchors only.** |
| Slug derivation           | `src/lo/lo-slug.ts`           | `loSlug()` + `loSlugsByFolder()` (rejects collisions). 9 tests.                 |
| Node-side LO reader       | `src/lo/load-lo-disk.ts`      | `loadLo(folder)` + `listLoSlugs()` via `node:fs`.                               |
| Browser-side reader       | `src/lo/load-lo-glob.ts`      | `import.meta.glob`. Vite-only — **never** import from a Node script.            |
| Hydration-safe primitives | `src/hooks/useIsHydrated.ts`  | `useSyncExternalStore`-based; false on the server + hydration pass, true after. |
| Asset URL choke point     | `src/lib/assets.ts`           | `resolveAsset()` resolves against `BASE_URL`.                                   |

`BASE_URL` is one knob for the whole build: `vite.config.ts` reads `base` from
`process.env.BASE_URL`, and Bun exposes `process.env` as `import.meta.env`, so
`resolveAsset()` sees the same value while prerendering. `BASE_URL=/course/ bun run build`.

Full Part D decision record: `docs/process/2026-08-06-phase-c-part-d-static-html-handover.md` §10.

---

## 1. The problem this phase fixes

`http://localhost:5173/` currently renders **`lo-00-example` itself**, because `index.html`'s
`<div id="root" data-lo-folder="lo-00-example">` pins it there. Consequences:

- `dist/index.html` and `dist/example.html` are the same page. Pure duplication.
- Add a second LO and its page is an **orphan** — `dist/greetings.html` exists and nothing
  anywhere links to it.
- There is no cross-LO navigation of any kind. The header nav (Introduction · Grammar ·
  Vocabulary · Exercises) is in-page section anchors _within one LO_, by design (spec).

**Wanted:** `/` is a course landing page — hero copy, a **left sliding nav**, and a **card per
LO** linking to that LO's page. `lo-00-example` is simply the first card.

---

## 2. Read the reference first

https://github.com/pedbad/French-Basic-2026 is the look and behaviour to match. It is a
**different stack** (vanilla/legacy, pre-React-template), so port the _design and interaction_,
not the code.

Its docs worth reading before designing:

- `docs/ARCHITECTURE.md` — how the landing page and per-LO pages relate.
- `docs/archive/navigation/NAV_TODO.md` — the sliding-nav history, including what was wrong
  with earlier attempts.
- `docs/a11y/ACCESSIBILITY.md` + `docs/a11y/DOM_SEMANTIC_CHECKLIST.md` — the a11y bar the
  sliding nav has to clear (focus trap, escape, `aria-expanded`, scroll lock).
- Its landing page markup + the sidebar CSS/JS (find them from the repo root; `index.html`
  and the nav partial/script are the entry points).

Extract, explicitly, before writing code: card anatomy (what's on a card — title, blurb,
image? progress?), grid behaviour at each breakpoint, how the sidebar opens/closes, what it
contains (all LOs? sections of the current LO? both?), and whether it persists across pages.

**Do not** copy its `?lo=` style routing if present — path slugs are the only content route
here (carry-forward anti-pattern #26), and this is greenfield with no legacy links to protect.

---

## 3. What already exists to build on

Nothing needs inventing for the data layer:

- **Every LO, at build time:** `listLoSlugs()` → folder names; `loSlugsByFolder()` → folder→slug
  map with collision rejection.
- **Card content:** `loadLo(folder)` returns the assembled LO — `title` and `description` are
  exactly a card's heading and blurb. They already feed each page's `<title>`/`<meta>`.
- **Hero copy + branding:** `src/config/course.config.ts` already carries what a landing page
  needs, and always has:

  ```ts
  courseTitle: 'Cambridge Spanish — Level 1',
  landingCopy: { heading: 'Bienvenido', subheading: 'Start your Spanish journey' },
  logo: 'logo.svg',
  favicon: 'favicon.svg',
  loOrder: [],   // "Auto-discovery fills the real list later."
  ```

- **The prerender pass** already loops LOs and writes files; the landing page is one more
  output from the same script.

---

## 4. The work, in dependency order

1. **`CourseHome` component** — hero from `courseConfig.landingCopy`, then a card grid: one
   card per LO, `title` + `description` from its manifest, linking to `<slug>.html`.
   **Card hrefs must go through the base**, not a bare relative path — a relative href
   resolves against the current page URL and a root-absolute one 404s under a non-root base
   (anti-pattern #28, the same bug class as the favicon). Route them through `resolveAsset()`
   or the `%BASE_URL%` token.
2. **Left sliding nav** — per the reference. Native-first: a real `<nav>`, a `<button>` with
   `aria-expanded`, focus management, Escape to close, scroll lock while open, and
   `prefers-reduced-motion` respected. The repo already has `useScrollLock` in the bundle
   (Base UI) — check before adding anything.
3. **Prerender the landing page** — extend `scripts/prerender.tsx` to emit `dist/index.html`
   from `CourseHome`. Needs a small extension to `buildPrerenderedHtml`: the landing page is
   **not an LO**, so its title comes from `courseTitle`, its description from `landingCopy`,
   and it carries **no** `data-lo-folder`. Decide whether that is a second function or a
   discriminated input — keep the "two anchors, throw if missing" guarantee either way.
4. **Client entry for the landing page** — `main.tsx` currently _requires_ `data-lo-folder`
   and throws without it. The landing page needs its own entry (or a branch), and it must
   `hydrateRoot` for the same reason LO pages do.
5. **Cross-LO nav in the header** — a home link back to `/`. The header brand is currently
   `href="#content"` (a skip link), so this is a real shell change. Consider prev/next between
   LOs while you are in there.

---

## 5. Decisions this phase must settle

**A. The dev-server routing wrinkle — settle this FIRST.** `bun run dev` serves `index.html`.
Once that is the card list, every card links to `<slug>.html`, **which only exists after a
build**. So clicking a card in dev 404s. Options:

1. Register per-LO HTML entries in `vite.config.ts` so the dev server serves them too
   (closest to production; more build config, and the entry list must stay in sync with
   `lo-config/` — a Vite plugin can generate it).
2. Author via `bun run preview` after a build (zero new config; loses hot reload while
   authoring content, which is the main authoring loop).
3. Keep a dev-only pinned-LO entry alongside the index (fast authoring; dev and prod differ,
   which is how the current duplication happened in the first place).

This is the choice that changes daily authoring. Pick deliberately and record why.

**B. LO order — one source of truth.** The folder ordinal already encodes order (`lo-00-`,
`lo-01-`). `courseConfig.loOrder` is a _second_ source for the same fact, and silent config
drift is precisely what this template exists to prevent. Recommendation: the folder ordinal
**is** the order; either delete `loOrder` or redefine it as an explicit override with a guard
that every slug in it exists and every LO is covered. Do not leave two unreconciled sources.

**C. What the sliding nav contains.** All LOs (a course-wide index, same on every page)? The
current LO's sections (what the header nav does today)? Both, in one panel? The reference
answers this — follow it, and note the answer here.

**D. Does the landing page list only LOs?** The exercise showcase still ships in production
builds (`exercise-showcase.html`, still unresolved from Part D §5). Decide whether it appears
on the landing page, stays unlinked, or is finally gated out of prod builds.

**E. Card content beyond title + description.** An image or icon per card means a new optional
manifest field (`lo-schema.ts`) and an asset convention — a schema change, so decide before
building cards, not after.

---

## 6. Acceptance criteria (one concern per commit)

- [ ] `/` renders the course landing page — hero + one card per LO — and **no LO content**.
- [ ] `dist/index.html` is the landing page; `dist/example.html` remains `lo-00-example`. No
      duplication.
- [ ] Every card links to a page that exists, verified under a **non-root base**
      (`BASE_URL=/course/ bun run build`).
- [ ] Landing page is prerendered: full card list present with JavaScript disabled, and every
      card link works with JS off.
- [ ] Sliding nav: keyboard-operable (open, trap, Escape, restore focus), `aria-expanded`
      correct, scroll-locked while open, reduced-motion respected. Works with JS off or is
      inert-but-harmless without it.
- [ ] Landing page hydrates with no React mismatch warnings; LO pages and the showcase entry
      unaffected.
- [ ] Adding a folder to `lo-config/` adds a card with **no code change**. Verify with a real
      second LO, then delete it.
- [ ] LO order has exactly one source of truth (decision B), with a test.
- [ ] `bun run test · lint · lint:css · format:check · build` green, plus a browser pass over
      HTTP (not `file://`).
- [ ] Docs updated in the same pass: README's Build section, CONTRIBUTING's authoring section,
      TOOLING, and the buildlist (`docs/process/LC_BASE_TEMPLATE_BUILD_HANDOVER.md` — step 16
      and the DOCS/DEPLOY block). **The last session's drift pass cleaned all of these; don't
      re-introduce drift.**

---

## 7. Guardrails

- **Never import `load-lo-glob.ts` from a Node script** — `import.meta.glob` is Vite syntax and
  throws under Bun. Use `load-lo-disk.ts`.
- **No second assembler, no second validation path.** `assembleLo` stays the one place.
- **No `?lo=` route.** Path slugs only (anti-pattern #26).
- **`%BASE_URL%` / `resolveAsset()` for every URL** — static head assets and card links alike
  (anti-pattern #28). Verify under a non-root base, not just at `/`.
- Fail fast and loud: a malformed LO must fail the BUILD naming the file, never emit a
  half-rendered page.
- Prerendered markup must equal the first client render. Anything that cannot exist
  server-side goes behind `useIsHydrated`.
- Semantic HTML, tokens only (no raw hex/px), CSS in `@layer`, files under 800 lines,
  conventional commits, one concern each.
- **Never commit `.claude/tdd-guard/`.** Its hook was muted 2026-08-04 (`Not logged in`).

---

## 8. After this phase

- **Guards b–h** — naming/render-mirror, asset-path, asset-existence, registry-complete,
  token-integrity, css-layer-discipline, w3c/a11y. Guard a is active.
- **Per-LO chunking** — every page currently bundles every LO's JSON via `import.meta.glob`.
  Fine at one or two LOs; measure around a dozen against the microsite JS budget.
- **Rich-text extensions** — block-level content in modals; rich text in the 12 exercise
  engines (`docs/specs/lo-rich-text-modals.md` §12).
- **Step 16** — debug sandbox.

---

## 9. Paste-ready resume prompt

> Read `docs/process/2026-08-06-phase-d-landing-page-handover.md` and implement Phase D: the
> course landing page. Right now `/` renders `lo-00-example` itself, which duplicates
> `example.html` and leaves any second LO an orphan — replace it with a real landing page:
> hero copy from `course.config.ts`, a left sliding nav, and one card per LO (title +
> description from each manifest) linking to that LO's static page. `lo-00-example` is the
> first card.
>
> Match https://github.com/pedbad/French-Basic-2026 — read its `docs/ARCHITECTURE.md`,
> `docs/archive/navigation/NAV_TODO.md` and `docs/a11y/` first, and port the design and
> interaction, not the code (different stack).
>
> Settle §5 decision A (the dev-server 404 on card links) BEFORE writing components — it
> changes how authors work daily — then B (one source of truth for LO order). Use
> `src/lo/load-lo-disk.ts`, never `load-lo-glob.ts`. Card links and head assets go through
> `%BASE_URL%`/`resolveAsset()`; verify with `BASE_URL=/course/ bun run build`. TDD where
> there is logic (ordering, the landing-page inject path). Verify with a real no-JS browser
> pass over HTTP, add a throwaway second LO to prove a card appears with no code change, and
> update README / CONTRIBUTING / TOOLING / the buildlist in the same pass. Record §5's
> answers in this file as you settle them.
