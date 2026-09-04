# Contributing

How to work in this repo: setup, everyday commands, the commit gate, and conventions.

> **Living document.** This is a stub. It grows one section per build step as features
> land (guards, per-LO authoring loop, exercise contract, theming). Sections marked
> _“Coming”_ below are placeholders for locked spec decisions not yet built — see
> `docs/specs/2026-06-15-lc-base-template-design.md` §14 for the full planned scope.
>
> For **why** each tool was chosen (not how to use it), see [`docs/TOOLING.md`](docs/TOOLING.md).
>
> For **what is still open on the template itself**, see
> [`docs/process/TODO.md`](docs/process/TODO.md) — the live worklist, ordered, with the
> constraints and the verify gate at the top. Start there in a new session.

---

## Prerequisites

- **[Bun](https://bun.com)** ≥ 1.3 — package manager and script runner. Tests run on
  **Vitest** (via `bun run test`), not Bun's built-in `bun test` — see [docs/TOOLING.md](docs/TOOLING.md).
  Install: `curl -fsSL https://bun.com/install | bash`. No separate Node/npm needed.

## Getting started

```bash
git clone https://github.com/pedbad/lc-base-template.git
cd lc-base-template
bun install     # installs deps AND self-installs the git pre-commit hook (zero-touch)
bun run dev     # start the Vite dev server
```

`bun install` runs the `prepare` script, which installs husky — so the commit gate
below is active immediately, no manual `git config` step.

## Everyday commands

| Command                | What it does                                                         |
| ---------------------- | -------------------------------------------------------------------- |
| `bun run dev`          | Vite dev server, hot reload — landing page and every LO page         |
| `bun run build`        | Type-check + bundle + prerender the landing page and one HTML per LO |
| `bun run preview`      | Serve the production build locally                                   |
| `bun run test`         | Run the test suite (Vitest, one-shot)                                |
| `bun run test:watch`   | Vitest in watch mode                                                 |
| `bun run lint`         | ESLint over the repo                                                 |
| `bun run lint:css`     | Stylelint over `src/**/*.css`                                        |
| `bun run format`       | Prettier — rewrite all files to the house style                      |
| `bun run format:check` | Prettier — verify formatting without writing                         |

Serving from a sub-path (both deploy targets do) is one env var — it feeds the bundle
and the prerender pass together, so hashed assets, the favicon and runtime audio/image
URLs all resolve against the same base:

```bash
BASE_URL=/course/ bun run build
```

## Authoring a Learning Object

An LO is a folder under `lo-config/`; it exists because the folder exists. Nothing in
the app enumerates LOs — adding a folder adds its page **and its card on the landing
page**, with no code change.

1. Copy `lo-config/lo-00-example/` to `lo-config/lo-NN-your-slug/` — the `lo-NN-`
   ordinal is the course order (see below), and the URL drops it (`your-slug.html`).
2. Edit `lo.json` and each `blocks/*/block.json` / `exercises/*/exercise.json`.
3. `bun run build && bun run preview` to click through the whole course.

### What an LO's card on the landing page reads from

Three `lo.json` fields do double duty as that LO's card:

| Field         | On the card                                                      |
| ------------- | ---------------------------------------------------------------- |
| `title`       | the card heading (and the page's `<h1>` and `<title>`)           |
| `description` | the blurb (and the page's meta description). Optional.           |
| `image`       | the illustration. Optional — omit it and the card shows an icon. |

`image` is a path under `public/`, written the way you'd author any asset
(`images/your-lo.webp`); the app resolves it against the deploy base, so never write a
bare relative or root-absolute URL. Out of the box `lo-00-example` points at the shared
`images/lo-placeholder.svg` — drop your own file into `public/images/` and name it there.

### Course order has one source: the folder ordinal

The `lo-NN-` number in the folder name orders the cards, the lesson nav and the build.
It is sorted **numerically**, so `lo-9-` precedes `lo-10-` (alphabetically it would
not). `course.config.ts` has no order list — a second source for the same fact would
be free to drift from the folders silently. **To reorder a course, rename folders.**

### The authoring loop

```bash
bun run dev                        # write content: hot reload, and cards actually work
bun run build && bun run preview   # the real static pages, before you ship
```

`bun run dev` serves the landing page at `/` and each LO at `/<slug>.html`. Those files
are written by the prerender pass and so do not exist during `dev`; a serve-only Vite
plugin (`src/build/lo-dev-pages.ts`) answers those URLs instead, stamping the LO's
folder onto the dev `index.html` through the same `injectRootDiv()` the prerender pass
uses. It renders nothing of its own, and reads the LO list from `lo-config/` per
request — so a new folder is live on the next reload, with nothing to register.

**Dev does not prerender.** An LO page there is client-rendered, so `dev` proves
content, layout and behaviour, while the no-JS static page — the thing that deploys —
is only proven by `build && preview`. Run that before you ship, and after any change
to page structure.

A malformed LO fails the **build** with the offending file named — it never emits a
half-rendered page. Two folders that derive the same slug fail too, naming both.
(The same malformed-folder error surfaces on a dev request, so you meet it early.)

## Code quality & the commit gate

Formatting and linting are **enforced, not suggested**. Three layers, weakest to
strongest (full rationale in [`docs/TOOLING.md`](docs/TOOLING.md#enforcement-layers)):

1. **Editor** — format-on-save via `.vscode/settings.json` (convenience).
2. **Pre-commit hook** — husky runs `lint-staged` on **staged files only**: Prettier
   and ESLint on JS/TS, Prettier and Stylelint on CSS, Prettier on JSON/MD/config.
   Auto-fixable issues are fixed and re-staged silently; an unfixable problem
   (e.g. an unused variable) **blocks the commit**.
3. **CI** — GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml))
   re-runs `lint` · `lint:css` · `format:check` · `test` · `build` on every PR. The
   unbypassable wall.

You can bypass the local hook with `git commit --no-verify`, but CI will still catch
it before merge. Don't rely on bypass.

## Commit conventions

- **[Conventional Commits](https://www.conventionalcommits.org/):** `<type>: <description>`.
  Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.
- **One concern per commit** — keep changes small and reviewable.
- **No `Co-Authored-By` trailers** — attribution is disabled for this repo.

Examples:

```
feat: add SelectExercise component
fix: correct gap index in fill-gaps runtime
docs: document husky pre-commit hook
chore: bump Stylelint to 17
```

---

## Adding content vs. changing the system (READ before a PR)

This is a **template**: many people will author Learning Objects from it. The rule that
keeps every course consistent — **add content as data; don't quietly change the machinery.**

**Green path (author freely, normal review):**

- New LO content, fixtures, and `lo-config/` JSON.
- Copy an existing exercise fixture, change the Spanish content, wire it into the showcase.
- Docs and process notes.

**Requires maintainer review (owned in [`.github/CODEOWNERS`](.github/CODEOWNERS)):**

- `src/styles/**` — design tokens, theme, global CSS. Drift here re-skins every course.
- `src/config/**` — the LO / exercise **schemas** and course config (the content contract).
- `src/exercises/lazyRegistry.ts` + `src/exercises/lib/**` — core engine wiring / shared scaffold.
- `.github/**`, `vite.config.ts`, `package.json`, `bun.lock`, tsconfig/eslint/prettier/stylelint,
  `.claude/settings.json` — build, CI, and the TDD-guard setup.
- `docs/specs/**` — the canonical specs authors build against.

If a content PR finds itself editing a file in the second list, that's the signal to **stop
and ask** — usually the content model needs extending, not the component patched.

**Every PR** goes through [`.github/pull_request_template.md`](.github/pull_request_template.md):
green `bun run test · lint · build`, plus the keyboard / landmark / contrast / screenshot
checks CI can't fully judge.

**`main` is NOT protected yet.** While the template is a single-maintainer build, changes
go straight to `main` and the verify gate above is run by hand before each commit. Branch
protection — PR required, CI required to merge — goes on **before the repo is shared with
other developers**; it is a pre-share checklist item, not an oversight. Setup steps and the
single-maintainer lockout to avoid: [`docs/BRANCH_PROTECTION.md`](docs/BRANCH_PROTECTION.md).

> Note: adding a new **exercise engine** (not just content) follows the engine recipe —
> schema + pure grading + colocated tests + thin view + fixture + registry entry. See a
> recent engine (`src/exercises/reading/`) as the reference shape.

---

## Coming as the template grows

These are locked spec decisions, documented here when each lands:

- **Naming & render-mirror** _(spec §15)_ — `lo-01` not `lo1`, `images/` not `img/`,
  section-scoped ordinal+type folders (`01-fill-gaps/`). File structure mirrors the
  rendered page; a guard enforces folder↔config match.
- **Exercise authoring contract** — the config shape each exercise type expects.
- **The 7 guards** _(spec §11)_ — what each checks, what fails, and how to fix it.
- **Theming & tokens** — single-theme-per-clone, tokens only (no raw hex/px),
  CSS in `@layer`, no `!important`.
