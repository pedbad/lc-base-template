# Tooling Decisions

**Audience:** developers working on or forking this template.
**Purpose:** record _what_ each tool is, _why_ it was chosen, _how_ it helps, and
_what we rejected_ — so future devs inherit the reasoning, not just the result.

This is the rationale companion to the per-file comments in `prettier.config.mjs`
and `eslint.config.js`. The `README` (later) will link here rather than restate it.

> Toolchain is locked by design decision **#8** in the spec
> (`docs/specs/2026-06-15-lc-base-template-design.md`): a **zero-touch** setup —
> `git clone && bun install` and everything works, no manual configuration.

---

## Toolchain at a glance

| Tool                         | Role                                     | Step  |
| ---------------------------- | ---------------------------------------- | ----- |
| **Bun**                      | Package manager · runtime · test runner  | 1, 3  |
| **Vite**                     | Dev server · production bundler          | 2     |
| **TypeScript**               | Language · type safety                   | 2     |
| **Prettier**                 | Code formatter (layout)                  | 4     |
| **ESLint** + **jsx-a11y**    | Linter (correctness + accessibility)     | 5     |
| **eslint-config-prettier**   | Stops ESLint and Prettier fighting       | 5     |
| _Stylelint_                  | _CSS linting (planned)_                  | _6_   |
| _husky · lint-staged_        | _Pre-commit guard (planned)_             | _7_   |
| _Tailwind · shadcn · Lucide_ | _Styling · components · icons (planned)_ | _8–9_ |

---

## Division of labour (important mental model)

Two separate jobs, never overlapping:

- **Prettier owns _layout_** — how code _looks_: quotes, indentation, line width,
  trailing commas. It rewrites files to one style.
- **ESLint owns _correctness_** — _bugs and bad patterns_: unused vars, Rules of
  Hooks violations, accessibility mistakes.

They are deliberately kept apart so they never undo each other's work
(see `eslint-config-prettier` below).

---

## Enforcement layers

Formatting and linting are **checked**, not merely suggested. Three layers, weakest
to strongest:

1. **Editor (format-on-save)** — `.vscode/settings.json`. Convenience only; works
   in VS Code with the Prettier extension installed. Not a guarantee.
2. **Pre-commit hook** — husky + lint-staged (Step 7). Blocks unformatted /
   lint-failing commits locally. Bypassable with `--no-verify`.
3. **CI** — GitHub Actions (later step) re-runs `format:check` + `lint` + guards.
   The unbypassable wall: a `--no-verify` commit still fails here before merge.

Layer 1 is the carrot; layers 2–3 are the stick.

---

## Decisions

### Bun — package manager, runtime, test runner

- **What:** an all-in-one JS toolkit. Installs deps, runs scripts, runs tests.
- **Why:** one tool instead of three (npm/yarn + node + jest/vitest). Fast. Setup
  collapses to `git clone && bun install`. Lockfile (`bun.lock`) pins exact
  versions so every clone is reproducible.
- **How it helps:** zero-touch onboarding (spec #8); identical dependency trees
  across all courses spun from the template.
- **Rejected:** npm/pnpm + a separate test runner — more moving parts, slower.
- **Note:** Bun is **not** the bundler — Vite is. Bun installs/runs/tests; Vite builds.

### Vite — dev server + bundler

- **What:** the dev server (instant hot-reload) and production build tool.
- **Why:** fast, first-class React + TypeScript support, supports the multi-page
  entries (debug sandbox, showcase) and static pre-render the template needs.
- **How it helps:** sub-second dev feedback; the static-pre-render build (one
  `.html` per Learning Object) is a Vite build step.
- **Rejected:** Create-React-App (deprecated), Webpack (slower, heavier config).

### TypeScript — language + type safety

- **What:** JavaScript with static types.
- **Why:** the template validates Learning-Object configs at compile/load time
  (with Zod, later). Types catch config drift — the class of bug that repeatedly
  hurt the reference project (`instructionsText` vs `informationText`, etc.).
- **How it helps:** errors surface in the editor, before runtime.
- **Note:** `.tsx` = a TypeScript file that also contains **JSX** (the HTML-like
  React markup). `.ts` = TypeScript with no markup (schemas, utils, config).

### Prettier — code formatter _(Step 4)_

- **What:** an opinionated formatter that rewrites files to one consistent style.
- **Why:** ends style debates and style-only diffs; every clone formats identically.
  Config rationale lives in `prettier.config.mjs` (per-setting comments).
- **How it helps:** `bun run format` fixes the whole repo; `format:check` verifies
  it (used by CI). Format-on-save makes it invisible day to day.
- **Key choices:** `singleQuote`, `printWidth: 100`, `trailingComma: all`,
  `arrowParens: always`, `endOfLine: lf` (+ `.gitattributes` so git enforces LF
  too — protects against CRLF churn on Windows clones of this public repo).
- **Rejected:** ESLint stylistic rules for formatting — Prettier is purpose-built
  and faster to agree with.

### ESLint + eslint-plugin-jsx-a11y — linter + accessibility _(Step 5)_

- **What:** ESLint flags incorrect code; `jsx-a11y` adds accessibility rules over
  the JSX markup in `.tsx` files (missing `alt`, keyboard-unreachable handlers,
  bad ARIA).
- **Why:** accessibility is **non-negotiable and CI-gated** (spec guard **h**).
  `jsx-a11y` is the _lint half_ of that guard — it catches a11y bugs **as you
  type a component**, so every ported exercise is accessible from birth. The
  static-page half (axe/pa11y over rendered pages) lands in a later guard step.
- **How it helps:** `bun run lint` must pass before commit (Step 7) and in CI.
- **Choice:** `recommended` ruleset, not `strict` — lightweight now; stricter
  rules can be layered later without churn (avoids over-engineering a bare repo).
- **Known wrinkle:** `eslint-plugin-jsx-a11y@6.10` declares a peer range up to
  ESLint 9, so `bun install` warns under ESLint 10. It uses the stable flat-config
  API and runs correctly (verified by a clean `bun run lint`). The note in
  `eslint.config.js` is removed once the plugin ships ESLint 10 support.

### eslint-config-prettier — the truce _(Step 5)_

- **What:** a config that switches **off** every ESLint rule that overlaps with
  Prettier's formatting.
- **Why:** without it, ESLint and Prettier fight — one flags what the other just
  fixed, looping forever.
- **How it helps:** ESLint stops policing layout entirely; Prettier owns it.
  Must be **last** in `eslint.config.js` so its "off" switches win.
- **Rejected:** hand-disabling individual rules — brittle as the ruleset grows.

---

_Append a new section here as each tool lands (Stylelint, husky, Tailwind, …)._
