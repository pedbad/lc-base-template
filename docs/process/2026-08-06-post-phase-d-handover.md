# Handover — after Phase D: where the template stands, and what is open

**Date:** 2026-08-06
**Repo:** `lc-base-template` · branch `main` · pushed to `origin/main`, working tree clean.
**HEAD:** `c3f840f` — end of Phase D (course landing page) including the decision-A reversal.
**Suite:** 77 files · 605 tests green. `lint` · `lint:css` · `format:check` · `build` green locally.

**This document takes no decisions.** §5 lists the open work with options and trade-offs
laid out and deliberately unchosen — that is the next session's first job. §1–4 are the
state of the template as verified at `c3f840f`.

---

## 0. One-paragraph summary

A course is now navigable end to end. `/` is a real landing page (hero + one card per
Learning Object + a left sliding lesson nav), each LO has its own static page, the LO
page links back home, and both dev and the build serve all of it. An author adds a
folder under `lo-config/` and gets a page, a card and a nav entry with no code change.
What is NOT done: six of the seven config/asset guards, the debug sandbox, LICENSE, and
the exercise showcase still ships to production.

---

## 1. What Phase D delivered (10 commits, `bd6bd53`..`c3f840f`)

| Commit    | What                                                                                  |
| --------- | ------------------------------------------------------------------------------------- |
| `bd6bd53` | `loOrdinal()` + `sortLoFolders()`; `courseConfig.loOrder` deleted (decision B)        |
| `b32e488` | optional `image` on the LO manifest + `public/images/lo-placeholder.svg` (decision E) |
| `60b9a62` | `buildLoIndex()` — reader-agnostic, ordered, slug-collision-checked                   |
| `0f90fa2` | `CourseHome` · `LoCard` · `LessonSideNav` · `home.css`                                |
| `209b922` | prerender `dist/index.html`; `index.html` root div unstamped; `main.tsx` branches     |
| `a89bfe5` | LO header brand links home (`resolveHomeHref()`)                                      |
| `0f03fe8` | TS narrowing fix in the Tab trap                                                      |
| `76359f9` | docs: Phase D record                                                                  |
| `95a6083` | `loDevPages()` — dev server serves `/<slug>.html` (decision A reversed)               |
| `c3f840f` | docs: the reversal swept through all 29 markdown files                                |

Full decision record with the reference deviations:
`docs/process/2026-08-06-phase-d-landing-page-handover.md` §5–§7b.

### The five Phase D decisions, as settled

| #   | Settled                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------- |
| A   | Dev serves LO pages via `loDevPages()`. First answered build-then-preview, **reversed the same day**. |
| B   | The `lo-NN-` folder ordinal is the ONLY source of course order. `loOrder` deleted, absence asserted.  |
| C   | The sliding nav lists every LO (course-wide index), landing page only — as the reference does.        |
| D   | Landing page lists LOs only. The exercise showcase stays unlinked — and still ships (§5.2).           |
| E   | `image` added to the LO manifest now, with a placeholder wired into `lo-00-example`.                  |

---

## 2. How a page happens now (read this before touching the build)

```
lo-config/lo-00-example/          ← an LO exists because its folder exists
  lo.json                         ← title · description · image · ordered sections
  blocks/… exercises/… modals/…

listLoSlugs()      src/lo/lo-folders.ts     ← node:fs, alias-free (see §3)
sortLoFolders()    src/lo/lo-slug.ts        ← NUMERIC ordinal = course order
loadLo()           src/lo/load-lo-disk.ts   ← Node reader  ┐ both → assembleLo
loadLo()           src/lo/load-lo-glob.ts   ← browser      ┘  (one validator)
buildLoIndex()     src/lo/lo-index.ts       ← folders + a loader → ordered card data
```

Two pages, one bundle, one `<head>`:

| Page         | Rendered by  | Mount point                                 | Where it comes from                |
| ------------ | ------------ | ------------------------------------------- | ---------------------------------- |
| landing page | `CourseHome` | `<div id="root">` — **no** `data-lo-folder` | `dist/index.html`, written LAST    |
| one LO       | `App`        | `<div id="root" data-lo-folder="lo-NN-…">`  | `dist/<slug>.html`, one per folder |

`main.tsx` branches on the presence of `data-lo-folder`. That attribute is written in
exactly one place — `injectRootDiv()` in `src/build/prerender-html.ts` — called by both
the prerender pass and the dev-server plugin, so dev and the build cannot disagree.

### dev vs build (the distinction that caused the reversal)

|                | `bun run dev`                             | `bun run build && bun run preview` |
| -------------- | ----------------------------------------- | ---------------------------------- |
| `/`            | landing page, client-rendered             | landing page, prerendered          |
| `/<slug>.html` | served by `loDevPages()`, client-rendered | real static file, prerendered      |
| no-JS content  | **none** — empty root div                 | the whole page                     |
| hot reload     | yes, including LO JSON edits              | no                                 |

**So `dev` proves content, layout and behaviour; only `build && preview` proves the
no-JS page that actually deploys.** Both are documented in README and CONTRIBUTING.

---

## 3. Constraints a new session will hit

- **`vite.config.ts` now imports repo source** (`loDevPages`). The config is bundled
  before its own `resolve.alias` exists, so anything reachable from it must avoid `@/…`
  imports — that is why `listLoSlugs()` lives in `src/lo/lo-folders.ts` (node:fs only)
  and `load-lo-disk` re-exports it. Adding an alias import to that chain breaks
  `bun run dev` AND `tsc -b` (the node tsconfig project has no `paths`).
- **Never import `load-lo-glob.ts` from a Node script** — `import.meta.glob` is Vite
  syntax and throws under Bun. `load-lo-disk.ts` is the Node reader.
- **`%BASE_URL%` / `resolveAsset()` / `resolveHomeHref()` for every URL**, static head
  assets and page links alike (anti-pattern #28). Verify under a non-root base:
  `BASE_URL=/course/ bun run build`.
- **Prerendered markup must equal the first client render.** Anything that cannot exist
  server-side goes behind `useIsHydrated`. This is why the sliding nav is hand-rolled
  rather than shadcn's `Sidebar` (which branches on a JS-measured viewport).
- **The landing page is written last** by `scripts/prerender.tsx` — it overwrites the
  template every other page is rendered from.
- Semantic HTML, tokens only (no raw hex/px), CSS in `@layer`, files under 800 lines,
  conventional commits, one concern per commit. **Never commit `.claude/tdd-guard/`.**

---

## 4. Verified at this HEAD

- `/` renders hero + one card per LO, no LO body content; `dist/example.html` is still
  the LO. No duplication.
- Non-root base: `BASE_URL=/course/ bun run build` → `href="/course/example.html"`,
  `src="/course/images/lo-placeholder.svg"`.
- No-JS: the served landing page carries hero, all cards, all nav entries and the image
  with no JS engine involved (`curl`), and rendered correctly in-browser from a
  script-stripped copy. Every card link returns HTTP 200 with the expected `<h1>`.
- Sliding nav in-browser: `aria-expanded` correct, focus into panel and back to the
  toggle, Tab trapped both directions, Escape closes, `inert` + `aria-hidden` restored,
  page scroll-locked while open, motion CSS-only behind `prefers-reduced-motion`.
- Hydration: console clean on landing and LO pages.
- Dev parity: card click → `/example.html` with the right folder, 4 sections, 5
  accordions; an LO JSON edit appeared without a rebuild.
- A throwaway second LO produced a page, a card and a nav entry with zero code edits.
- Mobile 375px: single column, no horizontal overflow.

- CI: run `31121753296` for `c3f840f` completed **success** (8m33s) — `lint` ·
  `lint:css` · `format:check` · `test` · `build` on GitHub Actions. Nothing outstanding.

---

## 5. Open work — no decisions taken

Ordered roughly by "what stops a real course shipping", not by size. Each item states
the options and the trade-off; none is chosen.

### 5.1 Branch protection — SETTLED 2026-09-03: stays off, deferred to pre-share

Resolved as _leave `main` open, fix the docs_. `main` accepts direct pushes while this is
a single-maintainer build; the verify gate is run by hand before each commit. Enabling
protection is now tracked as buildlist item **34**, gated on the repo being shared with
other developers.

Correction to this section as originally written: `docs/BRANCH_PROTECTION.md` did **not**
claim protection was on — it carried a `NOT yet enabled` status line all along. The single
false claim was one sentence in CONTRIBUTING (`main` is protected — no direct pushes),
which has been rewritten to describe the real workflow.

Also recorded in `docs/BRANCH_PROTECTION.md`: with one collaborator, `Require approvals: 1`
plus `Do not allow bypassing` locks the sole maintainer out permanently, because GitHub
forbids self-approval. The solo-safe subset is PR required + status checks only.

### 5.2 The exercise showcase still ships to production

`dist/exercise-showcase.html` is in every build. It is a debug gallery of the 12
engines, unlinked from anywhere (Phase D decision D declined to link it), but publicly
reachable by URL on a deployed course. Open since Phase C · Part D §5.

Options: gate the entry out of prod builds (`vite.config.ts` `rollupOptions.input`
conditional on an env flag or mode); keep it and accept a stray public page; or move it
behind the debug sandbox when that lands (§5.5). Trade-off: gating is small but touches
the build config, and the showcase is genuinely useful when authoring content — losing
it in preview builds would hurt.

### 5.3 Guards b–h (six of seven still open — buildlist steps 20–26)

Guard **a** (config-schema, Zod at load) is active. Remaining:

| Guard | Checks                                           | Note                                                               |
| ----- | ------------------------------------------------ | ------------------------------------------------------------------ |
| b     | naming + render-mirror (folder ↔ config match)   | `example-lo.test.ts` already seeds this on one LO                  |
| c     | asset-path (everything through `resolveAsset()`) | `src/lib/assets.ts` is already the single choke point              |
| d     | asset-existence (every authored path exists)     | seeded: the card-image test in `example-lo.test.ts`                |
| e     | registry-complete (`type` resolves to an engine) | seeded: the per-type schema map in `example-lo.test.ts`            |
| f     | token-integrity (no raw hex/px)                  | `public/images/lo-placeholder.svg` is the one deliberate exception |
| g     | css-layer discipline (`@layer`, no `!important`) |                                                                    |
| h     | w3c / a11y over rendered pages                   | the landing page and the sliding nav are new surface for this      |

Note for whoever picks these up: **two of the three bugs carried forward from
french-lo-1 were asset paths under a non-root base** (#28 favicon, #35 runtime fetch),
which argues for c + d early — but that is an argument, not a decision.

### 5.4 Per-LO chunking (Phase D §8)

Every page bundles every LO's JSON, because `load-lo-glob.ts` uses an eager
`import.meta.glob`. Harmless at one LO. Needs measuring against the microsite JS budget
(<80kb gzipped) somewhere around a dozen LOs. Options: leave until measured; switch the
glob to lazy and gate LO loading behind `useIsHydrated`; or split per-LO chunks at build
time. Nothing here is urgent, and the landing page made it slightly worse (the index
reads every manifest).

### 5.5 Buildlist leftovers

- **16** debug sandbox (palette / fonts / SVG preview) — never started.
- **18** sandbox renders docs as HTML.
- **28** LICENSE — **DONE 2026-09-03** (`6c62d6d` + follow-up): MIT code + CC-BY-NC-4.0
  content + brand/Feijoa disclaimer, copyright The Language Centre, University of
  Cambridge.
- **29** DESIGNER / STRUCTURE / AGENTS.md (README and CONTRIBUTING exist and are current).
- **30** `bun run docs:tree` — auto-generated STRUCTURE tree.
- **31** CI is partial by design: guards b–h join as they land.
- **33** mark the repo as a GitHub "template repo".

### 5.6 Rich-text extensions (`docs/specs/lo-rich-text-modals.md` §12)

Block-level content inside modals; rich text in the 12 exercise engines. Spec'd, not
built.

### 5.7 Small known edges

- A **typo'd slug in dev** (`/greetigns.html`) falls through Vite's SPA fallback and
  renders the landing page rather than 404ing. Deliberately not claimed by
  `loDevPages()` — owning that would mean owning the dev server's 404 behaviour.
  Recorded in `docs/TOOLING.md`.
- The **landing page's chrome words** ("Lessons", "Start learning") are hardcoded in the
  home components, matching the existing shell precedent ("Skip to main content", "Main
  navigation"). `ui-strings.ts` is exercise chrome and its schema requires every key, so
  adding landing keys there is a contract change nobody has needed yet.
- `Footer.tsx` still ships **placeholder links** ("Accessibility", "Privacy" → `#`) and
  a "real links land in a later Phase C part" note.

---

## 6. Paste-ready resume prompt

> Read `docs/process/2026-08-06-post-phase-d-handover.md`. The template is at `c3f840f`
> on `main`: Phase D is complete — `/` is the course landing page (hero + one card per
> LO + a left sliding lesson nav), each LO has a static page, dev and the build both
> serve all of it, and adding a folder under `lo-config/` adds a page, a card and a nav
> entry with no code change. 605 tests green.
>
> Pick up from §5, which lists the open work with options and trade-offs and
> deliberately takes no decisions. Tell me what you'd do first and why before starting,
> and settle any §5 choice with me rather than for me. The constraints in §3 are not
> negotiable — in particular: nothing reachable from `vite.config.ts` may use `@/…`
> imports, never import `load-lo-glob.ts` from a Node script, every URL goes through
> `%BASE_URL%`/`resolveAsset()`/`resolveHomeHref()` and is verified under
> `BASE_URL=/course/ bun run build`, and prerendered markup must equal the first client
> render. TDD where there is logic, one concern per commit, and update
> README/CONTRIBUTING/TOOLING/the buildlist in the same pass as any behaviour change.
