# Contributing

How to work in this repo: setup, everyday commands, the commit gate, and conventions.

> **Living document.** This is a stub. It grows one section per build step as features
> land (guards, per-LO authoring loop, exercise contract, theming). Sections marked
> _“Coming”_ below are placeholders for locked spec decisions not yet built — see
> `docs/specs/2026-06-15-lc-base-template-design.md` §14 for the full planned scope.
>
> For **why** each tool was chosen (not how to use it), see [`docs/TOOLING.md`](docs/TOOLING.md).

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

| Command                | What it does                                    |
| ---------------------- | ----------------------------------------------- |
| `bun run dev`          | Vite dev server with hot reload                 |
| `bun run build`        | Type-check (`tsc -b`) + production build        |
| `bun run preview`      | Serve the production build locally              |
| `bun run test`         | Run the test suite (Vitest, one-shot)           |
| `bun run test:watch`   | Vitest in watch mode                            |
| `bun run lint`         | ESLint over the repo                            |
| `bun run lint:css`     | Stylelint over `src/**/*.css`                   |
| `bun run format`       | Prettier — rewrite all files to the house style |
| `bun run format:check` | Prettier — verify formatting without writing    |

## Code quality & the commit gate

Formatting and linting are **enforced, not suggested**. Three layers, weakest to
strongest (full rationale in [`docs/TOOLING.md`](docs/TOOLING.md#enforcement-layers)):

1. **Editor** — format-on-save via `.vscode/settings.json` (convenience).
2. **Pre-commit hook** — husky runs `lint-staged` on **staged files only**: Prettier
   and ESLint on JS/TS, Prettier and Stylelint on CSS, Prettier on JSON/MD/config.
   Auto-fixable issues are fixed and re-staged silently; an unfixable problem
   (e.g. an unused variable) **blocks the commit**.
3. **CI** — re-runs the checks (later step). The unbypassable wall.

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

## Coming as the template grows

These are locked spec decisions, documented here when each lands:

- **Naming & render-mirror** _(spec §15)_ — `lo-01` not `lo1`, `images/` not `img/`,
  section-scoped ordinal+type folders (`01-fill-gaps/`). File structure mirrors the
  rendered page; a guard enforces folder↔config match.
- **Per-LO authoring loop** _(spec §13)_ — copy the example LO JSON, edit content,
  add assets, preview, commit.
- **Exercise authoring contract** — the config shape each exercise type expects.
- **The 7 guards** _(spec §11)_ — what each checks, what fails, and how to fix it.
- **Theming & tokens** — single-theme-per-clone, tokens only (no raw hex/px),
  CSS in `@layer`, no `!important`.
