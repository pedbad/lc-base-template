# AGENTS.md

Instructions for AI coding agents working **in this repository**. Vendor-neutral;
read by Cursor, Codex, Claude Code and similar.

Rule-first and deliberately short. It does not restate the human docs — it points
at them. For depth: [`CONTRIBUTING.md`](CONTRIBUTING.md) (workflow),
[`STRUCTURE.md`](STRUCTURE.md) (layout), [`DESIGNER.md`](DESIGNER.md) (theming),
[`docs/TOOLING.md`](docs/TOOLING.md) (why each tool). Start any session at
[`docs/process/TODO.md`](docs/process/TODO.md).

> **Not to be confused with [`public/llms.txt`](public/llms.txt).** That file
> ships in the build (`dist/llms.txt`) and describes the **deployed course** to
> agents that consume the site. This file is not shipped and describes the
> **repository** to agents that edit it. Different audience, different lifecycle:
> update `llms.txt` when the site's pages or engines change; update this when a
> repo rule changes.

---

## Verify before you claim done

```bash
bun run format && bun run lint && bun run lint:css && bun run test:coverage && bun run build && bun run test:e2e
```

- `test:coverage` is `bun run test` plus per-file coverage bars — exactly what CI
  runs, so a file below its bar fails here before it fails there
  (`docs/TOOLING.md`, "Coverage").
- `test:e2e` is the browser suite against the build that precedes it; it needs Node
  and a one-time `bunx playwright install chromium firefox webkit`
  (`docs/TOOLING.md`, "Browser tests"). The debug pages have a second suite, which CI
  also runs; when a change touches them, run it too (same section).
- Use `bun run test` (Vitest). **Never `bun test`** — Bun's runner throws on the
  `import.meta.glob` in `src/lo/load-lo-glob.ts` and reports a false failure.
- `bun run guards` is the fast invariant sweep (~1s). A subset of `test`, never a
  substitute for the gate above.
- Run the gate before every commit. Do not report success without running it. The
  pre-push hook re-runs `guards` and `test`, but it is a backstop, not the gate.

## Hard constraints — these break the build

1. **No `@/…` alias imports in anything reachable from `vite.config.ts`.** The
   config is bundled before its own `resolve.alias` exists. This is why
   `listLoSlugs()` lives in `src/lo/lo-folders.ts` (`node:fs` only).
2. **Never import `src/lo/load-lo-glob.ts` from a Node script.**
   `import.meta.glob` is Vite-only syntax. `load-lo-disk.ts` is the Node reader.
3. **Every URL goes through `%BASE_URL%` (static head), `resolveAsset()`
   (runtime) or `resolveHomeHref()` (page links).** Never a bare relative or
   root-absolute path. A CSS `url()` to a `public/` file is no exception: Vite
   rewrites it against the base only when the file exists at build time, so a
   git-ignored file (Feijoa) escapes the base. Build-time URLs come from a plugin
   that knows the base instead (`src/build/feijoa-fonts.ts`). Verify under a
   sub-path: `BASE_URL=/course/ bun run build`, and `bun run test:e2e` under the same.
4. **Prerendered markup must equal the first client render.** Anything that
   cannot exist server-side goes behind `useIsHydrated`.
5. **Never commit `.claude/tdd-guard/`** or `public/fonts/feijoa/*`.
6. **Debug pages are opt-in and fail closed.** `exercise-showcase.html`,
   `ui-showcase.html` and `debug-sandbox.html` build only under `DEBUG=1 bun run build`. Add a debug
   artifact to `DEBUG_ENTRY_FILES` in `src/build/build-entries.ts`; never as an
   unconditional `rollupOptions.input` entry.

## Content rules

- **Add an LO by copying `lo-config/lo-00-example/`** to `lo-config/lo-NN-slug/`.
  Never edit or delete the example; it hides itself (`CONTRIBUTING.md`).
  Never register it anywhere — a folder is a lesson. Zod must pass at load.
- **Never add an image or audio file the course does not own or may not share**
  (a CD track, a web image without an open licence). Content is published under
  CC BY-NC 4.0; the rule and what is allowed are in `CONTRIBUTING.md`.
- **Course order is the `lo-NN-` ordinal and nothing else**, sorted numerically.
  Do not add an order list; reorder by renaming folders.
- **Render-mirror naming:** `<ordinal>-<type>` inside `blocks/` and `exercises/`,
  numbered LO-wide per kind, not per section (`STRUCTURE.md`). Media under `public/` mirrors the same names. Guard b enforces
  the folder↔config match.

## Code rules

- **Tokens only.** No raw hex outside `src/styles/palette.css`. No raw px on
  spacing/sizing properties — px is legitimate on `border*`, `outline*`,
  `box-shadow`, `backdrop-filter`, `perspective`, `transform`, inside a `calc()`
  that references a token, and in a `@media` breakpoint.
- **Every CSS rule inside `@layer`. No `!important`.**
- **Semantic HTML**, per spec §17. Decorative icons get `aria-hidden`.
- **Reduced motion is read through `prefersReducedMotion()`** (`src/lib/`), and only
  from an event handler or an effect — never at module scope or during render. A
  module-scope `matchMedia` read throws in the Bun prerender; a read during render
  makes the first client render disagree with the prerendered markup. CSS motion
  belongs in a `@media (prefers-reduced-motion: reduce)` block instead, which needs
  no JS at all.
- **A new exercise engine follows the recipe:** schema + pure grading +
  colocated tests + thin view + fixture + registry entry. Copy the shape of
  `src/exercises/reading/`.
- **New code starts from a failing test** — write the test, run it, see it fail, then
  write the code that makes it pass. No hook enforces this by default (the TDD guard
  is opt-in, `docs/TOOLING.md`); CI and review do, so do not skip it.
- **Tests sit beside the code** as `<name>.test.ts(x)`. Vitest only collects
  `src/**/*.test.{ts,tsx}` — a test outside `src/` never runs. The one exception is
  `e2e/`: Playwright specs, run by `test:e2e` (`STRUCTURE.md`).
- Files under 800 lines.

## The eight guards

Guards b–h are Vitest sweeps in `src/guards/` (plus `eslint-plugin-jsx-a11y` for guard
h's per-file half); guard a is the Zod schemas, run on every load and tested in
`src/config/`. All are Vitest tests, so `bun run test` already enforces them. **Do not weaken a
guard to make a change pass** — if a guard fires, the code is wrong, or the rule
genuinely needs a written-down narrowing with its reasoning in the guard header.

The canonical short list is
[`CONTRIBUTING.md` → "The 8 guards"](CONTRIBUTING.md#locked-spec-decisions).
Do not fork a second copy of it.

## Commits

- [Conventional Commits](https://www.conventionalcommits.org/):
  `feat` · `fix` · `refactor` · `docs` · `test` · `chore` · `perf` · `ci`.
- **One concern per commit.**
- Prose docs are not exempt from the gate: Prettier formats markdown and CI runs
  `format:check`.

## Working habits that keep this repo honest

- **Read `docs/process/TODO.md` before starting**, and update it when you finish.
  It is the single source of truth for what is open.
- **Re-read a doc immediately before editing it.** Prettier reflows markdown
  tables on commit, so an exact-string edit written against a stale copy fails.
  Avoid `_underscore_` emphasis inside table cells; use `**bold**`.
- **Do not restate a rule that already lives in another doc.** Link to it. Two
  copies of one rule is the drift the guards exist to prevent.
- **The markdown docs are the single source; the sandbox RENDERS them** (spec
  §14). Never copy prose into `src/sandbox/` — `src/build/docs-markdown.ts` reads
  the real `.md` files. If the hub should show something, put it in the doc.
- When a doc and the code disagree, **the code is the truth** — fix the doc and
  say so.
- **Task recipes live in [`.claude/skills/`](.claude/skills/)** (a lesson, an engine,
  a block type, the theme, a template sync, before a PR, a build for upload). Claude
  Code loads them by itself; other agents can read them. They link to this file and
  never restate it, so when a rule here changes, check the skills that link to it.

---

`CLAUDE.md` is not committed. To have Claude Code read this file under that name,
create a local symlink (git-ignore it, or commit it if the team wants it shared):

```bash
ln -s AGENTS.md CLAUDE.md
```
