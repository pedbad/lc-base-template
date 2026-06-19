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

| Tool                        | Role                                           | Step |
| --------------------------- | ---------------------------------------------- | ---- |
| **Bun**                     | Package manager · runtime · test runner        | 1, 3 |
| **Vite**                    | Dev server · production bundler                | 2    |
| **TypeScript**              | Language · type safety                         | 2    |
| **Prettier**                | Code formatter (layout)                        | 4    |
| **ESLint** + **jsx-a11y**   | Linter (correctness + accessibility)           | 5    |
| **eslint-config-prettier**  | Stops ESLint and Prettier fighting             | 5    |
| **Stylelint**               | CSS linting                                    | 6    |
| **husky** + **lint-staged** | Pre-commit guard (format/lint staged)          | 7    |
| **Tailwind CSS** (v4)       | Utility-first styling · theme engine           | 8    |
| **shadcn/ui** + **Lucide**  | Components (19) · icons                        | 9    |
| **Cambridge Slate tokens**  | Theme: primitive→semantic→component CSS vars   | 10   |
| **Cambridge typography**    | Open Sans (body) + Feijoa (display) + baseline | 10b  |

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

### Stylelint — CSS linting _(Step 6)_

- **What:** lints CSS files (`src/**/*.css`) for errors and bad patterns —
  ESLint's role, but for stylesheets.
- **Why:** the foundation for **guard f** (no raw hex/px in components — use
  tokens) and **guard g** (every rule inside `@layer`, zero `!important`), the
  template's CSS bulletproofing. Linting from the first stylesheet means no
  retrofit later.
- **How it helps:** `bun run lint:css` (joins the pre-commit hook + CI later).
- **No Prettier truce needed:** Stylelint 16+ dropped stylistic rules, so it
  never fights Prettier over CSS layout (the old `stylelint-config-prettier` is
  deprecated — one less dependency).
- **Tailwind (done in Step 8):** `config-standard` flagged Tailwind's CSS at-rules
  (`@theme`, `@utility`, `@apply`, …) as unknown; resolved via an at-rule allowlist
  (see the Tailwind section below). **Distinction:** Tailwind utility _classes_
  (`class="bg-slate-500 p-4"`) live in `.tsx` markup, **not** in `.css` — Stylelint
  never sees them, so they need no config. Only the at-rule directives in stylesheets do.
- **Rejected:** waiting until Tailwind to add Stylelint — leaves CSS unlinted.

---

### husky + lint-staged — pre-commit guard _(Step 7)_

- **What:** **husky** manages git hooks (it owns the `.husky/` directory; git runs
  the scripts there on git events). **lint-staged** runs commands against **only the
  files staged** for the current commit. Together: `.husky/pre-commit` runs
  `bunx lint-staged`, which formats/lints just the staged files before the commit lands.
- **Why:** Steps 4–6 added Prettier, ESLint, and Stylelint, but nothing _enforced_
  them — a badly-formatted or lint-failing file committed fine. This is **enforcement
  layer 2** (the "stick"): an unfixable problem blocks the commit locally.
- **How it helps:** husky self-installs via the `"prepare": "husky"` script on every
  `bun install` — **zero-touch** (spec #8): clone the template and the guard is just
  _there_, no manual `git config`. lint-staged keeps it fast by never scanning the
  whole repo. Config lives in `lint-staged.config.mjs` (commented, per-tool globs).
- **Glob scoping:** each tool only sees files it understands — ESLint on `js/jsx/ts/tsx`,
  Stylelint on `css`, Prettier on everything formattable (incl. `mjs/cjs` config files).
  `--fix`/`--write` mutate files and lint-staged re-stages the result automatically.
- **Auto-fix vs block:** formatting issues are silently auto-fixed (commit succeeds with
  the cleaned file); a problem with no autofix (e.g. `no-unused-vars`) **fails the commit**.
  Verified Step 7: a staged file with an unused var was blocked
  (`husky - pre-commit script failed (code 1)`) and never entered history.
- **pre-commit = lint-staged only (no tests):** kept fast and focused on format/lint.
  The full `bun test` suite runs in **CI** (Step 31), not on every commit — the standard
  split: pre-commit = cheap fast checks, CI = full validation.
- **Bypass reality:** `git commit --no-verify` skips the hook. That's expected — the
  hook is a fast local helper, **CI is the unbypassable wall** (enforcement layer 3).
- **Rejected:** running the whole test suite or `eslint .` (whole repo) on pre-commit —
  too slow; defeats the point of a fast local gate.

---

### Tailwind CSS v4 — utility-first styling _(Step 8)_

- **What:** a utility-first CSS framework. Instead of authoring bespoke class rules,
  you compose pre-built utilities in markup (`<div class="p-4 rounded-lg shadow">`).
- **Why:** a consistent spacing/color/type scale out of the box, and — crucial here —
  v4's **`@theme` token system** is the backbone of the theming steps (10–11: Slate
  palette, light/dark, design tokens). Step 8 only installs the engine; tokens come later.
- **v4 is a big shift from v3** (three things to know):
  1. **CSS-first config** — no `tailwind.config.js` by default; configure in CSS via
     `@theme { … }`. Fewer JS config files.
  2. **One import** — `@import 'tailwindcss';` (in `src/index.css`) replaces v3's three
     `@tailwind base/components/utilities` directives.
  3. **First-party Vite plugin** — `@tailwindcss/vite` (faster than the v3 PostCSS path);
     wired in `vite.config.ts` as `plugins: [react(), tailwindcss()]`.
- **How it helps:** utilities are generated **on demand** by scanning source files, so the
  output CSS only contains classes actually used. Verified Step 8: a probe element
  (`bg-purple-600 rounded-lg text-2xl …`) produced exactly those rules in the built CSS.
- **Stylelint adaptation (Option A — chosen):** `config-standard` rejected the v4 at-rules
  and forced `@import url(...)`. Fixed in `stylelint.config.mjs` with **no new dependency**:
  an `at-rule-no-unknown` allowlist (`theme`, `utility`, `apply`, `variant`,
  `custom-variant`, `source`, `reference`, `config`, `plugin`, `tailwind`) plus
  `import-notation: 'string'` (Tailwind requires the string form). **Rejected Option B**
  (`stylelint-config-tailwindcss`) — its Stylelint-17 peer support can lag (same class of
  warning that already affects `jsx-a11y`); a small stable allowlist is lower-risk.
- **Note:** no `tailwind.config.js`, no `postcss.config.js` — intentional. v4 needs neither
  for this setup; theme customization is CSS-first (`@theme`, Step 10).

---

### shadcn/ui + Lucide — component layer _(Step 9)_

- **What (shadcn/ui):** NOT a dependency. A CLI (`bunx shadcn@latest`) **copies component
  source into the repo** (`src/components/ui/*`) — you own and edit the code. Built on a
  headless primitive library + Tailwind, so accessibility (focus, ARIA, keyboard) comes
  for free without a runtime UI package to version-pin.
- **What (Lucide):** the icon set (`lucide-react`) — tree-shakeable SVG icons as React
  components (`<Rocket />`). shadcn's components reference it as their default icon library.
- **Why:** spec §3 names shadcn + Lucide. Gives accessible primitives (Button, Dialog, …)
  without hand-rolling a11y, plus a consistent icon system. a11y is CI-gated (spec §5h).
- **Install command we landed on:** `bunx shadcn@latest init -t vite -b base -p nova -y`
  - `-t vite` — Vite template (default is Next; must override).
  - `-b base` — base-color **system** = **Base UI** primitives (the other option, `radix`,
    pulls Radix). shadcn 4.11 changed `-b` from a hue name (`slate`) to a system enum.
  - `-p nova` — preset; **nova = Lucide icons + Geist font**. Presets: nova/vega/maia/lyra/
    mira/luma/sera/rhea. (`-d` defaults to `--template=next --preset=base-nova`, which is
    where the `base`+`nova` combination is documented.)
  - `-y` — non-interactive. Without the right `-t`/`-b`/`-p` it still prompts and hangs.
- **What init created/changed:** `components.json` (config; `iconLibrary: lucide`, aliases),
  `src/lib/utils.ts` (the `cn()` clsx + tailwind-merge helper), `src/components/ui/button.tsx`,
  and it **merged tokens into `src/index.css`** (`@theme inline`, `:root`/`.dark` oklch vars,
  `@layer base`, plus `@import` of `tw-animate-css`, `shadcn/tailwind.css`, Geist). Deps added:
  `@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`,
  `@fontsource-variable/geist`. **Step 10 replaces these placeholder tokens** with the
  Cambridge Slate system — the merge is a starting point, not the final theme.
- **Full component set — all 19 ported from french-lo-1** (the template is also a
  self-contained app + landing page, so the app-shell pieces are kept): accordion, alert,
  badge, button, card, dialog, input, label, navigation-menu, select, separator, sheet,
  sidebar, skeleton, switch, table, tabs, textarea, tooltip. **Bulk-add gotcha:** `add`
  prompts to overwrite an existing `button.tsx` (pulled in as a transitive dep) and an EOF
  aborts the whole queue — pass `--overwrite` to force-yes. **To add more later:**
  `bunx shadcn@latest add <name>` (pulls the Base-UI / nova version, auto-skinned by our
  tokens). Note: wrap the app in `TooltipProvider` before using tooltips.
- **Config adaptations required (4):**
  1. **`@/*` alias** (shadcn's Vite guide requires it _before_ init): `paths` in
     `tsconfig.json` + `tsconfig.app.json`, and `resolve.alias` in `vite.config.ts`
     (`path.resolve(import.meta.dirname, './src')`, plus `@types/node`). **No `baseUrl`** —
     it's deprecated in TS 6; TS 5.4+ resolves `paths` relative to the tsconfig file.
  2. **ESLint — `src/components/ui/**` override:** vendored files export variant helpers
(`badgeVariants`) or hooks (`useSidebar`) beside the component, tripping
`react-refresh/only-export-components`; the `Label`primitive trips`jsx-a11y/label-has-associated-control`(the _consumer_ associates the control). A
scoped override turns **only those two rules** off for`ui/\*\*`(the rest of guard h
stays on).`eslint.config.js` is locked by the config-protection hook, so it was
     hand-pasted, not tool-edited.
  3. **ESLint — `use-mobile.ts` fixed at source:** shadcn's sidebar hook called `setState`
     synchronously in an effect (`react-hooks` cascading-render rule). Rewritten with a lazy
     initial read instead of disabling the rule — config-protection prefers source fixes.
  4. **Stylelint:** shadcn's oklch vars used unitless lightness/hue (`0.985`, `0`); a one-time
     `stylelint --fix` normalised them to `98.5%`/`0deg` (config-standard's `lightness-notation`
     / `hue-degree-notation`). The pre-commit hook auto-fixes this going forward.
- **Verified (Step 9, headless — preview MCP mis-targets from a french-lo-1-rooted session):**
  all 19 components added; `bun run build` ships the Button (`data-slot`, `.inline-flex`) and
  the Lucide Rocket (exact icon path in JS); `lint`/`lint:css`/`test`/`build` all exit 0.

---

### Cambridge Slate tokens — theme system _(Step 10)_

- **What:** the colour theme as a 3-layer CSS-variable chain (spec §7.1):
  `palette.css` (primitives, raw brand hex) → `tokens.css` (semantic roles) →
  Tailwind colour utilities (via the `@theme inline` bridge in `index.css`).
  Full guide for devs: **`src/styles/README.md`**.
- **Why:** one edit point. Change a value in `palette.css` and every shadcn
  component reskins — no find-replace, no per-component colour. Sets up
  **guard f** (no raw hex/px in components) and **guard g** (every rule layered,
  zero `!important`).
- **Brand source:** official University of Cambridge guidelines (colour +
  typography) — **not** french-lo-1's teal (a per-course locale fossil,
  deliberately not ported). Cambridge Slate greyscale (Slate 4 = text, not pure
  black) + Cambridge Blue family + secondary accents for data viz / states.
- **Reconcile, not bulldoze:** shadcn's `init` (Step 9) had merged placeholder
  oklch vars + an `@theme inline` map into `index.css`. Step 10 **kept** the map
  (it skins all 19 components), **moved** the values out into `palette.css` /
  `tokens.css` swapped to Cambridge brand, and **stripped** the leftover
  Vite-demo CSS (`#root` width, demo `h1/h2/p/code`, `--text/--bg/--accent`,
  `prefers-color-scheme` block).
- **Switchable primary presets:** three `tokens-variant-*.css` files ship
  (A Cambridge Blue, B Dark Blue [default], C Warm Blue) — identical except
  `--primary`/`--ring`. Switch by copying one over `tokens.css` (see README).
  Default = **B**: the only candidate both AAA-accessible **and** a strong CTA on
  white (button-vs-page 12.5:1; A=1.43, C=2.35). Dark mode flips B's primary to
  Cambridge Blue (dark-blue would vanish on the Slate-4 base).
- **Light + dark:** `:root` + `.dark`; the Slate ramp inverts. `color-mix` lifts
  dark surfaces (card/popover/muted/sidebar) off the Slate-4 base.
- **Verified (Step 10, headless — preview MCP mis-targets from a french-lo-1
  session):** `format` / `lint` / `lint:css` / `test` / `build` all exit 0; the
  build ships the reskinned components.

---

### Cambridge typography — Open Sans + Feijoa _(Step 10b)_

- **What:** the two official Cambridge typefaces wired through the same token chain
  as the colours, plus the global type baseline (size + leading). Full dev guide:
  **`src/styles/README.md` → Fonts**.
- **Why:** shadcn's `init` (Step 9) pulled **Geist** — generic, not the brand.
  Cambridge's guidelines specify **Feijoa** for display (headings/titles) and
  **Open Sans** for body. Step 10b swaps Geist out.
- **The two fonts (deliberately different delivery):**
  - **Open Sans** — body. **Free** (Apache-2.0, via Google Fonts). Shipped as the
    npm package `@fontsource-variable/open-sans` (variable build → one file covers
    Regular/SemiBold/Bold). Self-hosted by Vite (no Google-CDN call → privacy +
    no render-blocking third party). **Committed.**
  - **Feijoa** — display. **Commercial** (Klim Type Foundry) — spec §12 /
    decision #18: **never committed.** Declared via `@font-face` pointing at
    git-ignored `public/fonts/feijoa/`; dropped in per Cambridge deploy only.
    `font-display: swap` + Open Sans fallback → fresh clones render correctly with
    no invisible-text flash and no missing-glyph boxes.
- **Token wiring (same one-edit-point philosophy as colour):**
  - `palette.css` (Layer 1, **shared** — NOT per-preset, so switching `--primary`
    presets never touches fonts): `--font-display: 'Feijoa','Open Sans','Arial',sans-serif`
    and `--font-body: 'Open Sans','Arial',sans-serif`. Arial = Cambridge's specified
    system fallback.
  - `index.css` `@theme inline`: `--font-sans: var(--font-body)` and
    `--font-heading: var(--font-display)`. **These two lines re-skin the type of
    all 19 shadcn components** — the structure is kept intact, only the values swap.
- **Type baseline — researched decisions (the _why_, for future devs):**
  - **Set on `<html>`, not `<body>`** — `rem` units anchor to `<html>`, and
    `line-height` set here inherits globally (including React portals / shadow DOM,
    which can skip a value set on `<body>`).
  - **`font-size: 100%`, not `16px`** — resolves to 16px (Cambridge min, spec §7.2)
    but **scales with the user's browser font preference**. A hardcoded `16px` would
    override a vision-impaired user who raised their default — an accessibility fail.
  - **`line-height: 1.4` UNITLESS, not `140%` / `1.4em`** — the "140% trap": a
    percentage/em line-height computes a **fixed px** at `<html>` and freezes that
    value for every child, clipping large headings. A **unitless** value passes the
    _multiplier_ down, so each element scales leading by its own font-size.
  - **`line-height: 1.4` duplicated on `<body>`** — WebKit/Safari edge case where
    some elements skip the `<html>` value; the duplicate forces inheritance.
  - **iOS rotate-zoom (`-webkit-text-size-adjust: 100%`) is NOT repeated by us** —
    Tailwind v4 Preflight already sets it on `<html>` (verified in
    `node_modules/tailwindcss/preflight.css`). Repeating it would trip Stylelint's
    `property-no-vendor-prefix` for zero benefit.
- **Rejected:** Google Fonts `<link>` CDN (privacy + render-blocking + offline-fragile;
  self-hosting via fontsource is the zero-touch, spec-#8 path). Hardcoded `16px`
  baseline (accessibility regression, above). Committing Feijoa (licence breach, §12).
- **Verified (Step 10b, headless — preview MCP mis-targets from a french-lo-1 session):**
  `format` / `lint` / `lint:css` / `test` / `build` all exit 0. Built CSS ships 10 Open
  Sans `@font-face` (latin + subsets), 3 Feijoa `@font-face` → `/fonts/feijoa/` with
  `swap`, the `--font-display`/`--font-body` tokens, `--font-sans:var(--font-body)`, and
  `line-height:1.4` on both `<html>` and `<body>`. Zero `geist` references remain.

---

_Append a new section here as each tool lands (Zod, …)._
