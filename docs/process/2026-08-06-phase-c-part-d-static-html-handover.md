# Handover — Phase C · Part D: Static per-LO HTML

**Date:** 2026-08-06
**Repo:** `lc-base-template` · branch `main` · in sync with `origin/main` (clean, all pushed).
**HEAD:** `46de471` — end of Phase C · Part C, plus the unplanned rich-text/modal addition.
**This task:** turn the single-page app into **one real HTML file per Learning Object**, via a
Node post-build `renderToStaticMarkup` pass. This is the part that makes the template shippable
as a static course.

**Start by reading §3 — the asset-hash problem is the whole difficulty of Part D. Rendering the
markup is the easy half.**

---

## 0. What exists now (verified at `46de471`)

### Parts A–C are done

- **Part A** — site shell: `PageLayout`, `Header`, `Footer`, `LoAccordion`,
  `InstructionsCallout`, `ThemeToggle`. Semantic, no-JS-safe by construction
  (native `<details>`/`<summary>`, progressive-enhancement animation only).
- **Part B** — `lo-config/lo-00-example/` on disk, schema-validated.
- **Part C** — the JSON drives the page. `loadLo` → `assembleLo` → `toPageSections` →
  `PageLayout`. `DEFAULT_SECTIONS` and `SECTION_CONTENT` are deleted, not bypassed.
- **Unplanned addition** — inline rich text + modal popups
  (`docs/specs/lo-rich-text-modals.md`).

### The pieces Part D needs, which already exist

| Piece                     | Where                                 | Note                                                                                         |
| ------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Node-side LO reader**   | `src/lo/load-lo-disk.ts`              | `loadLo(slug)` + `listLoSlugs()` via `node:fs`. **Built for exactly this task** — see below. |
| Browser-side reader       | `src/lo/load-lo-glob.ts`              | `import.meta.glob`. Vite-only syntax; do NOT import from a Node script.                      |
| Pure assembler            | `src/lo/assemble-lo.ts`               | No I/O. Both readers feed it, so validation and ordering are defined once.                   |
| JSON→DOM adapter          | `src/lo/lo-page-sections.tsx`         | `toPageSections(lo)`                                                                         |
| Composition root          | `src/App.tsx`                         | `ModalProvider` → `PageLayout`. `LO_SLUG` is a hardcoded constant — Part D replaces that.    |
| Asset URL choke point     | `src/lib/assets.ts`                   | `resolveAsset()` resolves against `import.meta.env.BASE_URL`.                                |
| DOM-free rich-text parser | `src/lo/rich-text/parse-rich-text.ts` | Plain string work, no `DOMParser` — deliberately, so it runs in Node.                        |

**Why there are two readers** (do not "simplify" this — verified 2026-08-04): `import.meta.glob`
is Vite-only syntax and throws under Bun/Node; `node:fs` does not exist in a browser bundle.
Neither mechanism spans both runtimes, so there is one assembler and two thin readers.

### The build today

`vite.config.ts` has **two hardcoded HTML entries**:

```js
input: {
  main: path.resolve(import.meta.dirname, 'index.html'),
  showcase: path.resolve(import.meta.dirname, 'exercise-showcase.html'),
}
```

`index.html` is the stock Vite template: `<div id="root"></div>` plus
`<script type="module" src="/src/main.tsx">`. There is **no** prerender script, no `scripts/`
directory, and no `postbuild` npm script. `bun run build` = `tsc -b && vite build`.

---

## 1. What Part D must produce

For each folder in `lo-config/`, one static HTML file whose **`<body>` already contains the
fully-rendered page** — heading outline, nav, sections, accordions, block prose — so the course
is readable and navigable with JavaScript disabled, and hydrates into the interactive app when
JS runs.

```
dist/
  index.html                  ← existing SPA entry (decide its fate, §5)
  exercise-showcase.html      ← existing, unchanged
  <slug>.html                 ← NEW, one per LO
  assets/*-HASH.{js,css}      ← existing hashed bundles
```

**Slug derivation** (design spec §15, already decided): the LO folder name carries an ordinal
prefix for authoring order; the URL slug strips it. `lo-00-example` → `example`. The folder name
stays the single source of truth for identity; nothing else carries or derives the slug.

---

## 2. The smallest first step (do this, and only this, first)

**Render ONE LO to one static file, and stop.**

- A `scripts/prerender.ts` that imports `loadLo` from `load-lo-disk.ts`, renders the app for
  `lo-00-example` with `renderToStaticMarkup`, injects it into a template, writes
  `dist/example.html`.
- No auto-discovery over `lo-config/`, no slug routing, no per-LO `<title>`/meta yet.
- Verify: open `dist/example.html` from disk with JS disabled and confirm the page reads;
  then with JS on and confirm it hydrates with no console mismatch warnings.

Only once that one file is correct, loop `listLoSlugs()`. The reason for this order is §3: the
asset-injection problem shows up on file one, and solving it for one file solves it for all.

---

## 3. The hard part — asset hashes and `%BASE_URL%`

**This is the crux. Budget your thinking here.**

`renderToStaticMarkup` gives you `<body>` markup. It does **not** give you the `<head>`. The
prerendered file must reference the **hashed** bundles Vite just emitted
(`assets/main-DKLXWUsE.js`, the CSS chunk, the font preloads) — and those hashes change every
build, so they cannot be hardcoded in a template.

Two candidate mechanisms:

1. **Read Vite's build manifest.** Set `build.manifest: true`; the post-build script reads
   `dist/.vite/manifest.json`, looks up the `index.html` entry, and emits the matching
   `<script type="module" src>` + `<link rel="stylesheet">` tags. Explicit, no HTML parsing.
2. **Reuse the built `dist/index.html`** as the template: Vite has already rewritten its tags to
   the hashed assets, so read it and inject the rendered markup into its `<div id="root">`.
   Less code, but couples the script to that file's exact shape.

Either way, mind **carry-forward anti-pattern #28** (`docs/process/FUTURE_PROJECTS.md`): static
`<head>` asset hrefs must use Vite's `%BASE_URL%` token, not relative paths, when the app is
served from a non-root base AND uses path-slug routes. A relative `href="favicon.svg"` resolves
against the _current page URL_, so it works at the base root and 404s at any deeper route.
`index.html` today uses `href="/favicon.svg"` (root-absolute), which breaks under a non-root
base — **fix that as part of this work**, and route runtime asset lookups through
`resolveAsset()`.

Also verify `resolveAsset()` behaves in Node: `readBaseUrl()` reads `import.meta.env?.BASE_URL`
and falls back to `'/'` when undefined, which is the Node case. Confirm that fallback produces
correct URLs in prerendered output, or pass the base in explicitly.

---

## 4. Hydration

`main.tsx` currently calls `createRoot(...).render(...)`. Prerendered markup needs
`hydrateRoot` instead — but only on the prerendered pages, and the showcase entry must keep
`createRoot`. Decide how that branches before writing it.

Two known hydration hazards in this codebase:

- **`ModalProvider`** holds `openId` state and renders a portal-based Base UI `Dialog`. Portals
  do not render server-side. Confirm the closed-dialog case emits nothing, so there is no
  mismatch.
- **`ThemeToggle` / `useTheme`** reads `localStorage`. Prerendered HTML cannot know the theme,
  so expect a flash-of-wrong-theme unless an inline pre-hydration script sets the class on
  `<html>` from storage before first paint. That inline script is the standard fix; it needs a
  CSP nonce if a CSP is added later.

---

## 5. Open questions Part D must settle

- **What happens to `dist/index.html`?** Options: keep it as the SPA entry; make it a redirect
  to the first LO; make it an index page listing every LO. Anti-pattern #26 is relevant —
  **path slugs are the only content route**; do not introduce `?lo=<id>` even as a fallback,
  since a greenfield app has no legacy links to protect.
- **Does the showcase ship in production?** `vite.config.ts` already flags this as a later step
  ("gate the showcase behind a debug flag / strip it from prod builds"). Part D is the natural
  time, since it is the first build that produces a real deliverable.
- **One bundle for all LOs, or per-LO chunks?** Today every LO's JSON is inlined into the
  bundle by `import.meta.glob` — every page ships every LO's content. Fine at one LO,
  questionable at fifteen. Measure before optimising; note the microsite JS budget in the
  performance rules.
- **Where does the prerender run in CI?** It must run after `vite build`, and CI currently
  runs `test + lint + build`.

---

## 6. Acceptance criteria (one concern per commit)

- [ ] `scripts/prerender.ts` renders ONE LO to `dist/<slug>.html` with correct hashed asset tags.
- [ ] Slug derivation strips the `lo-NN-` prefix; a unit test covers it.
- [ ] The script then loops every folder from `listLoSlugs()`; one file each.
- [ ] Per-LO `<title>` and `<meta name="description">` come from the LO manifest
      (`title`, `description`), not from the stock template.
- [ ] `%BASE_URL%` used for every static `<head>` asset href (anti-pattern #28); verified under a
      non-root `base`.
- [ ] Prerendered pages hydrate without React mismatch warnings; the showcase entry unaffected.
- [ ] **No-JS pass:** with JavaScript disabled, a prerendered LO page shows all sections and
      accordion content, and in-page nav anchors work.
- [ ] Theme flash addressed, or the tradeoff explicitly documented.
- [ ] `bun run test · lint · lint:css · build` green, plus a browser pass on a prerendered file
      served over HTTP (not just `file://`, which changes module and CORS behaviour).

---

## 7. Guardrails

- **Do not import `load-lo-glob.ts` from the prerender script** — `import.meta.glob` is Vite
  syntax and will throw under Node. Use `load-lo-disk.ts`.
- **Do not add a second assembler or a second validation path.** `assembleLo` stays the one
  place that validates and orders.
- Fail fast and loud: a malformed LO must fail the BUILD with the offending file path named,
  never emit a half-rendered page.
- Conventional commits, one concern each. Semantic HTML, tokens-only CSS, `<800`-line files.
- **Never commit `.claude/tdd-guard/`.** Its hook was muted on 2026-08-04 (`Not logged in`);
  re-check before relying on it.

---

## 8. What comes after Part D

- **Guards b–h** — naming/render-mirror, asset-path, asset-existence, registry-complete,
  token-integrity, css-layer-discipline, w3c/a11y. Guard a is active; seeds exist in
  `src/config/example-lo.test.ts`, `src/showcase/showcase-audio-assets.test.ts`, and
  `src/lo/rich-text/lo-rich-text.test.ts`.
- **Rich-text extensions** — block-level content in modals (lists, tables); rich text in the 12
  exercise engines. Both scoped in `docs/specs/lo-rich-text-modals.md` §12.

---

## 9. Paste-ready resume prompt

> Read `docs/process/2026-08-06-phase-c-part-d-static-html-handover.md` and implement Phase C
> Part D: static per-LO HTML. Start with §2 — render ONLY `lo-00-example` to one
> `dist/example.html` and get the hashed-asset injection right (§3) before looping every LO.
> Use `src/lo/load-lo-disk.ts`, never `load-lo-glob.ts`. Settle §5's open questions as you
> reach them and record the decisions in this file. TDD where there is logic to test (slug
> derivation, manifest lookup); verify with a real no-JS browser pass over HTTP.

---

## 10. Progress log — §2 done (2026-08-06)

**Status:** the §2 baby step is complete and verified. `bun run build` now emits
`dist/example.html`, a real static page that reads without JavaScript and hydrates cleanly.
The loop over `listLoSlugs()` is the next commit.

### Commits

| Commit    | Concern                                                                                    |
| --------- | ------------------------------------------------------------------------------------------ |
| `50629ae` | `src/lo/lo-slug.ts` — folder name → URL slug, TDD, 6 tests                                 |
| `5408d8e` | `src/build/prerender-html.ts` — inject a rendered LO into the built template, TDD, 9 tests |
| `f341d56` | hydration safety — `useTheme` rewrite, `useIsHydrated`, `ExerciseHost`                     |
| `690ac7e` | `scripts/prerender.tsx` + the entry/base-URL changes it needs                              |

### Decisions taken

**§3 — the template is the BUILT `dist/index.html`, not the Vite manifest.** Vite has already
rewritten that file's tags to the hashed URLs and resolved `%BASE_URL%`, so reusing it inherits
the correct `<head>` for free. Reading `dist/.vite/manifest.json` would duplicate knowledge of
the head — favicon, preloads, the pre-hydration theme script — and drift from it silently. The
coupling is narrow and checked: exactly two anchors (`<title>`, an empty `<div id="root">`), and
a missing anchor throws rather than emitting a stock-titled or app-less page.

**`renderToString`, not `renderToStaticMarkup`** (a deliberate deviation from §2's wording):
React documents static markup as non-hydratable, and these pages hydrate.

**One `BASE_URL` env var drives both steps.** `vite.config.ts` reads `base` from
`process.env.BASE_URL ?? '/'`, and Bun exposes `process.env` as `import.meta.env`, so
`resolveAsset()` resolves audio and image URLs against the SAME base while prerendering.
`vite build --base=…` would not reach the prerender pass, so `BASE_URL=/course/ bun run build`
is the supported knob. Verified: every hashed asset and the favicon carry `/course/`.

**Anti-pattern #28 fixed.** `index.html` and `exercise-showcase.html` now use
`%BASE_URL%favicon.svg`. Note: do not write the token itself inside an HTML comment — Vite
substitutes it there too.

**§4 — hydration.** `main.tsx` reads `#root`'s `data-lo-folder` (the FOLDER, not the slug —
that is what `loadLo` takes) and calls `hydrateRoot` when `#root` has children, `createRoot`
when it is empty (the dev server). The showcase entry keeps `createRoot` outright.

- `ModalProvider` was not a problem: a closed Base UI dialog renders nothing server-side.
- `ThemeToggle` WAS: resolving the theme during render mismatched `aria-checked` for a
  dark-theme reader. `useTheme` is now a `useSyncExternalStore` over localStorage + the `.dark`
  class, with a separate server snapshot. No effects, no setState-in-an-effect.
- Lazy exercise engines WERE a problem the handover did not anticipate: `renderToString` cannot
  resolve them, so each boundary failed server-side and the client threw its HTML away (React
  error #419, twice per page). `ExerciseHost` now gates the engine behind `useIsHydrated` and
  the static page says "This exercise needs JavaScript to run." — which is the honest thing to
  tell a no-JS reader anyway.

**Theme flash — solved, with one documented residue.** An inline, module-free script in
`index.html` stamps `.dark` before first paint (a module import would be deferred, which is too
late). It duplicates `resolveInitialTheme`'s rule by necessity; both sides carry a keep-in-sync
note. Residue: on a dark-theme page the switch itself renders in its off position for one frame
after hydration. Accepted — the page never flashes, only the control settles.

**§5 — `dist/index.html`.** Unresolved by design for now: it stays the dev/SPA entry, pinned to
`lo-00-example` via `data-lo-folder`, so `bun run dev` behaves exactly as before. Making it an
index page listing every LO only becomes meaningful once the loop exists — decide it there.
Path slugs remain the only content route; no `?lo=` fallback was added (anti-pattern #26).

**§5 — where the prerender runs in CI.** Inside `bun run build`
(`tsc -b && vite build && bun scripts/prerender.tsx`), so the existing `test + lint + build` CI
covers it with no workflow change. `tsc -b` type-checks `scripts/` via `tsconfig.app.json`'s
include.

### Still open

- **Loop every LO** — `listLoSlugs()` → one file each. The only remaining §2→§6 gap.
- **Does the showcase ship in production?** Still shipping. Untouched.
- **One bundle for all LOs, or per-LO chunks?** Still one bundle; every LO's JSON is inlined
  into it. Measure at more than one LO before optimising.

### Verification performed

`bun run test` (548 pass) · `lint` · `lint:css` · `format:check` · `build` at both `/` and
`/course/` bases. Browser pass over HTTP via `vite preview` (not `file://`):

- **With JS:** fresh tab, zero console messages; opening an exercise accordion mounts the
  engine (3 comboboxes + Check button, placeholder gone); modal and audio buttons are live.
- **No JS:** served a copy with the module script stripped — `<h1>`, nav, all four sections
  and their accordions render; a native `<details>` opens and shows its rich text, inline
  modal-link text and audio icon; the `#exercises` nav anchor scrolls to the section.
- **Dark theme:** with `lc-theme=dark`, dark background before paint, switch correct after
  hydration, console clean.
