# Browser tests — slice E12a design

**Date:** 2026-10-14 · **Status:** built 2026-10-14 (`cbda661`; the E9 case `ec86eb7`), amended below as CI taught us
**TODO:** §E12 (this slice), §E9 (its first real case), §E15 (its prerequisite)
· **Plan:** [`2026-10-14-browser-tests-plan.md`](../process/2026-10-14-browser-tests-plan.md)

## 1. Why

The Vitest suite renders components to strings in Node and never presses a key. 1689
passing tests coexisted with a broken keyboard flow (§E9): in `ChoicePillGroup.tsx` the
arrow keys change the answer but focus stays on the old pill, so Right, Right selects
the second pill twice. Only a real browser sees that. This slice adds a browser suite
that runs in CI against the **built** site, the thing learners actually get, and ships
the E9 fix as its first case.

The repo's recorded **"no jsdom" decision stands** (`docs/TOOLING.md`; TODO §A-h). This
suite runs in real browsers, not in a DOM emulated inside Node, and the Vitest suite
stays `environment: 'node'`.

## 2. Scope

| Slice           | Covers                                                                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **E12a (this)** | the harness, CI under `/` and `/course/`, every page loads clean and passes axe, the E9 keyboard test                                                                 |
| E12b            | answer, check, edit, reveal and reset on the production engines (`select`, `radio-quiz`)                                                                              |
| E12c            | cases that live only in the `DEBUG=1` showcase: audio playing and failing, memory-match resize during "Show answers", sequence-audio scrub; needs a debug build in CI |

E12b and E12c get their own specs. Nothing in this slice tests the debug pages.

## 3. Approach

`@playwright/test` with `@axe-core/playwright`, against `dist/` served by `vite preview`.

Rejected:

- **Vitest browser mode.** One runner, but it renders components in isolation, so it
  misses what this suite is for: prerender/hydration mismatches and base-path bugs.
- **Plain `playwright-core` scripts** (how the hand checks ran). No runner, retries,
  reporting or parallel browsers; it would mean writing a runner.

## 4. Layout and running

- `e2e/` at the repo root holds the specs, `playwright.config.ts` sits beside
  `vite.config.ts`. Outside `src/`, so Vitest never collects them and they do not count
  toward the coverage bars. `tsc -b` type-checks both: the config through
  `tsconfig.node.json`'s `include`, the specs through their own `tsconfig.e2e.json`
  (the only config with DOM types, for code inside `page.evaluate`); ESLint already
  lints the whole tree.
- `playwright.config.ts` starts `vite preview` itself (`webServer`) and sets `baseURL`
  to the preview origin plus `process.env.BASE_URL ?? '/'`. `vite preview` reads the
  same `base` as the build (`vite.config.ts`), so `BASE_URL=/course/` on both the
  build and the test run gives the sub-path run.
- **Browsers: Chromium, Firefox and WebKit**, one Playwright project each (maintainer's
  choice, 2026-10-14, over Chromium only).
- `bun run test:e2e` runs `playwright test`. It needs a build first.
- **Not in the pre-push hook**, which stays fast (guards + Vitest). **In the verify
  gate** after `build`, because the gate is what CI runs.
- **No fixed sleeps.** Only auto-waiting assertions (`toBeFocused()`,
  `toHaveAttribute()`, `toBeVisible()`). Retries in CI only (2); a trace is kept on the
  first retry.
- Output folders `playwright-report/` and `test-results/` are git-, Prettier- and
  ESLint-ignored.

## 5. Tests

### 5.1 `e2e/pages.spec.ts` — every page loads clean

For `index.html` and `example.html`, in every browser:

- **No console errors and no uncaught page errors** from navigation until ready.
  React 19 reports a hydration mismatch (prerendered markup ≠ first client render, hard
  constraint 4 in `AGENTS.md`) as a console error, so this is also the hydration check.
- **No failed requests and no 4xx/5xx responses.** Under `/course/` a bare
  root-absolute URL 404s, so this is the base-path check (hard constraint 3).
- **Ready means:** `load` fired; on `example.html` also a `radiogroup` visible, which
  proves the lazy exercise chunks loaded and hydrated.
- **axe:** zero violations for the tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`,
  `wcag22aa`, on the whole page. The 2026-10-13 hand runs were clean, so any finding is
  real.

_(Amended 2026-10-14, while building: Firefox reports the missing or partly unsupported Feijoa font as a console error, so the spec ignores exactly that message — "downloadable font" naming Feijoa — and nothing else; requesting Feijoa only when its files exist is TODO §E5. And `vite preview` answers a missing file inside the base with 200 (its SPA fallback), so the 4xx check catches base-path mistakes, not every missing file.)_

_(Amended 2026-10-15: the first CI run on `main` failed at `/course/`, because without the font files the Feijoa URL also escaped the base. The `feijoaFonts()` plugin now declares Feijoa only when its files exist (TODO §E5), and the allowance is down to Firefox's "table discarded" notice for the Bold cut, which appears only where the files exist.)_

### 5.2 `e2e/choice-keyboard.spec.ts` — selection and focus move together (E9)

On `example.html`, the radio-quiz's first question. The quiz sets `shuffle: true`, so
pills are addressed **by position** in the group, never by label.

Start: click the first pill (selects and focuses it in every browser; Tab focus on
buttons differs by browser and macOS setting). Then keys only. After each step assert
both the selected pill (`aria-checked="true"`) and the focused pill (`toBeFocused()`):

| Keys                    | Selected and focused |
| ----------------------- | -------------------- |
| Right, Right            | 3rd (the bug: 2nd)   |
| End, Right              | 1st (wraps)          |
| Left; Left              | 3rd (wraps); 2nd     |
| Down, Down; Up          | 3rd; 2nd             |
| End; Home               | 3rd; 1st             |
| Right, Right (tabindex) | only the 3rd is `0`  |

**TDD order:** write this spec, run it against today's code, see it fail in all three
browsers for the reason above; then apply the fix (a ref per pill, focus the target
after `onSelect`, keeping wrap, Home/End and the roving tab stop); see it pass.

## 6. CI

**Node is pinned first (§E15, its own commit):** `.nvmrc` = `22`, `engines.node` =
`>=22.12` (the README's floor), and `actions/setup-node` with `node-version-file:
.nvmrc` in both jobs. Playwright's runner is Node, and the local default was 20.15.

A new job `e2e` beside `verify` in `.github/workflows/ci.yml`:

- `strategy.matrix.base: ['/', '/course/']`, `fail-fast: false`.
- Steps: checkout, setup-bun, setup-node, `bun install --frozen-lockfile`, browsers
  (cache `~/.cache/ms-playwright` keyed on the installed `@playwright/test` version; on
  a miss `playwright install --with-deps chromium firefox webkit`, on a hit
  `playwright install-deps chromium firefox webkit`), `bun run build` and
  `bun run test:e2e` with `BASE_URL: ${{ matrix.base }}`.
- On failure, upload `playwright-report/` and `test-results/` (7 days).
- `timeout-minutes: 15`. Expected 3–4 min per leg.
- A red `e2e` turns CI red like `verify`. It becomes a required check with branch
  protection (§E1).

Locally, once: `bunx playwright install chromium firefox webkit`.

## 7. Docs

- `docs/TOOLING.md` — a "Browser tests (Playwright)" section: why, what it covers, how
  to run it, the three-browser choice, and that "no jsdom" stands.
- `AGENTS.md` — the verify gate gains `&& bun run test:e2e`.
- `CONTRIBUTING.md` — the one-time browser install, linking to TOOLING.
- `docs/process/TODO.md` — E9, E12a and E15 done; E12b and E12c listed.

## 8. Commits

Verify gate before each, one concern each:

1. `docs(specs): browser test suite design (E12a)`
2. `chore: pin Node 22 locally and in CI (E15)`
3. `test(e2e): Playwright suite against the built site, in CI (E12a)`
4. `fix(choice-pills): focus follows the arrow-key selection (E9)` with its spec
5. `docs(todo): E9, E12a and E15 done; E12b and E12c split out`

## 9. Done when

- CI green on `main` with both `e2e` legs, each running all three browsers.
- The E9 spec was seen failing before the fix, in all three browsers.
- `BASE_URL=/course/ bun run build && BASE_URL=/course/ bun run test:e2e` passes
  locally.
