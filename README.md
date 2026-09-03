<div align="center">

# lc-base-template

**A course-factory template** — clone it, theme it, drop in Learning Object JSON,
ship a static LTR-language course from a menu of ready exercise types.

![Bun](https://img.shields.io/badge/Bun-1.3-000000?logo=bun&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?logo=shadcnui&logoColor=white)

![License](https://img.shields.io/badge/code-MIT-yellow)
![Content License](https://img.shields.io/badge/content-CC--BY--4.0-lightgrey)
![Status](https://img.shields.io/badge/status-under_construction-orange)

</div>

---

## Prerequisites

Verified toolchain (macOS, 2026-06-16):

| Tool                                      | Minimum       | Tested  |
| ----------------------------------------- | ------------- | ------- |
| [Bun](https://bun.sh)                     | ≥ 1.3         | 1.3.14  |
| [Node.js](https://nodejs.org)             | ≥ 22.12 (LTS) | 22.19.0 |
| [Git](https://git-scm.com)                | ≥ 2.40        | 2.50.1  |
| [GitHub CLI](https://cli.github.com) `gh` | ≥ 2.0         | 2.94.0  |

**Bun** is the package manager and runtime; **Vitest** is the test runner (`bun run test`).
**Node** is only a tooling fallback. (Bun installs/runs · Vitest tests · Vite bundles ·
Bun prerenders the static pages.)

## Setup

```bash
git clone <repo-url>
cd lc-base-template
bun install
```

### Fonts (Cambridge developers)

Body text (**Open Sans**) works out of the box — no action needed.

**Feijoa** (headings) is commercial and not committed to this repo. If you hold a
Cambridge/Klim licence, copy your font files into **`public/fonts/feijoa/`**:

| File                                | weight | style  |
| ----------------------------------- | ------ | ------ |
| `Feijoa-Medium-Cambridge.otf`       | 500    | normal |
| `Feijoa-MediumItalic-Cambridge.otf` | 500    | italic |
| `Feijoa-Bold-Cambridge.otf`         | 700    | normal |

These are git-ignored — they will **not** be committed or pushed. Until added,
headings fall back to Open Sans. Full details (incl. optional `.woff2`
optimisation): [`public/fonts/feijoa/README.md`](public/fonts/feijoa/README.md).

_(More steps added as the template grows.)_

## Build

```bash
bun run build     # type-check, bundle, then prerender the landing page + one HTML file per LO
bun run preview   # serve the built output locally
```

The build emits **one real HTML file per folder in `lo-config/`** (`lo-00-example` →
`dist/example.html`) plus **`dist/index.html`, the course landing page** — hero copy
from `src/config/course.config.ts` and one card per LO, linking to that LO's page.
Each page's body is already rendered, so a course reads and navigates with JavaScript
disabled, and hydrates into the interactive app when JavaScript runs. Exercises need
JavaScript and say so on the static page.

**LO order is the `lo-NN-` number in each LO's folder name, and nothing else** — cards,
the lesson nav and the build all read that one source, sorted numerically (so `lo-9-`
comes before `lo-10-`). There is deliberately no order list in `course.config.ts` to
drift from the folders. Move a lesson by renaming its folder.

### Previewing a course while you author it

`bun run dev` serves the whole course with hot reload — the landing page at `/`, and
each LO at `/<slug>.html`, so lesson cards and the lesson nav work as they do in
production. `<slug>.html` files themselves only exist after a build, so a small
serve-only Vite plugin answers those URLs by stamping the LO's folder onto the dev
`index.html`; the LO list is read from `lo-config/` per request, so a new folder is
live on the next reload with nothing to register.

```bash
bun run dev                        # author content, hot reload, cards work
bun run build && bun run preview   # the real static pages, before you ship
```

**The dev server does not prerender.** An LO page there is client-rendered, so it
proves content, layout and behaviour — not the no-JS static page. Check that with
`build && preview`, which is what actually deploys.

Serving from a sub-path takes one env var, which feeds both the bundle and the
prerender pass:

```bash
BASE_URL=/course/ bun run build
```

Why each tool was chosen: [`docs/TOOLING.md`](docs/TOOLING.md). How to work in the
repo: [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

Dual-licensed — see [`LICENSE`](LICENSE) for the full text and the file-by-file
breakdown. Copyright in both rests with **The Language Centre, University of Cambridge**.

- **Code** (`src/`, `scripts/`, tooling config) — MIT.
- **Learning content** (`lo-config/`, authored media, `docs/`) — CC BY 4.0: reuse it
  anywhere, including on your own servers, as long as you credit the Language Centre.

Cambridge branding and the Feijoa typeface are **not** licensed for reuse; forks must
remove or replace them.
