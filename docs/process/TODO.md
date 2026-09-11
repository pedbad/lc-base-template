# TODO — the live worklist

**This file is the single source of truth for "what is next".** Start here in a new
session, on either machine.

| File                                  | Role                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| **this file**                         | what is still open, ordered, with a verify line each       |
| `LC_BASE_TEMPLATE_BUILD_HANDOVER.md`  | the numbered buildlist + tick history (steps 1–34)         |
| `2026-08-06-post-phase-d-handover.md` | state snapshot at end of Phase D, plus the §5 decision log |

**Last updated:** 2026-09-10 · **HEAD:** see `git log` · **Suite:** 97 files · 954 tests green
· CI green · `main` unprotected by decision (job E1).

Non-negotiable constraints for every job below live in
`2026-08-06-post-phase-d-handover.md` §3. Read them before touching the build. In short:
nothing reachable from `vite.config.ts` may use `@/…` imports; never import
`load-lo-glob.ts` from a Node script; every URL goes through
`%BASE_URL%`/`resolveAsset()`/`resolveHomeHref()` and is verified under
`BASE_URL=/course/ bun run build`; prerendered markup must equal the first client render.

**Verify gate — run before every commit:**

```bash
bun run format && bun run lint && bun run lint:css && bun run test && bun run build
```

`bun run guards` (`vitest run src/guards`) is the fast subset — 211 tests in ~0.7s — for
when you only want to know whether you broke a repo-wide invariant. It is a subset of
`bun run test`, never a replacement for the gate above. It stayed at 211 when §B landed
**on purpose**: the docs-freshness test lives in `src/docs/`, not `src/guards/`, because
that glob means "the eight spec guards" and a stale-tree check is not one of them.

`bun run test` (Vitest), **not** `bun test` — Bun's own runner throws on the
`import.meta.glob` in `load-lo-glob.ts` and reports a false failure.

---

## A. Guards — 0 of 8 open — all eight guards live

Guards **a** (config-schema, 19), **b** (naming + render-mirror, 20), **c** (asset-path,
21), **d** (asset-existence, 22), **e** (registry, 23), **f** (token integrity, 24),
**g** (CSS layer discipline, 25) and **h** (semantic DOM, 26) are all done. **Section A is
closed** — nothing here is open, and the per-guard notes below are kept only because each
records a rule that is narrower than the spec sentence it came from, and that is worth
reading before touching the guard or the code it protects.

The ritual every one of them followed, in case a ninth is ever added: **write a
deliberately-broken fixture first, prove the guard blocks it, then make the real repo
green** — and plant a real violation in source once, to see how many other test files stay
quiet. A guard that was never seen to fail is a guard that might be asleep.

**Guards a–g read SOURCE; h reads RENDERED output** and is the only one that does. It
still needs no `dist/` — see §A-h.

### A-h — guard h (semantic DOM) — **DONE 2026-09-07, `99cd77d`**

`src/guards/semantic-dom.ts` + `html-source.ts` (the rendered-markup reader) +
`rendered-markup.tsx` (the 26 documents it validates), 84 tests. Half of guard h was
already live and CI-enforced before any of it: `eslint-plugin-jsx-a11y` is wired into
`eslint.config.js`. What this added is the half spec §95/§309 names — a checker over
rendered output — because jsx-a11y reads one JSX file at a time and every §17 clause is a
property of the ASSEMBLED page.

**The surface was already clean.** Both pages match §17 exactly, all 15 engines are clean,
and the one real defect (`SpeakerSvg` with no `aria-hidden`) was fixed in `1ce0275` before
the guard existed. So the expensive half was NOT flagging correct code:

- **A control can be named by a `<label for>`, and 17 are.** shadcn's select trigger is a
  `<button>` with a placeholder and no text; `select` and `line-match` give it an
  `sr-only` label, which is legal because `<button>` is labelable. A name rule that knows
  only `aria-label` and text content flags every blank in the repo.
- **An `aria-hidden` control needs no name** — Base UI's five visually-hidden mirror
  `<input>`s exist so a styled select submits with a form.
- **A `<table>` is judged by its headers, not its looks.** `dictation`'s two `<th>`s are
  `sr-only`, which reads as a layout table and is the opposite. The check is "has a `<th>`
  or `<caption>`, and is not `role="presentation"`".
- **`tabindex="-1"` is not a defect** — it is on `main` (skip-link target) and all four
  section `h2`s (lesson-nav focus targets), deliberately.
- **A fragment is not a page.** 24 of the 26 documents are single engines with no `h1` and
  no landmarks; `conjugation` legitimately opens at `h3`. The page-scope rules apply only
  to pages.

**Three decisions, all taken against the obvious answer:**

1. **No jsdom, so no axe-core.** It would reverse the deliberate node-env choice recorded
   in `docs/TOOLING.md` for the whole suite, and the suite already renders to strings. A
   string is all a §17 checker needs. axe's WCAG rule coverage remains a separate later
   decision, not a side effect of this one.
2. **No new dependency either** (this reversed the survey's first answer, which preferred
   `html-validate`). There is **zero `dangerouslySetInnerHTML` in the repo** — all four
   grep hits are comments saying so — so every byte of markup is React-emitted and the
   "w3c" half of "w3c + a11y" is guaranteed by construction: React cannot emit unclosed
   tags or invalid nesting. What is left is bad SEMANTICS, and no off-the-shelf ruleset
   expresses "one `<article>` per accordion" or "`section` count == `h2` count".
3. **All 15 engines, not the 2 a default build prerenders.** `example.html` prerenders
   `select` and `radio-quiz`; the other thirteen live behind `DEBUG=1` (the flag was named
   `SHOWCASE` until 2026-09-08; both names still work) and appear in no
   built page. A guard over the pages alone would have covered 2 of 15 while reading as
   though it covered the lot — guard d's staleness lesson exactly.

**It needs no `dist/`, which is why it passes on a clean checkout.** The pages are rendered
in process from the same component trees `scripts/prerender.tsx` uses, with the same loader
— and the result is BYTE-IDENTICAL to the body it writes into `dist/` (23007 and 7324
bytes, verified against a fresh build). Reading `dist/` would be strictly worse even when
it exists, because a stale `dist/` validates last week's markup and passes. The `<head>`
is the only thing `dist/` adds and it carries no §17 surface; `<html lang>` is checked in
the source `index.html`.

**Native-first was narrowed to what rendered output can decide**, and the lint route was
tried and rejected rather than assumed: `jsx-a11y/prefer-tag-over-role` is not in
`flatConfigs.recommended`, and enabling it fires 16 times — every hit `<p role="status">`,
the result slot every engine renders, which it wants as `<output>`. That swap changes
nothing an assistive technology does. What guard h keeps is the real defect: an
interactive ARIA role that cannot take focus, or has no name.

**Verified by re-planting the `1ce0275` defect.** `bun run lint` passed CLEAN on it — so
jsx-a11y offers no coverage there — and **84 other test files stayed green**, which is the
proof the failure was otherwise silent. It fired on 5 engine fragments no test had ever
covered, which is decision 3 paying for itself. Two other plants (a section `h2` → `h4`,
and the nav toggle's `aria-label` stripped) were caught by guard h AND by the colocated
`PageLayout.test.tsx` / `Header.test.tsx`, so they are not evidence for h — worth knowing:
the shell is well covered, the engines' markup was not.

Floors assert both pages, all 15 engine keys against `EXERCISE_TYPE_KEYS`, 24+ fixtures and
plausible control/icon/id/heading totals, so a renamed fixture or a moved page fails loudly.

### A-f — guard f (token integrity) — **DONE 2026-09-07, `df6c987`**

`src/guards/token-integrity.ts` + 27 tests, plus `src/guards/css-source.ts` — the
stylesheet reader f and g share. The survey banked in this section was the expensive
half; the code fell out of it.

What the rule turned out to be, since the naive reading is wrong three separate ways:

- **px is a PROPERTY ALLOWLIST, not the blanket ban spec §138 reads as.** Legitimate on
  `border*`, `outline*`, `box-shadow`, `backdrop-filter`, `perspective`, `transform`,
  and in a `@media` prelude. 44 of the repo's 52 sites are 1–4px hairlines and focus
  rings where rem would actively be wrong.
- **A px inside a token-referencing `calc()` is allowed.** The four
  `calc(var(--radius) ± 4px)` sites go THROUGH the token — a derivative offset, not a
  bypass. This was the survey's biggest reversal, and a guard without it would have
  flagged four correct sites on day one.
- **A px in a custom property is allowed; a hex in one is not.** Naming a raw value is
  what a token IS, so `--hairline: 1px` is a component-level token (§136). Layer 1 is
  `palette.css` alone, so `--card-tint: #f0f0f0` is still the drift this guards.
- **Hex is banned everywhere except `src/styles/palette.css`.** One file-scoped
  exemption matching that file's own header, not a per-value allowlist.
- **`src/components/ui/` is exempt from the markup half.** shadcn regenerates it. A
  bracket group followed by `:` is a Tailwind VARIANT, so `min-[980px]:hidden` reads as
  the media query it is.

**Mechanism was decided, not inherited: Vitest.** Stylelint's
`declaration-property-unit-allowed-list` cannot express the token-referencing `calc()`
exemption and cannot see the TSX half at all, and a split rule would have made
`bun run guards` a half-truth. Nothing was added to `stylelint.config.mjs`; its comment
now records why, so nobody re-adds it.

**Repo was already clean**, as surveyed. Verified by planting `padding: 24px` in
`home.css` and `color: #cdd2d8` in `flashcards.css` — 82 other test files stayed green,
which is the proof the failure was otherwise silent — then `p-[24px]` and
`style={{ color: '#ff0000' }}` in `LineMatchExercise.tsx`, with `min-[980px]:block` on
the same line correctly ignored. Floors assert 15 stylesheets, 100+ markup files, 50+ px
sites and `palette.css`'s own 17 primitives, so a rename fails loudly (guard d's lesson).

### A-g — guard g (CSS layer discipline) — **DONE 2026-09-07, `69c254b`**

`src/guards/layer-discipline.ts` + 21 tests. Where f protects the chain's VALUES, g
protects its ability to be overridden at all: an unlayered rule beats every layered one
whatever its specificity, and one `!important` inverts layer order on top of that, making
the order mean the opposite of what it reads as.

**The `@layer` half — the one thing the survey could not verify — now holds.** "The file
contains `@layer`" was never the check: all 15 files already grep positive, and a file can
open a layer, close it, and carry on with bare rules underneath. Guard g tracks brace depth
and the enclosing at-rule per block, and finds **169 selector rules, every one inside a
layer, and zero real `!important`**. No live bug found.

Four structures a naive depth counter gets wrong, each decided in the module header:

- **Statement at-rules are legal unlayered.** `@import` is REQUIRED to come first, so
  `index.css`'s five could not be layered even in principle; `@charset`,
  `@custom-variant` and a bare `@layer a, b;` have no block, so none is a rule.
- **Descriptor at-rules are legal unlayered AND their inner blocks are not rules.**
  `@font-face` and `@theme inline` are exactly what `index.css` holds at top level.
  `@keyframes` is the trap — a `0% { … }` step has a percentage where a selector goes.
- **`:root` blocks ARE ordinary rules and ARE checked.** Custom properties cascade by
  layer too, so an unlayered `:root` beats a layered one. `palette.css` and all four
  token files wrapping theirs in `@layer base` is load-bearing, not habit. This is the
  case most likely to be waved through as "just variables"; it is not.
- **`@media` is transparent to the cascade and must be looked THROUGH, both ways.**
  Nested inside a layer its rules stay layered (all nine in the repo — flagging them
  would flag correct code); at top level it layers nothing.

**Comment stripping is the whole `!important` half** — all six matches in the repo are
exercise-engine file headers PROMISING "no raw hex, no `!important`". Third guard in a
row to turn on this (c, f, g), which is why `stripComments()` is now exported from
`asset-path.ts` rather than copied a fourth time.

**Scope is CSS only.** Tailwind's trailing-`!` modifier appears in `src/components/ui/`
(`top-1/2!` in `tooltip.tsx`), but that is generated shadcn expressing utility precedence
inside Tailwind's own layer — not a rule escaping the layer system — so extending g to
markup would buy an exemption and no signal.

Verified by planting an unlayered `.lo-shell` rule in `shell.css` and
`border-radius: 999px !important` in `word-order.css`. Both blocked with truthful
`file:line` while 83 other test files stayed green — and **`bun run lint:css` passed CLEAN
on both**, so stylelint offers no coverage here at all, which settles the mechanism
question for g as well as f.

### A8 — wire the guards up (buildlist 31) — **DONE 2026-09-07**

`bun run guards` = `vitest run src/guards`. 127 tests in ~0.4s against the full suite's
~2s. It did NOT need to wait for f–h: a path glob picks up a new guard the moment its
file lands, so nothing has to be edited when one does. A hand-kept list is the thing that
goes stale — the same argument guard e makes for a schema convention over a central map.

Two things settled while closing it, both written up in `docs/TOOLING.md`:

- **Guard a is deliberately outside the script.** Config-schema is not a sweep — the Zod
  schemas run inside `assembleLo` on every load, in the app itself. Its contract tests
  are colocated (`src/config/lo-schema.test.ts`), and every LO on disk is parsed
  end-to-end by `lo-rich-text.test.ts`, which loads them all through `loadLo`.
  `bun run test` covers both; `bun run guards` covers the six sweeps.
- **No CI step was added**, contrary to what this section used to say. CI runs
  `bun run test`, a strict superset — a guards step would re-run the same tests for
  no extra signal.

**Convention to keep:** every guard's scanner module lives in `src/guards/`. That is what
makes the glob honest — f and g joined with no edit to the script, and h goes there too.

---

## B. Docs — 0 of 2 open — closed 2026-09-08

Both jobs are done: **B1** the three missing books (29) and **B2** `bun run docs:tree`
(30). **Section B is closed** — nothing here is open. Kept only for the two claims the
old §B made that turned out to be wrong, because both are the kind of thing a future
session would otherwise re-derive or repeat.

**Correction 1 — `French-Basic-2026` is NOT on this machine.** §B said it "has a working
`AGENTS.md` to crib from"; `ls ../French-Basic-2026` finds nothing here. It may exist on
the other machine or under another path — it was not located. `AGENTS.md` was therefore
written from this repo's own conventions and
`2026-08-06-post-phase-d-handover.md` §3, and **nothing in it is attributed to that
repo**. The same claim appeared in §C1 about `debug-sandbox.html` and was **wrong there
too** — see §C.

**Correction 2 — `public/llms.txt` already existed, and §B never mentioned it.** It
already ships in the build as `dist/llms.txt`. Two AI-facing files with overlapping
purpose and no stated boundary is exactly the drift the guards exist to prevent, so the
split is now written down in `AGENTS.md`: **`llms.txt` describes the DEPLOYED SITE** to
agents consuming it and ships; **`AGENTS.md` describes the REPOSITORY** to agents editing
it and does not ship. Update `llms.txt` when the site's pages or engines change; update
`AGENTS.md` when a repo rule changes.

**One decision worth not re-litigating:** `DESIGNER.md` was a **promotion** of
`src/styles/README.md`, not a fresh document — that file is now a pointer stub, so there
is one copy of the theming rules. Do not re-expand the stub.

## C. Dev artifacts — 0 of 2 open — closed 2026-09-08

Both jobs are done: **C1** the debug sandbox (16, `c5dd291`) and **C2** the docs hub
(18, `4029c9a`). **Section C is closed** — nothing here is open. What is kept below is
the two claims the old §C made that turned out to be wrong, plus the four decisions
worth not re-litigating.

**Correction 1 — `French-Basic-2026` is still NOT on this machine.** §C1 said it "already
ships one (`debug-sandbox.html`) — copy the shape rather than inventing it". `ls
../French-Basic-2026` finds nothing here, exactly as in §B. The sandbox was therefore
designed from this repo's own conventions — `src/showcase/` for the page shape,
`DESIGNER.md` for what a designer needs, spec §14 for the docs hub — and **nothing in it
is attributed to that repo**. Two sections in a row have now carried this claim; treat
any future reference to that repo as unverified until an `ls` says otherwise.

**Correction 2 — buildlist 17's "12 engines, 18 fixtures" is not current.** Counted
2026-09-08: **15 engines** (`src/exercises/lazyRegistry.ts`) and **24 fixtures** across
`src/exercises/*/*.fixture.ts`. The buildlist line is a Phase B historical record and
stays as written, with a dated note beside it. Do not quote the old numbers as current.

**Four decisions worth not re-litigating:**

- **One flag, not two.** `DEBUG=1 bun run build` emits BOTH debug pages; a plain build
  emits neither. The dev server serves both regardless of `rollupOptions.input`, so a
  deploy carrying one debug page and not the other has no use case, and two fail-closed
  rules would be two things to keep in step. `SHOWCASE=1` stays recognised as an alias so
  the dated records that document it stay true. Rule and tests:
  `src/build/build-entries.ts`.
- **Markdown renders at BUILD time.** `markdown-it` is a devDependency and never reaches
  a bundle. `fetch()` would need the docs copied into `public/` — a second copy of the
  single source §14 forbids — and `?raw` would ship a parser to the browser. A Vite
  plugin (`sandbox-docs-plugin.ts`) serves the rendered docs as `virtual:sandbox-docs`,
  so dev and build render the same way. Full write-up: `docs/TOOLING.md`.
- **`html: false`, so raw HTML in a doc is escaped.** The docs are repo-authored, so the
  risk today is nil — the default is sanitised anyway, because provenance is an argument
  about today's content and a renderer outlives it.
- **`src/sandbox/`, not `src/showcase/`.** The showcase is one thing: fixtures through
  `ExerciseHost`. Folding a token reference, a type specimen, an icon sprite and a docs
  hub into it would leave a folder whose name described a quarter of its contents. The
  two pages link to each other instead.

**The sandbox is not in `public/llms.txt`'s Pages list, deliberately** — it is not a page
of the deployed course. Both debug pages ARE named in that file's Notes, with their
opt-in status, so an agent reading it does not mistake their absence for a broken link.

**Where its docs live:** `DESIGNER.md` "How to read the sandbox" (spec §14 names that
file as its home), `STRUCTURE.md`'s `src/sandbox/` row, README's build section,
CONTRIBUTING's command table, `AGENTS.md`'s two new house rules, `docs/TOOLING.md`'s two
new decision entries.

## D. Design & accessibility polish — 3 of 6 open

Design and a11y come before branch protection **by decision 2026-09-09**: a footer that
ships internal build chatter and two dead links is a defect on every page of a live
course, and adding collaborators does not fix it. Branch protection is now §E.

- **D1 — the footer colophon.** **DONE 2026-09-09/10** except `BackToTopButton`, which
  moved to D4 and is now built too. Spec:
  `docs/specs/2026-09-09-footer-colophon-design.md` (r2). The
  french-lo-1 footer is ported — lockup, LC/CC/eLearning imprint marks, social row,
  licence line — all driven by `src/config/footer.config.ts`, whose `href` refine
  rejects any bare fragment, so **`href: '#'` now fails the build** and the first §5.7
  edge is closed by construction. Contrast measured from rendered pixels in both
  themes (light 9.05 / 13.07 / 7.55, dark 7.15 / 8.71 / 6.48 — all clear AA 4.5:1);
  no horizontal overflow at 320 · 375 · 768 · 1024 · 1440.
- **D4 — `BackToTopButton`.** **DONE 2026-09-10**, `683d1ce`. Shipped deliberately
  unmounted; **D2 has since mounted it** (`8e3c49f`), so the component and its mount
  are both closed. Handover: `2026-09-10-backtotop-handover.md`. The
  reference's `IntersectionObserver` was **deleted, not repaired**: it watched its own
  container, so for an in-flow element it re-implemented scrolling, and removing it
  killed two defects outright (the `duration-[3600ms]` fade and the `opacity-0` +
  `pointer-events-none` + `tabIndex={-1}` hidden state that sat in the accessibility
  tree). What shipped is a plain `<button onClick>`.

  **THE FADE WAS ASKED FOR BACK on 2026-09-10, AND THE OBSERVER CAME WITH IT.** Two
  attempts failed first, and both failures are worth keeping because each looked
  right:

  1. `afe06af` — a CSS `view()` timeline, no JS, exactly what this row had advised.
     Measurably wrong: a view timeline is POSITIONAL, so an element already inside the
     viewport at load sits past `entry 100%` and never animates. Three of the four
     buttons on the example LO are on screen at load, so three of four never faded.
  2. `81947e6` — an observer again, but revealing ONCE and disconnecting. The fade
     then plays inside the first second of load and never again however far you
     scroll, which reads as no animation at all.

  `008b082` is the one that works: `useRevealWhileInView` toggles `data-seen` BOTH
  ways, so the button fades out as it leaves and back in as it returns — the
  reference's own behaviour, and the repetition is what makes the effect visible.
  3600ms in, 300ms out, the reference's asymmetry. So D4's observer decision IS
  reversed, not just its effect decision; what stays fixed is the rest — no
  `pointer-events-none`, no `tabIndex={-1}`, the button focusable and clickable at
  every point in the fade, and the hiding armed in `index.html` before first paint so
  JS off, no observer or reduced motion all leave a plainly VISIBLE button.

  Also fixed: the unguarded smooth
  `scrollTo` (now `src/lib/scrollToTop.ts`, `behavior: 'auto'` under reduced motion),
  duplicate accessible names across ~5 buttons per LO (a **required** `sectionId` prop
  feeds `aria-describedby` — guard h does not compare button names, but it DOES fail on
  a dangling reference), the missing `:focus-visible` ring once you leave
  shadcn's `Button`, the redundant `Tooltip`, and `type="button"`. Bundles are
  byte-identical to the previous commit, because nothing imports it yet.
  The keyboard pass, both themes and the five widths transferred to D2 with the mount
  and are **done** there. The in-browser reduced-motion check is the one item neither
  job could complete — see D2's row for why, and what stands in for it.

  **THE FADE ITSELF IS STILL UNOBSERVED, and that is why it took three goes.** A
  hidden Browser pane delivers no `IntersectionObserver` callbacks and does not
  advance transitions, so the one thing that would have shown each attempt failing —
  watching it — was never available. Everything around it WAS measured: the CSS
  resolves to opacity 0 armed-and-unseen, 1 armed-and-seen, 1 unarmed; arming happens
  before paint and the built `<html>` tag carries no class; computed
  transition-duration is 3.6s arriving and 0.3s leaving; and the delivery fallback
  fires and reveals when no callback arrives. **Get a human to look at any animation
  this pane cannot run.**

- **D5 — the two budget breaches, re-measured 2026-09-10 at `8e3c49f`.** `main-*.js`
  is **95.99 kB gzipped against a < 80 kB** microsite target, and CSS is **20.10 kB
  against < 15 kB**. §D's whole footer + back-to-top programme cost **+0.23 kB
  gzipped** between them, so it moved neither breach materially — the causes are
  upstream of §D, as the baseline measurement already said.
  Both PRE-DATE §D — measured at baseline by stashing the footer work — and the §D
  handover's "`main-*.js` is ~39kb raw today" is stale by roughly 7×. This also means
  the deferred **per-LO chunking** trigger below ("~a dozen LOs") is already met at ONE
  LO, by a different cause, so that row's wake-up condition is wrong as written.
- **D2 — the `BackToTopButton` mount.** **DONE 2026-09-10**, `97a5b4b` + `8e3c49f` +
  `1a5500b` (the mint restyle).
  **SCOPED DOWN BY DECISION on the day:** the row used to read "nav + landing-page
  polish", and the polish half was cut — D2 became the mount and nothing else, now §D6.
  One button per `<section>` in `PageLayout` (four on the example LO), one on
  `CourseHome`'s Lessons section and only when there are lessons. D4's deferred
  verification is **done**: 320 / 375 / 768 / 1024 / 1440 with no overflow and a 12px
  inset from the content edge at all five, both themes, keyboard reachable in natural
  tab order, every `aria-describedby` resolving to a real heading. Contrast computed
  from rendered pixels: arrow 10.36:1 on the mint at rest, 6.64:1 on the hover, and a
  3.22:1 rim against the light page — the fill itself is only 1.43:1 there, which is
  why the rim exists.

  **TWO MEASUREMENT TRAPS TO ADD TO D4's LIST, both of which produced confident wrong
  numbers here.** (1) `color-mix` and `oklab()` come back from `getComputedStyle`
  UNCONVERTED, so a naive `match(/[\d.]+/g)` reads `oklab(0.70 -0.07 -0.01)` as an RGB
  triple and every contrast figure downstream is fiction. Paint the value on a 1x1
  canvas and read `getImageData` instead. (2) `resize_window` with preset `desktop`
  while the Browser pane is HIDDEN leaves the tab at **zero width** — `innerWidth: 0`,
  every section 0px wide — so geometry reads as nonsense (a 12px inset measured as
  -36px) without erroring. Always set an explicit width before measuring layout.
  (3) A HIDDEN PANE DOES NOT SAMPLE A `ViewTimeline` either: computed opacity stays at
  its end value and `getComputedTiming().progress` is `null` at every scroll position,
  so a scroll-driven animation reads as "not working" when it is merely not being
  drawn. Verify the animation's SHAPE through `getAnimations()` — timeline type, fill,
  computed keyframes — and leave the visual progression to an eyeball. (4) Not a pane
  trap but the same shape: `window.scrollTo({behavior: 'auto'})` means "use the
  computed `scroll-behavior`", which is now `smooth` document-wide, so it silently
  does nothing while rAF is frozen. Pass `'instant'` to move the scroll in a probe.

  **One check could NOT be made in-browser** — the Browser pane exposes no way to
  emulate the OS reduced-motion preference, so the `behavior: 'auto'` path rests on
  `scrollToTop`'s unit tests plus the confirmed presence of the
  `@media (prefers-reduced-motion: reduce)` block in the CSSOM. Do that one by hand if
  you ever want it observed rather than inferred.

- **D6 — nav + landing-page polish.** The half cut out of D2, still with no spec.
  Surveyed 2026-09-10, so these are found, not speculative:
  - **Two navs hold different a11y standards.** `LessonSideNav` has focus-move-in, a
    Tab trap, `inert` when closed, Escape + focus restore. `Header`'s mobile panel has
    Escape and `hidden` only — no trap, no focus move in, no scroll lock.
  - **`activeSectionId` does not mean what its doc says.** `Header.tsx` calls it "the
    section currently in view", but `PageLayout` only updates it on `hashchange`, so
    `aria-current` is stale the moment the reader scrolls. Either build a real
    scroll-spy or correct the comment. A scroll-spy does NOT contradict §D4's "delete
    the observer": that observer watched ITSELF to answer a question scrolling already
    answers; a spy watches OTHER elements to answer one the DOM cannot.
  - **Two headers, two shapes.** LO page is `max-w-5xl`, sticky, blurred, brand is a
    link, holds the nav landmark. `CourseHome` is `max-w-6xl`, static, brand is a `<p>`,
    and the landmark lives inside `LessonSideNav`.
  - **`Header` is still 240-char inline Tailwind strings** while §D1 moved the footer to
    plain CSS in `@layer`. Pick one direction.
  - **The landing page reads sparse at 1440 with one LO** — hero, then a single card in
    a wide grid. Design work, not a defect.
- **D3 — the `no-preference` motion sweep.** Candidate, not agreed. `home.css`,
  `shell.css` and `footer.css` all use the `reduce` override shape; the
  `no-preference` opt-in fails closed on a user agent without the query. One commit
  across all three files, or none — a mixed idiom is worse than either.

---

## E. Before sharing with other developers

- **E1 — branch protection (buildlist 34).** **Deferred by decision 2026-09-03**: `main`
  takes direct pushes while this is a single-maintainer build. Trigger = a second person
  gets push access. Setup and the solo-lockout to avoid: `docs/BRANCH_PROTECTION.md`.
  Do **not** enable `Require approvals: 1` + `Do not allow bypassing` with one
  collaborator — GitHub forbids self-approval and the merge button locks permanently.

---

## Deferred on purpose — each with a wake-up trigger

Not forgotten. Decided.

| Item                        | Trigger to pick it up                                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Per-LO chunking (§5.4)      | **~a dozen LOs.** Eager `import.meta.glob` means every page bundles every LO's JSON. Harmless at one. Measure against the <80kb gzipped microsite JS budget. |
| Rich text in modals/engines | Someone actually needs it. Fully spec'd in `docs/specs/lo-rich-text-modals.md` §12, zero built.                                                              |
| Conjugation v2 choice mode  | Someone wants tap-to-answer verb tables. Schema ready, view path unbuilt.                                                                                    |

### Two small known edges (§5.7)

The footer-placeholder edge is **CLOSED** (2026-09-09, `d863465`): `Footer.tsx` no longer
ships the "later Phase C part" note, the whole `FOOTER_LINKS` array is gone — all three
rows, not only the two dead ones — and `footer.config.ts` makes `href: '#'` fail the
build, so it cannot return. Two remain:

- A **typo'd slug in dev** (`/greetigns.html`) renders the landing page rather than 404ing.
  Deliberate: owning that means owning Vite's dev 404 behaviour. Recorded in `TOOLING.md`.
- Landing-page chrome words ("Lessons", "Start learning") are hardcoded in the components,
  not in `ui-strings.ts`, because that schema requires every key and adding landing keys
  is a contract change nobody has needed.

---

## Done recently (so a new session does not redo it)

| Date       | Commit    | What                                                                                |
| ---------- | --------- | ----------------------------------------------------------------------------------- |
| 2026-09-03 | `6c62d6d` | LICENSE added — MIT code + CC-BY-4.0 content (buildlist 28)                         |
| 2026-09-03 | `2104d13` | content licence changed to **CC BY-NC 4.0**, swept through every doc                |
| 2026-09-03 | `f3f432e` | `main` stays open by decision; protection reframed as a pre-share gate              |
| 2026-09-03 | `ef9ec8f` | exercise showcase **opt-in per build** — no longer ships (buildlist 17b)            |
| 2026-09-03 | `2e3e4bd` | this TODO.md added as the live worklist; stale claims corrected                     |
| 2026-09-03 | `c239fa8` | **guard c — asset-path** (buildlist 21): `src/guards/` created, 21 tests            |
| 2026-09-03 | `4367d31` | **guard d — asset-existence** (buildlist 22), 11 tests                              |
| 2026-09-07 | `891511c` | **guard b — naming + render-mirror** (buildlist 20), 17 tests                       |
| 2026-09-07 | `22757f5` | **guard e — registry completeness** (buildlist 23), 30 tests                        |
| 2026-09-07 | `0891e27` | guard f **survey** banked in §A-f — the rule, not the guard yet                     |
| 2026-09-07 | —         | GitHub **template repository** box ticked (buildlist 33), verified                  |
| 2026-09-07 | see A8    | `bun run guards` fast subset added (buildlist 31 closed)                            |
| 2026-09-07 | `df6c987` | **guard f — token integrity** (buildlist 24), 27 tests + shared reader              |
| 2026-09-07 | `69c254b` | **guard g — CSS layer discipline** (buildlist 25), 21 tests                         |
| 2026-09-07 | `99cd77d` | **guard h — semantic DOM over rendered output** (buildlist 26), 84 tests            |
| 2026-09-08 | `8c95085` | **DESIGNER / STRUCTURE / AGENTS** written (buildlist 29); §B closed                 |
| 2026-09-08 | `f06295a` | **`bun run docs:tree`** + freshness test (buildlist 30), 8 tests                    |
| 2026-09-08 | `99825af` | README + CONTRIBUTING now link the three new books                                  |
| 2026-09-08 | `0bcd7d7` | markdown **link-existence check** added (`src/docs/md-links.ts`)                    |
| 2026-09-08 | `c5dd291` | **debug sandbox** — palette / type / icons (buildlist 16), 10 tests                 |
| 2026-09-08 | `4029c9a` | **sandbox docs hub** — markdown→HTML (buildlist 18), 26 tests                       |
| 2026-09-09 | `23f1d15` | §D opened, branch protection renumbered to §E                                       |
| 2026-09-09 | `d863465` | **footer defect fixed** — schema-validated config; `href: '#'` now fails the build  |
| 2026-09-09 | `4c70955` | footer assets downscaled 264→52 KB, ratio-normalised, sprite marks themeable        |
| 2026-09-09 | `dad0428` | **preset drift fixed** — `--success` back-ported to all three presets + parity test |
| 2026-09-09 | `c06a595` | `--footer` surface + six derived crest tokens                                       |
| 2026-09-09 | `6c6d429` | lockup, imprint marks and social row                                                |
| 2026-09-09 | `999176c` | `footer.css` — editorial colophon, crest in both themes                             |
| 2026-09-09 | `52e4ca4` | band kept mint; the two footer columns share a baseline                             |
| 2026-09-10 | `40f4e1b` | mark and social rows share one width, so both edges flush                           |
| 2026-09-10 | `8e8ec94` | icon ink flushed; marks get the social hover + a focus ring they lacked             |
| 2026-09-10 | `eac73fc` | `prefersReducedMotion` extracted to `src/lib/` — BackToTop is consumer two          |
| 2026-09-10 | `683d1ce` | **`BackToTopButton`** (§D4) — observer deleted, not fixed; unmounted, D2 mounts it  |
| 2026-09-10 | `97a5b4b` | landing page's Lessons heading id now comes from `headingId`, not a literal         |
| 2026-09-10 | `8e3c49f` | **`BackToTopButton` mounted** (§D2) — one per section + the Lessons grid            |
