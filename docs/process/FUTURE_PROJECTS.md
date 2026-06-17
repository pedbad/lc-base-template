# Future Projects Blueprint (React + Bun + Tailwind + shadcn + Lucide)

## Reusable Master Prompt

Use this prompt when starting a new project:

```text
Create a new production-ready React app using Bun, Tailwind CSS, shadcn/ui, and Lucide icons.

Non-negotiable architecture:
1. Use Bun for install/dev/build/test scripts.
2. Use Tailwind as the only styling system. Do not use SCSS/SASS.
3. Implement strict single source of truth for design using a four-file CSS split:
```

src/styles/
palette-lc.css ← Layer 1: empty placeholder — reserved for future --palette-_ system
theme-lc-[language].css ← Layer 2: brand tokens (--brand-_); the ONLY file swapped to re-skin
tokens.css ← Layer 3: UI role tokens + shadcn system tokens + --edu-_ + --ex-_
fonts.css ← @font-face declarations only
src/index.css ← entry point: @import the four files, then Tailwind

```
Import order in index.css: palette → theme → tokens → fonts → Tailwind plugin/config.
- `tokens.css` is the semantic token contract consumed by components.
- `theme-lc-[language].css` is the ONLY file changed to re-skin for a new course.
  It holds 4 brand colour slots: `--brand-primary/secondary/tertiary/quaternary`.
  Designer provides the 4 oklch values; developer populates this file.
- `palette-lc.css` is an intentionally empty placeholder. Do NOT put raw values here
  until the `--palette-*` system is designed and documented. Brand values go in the theme file.
- Tailwind and shadcn consume semantic tokens only.
- No hardcoded colour/font-size/font-family values outside token files.
- fonts.css is imported via index.css — NOT via JS imports in main.jsx.
4. Must support light and dark mode from day one using class-based theme switching.
5. Ensure token parity across light/dark (no ad hoc per-component overrides).
- Include locale/brand theming from day one via `data-theme` on the root element.
6. Set up shadcn so components are easy to theme and extend via cva variants.
- Default primitive backend: Radix UI.
- Only switch to Base UI if you have a clear strategic reason (for example org-wide standardization or a specific missing capability).
7. Add a cn utility and class-variance-authority pattern for all reusable custom components.
8. Add accessibility defaults:
- visible focus states
- keyboard support
- prefers-reduced-motion support
- semantic landmarks/headings (`<main>`, `<nav>`, `<section>` with headings)
- native interactive elements first (`button`, `a`, `input`) before ARIA role fallbacks
9. Add guardrails:
- ESLint + Prettier
- pre-commit hooks
- CI checks
- style guard script that fails on new hardcoded typography/colors outside token files
- fail CI if any .scss/.sass files are added
- fail CI on accessibility gate failures (lint + automated checks)
- **add config key schema guards on day one** — define which JSON keys are canonical for each content type and write a guard script that blocks banned/legacy keys from being committed. It is far cheaper to enforce a schema at the start than to clean up 15 LOs of key drift later. (Lesson learned: `instructionsText` / `infoText` variants accumulated across 32 config locations before being caught and cleaned up.)
10. Add docs:
- THEME_ARCHITECTURE.md
- COMPONENT_GUIDELINES.md
- CONTRIBUTING.md
11. Provide a starter set of token-driven components (Button, Card, Input, Badge, Alert, Dialog) and example custom variants.
12. Routing/SEO from day one:
- Use path-based slug routes for content pages (for example `/first-contact/`), not query-only routing (`?lo=1`).
- Keep a stable slug map in content index metadata (`slug` -> `file/id`) so URLs are human-readable while internal file naming can remain numeric if needed.
- Add canonical URL tags for each route and avoid duplicate route variants indexing.

Output required:
- exact setup commands
- final directory structure
- key config files
- guard scripts
- docs
- short checklist for adding new components safely
```

## Out-of-the-Box GitHub Actions CI (Default)

Use this as the default workflow in new repos (`.github/workflows/ci.yml`):

```yaml
name: PR Quality Gates

on:
  pull_request:
  workflow_dispatch:

jobs:
  quality:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Ensure origin/main exists for branch guards
        run: git fetch --no-tags origin main:refs/remotes/origin/main

      - name: Build
        run: bun run build

      - name: Lint
        run: bun run lint

      - name: Typography guard (branch)
        run: bun run check:typography:branch

      - name: Color guard (branch)
        run: bun run check:color:branch

      - name: A11y guard (branch)
        run: bun run check:a11y:branch
```

## Additional Prevention Defaults (Recommended)

Add these from day one to avoid late cleanup projects:

1. Protect `main` with required status checks for CI workflows.
2. Add `CODEOWNERS` for design tokens, accessibility-critical components, and build config.
3. Add a PR template that requires:
   - keyboard test confirmation
   - screen-reader smoke check confirmation
   - before/after screenshots for UI changes
4. Add Playwright + axe smoke tests for key pages/states in CI.
5. Add visual regression snapshots for top-level routes and core components.
6. Add a path hygiene guard (ASCII-only names, no spaces) for `public/` assets.
   - include an explicit image-path guard:
     - block new `public/images/` or `public/img/` additions (legacy paths)
     - enforce new image assets under `public/media/images/`
     - enforce lowercase + ASCII-safe filenames
7. Add dependency update automation (Dependabot or Renovate) with weekly cadence.
8. Add security scanning (CodeQL and `npm audit`/`yarn audit`) on schedule.
9. Add branch-level "no new debt" checks (warnings/error budgets must not increase).
10. Add a release checklist workflow for production preview validation (build + preview + smoke checks).
11. Keep developer fixtures in a separate dev-only sandbox page (do not render hidden debug DOM in the production app tree).
12. Use a portable build base by default (`base: './'` or env-driven equivalent), with optional fixed-path override for constrained hosting.
13. Use path-based slug routing for SEO:

- required public URL shape should be route paths (`/first-contact/`), not query-only params.
- if legacy query params are supported, redirect/canonicalize to slug path.

14. If the app is single-language in production, do not keep dormant `?lang=` runtime routing; hard-wire one language config source and remove dead multi-language branches early.
15. If infrastructure cannot guarantee rewrite support, do not choose client-side SPA-only slug routing. Prefer static pre-rendered route files (per language/per LO) so clean paths work without `.htaccess`/server rewrites.
16. For top navigation, do not keep desktop render, mobile render, nav data shaping, and scroll-highlight orchestration in one monolithic component file. Split them into small modules from day one.
17. For interactive tiles/cards, prefer shadcn/Tailwind composition in the component JSX first:

- use tokenized Tailwind utilities for sizing, spacing, shadows, transitions, z-index, and 2D transforms
- only add shared CSS when the effect cannot be expressed cleanly with utilities (for example narrow 3D/perspective helpers or image-specific overrides)

## What To Avoid In Future Projects

Use this as a hard "do not repeat" list.

1. Do not start with mixed styling ownership (Tailwind + broad SCSS) without strict boundaries.
2. Do not add new `.scss/.sass` files once Tailwind/token architecture is chosen.
3. Do not add new SCSS imports in component files (`.jsx/.tsx/.js/.ts`).
4. Do not rely on high-specificity legacy selectors that fight utility classes.
5. Do not keep global app styling hidden in `App.scss`; keep global/base rules in `src/index.css` (`@layer base`).
6. Do not encode component variants in Sass interpolation patterns when `cn()`/`cva` should handle variants.
7. Do not leave animations scattered across many SCSS files; centralize keyframes/tokens in Tailwind config or layered global CSS.
8. Do not allow new hardcoded typography/color literals outside token files.
9. Do not skip branch protection + required CI checks for guard scripts.
10. Do not start refactors without visual and accessibility regression checks in the PR definition of done.
11. Do not keep debug/sample scaffolding hidden in production markup; isolate it in a dev-only sandbox entrypoint.
12. Do not switch shadcn primitive backend (Radix -> Base UI) without a documented strategic reason.
13. Do not author modal content links in JSON as direct fragment hashes (for example `href="#tuvous"`).
14. Do not use `<table>` for visual layout where flex/grid is the correct semantic choice.
15. Do not add new image assets into a legacy catch-all folder (`public/images`); use `public/media/images/common`, `public/media/images/shared`, and `public/media/images/loX`.
16. Do not use presentational emphasis tags (`<b>`, `<i>`) in authored HTML/JSON content; use semantic tags (`<strong>`, `<em>`) instead.
17. Do not hardcode a single deployment mount path in build config (for example fixed Vite `base` tied to one folder name); make it env-configurable with a portable default.
18. Do not ship query-only content routing as the primary URL strategy when SEO/discoverability matters; use path slugs as canonical routes. (See #26 — in new projects do not even keep a numeric/query _resolver_ as a backward-compat fallback; slug paths are the only route.)
19. Do not retain unused language-query routing (`?lang=`) in single-language deployments; it creates unnecessary URL surface and debugging drift.
20. Do not start multilingual LO programs (for example French + Spanish series) without deciding route serving strategy first:

- rewrite-capable SPA hosting, or
- pre-rendered static routes (preferred when rewrite access is limited).

21. Do not leave shadcn's default `--primary` (near-black) in tension with your brand primary colour without documenting the split. On new projects, override `--primary` in `tokens.css` to equal `var(--brand-primary)` from day one — unless there is a deliberate reason to keep them different (for example brand primary is a light tint that cannot serve as a button fill). See `tokens.css` Section A comment for the explanation used on this project.
22. Do not default to bespoke CSS for card/tile interactions when Tailwind and shadcn primitives can express the layout cleanly. Drop to shared CSS only for the narrow pieces utilities do not cover well.
23. Do not use `<h4>`, `<p>`, or bare `<div>` for short grammar section labels (e.g. "For example:", "Here are the conditional forms:"). Always use `<GrammarLabel>` — it enforces correct font size and prevents WAVE "possible heading" alerts. One component = one change site for all labels.
24. **[Tech debt — existing LOs]** Do not ship a new course without renaming all component-named audio exercise subfolders to semantic or ordered names. All current LOs (LO1–LO15) use folder names tied to React component names (`draggableFillGaps1`, `selectExercise2`, `memoryMatchGame1`, `dictationExercise4`, etc.). These are implementation details, not content descriptions — if a component is renamed or replaced, the folder name becomes misleading. Scope of the existing debt: ~50 folders across LO1–LO15, ~400+ source references. Migrate one LO at a time in dedicated commits. See the Audio File & Folder Naming Convention section for the target structure.
25. **[Tech debt — `App.jsx`] (RESOLVED 2026-06)** Do not render config-driven components through a giant `switch (component)` inside a god component. `App.jsx` was originally a single 1735-line class doing routing, config loading, schema normalization, modal-link handling, theme, and a ~550-line `renderComponent` switch with ~20 branches. It is now a ~450-line functional composition root: exercises dispatch through `EXERCISE_REGISTRY` in `src/render/lazyRegistry.jsx`, and the structural switch + the `wrapInShell` shell live in a `createRenderer(ctx)` factory in `src/render/renderLearningObject.jsx` (PR #37). The lesson still stands for new projects — build the registry + thin shell from day one so the file never grows without bound. See the Component Rendering Architecture rule below for the target.
26. **[SEO — no dead query routing]** Do not carry a numeric/query content selector (`?lo=1`, `?id=`, `?page=`) in a new project — not even as a "backward-compat" resolver that canonicalizes to the slug. There are no legacy links to protect on a greenfield app, so a query resolver is pure dead surface: a second way to reach every page, a crawl/duplicate-content risk, and ongoing test/normalize code that must be kept in sync. Build **slug paths as the only route from day one** — resolve content from `location.pathname` slug only; never read a content id/slug off `URLSearchParams`. (Contrast — existing French LO: `?lo=<id|slug>` is RETAINED there as a real backward-compat entry that self-canonicalizes to `/slug/` and strips `?lo` — see `resolveLearningObjectParam` / `normalizeLearningObjectUrl` in `src/lib/loConfig.js`. That safety net is justified by real shipped links; a NEW project has none, so omit it entirely.) Non-content operational flags that never index (e.g. `?skipCookieControl=1`, debug toggles) are fine — the rule is about content addressing, not all query params.
27. **[Tech debt — CSS layers]** Do not leave custom CSS **unlayered**. In Tailwind v4, cascade-layer order beats specificity: a rule in `@layer utilities` (where all Tailwind utilities live) beats `@layer base` _even for ID selectors_ — but an **unlayered** rule beats _every_ layer, so it silently overrides Tailwind utilities no matter how low its specificity. `src/index.css` still has ~321 ID-scoped, largely **unlayered** legacy rules (e.g. `#content :where(p,li,td…)`, `#content a`) that sit cascade-above utilities. Symptom: a `text-*`/`bg-*` utility "does nothing" and only `!important` fixes it (a band-aid that must be repeated forever). **Fix:** wrap the offending rule in `@layer base` — utilities then win cleanly with no `!important`. See the CSS Cascade Layers rule below. Migrating the remaining unlayered legacy rules into `@layer base` is an open phase.
28. **[Static `<head>` assets must use `%BASE_URL%` under a non-root base + path routing]** Do not author `<link rel="icon">`, `apple-touch-icon`, `manifest`, preload, or any static `<head>` href as a **relative** path (`href="favicon.svg"`) when the app deploys under a non-root base AND uses path-slug routing. Vite rewrites relative URLs in _processed_ assets (JS/CSS) to the base, but leaves static `<head>` `<link>`/`<meta>` hrefs untouched — so a relative favicon resolves against the _current page URL_, not the base. It works on the base-root landing page (`…/french-basic/` → `…/french-basic/favicon.svg`) but 404s on any deeper slug route (`…/french-basic/first-contact/` → `…/french-basic/first-contact/favicon.svg`) → browser shows its default icon. **Fix:** prefix every static `<head>` asset href with Vite's `%BASE_URL%` token (`href="%BASE_URL%favicon.svg"`) so it builds to an absolute base-rooted path that resolves at any route depth. Same root cause as the runtime-asset bug (#35: relative fetch under a non-root base) — `%BASE_URL%` for `index.html` statics, `resolveAsset(...)` for runtime fetches. Note: `site.webmanifest`'s own icon `src` entries are exempt — they resolve against the _manifest's_ URL (always at base root), not the page. French LO fix: 2026-06-15, `index.html` 5 links.

### Component Rendering Architecture (Carry Forward)

> 📐 **Diagrams:** see [docs/ARCHITECTURE.md](../ARCHITECTURE.md) for Mermaid diagrams of the four layers, render flow, activity contract, theme cascade, and the new-course / new-activity workflows — the developer-facing version of these rules.

Config-driven content apps (a JSON schema naming components to render) must map type → component through a **registry**, never a switch, and must keep the app shell thin.

**Rules:**

1. **Registry, not switch.** Map component-type strings to components in a lookup object; dispatch by key.
   ```js
   // componentRegistry.js
   export const COMPONENT_REGISTRY = { SelectExercise, RadioQuiz, DraggableFillGaps /* … */ };
   // render: const Cmp = COMPONENT_REGISTRY[type]; return Cmp ? <Cmp {...props} /> : null;
   ```
   Adding a component = one map entry, not a new `case`. No single file grows unbounded.
2. **Function components + hooks from day one.** Class components block shared-logic extraction via hooks (and force `this`-bound handlers). Start functional.
3. **Context for cross-cutting concerns.** Theme (dark mode), modal/dialog state, and similar app-wide state belong in React Context (`ThemeContext`, `ModalContext`) — not threaded through one component's state.
4. **Routing is its own layer.** Slug/URL ↔ content resolution belongs in a `router/` module (or a router library), not as methods on the app component.
5. **Config + schema work is a service.** Loading and normalizing JSON config is data work — put it in a `configService`/loader module, outside the view layer.
6. **The app shell is a composition root.** Ideally ~100 lines: wire providers + router + registry, nothing else.

**Defined prop contract for the registry:** decide up front — either (A) every registered component accepts a uniform `{ value, ...context }` shape and reads what it needs, or (B) the registry stores `{ Component, mapProps }` adapters per type. Prefer A where components already share a shape; B for outliers.

**If refactoring an existing switch:** use the strangler pattern — add the registry alongside the switch, migrate one type per commit (registry entry + delete that `case`), verify each step against a visual baseline (Playwright screenshots) and unit tests where logic is extractable, then delete the empty switch last. App stays working after every commit.

**Proven outcome (French LO, 2026-06):** this architecture was reverse-engineered onto a legacy class component. `App.jsx` went 1495 → ~450 lines across PRs #27–#37 (pure helpers → `lib/`, dead branches removed, render-shell helper, modal map + hook → `lib/`+`hooks/`, page-chrome → presentational components, lazy code-split registry + the whole `renderComponent`/`renderComponentForTab` dispatch → `src/render/`), one PR per session, each behaviour-preserving and browser-verified. No regressions. `App.jsx` is now a thin composition root; the data-loading effect is the only sizeable block left in the shell and further splitting is optional. **Lesson: build the registry + thin shell from day one; retrofitting it is many careful PRs.**

### Config Schema as Component Spec (Carry Forward)

The companion to the registry rule above: the **content JSON is a typed, nested component spec**, and the renderer is a generic interpreter with zero per-page logic. A new "page" (learning object, lesson, article…) is _pure data_ — a JSON tree + any new custom components registered in the registry. This is what makes the content authorable without touching code.

**The contract (carry forward verbatim):**

1. **Every node carries a `component` string** — the single dispatch key. The renderer resolves it: registry hit → uniform `<Cmp config={node} />`; a few structural types (`Group`, `Section`) handled explicitly; else look up a per-project custom-component map; unknown → a visible "not implemented" placeholder (never a silent blank); a reserved prefix (e.g. `HIDE…`) → skip.

2. **Container nodes nest via `content[]`, and the renderer recurses.** A `Group`/`Section` node holds `content: [ { "uniqueKey": node }, … ]` — each child is wrapped in a throwaway key so JSON keeps children _ordered and named_. Normalise (strip the wrapper key to the inner node) before mapping. The JSON tree maps 1:1 to the React tree.

3. **One container, two layouts via a flag.** `Group` renders its children stacked (sub-accordions/sections) by default, or as **tabs** when `displayAsTabs: true`. Same data, presentation flag decides. Keep presentation switches as boolean/enum fields on the node, not as separate component types.

4. **Top-level config = an ordered object of sections**, iterated in key order. A reserved `settings` key (peeled off before iteration) holds page-level settings that merge over global shared-settings (page overrides global). Everything else is a section.

5. **Per-node knobs the interpreter honours** (name them once, reuse everywhere): `id` (drives DOM id + accordion key + `#hash` deep link — **stable, never regenerate**), `expandable` (accordion vs static shell), a hero flag (which shell wraps it), `displayAsTabs`, `titleText`/`titleTextHTML`, `menuText` (tab/nav label), an instruction/info field (callout above content), and an `instructionsLayout` (intro paragraph + image). Component-specific payload (`phrases`, `items`, `words`, `soundFile`, etc.) is read only by that component.

6. **Inline rich-text HTML carries cross-cutting behaviour the renderer never parses.** Authored fields embed `<a class='modal-link' data-modal-target='…'>` (see Modal-Link Authoring Rule below). The renderer outputs the HTML as-is; a single document-level capture-phase click delegation (one hook) resolves `.modal-link` clicks to a dialog. Keep this out of every component — one global listener, not per-render wiring.

**App-shell split that pairs with this (French LO, PR #32):** keep the shell's render body thin by extracting page **chrome** — hero banner, page title, intro block, empty-state notice — into pure presentational components that take data as props. The shell keeps only the _when-to-show_ guards (e.g. `currentLearningObject !== -1 ? <HeroBanner …/> : null`); the components stay pure and free of conditionals. Same principle as the container/presentational split, applied to the composition root.

### CSS Cascade Layers (Carry Forward)

> 📐 **Project-specific detail:** see [docs/process/TAILWIND_V4.md](./TAILWIND_V4.md) for the French LO debt table, all fixes applied, and the future-project checklist.

Tailwind-first means utilities must always be able to win. The mechanism that guarantees this is **cascade layers**, not specificity.

- Tailwind v4 declares `@layer theme, base, components, utilities;`. **Layer order beats specificity:** a `text-sm` utility (in `@layer utilities`) overrides `#content p { font-size }` _only if that rule is in an earlier layer_ (`@layer base`). The ID's 1-0-0 specificity is irrelevant across layers.
- **Unlayered CSS beats every layer.** A plain unlayered rule sits cascade-above `@layer utilities`, so it silently overrides Tailwind utilities regardless of specificity. This is the usual reason a utility "does nothing".
- **Rule:** wrap _all_ hand-written CSS in a layer — `@layer base` (element/content defaults), `@layer components` (reusable classes), or `@utility` (custom utilities). Never leave custom rules unlayered.
- **Never reach for `!important` to beat a global rule** — that's a band-aid repeated forever. Instead move the offending rule into `@layer base`; utilities then win cleanly.
- **Authored/prose content** that can't carry classes: style it via a layered, scoped rule (`@layer base { #content :where(p,li,td…) {…} }`). Authored content (no utilities) still gets the default; any component using utilities inside the same container still wins.
- **Debugging:** if a utility loses, inspect the winning rule's **layer**, not just its specificity.

> Existing debt: ~321 ID-scoped, largely unlayered rules in `src/index.css`. The font-size/link-colour ones under `#content` have been moved into `@layer base`; the rest are a pending migration. New CSS must be layered from the start.

### Image Asset Structure Rule (Carry Forward)

Use this as the default image directory contract:

```text
public/media/images/
|- common/            (app-shell assets — cross-language, infrastructure)
|  |- branding/       (banners, app-level brand assets)
|  |- footer/         (organisation logos in light/dark variants)
|  |- custom-icons/   (bespoke designer SVGs used as CSS mask-images)
|- shared/            (cross-LO content assets — language-specific but not LO-specific)
|- lo1..loN           (LO-specific assets)
```

**`common/custom-icons/` rule:**

- Use for static designer SVG files loaded via CSS `mask-image` — NOT for Lucide React components.
- Lucide icons are React components imported from `lucide-react` and rendered inline in the DOM.
- Custom icons are disk files served by URL, coloured by CSS `background-color` + `mask-image`.
- Keep the two systems clearly separate — never put Lucide SVG exports in `custom-icons/`.

Naming rules:

1. lowercase only
2. ASCII-only
3. no spaces
4. kebab-case preferred for multi-word names

### Modal-Link Authoring Rule (Carry Forward)

Use this rule in all config/JSON-authored rich text:

1. For modal content links, always use:
   - `href="#content"`
   - `data-modal-target="<modal-content-id>"`
2. Example:
   - `<a class='modal-link' href='#content' data-modal-target='tuvous'>vous</a>`
3. Do not use:
   - `<a class='modal-link' href='#tuvous'>vous</a>`
4. Why:
   - direct hash modal links are frequently reported as "Broken same-page link" by validators because they appear as missing in-page fragments.
   - this blurs two distinct behaviors (scroll navigation vs modal launch) and increases maintenance risk.
5. Design principle:
   - one link behavior per contract: top nav hashes are for section scroll, `.modal-link` is for modal launch only.

### Single-Accordion Default-Open Rule (Carry Forward)

Use this for LO-style content pages where some sections contain only one accordion:

1. Count accordions per top-level section (include nested group/section content).
2. If a section has exactly one accordion, open it by default so content is immediately visible.
3. If a section has more than one accordion, keep default collapsed.
4. Persist user open/close state in session storage and let persisted state override default-open.
5. Document the behavior in README/task tracker to avoid regressions during future refactors.

### Accordion Strategy Rule (Carry Forward)

1. If an existing app already has a production accordion wrapper with accepted UX/a11y behavior, reuse it for short-term parity migrations.
2. In parallel, plan a medium-term migration to a shared shadcn-native wrapper (for example `LessonAccordion`) so all future sections/components use one API.
3. Keep one visual skin contract (tokens/classes) regardless of underlying primitive to avoid hover/animation drift between modules.
4. Document both phases explicitly:
   - phase 1: parity-first, low-risk reuse.
   - phase 2: design-system abstraction and cross-feature consolidation.

### LO Architecture Parity Checklist (Carry Forward)

Use this checklist whenever adding/refactoring an LO section (especially Grammar):

1. Config parity check
   - Compare against a known-good LO section and confirm both use equivalent config shape (`Group` + child items where expected), not one-off monolithic components unless intentional.
2. Render-path parity check
   - Confirm section content is rendered through shared app wrappers (`Section`/`HeroSection` + `AccordionArticle`) instead of nested bespoke wrappers inside custom components.
3. Instruction-path parity check
   - Confirm instructional copy uses the shared callout pipeline and sanitized HTML-capable fields.
4. Spacing parity check
   - Avoid extra nested `.container` wrappers that introduce additional horizontal padding layers and visual drift.
5. Documentation parity check
   - Update README + task checklist immediately when architecture decisions differ from baseline so drift is visible early.

### Responsive Navigation Pattern (Carry Forward)

Use this pattern for all future projects that need a desktop nav + hamburger mobile nav:

1. Keep structure and behavior separate
   - Use shadcn/Radix primitives for structure (`NavigationMenu`, optional `Sheet`).
   - Keep responsive orchestration (open/close/highlight/scroll offsets) in dedicated helper/hook files.

2. Avoid monolithic menu files
   - Split into:
     - container/orchestrator
     - desktop nav renderer
     - mobile panel renderer
     - actions block (theme toggle + hamburger)
     - pure nav-entry mapping helper

3. Preserve semantic accessibility defaults
   - Keep one primary navigation landmark for one IA.
   - If mobile panel duplicates same links, use non-primary container semantics for the panel shell.
   - Keep keyboard close behavior (`Escape`) and explicit control wiring (`aria-controls`, `aria-expanded`).

4. Keep one visual contract
   - Tokenized Tailwind classes remain the source of truth.
   - Do not create separate ad hoc style systems for desktop vs mobile nav.

5. Add focused behavior tests early
   - highlight update on scroll
   - mobile open/close
   - nav click behavior

### Educational Semantic Colour Token Rule (Carry Forward)

Use the `--edu-*` prefix for all colour tokens that describe a **role in learning content**, not a visual appearance or brand value.

**Token set:**

```css
--edu-affirm   /* correct answer, success, positive feedback      */
--edu-warn     /* caution, hint, amber call-to-action              */
--edu-neg      /* wrong answer, error, negative feedback           */
--edu-neutral  /* secondary/supporting text, inactive state        */
--edu-accent   /* highlighted term, active selection emphasis      */
```

**Companion utility classes** (apply token colour to inline text):

```css
.edu-affirm {
  color: var(--edu-affirm);
}
.edu-warn {
  color: var(--edu-warn);
}
.edu-neg {
  color: var(--edu-neg);
}
.edu-neutral {
  color: var(--edu-neutral);
}
.edu-accent {
  color: var(--edu-accent);
}
```

**Rules:**

1. Always use `--edu-*` prefix — never `--ped-*` (ambiguous, could be read as a person's name).
2. These tokens describe semantic role only. Never name them by colour (`--green`, `--amber`).
3. `--edu-*` tokens own their values as **pinned oklch literals** — never alias `--chart-*`. shadcn remaps chart tokens in dark mode (e.g. chart-3 → amber-orange, chart-4 → vivid purple), which causes semantic drift. Pinned values stay correct regardless of shadcn updates.
4. `--edu-*` tokens are course-neutral and brand-neutral. They must not contain brand colour values directly. Use dedicated oklch literals or, where truly appropriate, `--destructive` (never `--chart-*`).
5. Document the full token set and utility classes with a block comment in the CSS file so any developer can understand the system without reading the docs.

**Why not `--ped-*`:**
`ped` is a common nickname and can be confused with a person's name. `edu` is universally understood as "educational" by any developer reading cold.

### Semantic Emphasis Rule (Carry Forward)

1. Author inline emphasis with semantic tags only:
   - use `<strong>` for strong importance.
   - use `<em>` for stress emphasis.
2. Do not use `<b>` or `<i>` for authored content in JSX/JSON HTML.
3. Why:
   - semantic tags communicate emphasis meaning to assistive technologies more reliably;
   - presentational tags cause inconsistent authoring patterns and accessibility drift over time.

## Dev-Only Debug Sandbox Pattern (Best Practice)

Use this pattern by default:

1. Keep debug fixtures in a dedicated dev area (for example `src/debug/`) instead of `src/App` or route components used by production pages.
2. Use a separate sandbox entry page (for example `debug-sandbox.html`) and a dedicated entry script (for example `src/debug/sandbox-main.jsx`).
3. Add a hard runtime guard in sandbox entry code:
   - `if (!import.meta.env.DEV) throw new Error(...)`
4. Keep sandbox-only React components either:
   - nested/private inside the sandbox page component file, or
   - colocated under `src/debug/components/` (not exported from app component barrels).
5. Do not import sandbox components into production app trees (`src/App.*`, production routes, shared exports).
6. Naming convention:
   - React component names: PascalCase (`DebugSandbox`, `TypographySample`)
   - folders/paths: lowercase or kebab-case (`src/debug`, `src/debug/components`)

Why this is best practice:

- prevents validator noise from hidden debug DOM in production HTML
- keeps production markup deterministic and easier to maintain
- avoids debug component sprawl in core app component namespaces
- makes intent explicit: sandbox code is for developer diagnostics only

### Grammar Section Label Rule (Carry Forward)

Short introductory labels that appear immediately before a grammar table or example list must use a single shared component — never a bare `<div>`, `<p>`, or `<h4>`.

1. Always import and use `<GrammarLabel>` from `src/components/custom/grammar/GrammarLabel.jsx`:

   ```jsx
   import { GrammarLabel } from "@/components/custom/grammar/GrammarLabel";

   <GrammarLabel>For example:</GrammarLabel>
   <GrammarLabel className="mt-4">Here is the full list of pronouns:</GrammarLabel>
   ```

2. The component enforces `font-size: var(--font-size-base)` and renders as a `<div>` — preventing both font-size drift and WAVE "possible heading" alerts.
3. Use the optional `className` prop only for spacing (e.g. `mt-3`, `mt-4`). Never add `font-semibold`, `font-bold`, or heading classes.
4. Do NOT use `<h4>` for these labels — they are not document headings and will distort the heading outline for screen readers.
5. Do NOT use a bare `<div>` or `<p>` — both risk size drift and WAVE alerts.

Why this matters:

- Plain `<div>` inside `.panel` wrappers inherits a smaller font size than `<p>` — causing invisible style drift.
- Short `<p>` elements trigger WAVE "possible heading" false positives when they start with bold text or end with a colon.
- Bold `<h4>` labels look like sub-headings and are semantically incorrect for these labels.
- A single component means one change updates every label site simultaneously.

### Instruction Text Icon Token System (Future Architecture)

**Problem:** Exercise instruction text currently lives in JSON config files as raw HTML strings rendered via `dangerouslySetInnerHTML`. Because they are raw HTML — not JSX — Lucide React components cannot be embedded. This forces two separate icon systems to coexist:

| Context                 | Mechanism                          | Source                      |
| ----------------------- | ---------------------------------- | --------------------------- |
| Instruction text (JSON) | CSS `mask-image` + custom SVG file | `common/custom-icons/*.svg` |
| Exercise UI (JSX)       | Lucide React component             | `lucide-react` package      |

This is not true DRY. The same visual icon requires two separate definitions.

**Target architecture:** Replace raw HTML instruction strings in JSON with a lightweight token format, and build a shared renderer component that parses tokens into React — including Lucide icons inline.

**JSON config (before):**

```json
"informationTextHTML": "Click <span class='inline-icon inline-icon-check'></span> to check your answers"
```

**JSON config (after):**

```json
"instruction": "Click [icon:CircleCheck] to check your answers"
```

**Renderer component:**

```jsx
// <InstructionText value="Click [icon:CircleCheck] to check your answers" />
// renders: <>Click <CircleCheck size={16} aria-hidden="true" /> to check your answers</>
```

**Benefits once complete:**

- One icon source (Lucide) for all contexts — instruction text and exercise UI
- CSS mask-image custom SVGs retained only for genuinely bespoke designer icons not in Lucide
- `circle-check.svg`, `eye.svg`, `eye-off.svg`, `rotate-ccw.svg`, `volume-2.svg` can be removed from `common/custom-icons/`
- No more `dangerouslySetInnerHTML` in exercise instruction paths — safer and more testable

**Migration scope:**

1. Build `InstructionText` component with token parser and Lucide name registry.
2. Update every exercise component that uses `dangerouslySetInnerHTML` for instruction text.
3. Migrate all JSON configs from HTML strings to token strings.
4. Retain safe fallback for legacy HTML content (links, `<strong>`, `<em>`) — parser must handle mixed text and HTML nodes.
5. Remove redundant CSS mask-image icon files once all references are gone.

**Do not start this migration mid-project.** Plan as a dedicated sprint with a full config audit upfront. The migration touches every exercise type and all LO config files simultaneously.

### Table Semantics Rule (Carry Forward)

1. Default layout primitives:
   - use flex/grid for spacing/alignment/layout.
2. Use `<table>` only for true tabular data relationships.
3. Data tables must include:
   - `<caption>`
   - `<th scope="col|row">` headers
4. If legacy layout table removal must be phased:
   - use `role="presentation"` as a temporary mitigation only.
5. Validation triage reminder:
   - WAVE snippets that include `chrome-extension://...` assets are extension overlays, not source DOM.

### What To Include In Debug Sandbox (Default Scope)

Include these by default in new projects:

1. Typography contract preview
   - heading/body/caption samples that consume the same global tokenized styles as production pages.
2. Token inventories
   - color token list with light/dark resolved values and swatches.
   - font token and `@font-face` inventory with used/unused status.
3. Asset diagnostics
   - SVG/image usage panel rendered in UI cards.
   - prefer manifest/snapshot input over browser-time source scanning for stability.
4. Navigation helpers for QA
   - index links to key pages/learning objects.
   - high-level structure summary (sections/accordions/component types).
   - if the structure summary classifies exercise/component types, keep that exercise-type registry in sync whenever a new reusable engine is added (for example `LineMatch`).
5. Explicit diagnostics state
   - clear loading/error messages per panel so one failing panel does not blank the entire sandbox.

### What Not To Include In Debug Sandbox

1. No imports from production component barrels if direct imports are possible.
2. No hidden debug DOM inside production app trees (`App`, route pages, shared layout).
3. No analytics/telemetry side effects.
4. No write-path behavior (localStorage mutation, data writes) unless intentionally testing that behavior.

## Recommended Directory Structure

```text
project-root/
  public/
    media/
      audio/                # runtime-served audio files (no import processing needed)
      video/                # runtime-served video files
      images/               # static images used by content/config
      icons/                # static favicon/pwa/icon assets
  src/
    debug/                  # dev-only sandbox pages and fixtures (not imported by production app)
      components/           # optional sandbox-only components
      sandbox-main.tsx      # sandbox entry point
    app/
      providers/            # ThemeProvider, QueryProvider, etc.
      routes/               # route-level pages/layouts
    components/
      ui/                   # shadcn primitives (Button, Dialog, Tabs...)
      custom/               # your app-specific reusable components
      sections/             # larger page/feature sections
    features/               # feature modules (state, components, services)
      <feature-name>/
        components/
        hooks/
        lib/
        types.ts
    hooks/                  # shared hooks (useTheme, useMediaQuery...)
    lib/
      utils.ts              # cn(), helpers
      guards/               # style guard scripts/helpers if needed
      constants.ts
    services/
      api/                  # fetch clients/endpoints
      audio/                # playback helpers/managers
    styles/
      tokens.css            # semantic token contract
      themes/
        theme-french.css    # locale/brand palette overrides
        theme-spanish.css
        theme-russian.css
      base.css              # tailwind base imports + global utility glue
    assets/
      svg/                  # imported SVGs as modules/components
      fonts/                # self-hosted fonts if required
    types/
      global.d.ts
    main.tsx
    App.tsx
  scripts/
    check-style-guard.sh    # blocks hardcoded typo/color + blocks scss
  .githooks/
    pre-commit
  .github/
    workflows/
      ci.yml
  THEME_ARCHITECTURE.md
  COMPONENT_GUIDELINES.md
  CONTRIBUTING.md
  package.json
```

## Recommended Semantic Page DOM Structure

Use this as the default page-content structure in future projects:

```text
body
|- a.skip-link[href="#content"]                              (recommended)
|- header#mainMenu.main-menu
|  |- nav[aria-label="Main navigation"]                      (single primary nav landmark)
|  |- div.mobile-menu[role="region"][aria-label="Main navigation mobile"]
|- main#content
|  |- section#introduction
|  |  |- header
|  |  |  |- h1
|  |  |  |- div.instructions
|  |  |- div.section-body
|  |- section#dialogues
|  |  |- header
|  |  |  |- h2
|  |  |  |- div.instructions
|  |  |- div.accordion
|  |     |- article.accordion-article
|  |- section#vocabulary
|  |- section#grammar
|  |- section#pronunciation
|  |- section#exercises
|- footer
```

Rules:

1. Keep exactly one primary nav landmark for the main IA (`header > nav`).
2. Keep mobile navigation responsive, but do not add a second primary `<nav>` for the same links.
3. Keep heading order logical (`h1` before section `h2` headings).
4. Keep top-level content areas as real `section` landmarks under `main`.
5. Use `article` for standalone accordion leaf content units.

## Where Tokens Live (Simple Model)

Use this exact split so there is no confusion:

1. `src/styles/tokens.css`:
   Define the semantic token contract only (`--background`, `--foreground`, `--primary`, `--border`, typography tokens, spacing tokens).
2. `src/styles/themes/theme-<locale>.css`:
   Override token values for each locale/brand theme (French, Spanish, Russian).
3. `tailwind.config.ts` (or `.js`):
   Map Tailwind theme keys to CSS variables from `tokens.css` (for example `background: "var(--background)"`, `primary: "var(--primary)"`).
4. Components:
   Use Tailwind semantic utilities (`bg-background`, `text-foreground`, `border-border`, `text-primary`). Never use literal palette values in components.

Minimal example:

```css
/* src/styles/tokens.css */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
}
```

```css
/* src/styles/themes/theme-french.css */
:root[data-theme='french'] {
  --background: oklch(0.976 0.023 90.7);
  --primary: oklch(0.612 0.13 160.6);
}

:root[data-theme='french'].dark {
  --background: oklch(0.145 0 0);
  --primary: oklch(0.922 0 0);
}
```

```ts
// runtime switch (app init or ThemeProvider)
document.documentElement.dataset.theme = localeThemeMap[locale];
document.documentElement.classList.toggle('dark', isDarkMode);
```

## Asset Naming & Placement Convention (Carry Forward)

### Universal rules

These apply to every file and folder name in `public/` — audio, images, fonts, everything.

1. **Kebab-case always** — all lowercase, hyphens only. No PascalCase, no camelCase, no underscores, no spaces.
2. **No file extension in the filename** — `cc-logo-black.svg` not `cc-logo-black-svg.svg`.
3. **No abbreviations in folder names** — `images/` not `img/`, `fill-gaps-01/` not `fg-01/`.
4. **ASCII-safe** — no accented characters, no special characters (cross-platform reliability).
5. **Zero-padding for sortability:**
   - LO folders: 2-digit zero-padded — `lo-01`, `lo-02` … `lo-15`
   - Dialogue subsection folders: 2-digit number only — `01`, `02` (parent folder provides the semantic context)
   - Exercise subsection folders: task-name + number — `fill-gaps-02`, `select-01`
   - Individual files: 3-digit zero-padded — `001-`, `024-`, `135-`

> **Note — this project:** Uses `lo1`–`lo15` (no zero-padding, no hyphen) and `img/` (abbreviated). These are known deviations — too large to migrate mid-project. Apply the rules above from day one on new projects.

---

### Asset placement

| Asset type                          | Location            | Notes                              |
| ----------------------------------- | ------------------- | ---------------------------------- |
| Runtime audio (URL-referenced)      | `public/audio/`     | Never in `src/`                    |
| Runtime images (URL-referenced)     | `public/images/`    | Never in `src/`                    |
| SVGs imported into React components | `src/assets/svg/`   | Vite import, not URL               |
| App fonts                           | `src/assets/fonts/` | Versioned and tokenised            |
| UI sound effects                    | `public/audio/ui/`  | No LO subfolder, no numeric prefix |
| Favicons / PWA icons                | `public/` root      | Browser convention                 |

---

### Audio — directory structure

```
public/audio/
  lo-01/
    dialogues/
      01/                    ← number-first; parent folder provides semantic context; NOT phraseTable1/
      02/                    ← reflects page scroll order top-to-bottom; sorts correctly in all file browsers
    vocabulary/              ← flat if < ~50 files; no subsections needed
    grammar/
      adjective-agreement/   ← semantic topic name, no number if unambiguous
      modal-verbs/
    pronunciation/
      nasal-vowels/          ← semantic topic name
      silent-h/
    exercises/
      01-fill-gaps/          ← number first; NOT draggableFillGaps1/
      02-fill-gaps/
      01-matching/           ← NOT memoryMatchGame1/
      01-select/             ← NOT selectExercise1/
      01-dictation/          ← NOT dictationExercise1/
      01-listening-order/    ← NOT listeningOrder1/
      01-transform/          ← NOT typedTransformExercise1/
      01-inline-choice/      ← NOT inlineChoiceGroup1/
    shared/                  ← audio reused across multiple sections of the same LO
  lo-02/
    ...
  ui/
    click.mp3                ← UI feedback sounds: flat, no prefix, no LO folder
    error.mp3
```

#### Audio file names

Every content audio file: **`NNN-kebab-case-description.mp3`**

- `NNN` — 3-digit zero-padded sequence, **resets to `001` in every folder**
- Description — romanised content, ASCII-safe; accented chars romanised with a single hyphen (`où` → `ou`, `résidence` → `residence`)

```
✅  001-ou-habites-tu.mp3
✅  024-je-voudrais-un-kilo-de-pommes-de-terre.mp3
❌  ou habites tu.mp3                       — spaces
❌  OuHabitesTu.mp3                         — camelCase
❌  001-o-u-habites-tuo-habites-tu.mp3      — double romanisation concatenated
❌  lo12ex4.mp3                             — opaque internal reference, no prefix
```

UI sounds (`public/audio/ui/`) do not carry a numeric prefix — there is no ordering requirement.

#### Exercise folder name map (component → task name)

Number always comes first, zero-padded to 2 digits. The number is the instance number
for that exercise type within the LO (preserved from the original, gaps are fine).

| Old (component name)         | New (task name)                                              |
| ---------------------------- | ------------------------------------------------------------ |
| `phraseTable1`               | `01` (inside `dialogues/`)                                   |
| `draggableFillGaps1`         | `01-fill-gaps`                                               |
| `draggableFillGapsPictures1` | `01-fill-gaps-pictures`                                      |
| `selectExercise1`            | `01-select`                                                  |
| `memoryMatchGame1`           | `01-matching`                                                |
| `dictationExercise1`         | `01-dictation`                                               |
| `typedTransformExercise1`    | `01-transform`                                               |
| `inlineChoiceGroup1`         | `01-inline-choice`                                           |
| `listeningOrder1`            | `01-listening-order`                                         |
| `wordparts1`                 | `01-word-parts`                                              |
| `dropdowns4`                 | `04-select` (dropdown is a select variant; number preserved) |
| semantic name (`articles`)   | `01-articles` (add number prefix)                            |
| `grammar1`, `pronunciation1` | semantic topic name (e.g. `nasal-vowels/`)                   |

**Rule:** folder names describe what the _learner experiences_, not what _component renders it_. If a component is renamed or replaced the folder name must stay stable.

---

### Images — directory structure

```
public/images/
  lo-01/
    lo-01-hero.svg             ← one cover image per LO; name: lo-NN-topic-slug.svg
    exercises/
      rooms/                   ← content topic group; no numeric prefix on folder
        attic.svg              ← named after what it depicts; no numeric prefix on file
        bathroom.svg
      vocabulary/
        athletics.svg
        basketball.svg
  common/
    branding/
      fr-banner.svg
    custom-icons/
      circle-check.svg         ← flat, semantic, no prefix
      volume-1.svg
    footer/
      cc-logo-black.svg        ← kebab-case; no redundant format suffix
      lc-logo-dark.svg
  shared/
    grammar.svg                ← cross-LO reusables
    self-study.svg
```

#### Image file names

- **No numeric prefix** — images are keyed by what they depict, not by sequence.
- Exception: if multiple images serve the _same content slot_, use `NNN-` prefix.
- Named after the depicted subject in English: `athletics.svg`, `underground-train.svg`.
- No redundant format suffix in the name: `cc-logo-black.svg` not `cc-logo-black-svg.svg`.

#### Image formats

| Format  | Use for                                                       |
| ------- | ------------------------------------------------------------- |
| `.svg`  | All illustrations, icons, logos — preferred (scalable, small) |
| `.webp` | Photographs only                                              |
| `.png`  | Favicons and PWA manifest icons only (browser requirement)    |
| `.jpg`  | Avoid — use `.webp` instead                                   |

---

### Summary: what this project deviates from (known tech debt)

| Deviation                                             | Correct convention   | Migration cost                |
| ----------------------------------------------------- | -------------------- | ----------------------------- |
| `lo1`–`lo15` (no zero-padding, no hyphen)             | `lo-01`–`lo-15`      | Very high — do on new project |
| `img/`                                                | `images/`            | High — all config + JSX refs  |
| `draggableFillGaps1/` etc. in exercises               | `01-fill-gaps/` etc. | High — ~50 folders, ~400 refs |
| `CC_Logo_Black_SVG.svg` (PascalCase)                  | `cc-logo-black.svg`  | Low — footer images only      |
| `grammar1/`, `pronunciation1/` (number without topic) | semantic topic name  | Low — a handful of LOs        |

## Light/Dark Mode Rules

- Theme controlled by root class (`.dark`) + token overrides.
- Locale/brand theme controlled by root data attribute (`[data-theme="french"]`, etc.).
- Do not hardcode component-level light/dark hex values.
- All component colors must come from semantic tokens.
- Add theme toggle only as class switch; never inline style swaps.

## Multi-Theme Rules (Locale/Brand)

- Do not create separate component CSS for each locale/theme.
- Keep one semantic token set in `tokens.css` (example: `--background`, `--foreground`, `--primary`, `--border`, `--muted`).
- Keep locale palettes in dedicated theme files only.
- Theme files should only override tokens, for example:

```css
:root[data-theme='french'] {
  --primary: ...;
  --background: ...;
}
:root[data-theme='french'].dark {
  --primary: ...;
  --background: ...;
}
```

- Select locale theme at runtime once, for example:

```ts
document.documentElement.dataset.theme = localeThemeMap[locale];
```

- Validate each locale theme for WCAG AA contrast (text, controls, focus ring, links).

## Component Extension Rules

- Never edit shadcn primitives directly for one-off styles.
- Wrap primitives in `src/components/custom/*` and expose variants with `cva`.
- Keep variants semantic (`primary`, `secondary`, `danger`, `subtle`) not palette names.
- Use only Tailwind classes + tokens (no inline hardcoded colors/sizes).

## Add-Component Checklist

1. Build from shadcn primitive or custom wrapper.
2. Add/confirm needed tokens first (if new visual role is needed).
3. Add variants with `cva`.
4. Verify light and dark mode parity.
5. Verify locale/brand theme parity (French/Spanish/Russian or equivalents).
6. Verify keyboard focus and reduced motion.
7. Run guard checks and CI before merge.
8. Run accessibility checks before merge:
   - eslint accessibility rules (for example `jsx-a11y`)
   - automated page checks (for example axe in Playwright/Cypress)
   - quick keyboard-only smoke test (Tab/Shift+Tab, Enter, Space, Esc where relevant)

## Accessibility Is Non-Negotiable

Treat accessibility as a build requirement, not a polish task:

1. Every page must ship with semantic landmarks and heading structure.
2. Every interactive control must be keyboard-operable and visibly focusable.
3. Every icon-only control must have an accessible name.
4. CI must fail if accessibility gates fail.

## Copy-Only Prompt (Short)

```text
Create a new React project using Bun + Tailwind CSS + shadcn/ui + Lucide.

Must-haves:
- No SCSS/SASS. Tailwind-only styling.
- Single source of truth semantic token contract in src/styles/tokens.css for colors, typography, spacing, radius, shadows, and motion.
- Locale/brand palette overrides live in src/styles/themes/theme-<locale>.css.
- Tailwind and shadcn consume semantic tokens only.
- Light/dark mode from day one (class-based .dark), with token parity.
- Locale/brand theming from day one via data-theme on the root element.
- No hardcoded color/font-size/font-family values outside token files.
- shadcn extension pattern: keep primitives in src/components/ui and build app variants in src/components/custom using cva + cn utility.
- Accessibility defaults: visible focus, keyboard support, prefers-reduced-motion support.

Set up guardrails:
- ESLint + Prettier
- pre-commit hooks
- CI pipeline
- style guard script that blocks:
  - hardcoded typography/color literals outside token files
  - any new .scss/.sass file

Use this directory layout:
- public/media/audio, public/media/video, public/media/images, public/media/icons
- src/components/ui, src/components/custom, src/features, src/hooks, src/services, src/lib, src/styles, src/assets/svg, src/assets/fonts

Deliverables:
1) setup commands
2) full folder structure
3) key config files
4) guard scripts
5) docs: THEME_ARCHITECTURE.md, COMPONENT_GUIDELINES.md, CONTRIBUTING.md
6) starter token-driven components (Button, Card, Input, Badge, Alert, Dialog)
7) short checklist for adding new components safely.
```

---

## Tailwind v4 — register the type scale in `@theme` (don't use arbitrary font-size vars)

**Rule for new projects:** define font sizes (and other reused scales) in `@theme` and use the generated named utilities. Never put size-valued CSS vars in arbitrary brackets.

```css
@theme {
  --text-base: 1.15rem;
  --text-base--line-height: 1.7;
  --text-lg: 1.35rem;
  --text-lg--line-height: 1.8;
}
/* → plain text-base, text-lg (override TW defaults; pair line-height via the
   --text-{n}--line-height companion key) */
```

**Why (the trap this avoids):** `text-[var(--font-size-base)]` is type-ambiguous in v4 — Tailwind guesses **color**, emits `color: var(--font-size-base)`, the browser drops the invalid value, and text falls back to `--foreground` (near-black). Invisible on any default-colored text; only breaks where a custom color shares the element. No build error, no warning. The parens shorthand `text-(--font-size-base)` has the same bug. If you must use a size var inline, add the hint: `text-[length:var(--…)]`.

**Naming:** overriding `--text-base`/`--text-sm`/`--text-lg` in `@theme` is the intended v4 way to set your scale — it remaps the plain `text-*` utilities. Do **not** invent a prefixed parallel scale (`text-fs-*`/`text-content-*`) to "avoid collision"; there is no collision, you simply own the scale. (If the project still carries a `@config "…/tailwind.config.js"` with a `theme.fontSize` map, that already owns `text-*` — fold it into `@theme`, don't duplicate it.)

See `docs/process/TAILWIND_V4.md` → "Arbitrary font-size vars silently parsed as color".
