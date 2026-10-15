# Exercise flows and axe in open states (E12b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Playwright specs that walk the `select` and `radio-quiz` exercises through answer → check → edit → reveal → reset, and run axe with accordions, modals, a select dropdown and a hover card open, in light and dark.

**Architecture:** Three spec files in `e2e/` share one helper module, `e2e/support.ts`, which takes the helpers `pages.spec.ts` and `choice-keyboard.spec.ts` now keep inline. Everything runs against the built site (`vite preview`) in Chromium, Firefox and WebKit through the existing `playwright.config.ts` and CI job. No app code changes unless a check finds a real defect (spec §7).

**Tech Stack:** `@playwright/test`, `@axe-core/playwright`, Bun scripts (`bun run build`, `bun run test:e2e`). Spec: [`docs/specs/2026-10-15-exercise-flows-axe-design.md`](../specs/2026-10-15-exercise-flows-axe-design.md).

**Ground rules (AGENTS.md):** `bun run test`, never `bun test`. The e2e suite needs Node 22 (`.nvmrc`) and a build first. Every relative URL in a spec is relative (`'example.html'`), so it resolves under `/course/` too. Waits are auto-waiting conditions, never `waitForTimeout`.

---

## Facts the code relies on (checked 2026-10-15)

- `example.html` holds two exercises in closed `<details>` (LoAccordion): select, heading
  `#exercise-01-select-heading`; radio-quiz, heading `#exercise-02-radio-quiz-heading`.
  LoAccordion intercepts the summary click and animates `.details-inner` with the Web
  Animations API.
- Both set `shuffle: true`. Radio-quiz answers: question 1 "Buenos días" (wrong: "¡Hola!",
  "¿Qué tal?"), question 2 "martes". Explanations: question 1's starts "«Buenos días» es
  formal". Select sentences: "Yo … de Madrid." (soy), "Tú … muy amable." (eres), "Ella …
  profesora de español." (es); each blank's options are soy/eres/es.
- Footer buttons: "Check" (disabled until something is answered), "Reset" and "Show
  answers" (not rendered until they apply). Show answers appears after one failed Check
  while anything is wrong.
- Progress line: `role="status"`, text "{correct} correct out of {total}".
- Radio pills: `role="radiogroup"` named "Choose answer for question N", pills
  `role="radio"` with `aria-checked`, roving `tabindex`.
- Select blanks: a Base UI Select per blank, trigger labelled "Answer for blank N" (N is
  the blank's index in RENDER order, which shuffles), popup `role="listbox"`, options
  `role="option"`.
- Popup links: "open the example popup", "open the conjugation popup"; the modal is a
  Base UI Dialog, `role="dialog"`.
- Hover term: the `data-hover-target="lo-json"` trigger in the intro; focus opens the card
  and sets `aria-expanded="true"`.
- Dark mode: `index.html`'s inline script adds `.dark` when nothing is stored and
  `prefers-color-scheme: dark` matches, so `test.use({ colorScheme: 'dark' })` is enough.

## File structure

| File                          | Responsibility                                                 |
| ----------------------------- | -------------------------------------------------------------- |
| `e2e/support.ts`              | Shared helpers and the two exercise heading ids                |
| `e2e/pages.spec.ts`           | Unchanged checks; imports helpers from `support.ts`            |
| `e2e/choice-keyboard.spec.ts` | Unchanged checks; opens the quiz with `openExercise()`         |
| `e2e/exercise-flows.spec.ts`  | Radio-quiz and select flows, and the Tab/Shift+Tab path        |
| `e2e/axe-open-states.spec.ts` | axe in open states, light and dark; both pages as loaded, dark |

---

### Task 1: Extract `e2e/support.ts`

A refactor: behaviour must not change, so the existing 30 tests are the test.

**Files:**

- Create: `e2e/support.ts`
- Modify: `e2e/pages.spec.ts` (delete the inline `WCAG_TAGS`, `isCancelled`, `isKnownFeijoaFontNotice`, `watchForProblems`, `animationsSettled`; import them)
- Modify: `e2e/choice-keyboard.spec.ts` (`firstQuestionPills` uses `openExercise`)

- [ ] **Step 1: Run the suite green first**

Run: `bun run build && bun run test:e2e`
Expected: `30 passed`.

- [ ] **Step 2: Create `e2e/support.ts`**

Move the four helpers and the two predicates verbatim from `pages.spec.ts` (their doc
comments come with them), export them, and add:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page } from '@playwright/test';

/** The example LO's exercise headings. They follow the render-mirror folder names
 *  (`exercises/01-select`, `exercises/02-radio-quiz`), so renaming a folder renames
 *  these: one place to change. */
export const EXERCISE_HEADINGS = {
  select: '#exercise-01-select-heading',
  radioQuiz: '#exercise-02-radio-quiz-heading',
} as const;

/** Waits for every animation inside `scope` to finish: the auto-waiting condition after
 *  an interaction that starts one. `animationsSettled()` is for page load. */
export async function animationsInside(scope: Locator): Promise<void> {
  await scope.evaluate((element) =>
    Promise.all(element.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))),
  );
}

/**
 * Opens an exercise's accordion on the current page and returns its <details>. Waits for
 * the open animation: in WebKit a click landing within milliseconds of the content
 * appearing was occasionally lost (about 1 run in 60-160; 360 of 360 passed without the
 * animation), so wait as a person would, for the panel to finish opening.
 */
export async function openExercise(page: Page, headingId: string): Promise<Locator> {
  const details = page.locator('details', { has: page.locator(headingId) });
  await details.locator('summary').click();
  await expect(details).toHaveAttribute('open', '');
  await animationsInside(details.locator('.details-inner'));
  return details;
}

/** Runs axe with the E12a tags and fails with the violations listed. */
export async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations).toEqual([]);
}
```

In `pages.spec.ts`, replace the moved code with
`import { animationsSettled, expectNoAxeViolations, watchForProblems } from './support';`
and the axe test body's last two lines with `await expectNoAxeViolations(page);`. Drop the
now-unused `AxeBuilder` import.

In `choice-keyboard.spec.ts`, `firstQuestionPills` becomes:

```ts
async function firstQuestionPills(page: Page): Promise<Locator[]> {
  await page.goto('example.html');
  const quiz = await openExercise(page, EXERCISE_HEADINGS.radioQuiz);
  const pills = quiz
    .getByRole('radiogroup', { name: 'Choose answer for question 1' })
    .getByRole('radio');
  await expect(pills).toHaveCount(3);
  return [pills.nth(0), pills.nth(1), pills.nth(2)];
}
```

with `import { EXERCISE_HEADINGS, openExercise } from './support';`. Its WebKit comment
moves to `openExercise`'s doc comment (above), so it is not lost.

- [ ] **Step 3: Run the suite again**

Run: `bun run lint && bun run build && bun run test:e2e`
Expected: `30 passed`, lint clean (`tsconfig.e2e.json` type-checks `e2e/`).

- [ ] **Step 4: Commit**

```bash
git add e2e/support.ts e2e/pages.spec.ts e2e/choice-keyboard.spec.ts
git commit -m "refactor(e2e): share the browser-test helpers in e2e/support.ts"
```

---

### Task 2: Radio-quiz flow

**Files:**

- Create: `e2e/exercise-flows.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
/**
 * exercise-flows.spec.ts — the learner's path through an exercise in a real browser
 * (TODO §E12b, spec docs/specs/2026-10-15-exercise-flows-axe-design.md §4): answer,
 * Check, change an answer, Show answers, Reset. Read the way a learner or a screen
 * reader meets it: aria-checked, button names, the progress line. Both exercises
 * shuffle, so options are chosen by label, never by position.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

import { EXERCISE_HEADINGS, openExercise } from './support';

const button = (scope: Locator, name: string) => scope.getByRole('button', { name, exact: true });
const progress = (scope: Locator) => scope.getByRole('status');

/** Nothing answered: Check disabled, no Reset, no Show answers, nothing checked. */
async function expectFreshStart(exercise: Locator): Promise<void> {
  await expect(button(exercise, 'Check')).toBeDisabled();
  await expect(button(exercise, 'Reset')).toHaveCount(0);
  await expect(button(exercise, 'Show answers')).toHaveCount(0);
}

test.describe('radio-quiz: answer, check, edit, reveal, reset', () => {
  let quiz: Locator;
  const question = (n: number) =>
    quiz.getByRole('radiogroup', { name: `Choose answer for question ${n}` });
  const pick = (n: number, label: string) =>
    question(n).getByRole('radio', { name: label, exact: true }).click();
  const explanation1 = () => quiz.getByText('«Buenos días» es formal', { exact: false });

  test.beforeEach(async ({ page }) => {
    await page.goto('example.html');
    quiz = await openExercise(page, EXERCISE_HEADINGS.radioQuiz);
  });

  test('starts with nothing answered', async () => {
    await expect(quiz.getByRole('radio', { checked: true })).toHaveCount(0);
    await expectFreshStart(quiz);
  });

  test('Check grades, explains the wrong answer and offers Show answers', async () => {
    await pick(1, '¡Hola!');
    await pick(2, 'martes');
    await button(quiz, 'Check').click();
    await expect(progress(quiz)).toHaveText('1 correct out of 2');
    await expect(explanation1()).toBeVisible();
    await expect(quiz.getByText('«Martes» es un día', { exact: false })).toHaveCount(0);
    await expect(button(quiz, 'Show answers')).toBeVisible();
  });

  test('changing the wrong answer clears its verdict, then Check gives full marks', async () => {
    await pick(1, '¡Hola!');
    await pick(2, 'martes');
    await button(quiz, 'Check').click();
    await pick(1, 'Buenos días');
    await expect(explanation1()).toHaveCount(0);
    await button(quiz, 'Check').click();
    await expect(progress(quiz)).toHaveText('2 correct out of 2');
    await expect(button(quiz, 'Show answers')).toHaveCount(0);
  });

  test('Show answers selects every correct option and hides explanations', async () => {
    await pick(1, '¡Hola!');
    await button(quiz, 'Check').click();
    await button(quiz, 'Show answers').click();
    await expect(question(1).getByRole('radio', { name: 'Buenos días' })).toBeChecked();
    await expect(question(2).getByRole('radio', { name: 'martes' })).toBeChecked();
    await expect(explanation1()).toHaveCount(0);
    await expect(button(quiz, 'Show answers')).toHaveCount(0);
  });

  test('Reset returns to the start', async () => {
    await pick(1, '¡Hola!');
    await button(quiz, 'Check').click();
    await button(quiz, 'Reset').click();
    await expect(quiz.getByRole('radio', { checked: true })).toHaveCount(0);
    await expectFreshStart(quiz);
  });
});
```

- [ ] **Step 2: Run it**

Run: `bun run build && bunx playwright test e2e/exercise-flows.spec.ts`
Expected: 15 passed (5 × 3 browsers). If a check fails, compare it with the real
behaviour before touching anything: a wrong assumption in the spec is fixed in the spec;
a real defect follows spec §7.

- [ ] **Step 3: See it fail against a planted break**

In `src/exercises/radio-quiz/RadioQuizExercise.tsx`, temporarily change `const handleReset = reset;`
to `const handleReset = () => {};`, then
`bun run build && bunx playwright test e2e/exercise-flows.spec.ts -g "Reset" --project chromium`.
Expected: FAIL ("Reset returns to the start"). Then
`const showExplanation = Boolean(question.explanation);` (explanation never clears):
expected FAIL in the edit and reveal tests. Revert both with
`git checkout src/exercises/radio-quiz/RadioQuizExercise.tsx`, rebuild, and confirm 15
passed.

- [ ] **Step 4: Commit**

```bash
git add e2e/exercise-flows.spec.ts
git commit -m "test(e2e): radio-quiz flow — answer, check, edit, reveal, reset (E12b)"
```

---

### Task 3: Select flow

**Files:**

- Modify: `e2e/exercise-flows.spec.ts` (append)

- [ ] **Step 1: Append the select describe**

```ts
test.describe('select: answer, check, edit, reveal, reset', () => {
  let page: Page;
  let exercise: Locator;
  /** The blank in the line whose sentence contains `words` (rows shuffle). Each line is
   *  a `div.leading-loose` holding its text and its one select (SelectExercise.tsx). */
  const blankIn = (words: string) =>
    exercise.locator('div.leading-loose', { hasText: words }).getByRole('combobox');
  async function choose(words: string, option: string): Promise<void> {
    await blankIn(words).click();
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await listbox.getByRole('option', { name: option, exact: true }).click();
    await expect(listbox).toHaveCount(0);
  }

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('example.html');
    exercise = await openExercise(page, EXERCISE_HEADINGS.select);
  });

  test('starts with nothing answered', async () => {
    await expectFreshStart(exercise);
  });

  test('Check grades and offers Show answers; fixing the wrong one gives full marks', async () => {
    await choose('de Madrid', 'eres');
    await choose('muy amable', 'eres');
    await choose('profesora de español', 'es');
    await button(exercise, 'Check').click();
    await expect(progress(exercise)).toHaveText('2 correct out of 3');
    await expect(button(exercise, 'Show answers')).toBeVisible();
    await choose('de Madrid', 'soy');
    await button(exercise, 'Check').click();
    await expect(progress(exercise)).toHaveText('3 correct out of 3');
    await expect(button(exercise, 'Show answers')).toHaveCount(0);
  });

  test('Show answers fills every blank correctly', async () => {
    await choose('de Madrid', 'eres');
    await button(exercise, 'Check').click();
    await button(exercise, 'Show answers').click();
    await expect(blankIn('de Madrid')).toHaveText('soy');
    await expect(blankIn('muy amable')).toHaveText('eres');
    await expect(blankIn('profesora de español')).toHaveText('es');
  });

  test('Reset returns to the start', async () => {
    await choose('de Madrid', 'eres');
    await button(exercise, 'Check').click();
    await button(exercise, 'Reset').click();
    await expectFreshStart(exercise);
  });
});
```

- [ ] **Step 2: Run, then see it fail**

Run: `bun run build && bunx playwright test e2e/exercise-flows.spec.ts`
Expected: 27 passed (9 × 3). Plant `const handleReset = () => {};` in
`SelectExercise.tsx`, rebuild, run `-g "select" --project chromium`: expected FAIL on
Reset. Revert with `git checkout src/exercises/select/SelectExercise.tsx`, rebuild,
confirm green.

- [ ] **Step 3: Commit**

```bash
git add e2e/exercise-flows.spec.ts
git commit -m "test(e2e): select flow — answer, check, edit, reveal, reset (E12b)"
```

---

### Task 4: Tab and Shift+Tab through the radio-quiz, from nothing selected

**Files:**

- Modify: `e2e/exercise-flows.spec.ts` (append inside the radio-quiz describe)

- [ ] **Step 1: Append the test**

```ts
test('Tab moves between questions, not between pills (roving tab stop)', async ({ page }) => {
  const firstPill = (n: number) => question(n).getByRole('radio').first();
  await quiz.locator('summary').focus();
  // Tab on until focus reaches a pill: anything focusable in the instructions comes
  // first. Bounded, so a broken tab order fails instead of looping.
  for (let presses = 0; presses < 10; presses += 1) {
    await page.keyboard.press('Tab');
    if (await firstPill(1).evaluate((el) => el === document.activeElement)) break;
  }
  await expect(firstPill(1)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(firstPill(2)).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(firstPill(1)).toBeFocused();
});
```

WebKit only moves focus to buttons with Tab when "Press Tab to highlight each item" is
on; Playwright's WebKit build follows that macOS rule. If the test fails in WebKit only
for that reason, skip it there with
`test.skip(browserName === 'webkit', 'WebKit: Tab skips buttons by default (macOS rule)')`
and say so in the test's comment. Any other failure is a real finding (spec §7).

- [ ] **Step 2: Run, then see it fail**

Run: `bun run build && bunx playwright test e2e/exercise-flows.spec.ts -g "Tab moves"`
Expected: PASS. Plant a break in `src/exercises/lib/ChoicePillGroup.tsx`: make every pill
`tabIndex={0}`. Expected FAIL (the second Tab lands on question 1's second pill). Revert
with `git checkout`, rebuild, confirm green.

- [ ] **Step 3: Commit**

```bash
git add e2e/exercise-flows.spec.ts
git commit -m "test(e2e): Tab and Shift+Tab move between questions, not pills (E12b)"
```

---

### Task 5: axe in open states, light and dark

**Files:**

- Create: `e2e/axe-open-states.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
/**
 * axe-open-states.spec.ts — axe with things OPEN, in light and dark (TODO §E12b, spec
 * docs/specs/2026-10-15-exercise-flows-axe-design.md §5). pages.spec.ts checks each page
 * as loaded, where the exercises sit in closed <details> and no overlay exists, so axe
 * never measured them. Dark follows prefers-color-scheme when nothing is stored
 * (index.html's inline script), so colorScheme emulation is enough.
 */
import { expect, test, type Page } from '@playwright/test';

import {
  EXERCISE_HEADINGS,
  animationsInside,
  animationsSettled,
  expectNoAxeViolations,
  openExercise,
} from './support';

/** Opens every closed accordion that is visible, until none is left (opening one can
 *  reveal another, such as a transcript). Bounded so a summary that will not open fails
 *  loudly instead of looping. */
async function openEveryAccordion(page: Page): Promise<void> {
  for (let round = 0; round < 20; round += 1) {
    const closed = page.locator('details:not([open]) > summary').filter({ visible: true });
    if ((await closed.count()) === 0) return;
    const summary = closed.first();
    await summary.click();
    await animationsInside(summary.locator('..'));
  }
  throw new Error('accordions kept appearing after 20 rounds');
}

async function openPopup(page: Page, linkText: string): Promise<void> {
  await page.getByRole('link', { name: linkText }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await animationsInside(dialog);
}

const OPEN_STATES: { name: string; open: (page: Page) => Promise<void> }[] = [
  { name: 'every accordion open', open: openEveryAccordion },
  { name: 'example popup open', open: (page) => openPopup(page, 'open the example popup') },
  {
    name: 'conjugation popup open',
    open: (page) => openPopup(page, 'open the conjugation popup'),
  },
  {
    name: 'select dropdown open',
    open: async (page) => {
      const exercise = await openExercise(page, EXERCISE_HEADINGS.select);
      await exercise.getByRole('combobox').first().click();
      const listbox = page.getByRole('listbox');
      await expect(listbox).toBeVisible();
      await animationsInside(listbox);
    },
  },
  {
    name: 'hover card open',
    open: async (page) => {
      // HoverTerm renders the term as a <button aria-expanded>; focus opens its card.
      const term = page.getByRole('button', { name: "Learning Object's JSON" });
      await term.focus();
      await expect(term).toHaveAttribute('aria-expanded', 'true');
      await animationsSettled(page);
    },
  },
];

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme });

    if (colorScheme === 'dark') {
      for (const path of ['index.html', 'example.html']) {
        test(`${path} as loaded has no axe violations`, async ({ page }) => {
          await page.goto(path);
          await expect(page.locator('html')).toHaveClass(/\bdark\b/);
          await animationsSettled(page);
          await expectNoAxeViolations(page);
        });
      }
    }

    for (const { name, open } of OPEN_STATES) {
      test(`example.html with ${name} has no axe violations`, async ({ page }) => {
        await page.goto('example.html');
        await expect(page.locator('[role="radiogroup"]').first()).toBeAttached();
        await open(page);
        await expectNoAxeViolations(page);
      });
    }
  });
}
```

- [ ] **Step 2: Run it**

Run: `bun run build && bunx playwright test e2e/axe-open-states.spec.ts`
Expected: 36 tests (12 × 3). Any violation is a real finding: record it, then follow
spec §7 (Task 6).

- [ ] **Step 3: See the dark pass fail against a planted break**

Append to `src/styles/app.css`, inside its existing `@layer`, a dark-only rule:
`.dark .lo-section p { color: var(--background); }` (text the colour of the page), build,
run `-g "dark mode.*as loaded" --project chromium`: expected FAIL with
`color-contrast`. Run `-g "light mode" --project chromium`: expected PASS. Revert with
`git checkout src/styles/app.css`, rebuild.

If `.lo-section` matches nothing, pick any selector for body text on `example.html`
(read the rendered DOM with `page.content()` once) — the point is a dark-only contrast
break.

- [ ] **Step 4: Commit**

```bash
git add e2e/axe-open-states.spec.ts
git commit -m "test(e2e): axe with accordions, popups, a dropdown and a hover card open, light and dark (E12b)"
```

---

### Task 6: Fix what the checks found (only if they found something)

**Files:** whichever the violation names.

- [ ] **Step 1:** For each distinct violation, read axe's `id`, `target` and `failureSummary`, and find the cause in source (tokens in `src/styles/palette.css` for contrast; the component for names and roles).
- [ ] **Step 2:** If the fix is a few lines and keeps the design (a token value in the dark block, a missing `aria-label`), make it. The failing spec is the test: run it, see it pass. Run `bun run test` too, since tokens are guarded (guard f).
- [ ] **Step 3:** If the fix is larger or changes the look, stop and report the violation to the maintainer with axe's output. Mark that one test `test.fixme()` only with the maintainer's agreement, and record it in TODO §E12b.
- [ ] **Step 4:** Commit each fix on its own: `git commit -m "fix(a11y): <what> in dark mode (found by E12b)"`.

---

### Task 7: Docs, gate, PR

**Files:**

- Modify: `docs/TOOLING.md` ("Browser tests": name the three new files and what each covers, and the open-state and dark passes)
- Modify: `docs/process/TODO.md` (§E12b → DONE with commit hashes; header test counts)
- Modify: `docs/specs/2026-10-15-exercise-flows-axe-design.md` (Status → built, with hashes)

- [ ] **Step 1:** Re-read each doc immediately before editing it (Prettier reflows tables). Update.
- [ ] **Step 2:** Run the full gate:

```bash
bun run format && bun run lint && bun run lint:css && bun run test:coverage && bun run build && bun run test:e2e
```

Expected: all green; e2e count = 30 + 27 + 3 + 36 = 96 (adjusted by any WebKit skip).

- [ ] **Step 3:** Run the sub-path too: `BASE_URL=/course/ bun run build && BASE_URL=/course/ bun run test:e2e`. Expected: same count, green.
- [ ] **Step 4:** Commit the docs (`docs: record E12b in TODO, TOOLING and its spec`), push the branch, open a PR, one review agent over the diff, address findings.
- [ ] **Step 5:** When CI is green, merge by fast-forward: `git switch main && git merge --ff-only test/e12b-exercise-flows && git push`.
