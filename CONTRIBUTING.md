# Contributing

How to work in this repo: setup, everyday commands, the commit gate, and conventions.

> **Living document.** It grows one section per build step as features land
> (guards, per-LO authoring loop, exercise contract, theming). The locked spec
> decisions it once listed as coming have all landed — see
> [Locked spec decisions](#locked-spec-decisions) — and
> `docs/specs/2026-06-15-lc-base-template-design.md` remains the full planned scope.
>
> For **why** each tool was chosen (not how to use it), see [`docs/TOOLING.md`](docs/TOOLING.md).
>
> Four sibling docs cover the audiences this one does not:
> [`COURSE_GUIDE.md`](COURSE_GUIDE.md) (colleagues writing a course in its own repo),
> [`DESIGNER.md`](DESIGNER.md) (change colours and fonts without touching code),
> [`STRUCTURE.md`](STRUCTURE.md) (what every folder is for) and
> [`AGENTS.md`](AGENTS.md) (house rules for AI coding agents).
>
> For **what is still open on the template itself**, see
> [`docs/process/TODO.md`](docs/process/TODO.md) — the live worklist, ordered, with the
> constraints and the verify gate at the top. Start there in a new session.

---

## Prerequisites

- **[Bun](https://bun.com)** ≥ 1.3 — package manager and script runner. Tests run on
  **Vitest** (via `bun run test`), not Bun's built-in `bun test` — see [docs/TOOLING.md](docs/TOOLING.md).
  Install: `curl -fsSL https://bun.com/install | bash`. No separate Node/npm needed —
  if Node is installed, though, `bun run` uses it for the Vite, Vitest, ESLint and
  Prettier CLIs, so it must meet the minimum in the README's toolchain table.

## Getting started

```bash
git clone https://github.com/pedbad/lc-base-template.git
cd lc-base-template
bun install     # installs deps AND self-installs the git hooks (zero-touch)
bun run dev     # start the Vite dev server
```

`bun install` runs the `prepare` script, which installs husky — so the commit and push
gates below are active immediately, no manual `git config` step.

Once per machine, for the browser tests:
`bunx playwright install chromium firefox webkit` (`docs/TOOLING.md`, "Browser tests").

## Everyday commands

| Command                 | What it does                                                            |
| ----------------------- | ----------------------------------------------------------------------- |
| `bun run dev`           | Vite dev server, hot reload — landing page and every LO page            |
| `bun run build`         | Type-check + bundle + prerender the landing page and one HTML per LO    |
| `bun run preview`       | Serve the production build locally                                      |
| `bun run test`          | Run the test suite (Vitest, one-shot)                                   |
| `bun run test:coverage` | The suite plus per-file coverage bars — what CI runs                    |
| `bun run test:e2e`      | Browser tests against the last build — Chromium, Firefox, WebKit        |
| `bun run guards`        | Just the repo-wide guard sweeps — fast; the pre-push hook runs it first |
| `bun run test:watch`    | Vitest in watch mode                                                    |
| `bun run lint`          | ESLint over the repo                                                    |
| `bun run lint:css`      | Stylelint over `src/**/*.css`                                           |
| `bun run format`        | Prettier — rewrite all files to the house style                         |
| `bun run format:check`  | Prettier — verify formatting without writing                            |
| `bun run docs:tree`     | Regenerate the folder tree in `STRUCTURE.md`                            |
| `DEBUG=1 bun run build` | Build, plus the three debug pages — both showcases and the sandbox      |

`bun run dev` serves `/debug-sandbox.html`, `/exercise-showcase.html` and
`/ui-showcase.html` whether or not that flag is set — **bookmark the three URLs**. Nothing in the course links to them and
nothing should: a deployed build contains neither file, so an in-course link would work
locally and 404 for every reader. (Vite takes 5174 when 5173 is busy; it prints the port
it chose.)

Serving from a sub-path (courses usually are) is one env var — it feeds the bundle
and the prerender pass together, so hashed assets, the favicon and runtime audio/image
URLs all resolve against the same base:

```bash
BASE_URL=/course/ bun run build
```

Publishing a course (fonts, the address, the checks before it goes live, the upload) is
[`DEPLOY.md`](DEPLOY.md).

## Authoring a Learning Object

An LO is a folder under `lo-config/`; it exists because the folder exists. Nothing in
the app enumerates LOs — adding a folder adds its page **and its card on the landing
page**, with no code change.

1. Copy `lo-config/lo-00-example/` to `lo-config/lo-NN-your-slug/` — the `lo-NN-`
   ordinal is the course order (see below), and the URL drops it (`your-slug.html`).
2. Edit `lo.json` and each `blocks/*/block.json` / `exercises/*/exercise.json`.
3. `bun run build && bun run preview` to click through the whole course.

**Never edit or delete `lo-00-example`.** It is every course's master copy: the test
suites and browser tests run on it, and template updates change it, so a course that
edits or deletes it gets red CI and clashing updates. Learners never meet it: once
`lo-config/` holds a lesson of its own, the landing page leaves the example's card out
by itself (`EXAMPLE_LO_FOLDER` in `src/lo/lo-index.ts`). Its page is still built, with
nothing linking to it, so the browser tests keep a page to drive.

> **Only add pictures and audio that we made, or that we are clearly allowed to
> share. Never upload audio from a textbook CD that is not ours, or an image taken
> from the web that is not openly licensed.**
>
> Everything in `lo-config/`, `public/images/` and `public/audio/` is published under
> CC BY-NC 4.0 ([`LICENSE`](LICENSE)), and we can only give that permission for
> material we own. Allowed: recordings and images made by the Language Centre or its
> staff, and openly licensed material whose licence allows this reuse (public domain,
> CC0 or CC BY), credited where it appears. Not allowed: publishers' audio, textbook
> scans, stock photos, or anything found online without such a licence. If you are
> not sure, do not add it — ask the maintainer first. Content pull requests skip
> owner review, so nobody else checks this for you.

Rich text in `text` fields takes the tags listed in
[`docs/specs/lo-rich-text-modals.md`](docs/specs/lo-rich-text-modals.md). The rule
authors most often trip on: a link, popup link, hover term or audio icon cannot sit
inside another one. Put them side by side; the build names both if you forget.

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

`hero` is the page's banner art and is not on the card. Write it as an object,
`"hero": { "src": "images/lo-NN-slug/hero.webp" }`: a wide crop (about 2000px across,
WebP or AVIF), separate from the card's `image`. It is decorative by default, because the
banner already carries the LO title as the page's `<h1>`. Add `"alt"` only when the art
says something the title does not, and never write `"alt": ""`, which the schema rejects.
The title is printed straight onto the art in one dark ink, in both themes, so **keep
the art's top-left corner light and calm** behind the title. Dark art there fails
contrast. Omit `hero` entirely and the banner renders as a plain brand-coloured band.
`lo-00-example` points at `images/lo-00-example/hero.svg`.

### Course order has one source: the folder ordinal

The `lo-NN-` number in the folder name orders the cards, the lesson nav and the build.
It is sorted **numerically**, so `lo-9-` precedes `lo-10-` (alphabetically it would
not). `course.config.ts` has no order list — a second source for the same fact would
be free to drift from the folders silently. **To reorder a course, rename folders.**
Settle the order before learners start. A flashcards deck keeps their saved progress
under the site's base path and its LO and exercise folder names, so renaming either
folder (inserting a lesson renames every one after it) or moving the site starts that
deck afresh. Inside a deck each card is kept by its target word: fixing the English
side keeps a card's progress, fixing the target word starts that one card afresh.

### Tabs block

A set of labelled tabs, one panel showing at a time. Add it like any block: a
`blocks/NN-tabs/block.json` folder, listed in a section's `blocks` array in `lo.json`.
`lo-00-example` has one in its Grammar section (`blocks/04-tabs/`).

```json
{
  "type": "tabs",
  "presentation": "plain",
  "content": {
    "label": "Forms of address",
    "intro": ["Optional rich text above the tabs."],
    "tabs": [
      {
        "label": "Tu",
        "instructions": "Read the informal examples, then play the clip.",
        "text": ["Rich text, exactly as in a grammar block."]
      },
      {
        "label": "Vous",
        "instructions": "Compare these with the informal forms.",
        "text": ["<ul><li>Lists, tables and audio work too.</li></ul>"]
      }
    ]
  }
}
```

- `label` names the tab set for screen readers, and is required.
- An optional block-level `instructions` (plain text, beside `label`) shows once, in the
  info box above the whole tab set.
- At least two tabs, and every tab `label` is unique within the block.
- Every tab needs `instructions`: plain text, shown first in the panel in the same
  info box the accordions use. A tab without it fails the build.
- Each tab's `text` takes what a grammar block's `text` takes: paragraphs, lists,
  tables, the audio player, inline audio, popup links, plain links (`<a href>`, opened
  in a new tab) and hover terms (`<span class="hover-term" data-hover-target="…">`).
- A tab may add `media`, shown after its instructions: an `image`
  (`"kind": "portrait"` beside the player, or `"figure"` full width with an optional
  `caption`), an `audio` player (`src`, optional `label`) and its `transcript` (rich
  text, behind a Show/Hide transcript toggle). Image, audio or both; audio needs a
  transcript; every image needs `alt` (`""` only on a decorative portrait). Tabs B–D
  in `lo-00-example` show each layout.
- `"presentation": "plain"` puts the tabs straight under the section heading;
  `"card"` (with a `title`) wraps them in an accordion.
- Below 48rem of block width the tab row gives way to a dropdown. From 48rem up the
  labels must fit on one line, or the row wraps: keep them short (`lo-00-example`'s
  four "Placeholder tab A"-length labels fit with room to spare).
- A misspelt key fails the build rather than being ignored.

Design and what is coming next (callouts and exercises in a tab):
[`docs/specs/2026-10-07-tabs-block-design.md`](docs/specs/2026-10-07-tabs-block-design.md).
Media in a tab:
[`docs/specs/2026-10-07-tabs-media-design.md`](docs/specs/2026-10-07-tabs-media-design.md).

### Sources block

A references list: citations grouped under optional headings, each marked as a print or
web source, with an optional note on which extract was used. Add it like any block, a
`blocks/NN-sources/block.json` folder listed in a section's `blocks`. `lo-00-example`
has one in its last section, Sources (`blocks/08-sources/`).

```json
{
  "type": "sources",
  "presentation": "plain",
  "content": {
    "groups": [
      {
        "heading": "Strategies",
        "items": [
          {
            "kind": "print",
            "citation": "Foley, R. (2003) On Stony Ground, <em>Evolutionary Anthropology</em> 12:109–122.",
            "note": "This extract from p120, column 3, penultimate paragraph."
          },
          {
            "kind": "web",
            "citation": "Daily Telegraph, 30/05/2011, <a href=\"https://…\">‘Coral reefs on edge of extinction’</a>"
          }
        ]
      }
    ]
  }
}
```

- `kind` is `print` (book icon) or `web` (globe icon). Anything else fails the build.
- `citation` and `note` are inline rich text: `<em>` for titles, `<a href>` for links
  (opened in a new tab). A `web` source must have a link in its `citation`.
- `heading` is optional; a single list needs none. At least one group, and at least
  one item in each.
- An optional block-level `instructions` (plain text, beside `groups`) shows in the
  info box above the list.
- `"presentation": "plain"` is the usual choice: the list reads as page copy under a
  section heading. Group headings are `<h3>` there, `<h4>` inside a `"card"`.
- A misspelt key fails the build rather than being ignored.

Plan and decisions:
[`docs/process/2026-10-12-sources-block-plan.md`](docs/process/2026-10-12-sources-block-plan.md).

### Exercise options

Any `exercise.json` may add an `options` object beside `content`. It has one shape for
every exercise type, every field is optional, and it is set per exercise, so two
exercises of the same type can behave differently. An engine ignores a field it has no
use for (`caseSensitive` on a choice exercise, say).

```json
"options": { "shuffle": true, "showAnswersAfter": 2 }
```

| Field              | Type             | Default   | Effect                                                      |
| ------------------ | ---------------- | --------- | ----------------------------------------------------------- |
| `shuffle`          | boolean          | `false`   | Randomise the order of the choices; Reset re-shuffles.      |
| `sampleSize`       | positive integer | show all  | Show a random N of the items.                               |
| `allowShowAnswers` | boolean          | `true`    | `false` removes the Show answers control entirely (a game). |
| `showAnswersAfter` | integer ≥ 1      | see below | Failed tries before Show answers appears.                   |
| `caseSensitive`    | boolean          | `false`   | Typed answers only: capitals count. Accents always count.   |

A failed try is a Check with anything wrong, a missed pair in memory-match, or a wrong
click in word-spot. `showAnswersAfter` defaults to 1, or 2 for word-order,
phrase-reorder, drag-fill-gaps and memory-match. Show answers only ever appears while
something is still wrong. Each type's `content` shape is its
`src/exercises/<type>/<type>-schema.ts`, with a working example in `<type>.fixture.ts`.
Design: [`docs/specs/2026-06-19-exercise-engines-design.md`](docs/specs/2026-06-19-exercise-engines-design.md)
§5–6; the schema is `ExerciseOptionsSchema` in `src/config/lo-schema.ts`.

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

Formatting, linting and tests are **enforced, not suggested**. Four layers, weakest to
strongest (full rationale in [`docs/TOOLING.md`](docs/TOOLING.md#enforcement-layers)):

1. **Editor** — format-on-save via `.vscode/settings.json` (convenience).
2. **Pre-commit hook** — husky runs `lint-staged` on **staged files only**: Prettier
   and ESLint on JS/TS, Prettier and Stylelint on CSS, Prettier on JSON/MD/config.
   Auto-fixable issues are fixed and re-staged silently; an unfixable problem
   (e.g. an unused variable) **blocks the commit**.
3. **Pre-push hook** — husky runs `bun run guards` (fast fail) then `bun run test`
   (~10s). A red test **blocks the push**, so broken code never leaves your machine —
   even in a fork where GitHub Actions has not been switched on yet.
4. **CI** — GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml))
   re-runs `lint` · `lint:css` · `format:check` · `test:coverage` · `build` · `test:e2e` on every
   PR to `main` and every push to `main`. The unbypassable wall.

You can bypass the local hooks with `--no-verify` (`git commit` or `git push`), but CI
will still catch it before merge. Don't rely on bypass.

**New code needs a test beside it, or CI fails.** CI's test step measures coverage
**per file**: logic (`.ts`) must reach 80% of lines and components (`.tsx`) 20%, so a
new file with no test scores 0% and turns CI red. Run `bun run test:coverage` before
you push to see what CI will see. The bars, what is left out and why:
[`docs/TOOLING.md`](docs/TOOLING.md#coverage--per-file-bars-ci-only-decision-2026-10-14-todo-e8).

## Commit conventions

- **[Conventional Commits](https://www.conventionalcommits.org/):** `<type>: <description>`.
  Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.
- **One concern per commit** — keep changes small and reviewable.
- **AI-assisted commits may carry a `Co-Authored-By` trailer** (Claude Code adds one by
  default). It is an honest record of how the change was made; keep it, don't hand-add
  one to a commit no assistant touched.

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

**Green path (author freely):**

- **No owner review:** `lo-config/` JSON and the lesson media in `public/images/` and
  `public/audio/` — **media we made or may share only** (see
  [Authoring a Learning Object](#authoring-a-learning-object)). `CODEOWNERS` leaves these ownerless, so a pull request touching only
  them merges once CI is green — and CI still validates every LO against the schemas.
- **Normal review:** new fixtures (copy an existing exercise fixture, change the Spanish
  content, wire it into the showcase), docs and process notes.

**Requires maintainer review (owned in [`.github/CODEOWNERS`](.github/CODEOWNERS)):**

- `src/styles/**` — design tokens, theme, global CSS. Drift here re-skins every course.
- `src/config/**` — the LO / exercise **schemas** and course config (the content contract).
- `src/exercises/lazyRegistry.ts` + `src/exercises/lib/**` — core engine wiring / shared scaffold.
- `.github/**`, `vite.config.ts`, `package.json`, `bun.lock`, tsconfig/eslint/prettier/stylelint,
  `.claude/settings.json` — build, CI, and the repo's Claude Code settings.
- `docs/specs/**` — the canonical specs authors build against.

If a content PR finds itself editing a file in the second list, that's the signal to **stop
and ask** — usually the content model needs extending, not the component patched.

**Every PR** goes through [`.github/pull_request_template.md`](.github/pull_request_template.md):
the checks CI runs, plus the keyboard / landmark / contrast / screenshot checks CI can't
fully judge.

**`main` is NOT protected yet.** While the template is a single-maintainer build, changes
go straight to `main` and the verify gate (`AGENTS.md`, "Verify before you claim done")
is run by hand before each commit. Branch
protection — PR required, CI required to merge — goes on **before the repo is shared with
other developers**; it is a pre-share checklist item, not an oversight. Setup steps and the
single-maintainer lockout to avoid: [`docs/BRANCH_PROTECTION.md`](docs/BRANCH_PROTECTION.md).

> Note: adding a new **exercise engine** (not just content) follows the engine recipe —
> schema + pure grading + colocated tests + thin view + fixture + registry entry. See a
> recent engine (`src/exercises/reading/`) as the reference shape.

**Claude skills.** The recurring jobs (a lesson, an engine, a block type, the theme, a
template sync, the check before a pull request, a build for upload) have recipes in
[`.claude/skills/`](.claude/skills/), with a reviewer in
[`.claude/agents/lc-reviewer.md`](.claude/agents/lc-reviewer.md). The code recipes start
from a failing test. In a course repo they file a **Template request** issue on the
template instead of writing code ([`COURSE_GUIDE.md`](COURSE_GUIDE.md), "Need a new
exercise, block or look?"); the maintainer builds it here and the pull request's
`Closes #N` closes the issue. `src/docs/claude-skills.test.ts` keeps the recipes' shape.

---

## Locked spec decisions

All four of the spec's locked decisions have landed. Each is documented here or in the
doc it links:

- **Naming & render-mirror** _(spec §15)_ — **landed**: `lo-01` not `lo1`, `images/`
  not `img/`, and `<ordinal>-<type>` folders (`01-select/`) numbered LO-wide per kind,
  not per section. File structure mirrors the rendered page; guard b enforces the
  folder↔config match. The rules: [`STRUCTURE.md`](STRUCTURE.md).
- **Exercise authoring contract** — **landed**: the shared `options` are in
  [Exercise options](#exercise-options); each type's `content` shape is its own schema.
- **The 8 guards** (a–h) — what each checks, what fails, and how to fix it. **All eight
  are live:** **a** config-schema (Zod at load), plus **b** naming + render-mirror, **c**
  asset-path, **d** asset-existence, **e** registry completeness, **f** token integrity
  (no raw hex/px bypassing the token chain), **g** CSS layer discipline (every rule in
  `@layer`, no `!important`) and **h** semantic DOM (the spec §17 contract over rendered
  output). **b–h** are the seven sweeps in `src/guards/`; **a** is not a sweep — the Zod
  schemas run on every load, and their contract tests sit beside them in `src/config/`.
  All are Vitest tests, so `bun run test` already enforces them, and `bun run guards`
  runs the seven sweeps on their own in about a second. Guard h has a second half that is not in `src/guards/` at all:
  `eslint-plugin-jsx-a11y` in `eslint.config.js`, which lints the JSX as you write it —
  so an a11y mistake can fail either `bun run lint` or `bun run test`, depending on
  whether it is visible in one file or only in the assembled page. See
  [`docs/process/TODO.md`](docs/process/TODO.md) §A.
- **Theming & tokens** — **landed**: single-theme-per-clone, tokens only (no raw
  hex/px), CSS in `@layer`, no `!important`. Full guide, written for a designer:
  [`DESIGNER.md`](DESIGNER.md).
