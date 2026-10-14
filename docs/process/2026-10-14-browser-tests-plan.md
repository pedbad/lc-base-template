# Browser tests (E12a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Playwright suite that runs in CI against the built site in Chromium, Firefox and WebKit, under `/` and `/course/`, and ships the E9 keyboard fix as its first real case.

**Architecture:** `@playwright/test` starts `vite preview` on the built `dist/` and drives three browsers. `e2e/pages.spec.ts` checks every page loads with no console errors, no failed requests and no axe violations; `e2e/choice-keyboard.spec.ts` checks that arrow keys move the radio-quiz selection and focus together. A new CI job runs the suite twice, once per base path.

**Tech Stack:** `@playwright/test` 1.63.0 (exact), `@axe-core/playwright` 4.13, Vite preview, GitHub Actions, Node 22 (pinned in Task 1).

**Spec:** [`docs/specs/2026-10-14-browser-tests-design.md`](../specs/2026-10-14-browser-tests-design.md). TODO §E9, §E12, §E15.

---

## Before you start

- Read `AGENTS.md`. Rules that bite here: **`bun run test`, never `bun test`**; run the verify gate before every commit; one concern per commit; Conventional Commits; re-read a markdown doc right before editing it (Prettier reflows tables).
- Node: the machine's default `node` may be older than 22.12. Before any command in this plan, run `nvm use` (after Task 1 creates `.nvmrc`) or put a Node ≥ 22.12 first on `PATH`. Check with `node --version`.
- The verify gate (Tasks 1–3 use it as is; Task 3 extends it):

```bash
bun run format && bun run lint && bun run lint:css && bun run test:coverage && bun run build
```

Expected: exit 0, `Test Files 161 passed`, `Tests 1689 passed` (the counts at the start of this plan).

## File map

| File                                    | Task | Responsibility                                                     |
| --------------------------------------- | ---- | ------------------------------------------------------------------ |
| `.nvmrc`                                | 1    | the Node major for local and CI                                    |
| `package.json`                          | 1, 2 | `engines.node`; the two devDependencies and `test:e2e`             |
| `.github/workflows/ci.yml`              | 1, 3 | `setup-node` in `verify`; the new `e2e` job                        |
| `README.md`                             | 1, 3 | the pinned Node; Node needed for `test:e2e`                        |
| `playwright.config.ts`                  | 2    | browsers, base URL, the preview server, retries                    |
| `tsconfig.node.json`                    | 2    | type-check the config and `e2e/`                                   |
| `.gitignore`, `.prettierignore`, ESLint | 2    | ignore `playwright-report/` and `test-results/`                    |
| `e2e/pages.spec.ts`                     | 2    | every page: clean load, no failed requests, axe                    |
| `docs/TOOLING.md`                       | 3    | the "Browser tests (Playwright)" decision section                  |
| `AGENTS.md`, `CONTRIBUTING.md`          | 3    | gate gains `test:e2e`; one-time browser install; the command table |
| `e2e/choice-keyboard.spec.ts`           | 4    | E9: arrow keys move selection and focus together                   |
| `src/exercises/lib/ChoicePillGroup.tsx` | 4    | the E9 fix                                                         |
| `docs/process/TODO.md`                  | 5    | E9, E12a, E15 done; E12b, E12c listed                              |

Commits: Task 1 = `chore: pin Node 22 locally and in CI (E15)`; Tasks 2–3 = one commit `test(e2e): Playwright suite against the built site, in CI (E12a)`; Task 4 = `fix(choice-pills): focus follows the arrow-key selection (E9)`; Task 5 = `docs(todo): …`.

---

### Task 1: Pin Node 22 (E15)

Configuration only, so there is no failing unit test to write; the check is that CI's log shows the pinned Node (Task 5).

**Files:**

- Create: `.nvmrc`
- Modify: `package.json` (top level, after `"type"`)
- Modify: `.github/workflows/ci.yml` (the `verify` job, after "Set up Bun")
- Modify: `README.md` (the paragraph under the prerequisites table)

- [ ] **Step 1: Create `.nvmrc`**

```
22
```

- [ ] **Step 2: Add `engines` to `package.json`**

Insert directly after the `"type": "module",` line:

```json
  "engines": {
    "node": ">=22.12"
  },
```

- [ ] **Step 3: Add `setup-node` to the `verify` job in `.github/workflows/ci.yml`**

After the "Set up Bun" step (before "Install dependencies"):

```yaml
# `bun run` hands Vite, Vitest, ESLint and Prettier to Node when Node is on the
# PATH, so CI pins the same Node as `.nvmrc` instead of whatever the runner image
# ships (TODO §E15). An exact tag at least two weeks old when adopted.
- name: Set up Node
  uses: actions/setup-node@v7.0.0
  with:
    node-version-file: .nvmrc
```

- [ ] **Step 4: Point the README at `.nvmrc`**

Re-read `README.md` first. In the paragraph that begins `**Bun** is the package manager and runtime`, after the sentence ending `(Vite will not run on older Node).`, add:

```markdown
`.nvmrc` pins the major version (`nvm use` picks it up) and CI uses the same file.
```

- [ ] **Step 5: Run the verify gate**

Run: `nvm use && node --version && bun run format && bun run lint && bun run lint:css && bun run test:coverage && bun run build`
Expected: `v22.x`, then exit 0 with 1689 tests passing.

- [ ] **Step 6: Commit**

```bash
git add .nvmrc package.json .github/workflows/ci.yml README.md
git commit -m "chore: pin Node 22 locally and in CI (E15)"
```

---

### Task 2: The Playwright harness and `pages.spec.ts`

**Files:**

- Modify: `package.json` (devDependencies, scripts)
- Create: `playwright.config.ts`
- Modify: `tsconfig.node.json:23` (`include`)
- Modify: `.gitignore`, `.prettierignore`, `eslint.config.js:44`
- Create: `e2e/pages.spec.ts`

- [ ] **Step 1: Add the dependencies and install the browsers**

```bash
bun add -d --exact @playwright/test@1.63.0
bun add -d @axe-core/playwright@^4.13.0
bunx playwright install chromium firefox webkit
```

Expected: both packages in `devDependencies` (`"@playwright/test": "1.63.0"`, no caret), then three browser downloads.

- [ ] **Step 2: Add the script to `package.json`**

In `"scripts"`, after `"test:coverage"`:

```json
    "test:e2e": "playwright test",
```

- [ ] **Step 3: Create `playwright.config.ts`**

```ts
/**
 * playwright.config.ts — the browser suite (TODO §E12, spec
 * docs/specs/2026-10-14-browser-tests-design.md). Runs against the BUILT site: build
 * first, then `bun run test:e2e`. `vite preview` reads the same BASE_URL as the build
 * (vite.config.ts), so `BASE_URL=/course/` on both gives the sub-path run.
 *
 * Not imported by vite.config.ts, so the `@/` alias rule (AGENTS.md hard constraint 1)
 * does not reach it; it imports nothing from src/ anyway.
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BASE_PATH = process.env.BASE_URL ?? '/';
const SITE_URL = `http://localhost:${PORT}${BASE_PATH}`;
const IS_CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: IS_CI,
  // Retries only in CI, where a trace of the retried run is kept for the report.
  retries: IS_CI ? 2 : 0,
  reporter: IS_CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    // Specs navigate with RELATIVE paths ('example.html'), so they resolve under the base.
    baseURL: SITE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `bun run preview --port ${PORT} --strictPort`,
    url: SITE_URL,
    reuseExistingServer: !IS_CI,
  },
});
```

- [ ] **Step 4: Type-check the config and the specs**

In `tsconfig.node.json`, replace `"include": ["vite.config.ts"]` with:

```json
  "include": ["vite.config.ts", "playwright.config.ts", "e2e"]
```

- [ ] **Step 5: Ignore Playwright's output**

Append to `.gitignore`:

```
# Playwright output (bun run test:e2e) — regenerated every run, never committed
playwright-report/
test-results/
```

Append to `.prettierignore` under `# Generated / build output`, after `coverage`:

```
playwright-report
test-results
```

In `eslint.config.js`, replace `globalIgnores(['dist']),` with:

```js
  globalIgnores(['dist', 'playwright-report', 'test-results']),
```

- [ ] **Step 6: Write `e2e/pages.spec.ts`**

```ts
/**
 * pages.spec.ts — every built page loads clean and passes axe (spec §5.1).
 *
 * "Clean" is three checks in one: no console error and no uncaught error (React 19
 * reports a hydration mismatch as an error, so this is also the hydration check,
 * AGENTS.md hard constraint 4), and no request that failed or answered 4xx/5xx (under
 * BASE_URL=/course/ a root-absolute URL 404s, so this is the base-path check, hard
 * constraint 3).
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** axe rule tags: WCAG 2.0, 2.1 and 2.2, levels A and AA. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

interface PageCase {
  /** Relative to the base URL — never a leading slash. */
  path: string;
  /** Resolves once the page is hydrated and its lazy parts have loaded. */
  ready: (page: Page) => Promise<void>;
}

const PAGES: PageCase[] = [
  { path: 'index.html', ready: async () => {} },
  {
    path: 'example.html',
    // The exercise engines are lazy chunks that render only after hydration
    // (ExerciseHost). A radiogroup in the DOM proves both happened. Attached, not
    // visible: the exercises sit in closed <details>, and role queries skip hidden
    // elements, so this is a CSS locator.
    ready: async (page) => {
      await expect(page.locator('[role="radiogroup"]').first()).toBeAttached();
    },
  },
];

/**
 * A request the browser cancelled itself (a media range request superseded by the next
 * one) is not a broken one. A missing file still answers 4xx and is still caught.
 */
const isCancelled = (errorText: string | undefined): boolean =>
  /aborted|cancelled/i.test(errorText ?? '');

/** Collects every problem from this moment on. */
function watchForProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console error: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`uncaught: ${error.message}`));
  page.on('requestfailed', (request) => {
    const errorText = request.failure()?.errorText;
    if (!isCancelled(errorText)) problems.push(`request failed: ${request.url()} (${errorText})`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  return problems;
}

for (const { path, ready } of PAGES) {
  test.describe(path, () => {
    test('loads and hydrates with no errors and no failed requests', async ({ page }) => {
      const problems = watchForProblems(page);
      await page.goto(path, { waitUntil: 'load' });
      await ready(page);
      expect(problems).toEqual([]);
    });

    test('has no axe violations (WCAG 2.2 A and AA)', async ({ page }) => {
      await page.goto(path, { waitUntil: 'load' });
      await ready(page);
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}
```

- [ ] **Step 7: Build, then run the suite at `/`**

Run: `bun run build && bun run test:e2e`
Expected: `12 passed` (2 pages × 2 tests × 3 browsers). If a check fails, it has found a real problem in the site: stop and report it with the failure output; do not loosen the check.

- [ ] **Step 8: Run it at `/course/`**

Run: `BASE_URL=/course/ bun run build && BASE_URL=/course/ bun run test:e2e`
Expected: `12 passed`.

- [ ] **Step 9: Prove the base-path check bites**

Build for `/` but serve and test as `/course/`, so the page asks for `/assets/…` and those requests 404:

Run: `bun run build && BASE_URL=/course/ bun run test:e2e --project=chromium -g "loads and hydrates"`
Expected: FAIL, the `problems` array listing `HTTP 404: http://localhost:4173/assets/…` lines (or the page not loading at all). Then rebuild normally: `bun run build`.

No commit yet: the suite is not in CI until Task 3.

---

### Task 3: CI job and docs

**Files:**

- Modify: `.github/workflows/ci.yml` (new `e2e` job after `verify`)
- Modify: `docs/TOOLING.md` (new section after "Coverage", before "Vite")
- Modify: `AGENTS.md` (the verify gate)
- Modify: `CONTRIBUTING.md` (Getting started, Everyday commands, the CI layer)
- Modify: `README.md` (Node for `test:e2e`)

- [ ] **Step 1: Add the `e2e` job to `.github/workflows/ci.yml`**

Append under `jobs:`, after the whole `verify` job, at the same indent:

```yaml
# The browser suite (TODO §E12, docs/TOOLING.md "Browser tests"): the BUILT site in
# Chromium, Firefox and WebKit, once per base path so a root-absolute URL that only
# works at / fails here. Beside `verify`, not after it, so both report at once.
e2e:
  name: Browser tests (${{ matrix.base }})
  runs-on: ubuntu-latest
  timeout-minutes: 15
  strategy:
    fail-fast: false
    matrix:
      base: ['/', '/course/']
  env:
    BASE_URL: ${{ matrix.base }}
  steps:
    - name: Checkout
      uses: actions/checkout@v5

    - name: Set up Bun
      uses: oven-sh/setup-bun@v2
      with:
        bun-version: '1.3'

    # Playwright's runner is Node, not Bun.
    - name: Set up Node
      uses: actions/setup-node@v7.0.0
      with:
        node-version-file: .nvmrc

    - name: Install dependencies
      run: bun install --frozen-lockfile

    # Browsers are ~500 MB; cache them per Playwright version. On a hit only the
    # Linux system libraries are installed, which the cache cannot hold.
    - name: Read the Playwright version
      id: playwright
      run: echo "version=$(node -p "require('./node_modules/@playwright/test/package.json').version")" >> "$GITHUB_OUTPUT"

    - name: Cache Playwright browsers
      id: browser-cache
      uses: actions/cache@v6.1.0
      with:
        path: ~/.cache/ms-playwright
        key: playwright-${{ runner.os }}-${{ steps.playwright.outputs.version }}

    - name: Install browsers
      if: steps.browser-cache.outputs.cache-hit != 'true'
      run: bunx playwright install --with-deps chromium firefox webkit

    - name: Install browser system libraries
      if: steps.browser-cache.outputs.cache-hit == 'true'
      run: bunx playwright install-deps chromium firefox webkit

    - name: Build
      run: bun run build

    - name: Browser tests (Playwright)
      run: bun run test:e2e

    - name: Upload the report
      if: failure()
      uses: actions/upload-artifact@v7.0.1
      with:
        name: playwright-report-${{ strategy.job-index }}
        path: |
          playwright-report/
          test-results/
        retention-days: 7
```

- [ ] **Step 2: Add the TOOLING section**

Re-read `docs/TOOLING.md` first. Insert before the line `### Vite — dev server + bundler`:

```markdown
### Browser tests (Playwright) — the built site in three browsers _(decision 2026-10-14, TODO §E12)_

- **What:** `bun run test:e2e` runs `playwright test` against the **built** `dist/`,
  served by `vite preview`, in Chromium, Firefox and WebKit. Specs live in `e2e/`, the
  config in `playwright.config.ts`. Build first.
- **Why:** the Vitest suite renders to strings in Node and never presses a key. 1689
  green tests coexisted with a broken keyboard flow (§E9). Only a real browser sees
  focus, hydration and a sub-path's URLs.
- **Covers today (slice E12a):** every page loads with no console error, no uncaught
  error, no failed request and no axe violation (WCAG 2.2 A + AA); the choice pills'
  arrow keys move selection and focus together. Exercise flows (E12b) and the
  showcase-only cases (E12c) come next.
- **Three browsers, not one** (maintainer's choice): WebKit stands in for Safari.
- **CI:** the `e2e` job runs the suite twice, at `/` and at `/course/`, beside
  `verify`. A failure uploads the HTML report and traces as an artifact.
- **Not in the pre-push hook**, which stays fast. **In the verify gate**, after `build`.
- **Needs Node** (≥ 22.12, `.nvmrc`): Playwright's runner does not run on Bun.
- **Once per machine:** `bunx playwright install chromium firefox webkit`.
- **"No jsdom" still stands** (§A-h): this suite runs in real browsers, and Vitest stays
  `environment: 'node'`.
- **Rules:** navigate with relative paths (`'example.html'`, never `'/example.html'`) so
  the base applies; no fixed sleeps, only auto-waiting assertions.
```

- [ ] **Step 3: Extend the gate in `AGENTS.md`**

Re-read `AGENTS.md` first. Replace the gate line:

```bash
bun run format && bun run lint && bun run lint:css && bun run test:coverage && bun run build
```

with:

```bash
bun run format && bun run lint && bun run lint:css && bun run test:coverage && bun run build && bun run test:e2e
```

and add a bullet directly under the `test:coverage` bullet:

```markdown
- `test:e2e` is the browser suite against the build that precedes it; it needs Node
  and a one-time `bunx playwright install chromium firefox webkit`
  (`docs/TOOLING.md`, "Browser tests").
```

- [ ] **Step 4: Update `CONTRIBUTING.md`**

Re-read `CONTRIBUTING.md` first. Three edits:

(a) In "Getting started", after the paragraph ending `no manual \`git config\` step.`, add:

```markdown
Once per machine, for the browser tests:
`bunx playwright install chromium firefox webkit` (`docs/TOOLING.md`, "Browser tests").
```

(b) In the "Everyday commands" table, after the `bun run test:coverage` row:

```markdown
| `bun run test:e2e` | Browser tests against the last build — Chromium, Firefox, WebKit |
```

(c) In "Code quality & the commit gate", item 4, replace
`re-runs \`lint\` · \`lint:css\` · \`format:check\` · \`test:coverage\` · \`build\` on every`with`re-runs \`lint\` · \`lint:css\` · \`format:check\` · \`test:coverage\` · \`build\` · \`test:e2e\` on every`.

- [ ] **Step 5: README — Node for `test:e2e`**

Re-read `README.md`. After the sentence added in Task 1 Step 4, add:

```markdown
The browser tests (`bun run test:e2e`) are the exception: Playwright's runner needs
Node.
```

- [ ] **Step 6: Run the extended gate**

Run: `bun run format && bun run lint && bun run lint:css && bun run test:coverage && bun run build && bun run test:e2e`
Expected: exit 0; 1689 Vitest tests; `12 passed` from Playwright.

- [ ] **Step 7: Commit**

```bash
git add package.json bun.lock playwright.config.ts tsconfig.node.json .gitignore .prettierignore eslint.config.js e2e/pages.spec.ts .github/workflows/ci.yml docs/TOOLING.md AGENTS.md CONTRIBUTING.md README.md
git commit -m "test(e2e): Playwright suite against the built site, in CI (E12a)"
```

---

### Task 4: E9 — focus follows the arrow-key selection (TDD)

**Files:**

- Create: `e2e/choice-keyboard.spec.ts`
- Modify: `src/exercises/lib/ChoicePillGroup.tsx` (import line 33, `handleKeyDown`, the pill `<button>`)

- [ ] **Step 1: Write the failing spec `e2e/choice-keyboard.spec.ts`**

```ts
/**
 * choice-keyboard.spec.ts — arrow keys move the choice pills' selection AND focus
 * together (TODO §E9, spec §5.2). The bug: ChoicePillGroup's handleKeyDown called
 * onSelect(next) but left focus on the old pill, so the next arrow press started from
 * there again — Right, Right selected the second pill twice. The group is shared by
 * radio-quiz, reading and inline-choice; this drives radio-quiz on example.html.
 *
 * The quiz sets `shuffle: true`, so pills are addressed by POSITION, never by label.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

/** Opens the radio-quiz accordion and returns question 1's three pills, in order. */
async function firstQuestionPills(page: Page): Promise<Locator[]> {
  await page.goto('example.html');
  const quiz = page.locator('details', { has: page.locator('#exercise-02-radio-quiz-heading') });
  await quiz.locator('summary').click();
  const pills = quiz
    .getByRole('radiogroup', { name: 'Choose answer for question 1' })
    .getByRole('radio');
  await expect(pills).toHaveCount(3);
  return [pills.nth(0), pills.nth(1), pills.nth(2)];
}

/** Exactly pill `index` is checked, and it has focus. */
async function expectSelectedAndFocused(pills: Locator[], index: number) {
  for (const [position, pill] of pills.entries()) {
    await expect(pill).toHaveAttribute('aria-checked', position === index ? 'true' : 'false');
  }
  await expect(pills[index]).toBeFocused();
}

test.describe('choice pills: arrow keys move selection and focus together', () => {
  let pills: Locator[];

  test.beforeEach(async ({ page }) => {
    pills = await firstQuestionPills(page);
    // Click selects; focus() as well because a click does not focus a button in every
    // browser (WebKit follows macOS, where it does not). From here on, keys only.
    await pills[0].click();
    await pills[0].focus();
    await expectSelectedAndFocused(pills, 0);
  });

  test('Right, Right lands on the third pill', async ({ page }) => {
    await page.keyboard.press('ArrowRight');
    await expectSelectedAndFocused(pills, 1);
    await page.keyboard.press('ArrowRight');
    await expectSelectedAndFocused(pills, 2);
  });

  test('Right from the last pill wraps to the first', async ({ page }) => {
    await page.keyboard.press('End');
    await page.keyboard.press('ArrowRight');
    await expectSelectedAndFocused(pills, 0);
  });

  test('Left from the first pill wraps to the last, then keeps going', async ({ page }) => {
    await page.keyboard.press('ArrowLeft');
    await expectSelectedAndFocused(pills, 2);
    await page.keyboard.press('ArrowLeft');
    await expectSelectedAndFocused(pills, 1);
  });

  test('Down and Up move like Right and Left', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expectSelectedAndFocused(pills, 2);
    await page.keyboard.press('ArrowUp');
    await expectSelectedAndFocused(pills, 1);
  });

  test('End and Home jump', async ({ page }) => {
    await page.keyboard.press('End');
    await expectSelectedAndFocused(pills, 2);
    await page.keyboard.press('Home');
    await expectSelectedAndFocused(pills, 0);
  });

  test('only the selected pill is a Tab stop after arrowing', async ({ page }) => {
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(pills[0]).toHaveAttribute('tabindex', '-1');
    await expect(pills[1]).toHaveAttribute('tabindex', '-1');
    await expect(pills[2]).toHaveAttribute('tabindex', '0');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `bun run build && bun run test:e2e e2e/choice-keyboard.spec.ts`
Expected: all 6 tests FAIL in all three browsers (18 failed). The single-key steps fail on `toBeFocused()`: the selection moved (`aria-checked` matches) but focus is still on the first pill — "Right, Right" fails at its first step, `expectSelectedAndFocused(pills, 1)`. Tests whose second key runs from the stale focus fail on `aria-checked` instead (the tab-stop test sees the 2nd pill as the stop, not the 3rd). Confirm every failure is one of those two, not a locator error. If a locator errors (`toHaveCount(3)` timing out), fix the spec, not the code, and re-run.

- [ ] **Step 3: Write the fix in `src/exercises/lib/ChoicePillGroup.tsx`**

Change the import (line 33):

```ts
import { type KeyboardEvent, useRef } from 'react';
```

Replace the two comment lines above `const handleKeyDown` with the ref and an extended comment:

```ts
// One button per option, so a key press can move focus along with the selection.
const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);

// Arrow keys move the selection within the group (roving focus); Space/Enter
// re-commit the focused pill. Ported from inline-choice's handleChoiceKeyDown.
// Focus follows the selection (TODO §E9): left on the old pill, the next arrow
// press started from there again, so Right, Right selected the second pill twice.
```

At the end of `handleKeyDown`, after `onSelect(nextIndex);`:

```ts
pillRefs.current[nextIndex]?.focus();
```

On the pill `<button>`, after the `onKeyDown` prop:

```tsx
            ref={(pill) => {
              pillRefs.current[optionIndex] = pill;
            }}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `bun run build && bun run test:e2e e2e/choice-keyboard.spec.ts`
Expected: `18 passed` (6 tests × 3 browsers).

- [ ] **Step 5: Run the extended gate**

Run: `bun run format && bun run lint && bun run lint:css && bun run test:coverage && bun run build && bun run test:e2e`
Expected: exit 0; 1689 Vitest tests; `30 passed` from Playwright.

- [ ] **Step 6: Run it at `/course/`**

Run: `BASE_URL=/course/ bun run build && BASE_URL=/course/ bun run test:e2e`
Expected: `30 passed`. Then `bun run build` to leave a normal build behind.

- [ ] **Step 7: Commit**

```bash
git add e2e/choice-keyboard.spec.ts src/exercises/lib/ChoicePillGroup.tsx
git commit -m "fix(choice-pills): focus follows the arrow-key selection (E9)"
```

---

### Task 5: Push, check CI, update TODO

**Files:**

- Modify: `docs/process/TODO.md` (§E9, §E12, §E15, "Next", the "Done recently" table)

- [ ] **Step 1: Push and watch CI**

```bash
git fetch && git status -sb
git push
gh run watch --exit-status $(gh run list --branch main --limit 1 --json databaseId --jq '.[0].databaseId')
```

Expected: three jobs green — `Lint, test, build`, `Browser tests (/)`, `Browser tests (/course/)`. In each job's "Set up Node" log, the resolved version is `22.x` (the E15 check). If an `e2e` leg fails, download its artifact (`gh run download <id>`), read the trace, fix, and push a `fix(e2e): …` commit; never relax a check to get green.

- [ ] **Step 2: Update `docs/process/TODO.md`**

Re-read it first. Then:

- §E9: heading gains `**DONE 2026-10-14**` with the Task 4 commit hash; one sentence: fixed with a ref per pill, tested by `e2e/choice-keyboard.spec.ts` in three browsers, seen failing first.
- §E12: split into **E12a — DONE 2026-10-14** (hash of the Task 3 commit; what it covers, one line, link the spec), **E12b** (answer, check, edit, reveal, reset on `select` and `radio-quiz`; own spec) and **E12c** (the memory-match and sequence-audio cases already listed there, plus audio playing and failing; needs a `DEBUG=1` build in CI; own spec). Keep the existing E12 case descriptions under E12c rather than rewriting them.
- §E15: `**DONE 2026-10-14**` with the Task 1 hash; CI log shows Node 22.
- "Next": the next coding items are E10 then E11.
- "Done recently" table: one row each for E15, E12a, E9.

- [ ] **Step 3: Gate and commit**

```bash
bun run format && bun run lint && bun run lint:css && bun run test:coverage && bun run build && bun run test:e2e
git add docs/process/TODO.md
git commit -m "docs(todo): E9, E12a and E15 done; E12b and E12c split out"
git push
```
