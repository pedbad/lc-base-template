# STRUCTURE.md — what every folder is for

**For anyone new to the repo.** This is the map: which folder owns which job, and
where a given kind of change belongs. It answers "where does this go?", not "how
do I do it" — for that see [`CONTRIBUTING.md`](CONTRIBUTING.md) (workflow),
[`DESIGNER.md`](DESIGNER.md) (theming) and [`docs/TOOLING.md`](docs/TOOLING.md)
(why each tool).

An annotated tree of the whole repo sits at the bottom of this file.

---

## The shape in one paragraph

A course is **content plus engines**. The content is JSON on disk under
`lo-config/`, with its media under `public/`. The engines are React components
under `src/exercises/`. Between them sits a loader (`src/lo/`) that validates the
JSON and assembles a lesson, and a shell (`src/components/`) that renders the page
around it. A build bundles the app, then prerenders one static HTML file per
lesson. Nothing enumerates lessons by hand: **a Learning Object exists because its
folder exists.**

---

## Top-level folders

| Folder       | Owns                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| `lo-config/` | **Course content.** One folder per Learning Object. Authored JSON, no code.       |
| `public/`    | **Static assets**, copied verbatim to the site root — audio, images, fonts, icons |
| `src/`       | **The application** — engines, loader, shell, styles, guards                      |
| `scripts/`   | **Build-time Node scripts** run by `bun`, outside the Vite bundle                 |
| `docs/`      | **Specs, tooling rationale and process history** — the written record             |
| `.github/`   | **CI and repo policy** — the workflow, CODEOWNERS, PR template                    |
| `dist/`      | Build output. Generated, git-ignored, never edited.                               |

---

## `lo-config/` — the course content

An LO is a folder. Adding a folder adds a lesson page **and its card on the
landing page**, with no code change anywhere.

```
lo-config/lo-00-example/
  lo.json                          manifest: metadata + ordered refs to the below
  blocks/00-intro/block.json       a content block
  blocks/01-grammar/block.json
  exercises/01-select/exercise.json
  modals/example-popup/modal.json
```

Two naming rules carry real weight:

- **`lo-NN-slug`** — the `NN` ordinal is the course order, and the only source of
  it. Sorted numerically, so `lo-9-` precedes `lo-10-`. The URL drops the ordinal
  (`lo-00-example` → `example.html`). **To reorder a course, rename folders.**
- **`<ordinal>-<type>`** inside `blocks/` and `exercises/` — the file structure
  mirrors the rendered page, so "look at the page → go straight to the file".
  Ordinals are section-scoped: blocks and exercises each count from their own
  start. **Guard b** fails if a folder name stops matching the config.

Every file here is validated by Zod at load (**guard a**). A malformed LO fails
the build with the offending file named — it never emits a half-rendered page.

## `public/` — static assets

Copied to the site root untouched. Media mirrors the same `<ordinal>-<type>`
names the config uses, so an asset's path is derivable from the page.

| Path                   | Holds                                                        |
| ---------------------- | ------------------------------------------------------------ |
| `public/audio/`        | Audio clips, per LO and per showcase fixture                 |
| `public/images/`       | Illustrations, LO card art                                   |
| `public/fonts/feijoa/` | Commercial display font — **git-ignored, never committed**   |
| `public/icons.svg`     | The sprite sheet                                             |
| `public/llms.txt`      | Machine-readable summary of the built site (see `AGENTS.md`) |
| `public/robots.txt`    | Crawler policy                                               |

**Never write a bare relative or root-absolute URL to any of this.** Runtime
paths go through `resolveAsset()`; static `<head>` paths go through
`%BASE_URL%`. A course can deploy under a sub-path, and that is what makes it
work. **Guard c** checks the form; **guard d** checks the file is actually there.

## `src/` — the application

| Folder            | Owns                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------- |
| `src/exercises/`  | **The engines.** One folder per exercise type, plus `lib/` (shared shell) and the registry. |
| `src/lo/`         | **The loader.** Reads an LO folder, validates it, assembles it into a page.                 |
| `src/components/` | **The page shell** — header, footer, nav, landing page, audio players, `ui/` primitives.    |
| `src/config/`     | **The content contract** — Zod schemas, course config, UI strings.                          |
| `src/styles/`     | **The theme** — the token chain. See [`DESIGNER.md`](DESIGNER.md).                          |
| `src/guards/`     | **The eight repo-wide invariant sweeps.** Vitest tests; `bun run guards` runs them.         |
| `src/build/`      | Build-time helpers importable by Vite — prerender HTML, dev-server LO pages.                |
| `src/lib/`        | Small pure utilities — asset paths, heading ids, language tagging.                          |
| `src/hooks/`      | React hooks — theme, hydration state, viewport.                                             |
| `src/audio/`      | Audio playback manager and its hook.                                                        |
| `src/showcase/`   | The opt-in debug gallery of every engine with sample content.                               |

### Inside `src/exercises/`

Each engine is a folder with the same shape, and that shape is the recipe for
adding one:

```
src/exercises/select/
  select-schema.ts        the config this engine accepts (Zod)
  select-grading.ts       PURE grading — no React, no DOM
  select-grading.test.ts  colocated tests for the grader
  SelectExercise.tsx      thin view: renders state, calls the grader
  select.css              engine styles, all inside @layer
```

Pure grading is split from the view on purpose: the interesting logic is testable
without rendering anything. `lib/` holds what all engines share (the host, the
footer, the instructions callout, the blank-grading scaffold). `lazyRegistry.ts`
maps an exercise `type` string to its component — **guard e** fails if a declared
type has no engine, or an engine is unregistered.

### Tests live next to the code

There is no `tests/` folder. A test sits beside the file it tests, as
`<name>.test.ts(x)`. Vitest picks up `src/**/*.test.{ts,tsx}` — so **a test only
runs if it is under `src/`**. A test file anywhere else is silently never run.

## `scripts/` — Node-side build steps

Run by `bun`, outside the Vite bundle. Two rules apply here and nowhere else:

- **Never import `src/lo/load-lo-glob.ts`.** `import.meta.glob` is Vite syntax
  and throws under a plain Node runner. `load-lo-disk.ts` is the Node reader.
- Anything reachable from `vite.config.ts` must avoid `@/…` alias imports — the
  config is bundled before its own `resolve.alias` exists.

| Script                  | Does                                                          |
| ----------------------- | ------------------------------------------------------------- |
| `scripts/prerender.tsx` | After `vite build`: writes the landing page + one HTML per LO |

## `docs/` — the written record

| Path                        | Holds                                                         |
| --------------------------- | ------------------------------------------------------------- |
| `docs/TOOLING.md`           | **Why** each tool was chosen, and every build decision, dated |
| `docs/specs/`               | The canonical designs authors build against                   |
| `docs/process/`             | Handovers, buildlist, and `TODO.md` — the live worklist       |
| `docs/BRANCH_PROTECTION.md` | Setup steps for when `main` gets protected                    |

**Start at [`docs/process/TODO.md`](docs/process/TODO.md)** in a new session — it
is the single source of truth for what is still open.

---

## Where does my change go?

| I want to…                             | Touch                                                       |
| -------------------------------------- | ----------------------------------------------------------- |
| add a lesson                           | a new `lo-config/lo-NN-slug/` folder — nothing else         |
| reorder lessons                        | rename the LO folders                                       |
| change a colour or font                | `src/styles/palette.css` — see [`DESIGNER.md`](DESIGNER.md) |
| add an exercise engine                 | a new `src/exercises/<type>/` + a registry entry            |
| change what an exercise config accepts | `src/config/` (schema) — a **contract** change              |
| add audio or images                    | `public/`, mirroring the config's ordinal-type names        |
| change the page chrome                 | `src/components/shell/`                                     |

Anything in the second half of that table re-skins or re-shapes **every** course
built from this template. Those paths are owned in
[`.github/CODEOWNERS`](.github/CODEOWNERS) and need maintainer review — see
[`CONTRIBUTING.md`](CONTRIBUTING.md#adding-content-vs-changing-the-system-read-before-a-pr).

---

## The tree

<!-- docs:tree:start -->
<!-- docs:tree:end -->
