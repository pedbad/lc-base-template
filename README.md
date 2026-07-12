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
**Node** is only a tooling fallback. Vite builds. (Bun installs/runs · Vitest tests · Vite builds.)

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

## License

MIT (code) + CC-BY-4.0 (content) — full `LICENSE` added later. Cambridge branding and the
Feijoa typeface are **not** licensed for reuse; forks must remove or replace them.
