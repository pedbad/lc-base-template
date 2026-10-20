# STYLE.md — how the code is written

**For anyone writing TypeScript, React or CSS in this repo.** Most of the style is
enforced by tools, so you cannot get it wrong for long: the pre-commit hook formats and
lints what you stage, and CI fails what slips through. This page says what the tools
check, points at the repo's own rules instead of copying them, and writes down the
habits nothing enforces.

Measured against `src/` on 2026-10-21 (226 source files, the vendored
`src/components/ui/` left out). When this page and the code disagree, the code wins:
fix the page.

## What the tools enforce

| Tool           | Owns                                           | Config                                                         | Run                |
| -------------- | ---------------------------------------------- | -------------------------------------------------------------- | ------------------ |
| **Prettier**   | layout: every `.ts`, `.tsx`, `.css`, `.md`     | [`prettier.config.mjs`](../prettier.config.mjs)                | `bun run format`   |
| **ESLint**     | correctness, React hooks, accessibility in JSX | [`eslint.config.js`](../eslint.config.js)                      | `bun run lint`     |
| **TypeScript** | types, strictly                                | [`tsconfig.app.json`](../tsconfig.app.json) and its neighbours | `bun run build`    |
| **Stylelint**  | CSS: tokens, `@layer`, no vendor prefixes      | [`stylelint.config.mjs`](../stylelint.config.mjs)              | `bun run lint:css` |
| **The guards** | repo-wide invariants (a–h)                     | `src/guards/`                                                  | `bun run guards`   |

In practice that means: single quotes, semicolons, trailing commas, lines up to 100
characters; no unused variables or parameters; no `any` (there is none in `src/`); no
`enum` or other TypeScript-only runtime syntax (`erasableSyntaxOnly`); and a type-only
import says so (`import type { X }`, or `import { type X, y }`), because
`verbatimModuleSyntax` is on. ESLint checks correctness, not looks, and its config ends
with `eslint-config-prettier` so the two never disagree.

## Rules that live elsewhere

These are rules, not habits, and each has one home. Read them there:

- [`AGENTS.md` → "Hard constraints"](../AGENTS.md#hard-constraints--these-break-the-build)
  — the things that break the build: no `@/` imports where `vite.config.ts` reaches,
  every URL through the address helpers, prerendered markup equal to the first client
  render, debug pages opt-in.
- [`AGENTS.md` → "Code rules"](../AGENTS.md#code-rules) — tokens only, `@layer`,
  semantic HTML, reduced motion through `prefersReducedMotion()`, new code from a failing
  test, tests beside the code, files under 800 lines, the exercise-engine recipe.
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — the commit gate and the eight guards.
- [`DESIGNER.md`](../DESIGNER.md) — how the theme tokens are organised.

## Habits nothing enforces

Follow these in new code. Do not rename or reshape existing files just to match them:
churn costs more than consistency gains.

### Files and names

| What                        | Name                                                      | Example                                      |
| --------------------------- | --------------------------------------------------------- | -------------------------------------------- |
| A React component           | PascalCase, `.tsx`                                        | `ProgressMeter.tsx`                          |
| A hook                      | `use` + PascalCase, `.ts`                                 | `useFlipCue.ts`                              |
| Any other module            | kebab-case, `.ts`                                         | `flip-cue-store.ts`, `reading-grading.ts`    |
| A component's own styles    | kebab-case `.css`, beside it                              | `progress-meter.css`, imported by the `.tsx` |
| A test                      | the file's name + `.test.ts(x)`                           | `flip-cue-store.test.ts`, beside it          |
| An exercise engine's pieces | `<engine>-schema`, `<engine>-grading`, `<Engine>Exercise` | `src/exercises/reading/`                     |

Kebab-case is the rule for plain modules (103 of 137). About twenty older modules are
camelCase, named after the one function they export (`prefersReducedMotion.ts`,
`charDiff.ts`); leave them, but name a new one in kebab-case.

### Exports and functions

- **`export function`, not `export const x = () =>`** (279 to 18). Arrow functions are
  for callbacks and small values inside a function.
- **Exercise engines are default exports**: `src/exercises/lazyRegistry.ts` loads each
  with `lazy()`, which needs one. Other components use either; match the files around
  yours.
- One component per file, plus its small private helpers.

### Types

- **An object shape is an `interface`** (205 to 2); a union, a tuple or an alias is a
  `type`.
- **Props are `interface <Component>Props`**, destructured in the parameter list:
  `export function ProgressMeter({ correct, total }: ProgressMeterProps)`.
- Types parsed from content come from the Zod schema (`z.infer`), not a second
  hand-written copy of it.

### Imports

In this order, as most files already do: React; other packages; `@/…` (another folder
of `src/`); `./…` (this folder); the component's own `.css` last. Use `@/` across
folders and a relative path within one.

### Comments

Almost every file (221 of 226) opens with a header comment: what the file is, and
**why** it is shaped the way it is. Keep that up:

- Say why, not what. The code already says what.
- When you chose against an obvious alternative, name it and the reason, so nobody
  "fixes" it back.
- Point at the record: a TODO item (`TODO §E24`), a spec section, or the guard that
  checks it.
- A comment that has stopped being true is worse than none; fix it in the same commit.

### Errors and logging

- No `console.log` in committed code (there is none).
- `console.warn` for something that went wrong and was recovered from, saying what
  happened and what the code did instead (`flip cue: could not read …; showing the cue`).
- Fail loudly at build time: a bad lesson, a missing file or a reshaped template throws
  with the offending path named, rather than shipping a half-built page.

### React

- Browser-only things (`window`, `localStorage`, `matchMedia`) are read in an effect or
  an event handler, never during render or at module scope (`AGENTS.md`, hard constraint
  4 and "Code rules").
- State that a parent drives through a ref uses React 19's `ref` prop, not
  `forwardRef`.

### Tests

- Vitest: `describe` per unit, `test` per behaviour (`it` also appears; either is fine).
  Name the behaviour: `test('a ./ build takes the folder the page is served from')`.
- Most component tests render to a string (`renderToStaticMarkup`) in Node. Only a test
  that must replay real DOM events opts in to happy-dom, per file
  ([`docs/TOOLING.md`](TOOLING.md), "Config").

## When unsure

Copy the nearest file that does the same kind of job, and match it. The engine recipe
in `AGENTS.md` exists for exactly that reason.
