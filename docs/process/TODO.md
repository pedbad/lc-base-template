# TODO — the live worklist

**This file is the single source of truth for "what is next".** Start here in a new
session, on either machine.

| File                                  | Role                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| **this file**                         | what is still open, ordered, with a verify line each       |
| `LC_BASE_TEMPLATE_BUILD_HANDOVER.md`  | the numbered buildlist + tick history (steps 1–34)         |
| `2026-08-06-post-phase-d-handover.md` | state snapshot at end of Phase D, plus the §5 decision log |

**Last updated:** 2026-10-06 · **HEAD:** see `git log` · **Suite:** 103 files · 1070 tests green
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

`bun run guards` (`vitest run src/guards`) is the fast subset — **214** tests in ~1s — for
when you only want to know whether you broke a repo-wide invariant. It is a subset of
`bun run test`, never a replacement for the gate above. It stayed at 211 when §B landed
**on purpose**: the docs-freshness test lives in `src/docs/`, not `src/guards/`, because
that glob means "the eight spec guards" and a stale-tree check is not one of them.

**211 → 214 on 2026-09-11**, and the rise is the rule working rather than being bent.
All three tests are guard **d**'s own (`6310dad`, `6f4dd36`): the collector only ever
picked up a path whose value sat directly under an asset key as a STRING, so an image
authored as `image: { src, alt }` — the shape required once alt text is mandatory — was
walked straight past and the guard reported green having checked nothing. That is the
staleness `asset-existence.ts`'s own header warns about, so `src` joined `ASSET_KEYS`.
The outcomes block's OWN tests are not in this number: they live beside the code, which
is exactly what the paragraph above is about.

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

## D. Design & accessibility polish — 2 of 10 open

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

- **D5 — the budget breaches. CLOSED BY DECISION: JS 2026-10-05, CSS 2026-10-06.**
  The maintainer raised the CSS budget from < 15 kB to **< 17 kB** gzipped (2026-10-06),
  so `main-*.css` at 15.97 kB is within budget with about 1 kB of headroom; current
  figures in `docs/TOOLING.md`. The maintainer raised the JS budget from < 80 kB to **< 100 kB
  gzipped** rather than re-architect for it, so `main-*.js` at 97.13 kB (`6b5b821`) was
  **within budget, with 2.87 kB of headroom** at the time. The budget lives in ONE place —
  `docs/TOOLING.md`, "Bundle budget" — and the measurements below are kept as the
  dated record they are: where they say "< 80 kB" or "< 15 kB", that was the budget at
  the time.

  **Re-measured 2026-09-10 at `8e3c49f`.** `main-*.js`
  is **95.99 kB gzipped against a < 80 kB** microsite target, and CSS is **20.10 kB
  against < 15 kB**. §D's whole footer + back-to-top programme cost **+0.23 kB
  gzipped** between them, so it moved neither breach materially — the causes are
  upstream of §D, as the baseline measurement already said.
  **Re-measured 2026-09-11 at `2592827`**, after the `outcomes` block: `main-*.js`
  **96.62 kB** gzipped and CSS **20.32 kB**. The block cost **+0.43 kB** of JS (one
  lucide icon plus the renderer) and **+0.10 kB** of CSS (utilities only, no
  stylesheet) — so it moved neither breach materially, and neither breach is closed.
  Both PRE-DATE §D — measured at baseline by stashing the footer work — and the §D
  handover's "`main-*.js` is ~39kb raw today" is stale by roughly 7×. This also means
  the deferred **per-LO chunking** trigger below ("~a dozen LOs") is already met at ONE
  LO, by a different cause, so that row's wake-up condition is wrong as written.

  ### D5 — what is actually IN the bundle (measured 2026-09-14 at `d272093`)

  **Measured, not guessed** — this row's own warning is that guessing at bundle work
  is how you spend a day for 2 kB. Method: `bunx vite build --sourcemap` to a scratch
  dir, then sum each module's `sourcesContent` length out of `main-*.js.map` and group
  by package. **These are SOURCE bytes, so they RANK contributors — they are not a
  gzipped breakdown, and no figure here may be quoted as one.** Totals below are the
  real build's gzip numbers; the percentages are the ranking.

  `main-*.js` 298.27 kB raw / **96.61 kB gzipped** (< 80 kB), CSS 120.77 kB raw /
  **20.36 kB gzipped** (< 15 kB).

  **Re-measured 2026-09-14 at `f7afa0f`, after the whole §D7 rail programme:**
  `main-*.js` **97.08 kB gzipped**, CSS **20.65 kB**. Seven commits — the rail, the
  removed top bar, `ThemeToggleButton`, the icon swap and the colour-transition sweep —
  cost **+0.47 kB of JS and +0.33 kB of CSS between them**, so neither breach moved
  materially and neither is closed. The number that matters here is the one NOT spent:
  importing the vendored `src/components/ui/sidebar.tsx` instead of hand-rolling would
  have cost **+21.06 kB gzipped on its own** (96.83 → 117.89), because of its fan-out
  into Sheet, Tooltip, Button, Input, Separator and Skeleton. That measurement is what
  chose the approach. `sidebar.tsx` still has ZERO importers.

  | share | module                 |
  | ----- | ---------------------- |
  | 55.6% | `react-dom`            |
  | 18.5% | `@base-ui/react`       |
  | 4.1%  | `@base-ui/utils`       |
  | 4.0%  | app `components/shell` |
  | 2.2%  | app `lo/rich-text`     |
  | 1.6%  | app `lo/blocks`        |
  | 1.6%  | app `components/home`  |
  | 1.3%  | `lucide-react`         |

  Three facts that should shape whatever is decided:

  - **Base UI is ~23% of main, and FOUR wrappers put it there**: `ui/button` (4
    importers), `ui/input` (3), `ui/switch` (1 — the theme toggle), `ui/dialog` (1 —
    the rich-text modal). `ui/select` is NOT among them: it is already lazy and sits
    in its own chunk (69.54 kB raw / 25.06 kB gzipped), so the select engine is not
    the problem and splitting it again buys nothing. The dialog is the interesting
    one — it ships on every LO page but only renders once a reader clicks a modal
    link, so it is the clearest candidate for deferring.
  - **`react-dom` is 55.6% and is not negotiable** while the page hydrates as one
    React tree. Any route to < 80 kB either shrinks the other 44% to almost nothing,
    or changes how much of the page is React at all. These pages are PRERENDERED, so
    there is a real islands-shaped question underneath this row — that is an
    architecture decision, not an optimisation, and it needs a spec.
  - **Seven shadcn wrappers have no importer** — `tooltip`, `tabs`, `sidebar`,
    `sheet`, `separator`, `navigation-menu`, `badge`. With no importer Rollup should
    already exclude them, so deleting them is FILE HYGIENE, NOT BYTES. **Verify that
    before counting any saving from it** — the attribution above cannot tell you
    whether a module was excluded or merely small. **Verified 2026-09-14, and it is
    half right: free for JS, 5.30 kB gzipped for CSS. The count is also wrong — the
    dead set is ELEVEN. See the CSS attribution below.**

  ### D5 — the CSS bundle, attributed (measured 2026-09-14 at `ffbe141`)

  The row above asked for the equivalent of the JS attribution and it is done. **This
  one is better than the JS one**: Vite emits no `.css.map`, so the `sourcesContent`
  trick does not transfer, but the built CSS is a flat list of top-level constructs that
  can be split by brace depth and measured directly. These are OUTPUT bytes, not source
  bytes — a real breakdown of the shipped file rather than a ranking.

  Gzip does not decompose, so the third column is MARGINAL gzip: recompress the file
  with that construct deleted, and subtract. It answers "what would removing this save",
  which is the question worth asking, and the column therefore does not sum to the
  total. Raw totals below are Vite's own reported figures; the internal marginal
  numbers come from `gzip -9` and run ~1.2% under Vite's, so do not mix the two columns.

  **As shipped: 124.33 kB raw / 20.97 kB gzipped, against a < 15 kB budget.**

  | raw B  | marg. gz | n   | construct           |
  | ------ | -------- | --- | ------------------- |
  | 87,809 | 12,406   | 1   | `@layer utilities`  |
  | 12,968 | 2,631    | 1   | `@layer components` |
  | 8,882  | 1,759    | 1   | `@layer base`       |
  | 5,221  | 1,771    | 13  | `@font-face`        |
  | 4,995  | 547      | 79  | `@property`         |
  | 2,111  | 483      | 1   | `@layer properties` |
  | 1,675  | 472      | 1   | `@layer theme`      |
  | 600    | 133      | 3   | `@keyframes`        |

  **`@layer utilities` is 70.6% of the file and it is 100% Tailwind-generated.** The
  repo's own CSS writes into `base` (tokens, palette) and `components` (every component
  and engine stylesheet) and puts NOTHING in `utilities` — checked, not assumed. So the
  hand-written CSS this repo actually maintains is the 12,968-byte `components` row:
  **2.6 kB gzipped, or 13% of the bundle.** 115 kB of authored, heavily-commented source
  minifies to that. There is no saving to chase in the repo's own stylesheets.

  ### D5 — the finding: ELEVEN dead shadcn wrappers cost 5.30 kB gzipped of CSS

  Tailwind v4 has no `@source` directive here — `src/index.css` is a bare
  `@import 'tailwindcss'` — so it auto-detects and **scans files on disk. It does not
  care what imports what.** Rollup's dead-code elimination and Tailwind's scanner
  disagree completely: a component nothing imports still emits every utility its class
  strings mention. The `data-*` and `group-data-*` variant families alone are 20.2 kB
  raw across 123 rules, and one of them is literally `data-[slot=navigation-menu-…]`.

  **The dead set is eleven files, not the seven recorded above**, because deadness is
  transitive and the earlier count stopped at direct importers. `sidebar.tsx` has zero
  importers AND is the only importer of `tooltip`, `sheet`, `separator` and `skeleton`,
  so those four die with it; `card`, `textarea` and `label` were simply missed. Computed
  as a fixed point rather than by eye: **`badge` `card` `label` `navigation-menu`
  `separator` `sheet` `sidebar` `skeleton` `tabs` `textarea` `tooltip`**. Seven survive
  — `alert` `button` `dialog` `input` `select` `switch` `table`.

  **Measured by moving all eleven aside, rebuilding, and restoring** (tree verified
  clean after):

  | build          | CSS raw   | CSS gzip     | JS raw    | JS gzip      |
  | -------------- | --------- | ------------ | --------- | ------------ |
  | as shipped     | 124.33 kB | **20.97 kB** | 299.93 kB | **97.13 kB** |
  | eleven removed | 82.25 kB  | **15.67 kB** | 299.93 kB | **97.13 kB** |
  | delta          | −42.08 kB | **−5.30 kB** | 0         | **0**        |

  `@layer utilities` falls 87,809 → 46,149 raw and 819 → 506 rules. `components` and
  `base` do not move a byte, which is the control: the repo's own CSS is untouched, so
  the saving is entirely Tailwind output for markup that ships to nobody.

  **JS is byte-identical, confirming the row above was right about Rollup** — and wrong
  to generalise it to "not bytes". It is not bytes in the bundle it was looking at.

  **This closes 89% of the CSS breach on its own** — 5.97 kB over budget becomes 0.67 kB
  over — by deleting files nothing imports. It is the cheapest 5 kB on this row by a
  wide margin and it needs no spec. Note what re-adding one costs: `shadcn add sidebar`
  puts 5.30 kB of CSS back before a line of markup uses it.

  ### D5 — DECISION 2026-09-14: the eleven wrappers stay

  **The files are kept**, by the maintainer's decision on the day: `src/components/ui/`
  is a vendored shadcn surface and having a wrapper already present is the convenience
  it exists for. Deleting eleven of them to save 5.30 kB trades that away permanently
  for a budget that is not currently gating a release.

  **That trade turns out to be false, and the alternative is measured, not proposed.**
  Tailwind v4 takes `@source not "…"`, which removes a path from the scan while leaving
  the file on disk. Tested by adding one line per dead wrapper to `src/index.css` and
  rebuilding: the output is **`main-CNLtVVlr.css`, 82.25 kB raw / 15.67 kB gzipped —
  the same content hash as the delete experiment**, so it is not merely the same size,
  it is byte-identical CSS. JS unchanged at 97.13 kB.

  So all three properties hold at once: the wrappers stay where `shadcn` expects them,
  the 5.30 kB does not ship, and re-enabling one is deleting a single line rather than
  re-vendoring a component. **Nothing was applied** — `src/index.css` was restored and
  the tree verified clean. This row records the option as measured and available, and
  the call on whether to take it is open.

  **Two things to know before taking it.** The negation list is a second place that
  encodes which wrappers are unused, so it goes stale exactly like the seven-file count
  in this row did — whoever applies it should decide whether a guard pins the list
  against the real import graph, or whether a comment pointing here is enough. And the
  saving is contingent on those files staying unused: the moment one is imported, its
  `@source not` line silently strips utilities the live component needs, which fails as
  missing styles rather than as an error.

  ### D5 — APPLIED 2026-09-15, `94a3341`, with the guard. CSS half closed.

  Both caveats above were answered by taking the guarded option: eleven `@source not`
  lines in `src/index.css`, and `src/build/source-negation.test.ts` pinning the list
  against the real import graph. **CSS 124.33 kB raw / 20.97 kB gzipped → 82.47 /
  15.69.** JS unchanged at 97.13 kB. `DEBUG=1 bun run build` clean too, so no debug page
  reaches a negated wrapper. Suite 1008 → 1025; **`bun run guards` still 214**, because
  the check is in `src/build/` — that glob means the eight spec guards, and a staleness
  check over a config list is not one, the same call that put docs-freshness in
  `src/docs/`.

  **Against the < 15 kB budget: 5.97 kB over becomes 0.69 kB over.** The breach is NOT
  closed and stays open on this row. What changed is its size and its character — the
  remaining gap is in utilities the live components actually use, so the next 0.69 kB
  costs design decisions, not deletions.

  **0.22 kB raw of the predicted saving did not arrive**, and the honest reading is that
  the measurement predicted 82.25 and the build produced 82.47. The likely cause is that
  the two new files are themselves under `src/` and so are in Tailwind's scan — INFERRED,
  not measured. It is 20 bytes gzipped and was not worth another build to confirm.

  **The guard caught two faults in its own walk before it ever ran green**, which is the
  argument for writing it first. It read import statements out of its own test's fixture
  STRINGS — `sidebar` went live off a fixture and took four wrappers with it
  transitively — and it would have read an import out of a COMMENT, since
  `LessonRail.tsx` names `@/components/ui/sidebar` in the §D7 rejection note. Today that
  note uses backticks and slips past a quote-anchored match; a reworded one would not.
  Both are pinned by their own cases now, and comments are stripped with guard c's
  existing stripper rather than a second copy. **Guards c, f, g and now this make four
  checks in a row whose correctness turned on stripping comments first.**

  **Both directions were planted and observed failing before the commit** — an import of
  a negated wrapper, and a deleted negation line — each firing with the file named.

  **One placement bug worth keeping.** The directives first went in after the Tailwind
  imports but BEFORE the font and token ones, which CSS treats as invalidating every
  later `@import`. Stylelint's `no-invalid-position-at-import-rule` caught it. The block
  now sits below the last import, and `index.css`'s own header already warned about this.

  **One lead in the residual, NOT a recommendation.** `@font-face` is 13 faces / 2
  families — inside the two-family rule — but ten are Open Sans unicode-range subsets:
  cyrillic-ext, cyrillic, greek-ext, greek, hebrew, math, symbols, vietnamese, latin-ext,
  latin. Subsetting is correct practice and the FILES are only fetched when needed, but
  all ten DECLARATIONS ship. A latin+latin-ext-only course would save most of that
  1.74 kB gz — and this is a TEMPLATE, so dropping Greek or Cyrillic is a decision about
  which courses it can serve, not an optimisation. Left open deliberately.

  **SUPERSEDED 2026-10-05 — no JS spec is needed.** This paragraph used to say the JS
  half's next step was a spec choosing between deferring the dialog, dropping Base UI
  wrappers for native elements, or hydrating islands, to close a ~17 kB gap. The budget
  was raised to < 100 kB instead (see the top of this row), so none of those is
  scheduled. They stay on record here as the options, should the budget ever tighten.

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
  - **Two navs differ CORRECTLY — this row was a false alarm. Closed 2026-09-14.**
    It read "two navs hold different a11y standards": `LessonSideNav` (now
    `LessonRail`, §D7) has
    focus-move-in, a Tab trap, `inert` when closed, Escape + focus restore, while
    `Header`'s mobile panel has Escape and `hidden` only. True, and not a defect —
    the survey compared a DIALOG with a DISCLOSURE. That panel is a slide-over
    that covers the page and scroll-locks it, so a trap is right. `Header`'s panel is
    an in-flow `<div>` after the toggle with no backdrop and nothing inert behind it,
    so a trap would STRAND a keyboard user who can see, and legitimately wants to
    reach, the page behind. `hidden` also beats `inert` here: the slide-over needs
    `inert` only because `display: none` cannot animate its slide, and this panel does
    not animate. **Fix was documentation, not code** — the panel now carries the
    reasoning so the next reader does not re-derive it, plus tests pinning the
    no-trap contract.
  - **Header scroll-spy — SHIPPED 2026-10-06. Closed.** The active nav link now follows
    the section on screen, in the desktop nav and the mobile panel, with
    `aria-current="location"` (was `page`). A followed link wins at once and holds
    until its smooth scroll settles (150 ms debounce, no `scrollend` — Safari lacks it
    in the floor), so there is no flicker; the last section lights at the page bottom;
    nothing is lit on the hero. Spec `docs/specs/2026-10-06-header-scroll-spy-design.md`,
    plan `docs/process/2026-10-06-header-scroll-spy-plan.md`. A passive scroll listener,
    not an observer — the spec's §4 says why. Rules are pure and unit-tested
    (`src/lib/sectionInView.ts`, `src/lib/jumpHold.ts`); `src/hooks/useScrollSpy.ts` wires.
    **A parity bug fixed on the way:** `useState(currentHashId)` read the hash during the
    first client render, so `/example.html#grammar` hydrated with NO link marked —
    silently, since production React neither patches nor reports attribute mismatches.
    State now starts at `''` and the hash is read in an effect; a test pins it.
    **Verified on the built site (2026-10-06):** loading `#grammar` marks Grammar after
    hydration; at each section's landing position the matching link is marked; the hero
    marks none; the bottom marks Exercises; a click on Exercises from the top holds
    Exercises through every intermediate position; the hash and focus never change on
    scroll. **How:** the Browser pane was hidden, so it dispatched no `scroll` events —
    each position was set with `scrollTo` and a synthetic `scroll` event dispatched,
    which drives the real listener but is NOT a human scrolling. **Human-confirmed
    2026-10-06:** the maintainer scrolled the built page and the highlight follows
    (handover trap 6).
    **Bundle:** `main-*.js` 97.29 → 97.80 kB gzipped (+0.51 kB); CSS unchanged.
    It does NOT contradict §D4's "delete the observer" — that
    observer watched ITSELF to answer a question scrolling already answers; a spy
    watches OTHER elements to answer one the DOM cannot.
  - **Two headers, two shapes — CLOSED BY DECISION 2026-10-06.** The LO header is
    full-width, sticky, blurred, its brand a link, and it holds the nav landmark;
    `CourseHome`'s is `max-w-6xl`, static, its brand a `<p>`, and its landmark lives in
    `LessonRail`. **The maintainer decided they need not match.** The standing rule
    instead: **both stay fully accessible and both emit valid HTML and CSS.** What
    enforces that today, and what does not, is in
    `docs/process/2026-10-06-header-a11y-audit-handover.md` — the follow-up audit.
  - **Header a11y + validity audit — DONE 2026-10-06.** Both headers, on the BUILT site,
    at 375 and 1440, light and dark: eight cells, every check in the handover's §3.
    **How:** the Browser pane was hidden, which freezes the document timeline
    (`visibilityState: hidden`, `document.timeline` not advancing), so every colour
    read after a theme flip was a transition stuck at t=0 — it reported dark nav links
    at 1.28:1 that are really 6.68:1. The matrix was therefore run in headless Chromium
    (`playwright-core` and the cached `chrome-headless-shell`, from the session
    scratchpad — **nothing added to the repo**; the no-axe decision in
    `docs/TOOLING.md` stands): axe-core 4.10.2 from cdnjs, real Tab / Shift+Tab /
    Enter / Escape key presses, contrast painted on a 1x1 canvas against the composited
    ground, `emulateMedia({ forcedColors: 'active' })`. HTML: `html-validate`
    (`standard` preset — spec validity, not the house-style `recommended` one) run once
    from the scratchpad, at the maintainer's choice over uploading to the W3C.

    **Found and fixed** (one branch, each with a test that failed first):
    1. **LO brand and nav links had a 2.88:1 focus indicator** in light — the base
       layer's `outline: auto` in `ring/50`, under SC 1.4.11's 3:1.
    2. **Four controls had NO focus indicator under forced colours** — the LO menu
       toggle, the LO theme switch, the rail panel's close button and its lesson links
       all drew a box-shadow ring over `outline-none`, and forced colours drops
       `box-shadow`. Fix for 1 and 2 together: one indicator,
       `src/components/shell/focus-outline.ts`, the Tailwind spelling of the
       2px-solid-`--ring`-offset-2px outline the plain-CSS chrome already used. Every
       control in both headers now draws it: min 7.08:1, and present in forced colours.
    3. **LO theme switch OFF state failed 1.4.11** in light — track 1.88:1 on the
       header, thumb 1.8:1 on the track. Now `muted-foreground`: 6.31:1 and 6.06:1.
       Overridden in `ThemeToggle`, not in `src/components/ui/` (the shadcn CLI owns
       it). Dark, where the switch is ON, was already 7.68:1 / 10.36:1.
    4. **The `LessonRail` panel behaved modally but was announced as nothing** — focus
       in, Tab trapped, page scroll-locked, yet a screen reader's virtual cursor could
       walk out into the page behind, which is not inert. Now `role="dialog"`,
       `aria-modal="true"`, named by its own "Lessons" title.
    5. **`<h3>` inside `<span>` on every landing card** (`LoCard`) — the one spec
       error html-validate found. The wrappers are `<div>`s; both were already
       `display: block`, so nothing moved.
    6. **LO menu toggle squeezed to 26x36 at 375** by the wrapping brand title — over
       2.5.8's 24px, but not the square it is drawn as. `shrink-0`: 36x36.

    **Passed as found:** axe 0 violations in all eight cells, panels closed and open
    (5 `color-contrast` "incomplete" per cell — text over the blurred / backdropped
    grounds axe cannot composite; measured by hand instead). Text contrast: brand
    14.66 / 9.45, nav link 7.69 / 6.68, active link 12.40 / 7.68, rail lesson link
    9.19 / 6.88, panel title 6.38 / 5.34 (light / dark). Keyboard: LO disclosure opens
    on Enter, Tab walks into it, Escape closes and returns focus to the toggle; rail
    panel moves focus in, traps Tab both ways, Escape restores focus, panel back to
    `inert`, scroll lock released. Targets: all ≥ 32px except the LO switch's 32x18
    visual, whose `::after` extends the hit area to 56x34. **No colour strands on a
    theme flip** (§D8's failure shape): every header and rail colour lands on the new
    theme within 1.5 s, both directions, on a live timeline. Validator: 0 errors on
    both pages after fix 5.

    **Recorded, not fixed, with reasons:** the LO toggle's border (1.88 / 1.45) and the
    rail theme track's border (1.9 / 1.44) are under 3:1, but neither is what
    identifies the control — the glyph (14.66 / 9.45) and the thumb (10.77 / 5.93)
    are, and those clear it. The header's bottom border is decoration.

    **CSS validation — run 2026-10-06, as a follow-up.** No Java on the machine, so
    the W3C `vnu.jar` was out; `csstree-validator` 4.0.1 (spec grammars from mdn-data)
    was run once from the scratchpad over all seven built stylesheets — nothing
    uploaded, nothing added to the repo. **One error:** an unknown property `icon`, from
    a PHANTOM utility — Tailwind v4 auto-detects sources across the whole repo, and a
    code example in `FUTURE_PROJECTS.md` (`Click [icon:CircleCheck] …`) became
    `.\[icon\:CircleCheck\]{icon:CircleCheck}`. Fixed with `@source not "../docs"` in
    `src/index.css`, which also dropped ten other utilities only docs prose mentioned
    (`grid-cols-2`, `rounded-2xl`, `md:flex-row`, …), each confirmed unused outside
    `docs/`. Every `class="` left in the docs sits in a code span, so the debug docs hub
    loses nothing. **Validator: 0 errors**, production and `DEBUG=1` builds.

    **Not run:** reduced motion is still not emulable in the pane (§D4). A
    screen-reader pass of the new `aria-modal` was dropped by the maintainer
    (2026-10-06).
    **Bundle:** `main-*.js` 97.80 → 97.86 kB gzipped; `main-*.css` 15.87 → 15.95 kB,
    then 15.80 kB after the docs scan exclusion.

  - **`Header` to plain CSS — DONE 2026-10-06.** It was ~240-character inline Tailwind
    strings while §D1 had moved the footer to plain CSS. **The maintainer picked plain
    CSS** for the core chrome. `src/components/shell/header.css`, `@layer components`,
    flat `site-header-*` classes, tokens only; a test now fails if a Tailwind utility
    reappears in the header's markup, and the focus-outline and toggle-size tests read
    `header.css` instead of class strings. **Parity was measured, not eyeballed:** a
    full computed-style dump of all 13 header elements in 20 states (375 / 1440, light
    / dark, panel open, hover, active link, keyboard focus) before and after. The only
    differences are the intended ones — links no longer transition `color` and the
    toggle transitions only `background-color`, because the old `transition-colors`
    named base-state token colours, the §D8 shape. One trap found on the way:
    `--radius-sm` and `--font-heading` are `@theme inline`, so they are NOT runtime
    variables and `var(--radius-sm)` in plain CSS resolves to nothing — the expressions
    are written out. a11y re-run: axe 0, focus outline ≥ 7.68:1 and present in forced
    colours, disclosure keyboard flow unchanged.
    **Bundle — it did NOT help §D5:** `main-*.css` 15.80 → 15.97 kB (+0.17), because
    nearly every utility the header used is still used elsewhere, so the plain rules are
    added bytes rather than moved ones; `main-*.js` 97.86 → 97.70 kB (−0.16, the class
    strings leaving the bundle). The choice was for one styling strategy, not for size.
  - **The landing page reads sparse at 1440 with one LO** — hero, then a single card in
    a wide grid. Design work, not a defect.

- **D3 — the `no-preference` motion sweep. REJECTED, closed 2026-09-14.** The repo uses
  the `reduce` override shape — motion in the base state, `transition: none` under
  `@media (prefers-reduced-motion: reduce)` — and it stays that way. The candidate was
  the mirror image: no motion in base, added back under
  `@media (prefers-reduced-motion: no-preference)`. Both are correct on a browser that
  supports the query; they differ only on one that does not, where the `reduce` shape
  ignores the override and animates at a reader who asked for stillness, while
  `no-preference` ignores the opt-in and animates at nobody. That is the whole case for
  the sweep, and it is the reason the footer spec (§4.6, [R2]) called `no-preference`
  "strictly safer".

  **That browser is not in this repo's support floor, and the floor is checkable rather
  than remembered.** `package.json` declares no `browserslist`, so Vite 8's default
  target applies: `chrome111`, `edge111`, `firefox114`, `safari16.4`, `ios16.4`
  (`ESBUILD_BASELINE_WIDELY_AVAILABLE_TARGET`). `prefers-reduced-motion` shipped in
  Chrome 74, Edge 79, Firefox 63 and Safari 10.1 — every browser we build for is more
  than thirty versions past it. The population the safer shape protects is empty, and
  the day it stops being empty is the day the build target moves, which is a deliberate
  edit to `vite.config.ts` and the right place to reopen this.

  **The cost was also understated twice over.** The row said three files; there are
  **seven**: `index.css:148`, `shell.css:58`, `footer.css:360`, `back-to-top.css:186`,
  `home.css:480`, `memory-match.css:190`, `flashcards.css:191`. `back-to-top.css`
  arrived with §D4 after this row was written; the two exercise files were always there
  and were simply missed. And two of the seven are not a transition sweep at all — the
  flip-card engines use `reduce` to switch RENDERING STRATEGY, not to slow motion down.
  `flashcards.css` and `memory-match.css` drop the 3D transform and `display: none` the
  hidden face, cross-fading through the state attribute instead (both file headers say
  so). Inverting those means the base state becomes the non-3D fallback and
  `no-preference` carries the entire flip — a restructure of two engines, not a moved
  declaration.

  **Zero → zero benefit against seven files, two of them structural. Not worth it.** The
  "one commit or none" constraint still holds and is the reason this closes as a
  decision rather than drifting half-done: a mixed idiom is worse than either shape used
  consistently. `footer.css`'s own comment carried the promise of this sweep and now
  carries the decision instead.

- **D7 — the landing page's left rail. DONE 2026-09-14.** The header's "Lessons"
  button — which sat BEFORE the course title and read as though it were the page's
  subject — is replaced by `LessonRail`: a 48px strip pinned to the viewport's left
  edge, permanently visible, expanding into the panel `LessonSideNav` already owned.
  Ported from french-lo-1's landing page, including the collapsed strip's stack of
  social icons partway down it.

  **Decisions taken** (both put to the maintainer rather than assumed):
  - **Landing page only**, as in the reference. LO pages keep their own header nav:
    §17 allows one nav landmark per page and theirs owns it, their header is
    backdrop-blurred (which would make it the containing block for the fixed panel and
    trap it inside the bar), and the rail lists every LO — an index, which belongs on
    the index page.
  - **Social links go in the rail**, read from `footerConfig.social`, never a second
    list. Same sprite `<use>` route as `FooterSocial`, whose `brand-*` symbols are
    `fill="currentColor"` and so follow the theme with no dark-mode rules. Accepted
    cost, recorded rather than overlooked: the five account names are now announced
    twice on this page, which is ordinary for chrome repeated top and bottom.

  **The three risks, and how each was actually closed**
  1. **Prerender/hydration parity.** Closed by hand-rolling: nothing in the collapsed
     rail reads a cookie, measures a viewport or needs `useIsHydrated`. VERIFIED rather
     than reasoned — `.lesson-rail`, `.lesson-nav-backdrop` and `#lesson-nav-panel` are
     byte-identical between `dist/index.html` and the hydrated DOM, and the console is
     silent. The one diff anywhere in `#root` is Base UI's switch adding an `id` to its
     own label, which predates this work.
  2. **Bundle.** MEASURED BOTH WAYS before choosing. Importing `src/components/ui/sidebar.tsx`
     in `collapsible="icon"` mode: `main-*.js` **96.83 → 117.89 kB gzipped, +21.06 kB**,
     from its fan-out (Sheet, Tooltip, Button, Input, Separator, Skeleton) rather than
     the rail. Hand-rolled: **96.83 → 96.99 kB, +0.16 kB** (CSS +0.19 kB). That
     measurement is what decided the approach, not taste. `sidebar.tsx` keeps its zero
     importers.
  3. **Mobile.** Moot once hand-rolled — no `Sheet`, so no second Base UI dialog and no
     second mobile nav pattern. The rail exists at every width down to 320, where it is
     48px of 320 and the card grid is single-column anyway.

  **One mechanism, not two.** The rail is fixed and always there; expanding ALWAYS
  overlays, at every width. French's expanded sidebar pushes content sideways, which
  would mean pushing on desktop and overlaying on mobile — and branching the focus trap
  and scroll lock on viewport needs `matchMedia`, i.e. exactly the JS-measured
  breakpoint that disqualified shadcn's component. The panel covers the rail when open,
  so the social stack hides itself with no rule saying so.

  **`LessonRail` is rendered from inside `<header>`, and that is a constraint.** Guard h
  caught the first shape — the rail as a grid column beside the header — with
  `nav-outside-header`: §17 puts the primary nav in the header's subtree. It is
  `position: fixed`, so where it sits in the DOM and where it is painted are two
  different questions, and `.home-shell` pads the page out of its way with `:has()`
  rather than a flag duplicating the rail's own empty-course condition.

  **A defect found on the way, fixed here.** A `transition` that lists `color` where
  `color` is also declared in the base state from a token leaves the computed value
  pinned to the OLD token when the theme swaps: measured, the rail's icons stayed
  `#232830` on the dark rail (1.46:1) until the transition was removed, then snapped to
  `#eceef1`. Both rail rules now transition only compositor-friendly properties, which
  is the repo's own rule anyway. **`.footer-social-link` has the identical defect and is
  NOT fixed here** — different component, different concern; its icons currently render
  the light theme's colour on the dark footer.

  **Follow-up, same day — the top bar is gone (WAVE pass).** The landing page's bar held
  one title and one toggle, and both found better homes: `courseTitle` is now an
  `<hgroup>` eyebrow above the `<h1>`, and the theme control is `ThemeToggleButton`, a
  compact `aria-pressed` toggle at the foot of the rail. `<header>` STAYS as an unstyled,
  zero-height wrapper — §17 puts the primary nav inside it — and must never be given a
  background, border or `backdrop-filter`, which would give its fixed children a
  containing block. `<hgroup>` is what answers WAVE's two "possible heading" alerts: both
  paragraphs are subtitles of the h1, not headings, and the outline stays h1 → h2 → h3.
  `LessonRail` now renders its strip unconditionally so an empty course keeps its theme
  control; only the menu button and the panel depend on there being lessons. WAVE's
  "redundant link" is NOT fixed and is not a defect: it is the panel's lesson link and
  the card's link to the same LO, adjacent in link order only because the demo course has
  exactly one lesson — with several, the panel's last link is LOn and the grid's first is
  LO1. Suite 1003 → 1007.

  **WAVE pass, same day — what it caught and what it was wrong about.** Re-scanned after
  the bar came off: 0 errors, 0 contrast errors. Of the three alerts, two were real and
  one is not.
  - **Both "possible heading" alerts cleared.** The course title's went with the bar.
    The hero subheading's survived the `<hgroup>`, because that check is a STYLING
    heuristic — short text set larger than body copy — and never looks at the ancestor
    that says what the element is. Dropping `.home-hero-subheading` from `1.125rem` to
    `1rem` cleared it (`2c2b0ed`), confirmed by re-scan. Promoting it to a real heading
    was REJECTED and the reasoning is in the CSS so it is not reopened: it introduces no
    section, and every heading is a promise to a reader navigating by heading that
    content follows; it would also have to be a second `<h2>` claiming peerage with
    "Lessons", which guard h's heading-order check would fail.
  - **"Redundant link" is NOT a defect and is deliberately unfixed.** It is the rail
    panel's lesson link and the card's link to the same LO, adjacent in link order only
    because the demo course has exactly ONE lesson. With several, the panel's last link
    is LOn and the grid's first is LO1. It also predates the rail — `LessonSideNav` sat
    in the same place with the same links. Removing it means dropping either the panel's
    list or the card grid.

  **Icon and sizing corrections (`093bb6d`, `f7afa0f`).** The toggle's hamburger became
  lucide's `panel-left`, matching the reference's `SidebarTrigger`: a hamburger is the
  convention for a menu that drops or slides OVER the page, and this opens a panel
  pinned to an edge. The accessible name stays "Lessons" rather than the reference's
  "Toggle Sidebar" — that names what the panel contains, not the widget it is built
  from. Separately, the social marks were rendering 40% larger than their neighbours
  (28px box with the svg at `100%`, against 32px boxes holding 20px glyphs) because the
  rule had imported `.footer-social-link`'s "THE BOX IS THE ICON" reasoning, which is
  right in the FOOTER — marks flush-aligned in a row — and wrong in a vertical stack of
  inset glyphs. All three rail controls now share one 2rem box and one 1.25rem glyph
  held in custom properties on `.lesson-rail`; the target GREW to 32px, so SC 2.5.8 has
  more headroom than before, not less.

  **A repo-wide defect found from this work, fixed separately (`185c9de`).** See the
  entry below it: nine rules across eight files transitioned a colour declared in their
  base state from a token, which strands the computed value on the previous theme.

  **Verified:** both themes; 320 / 375 / 768 / 1024 / 1440 with no overflow and the rail
  48px at x=0 in every one; prerender parity as above; Escape closes and restores focus
  to the toggle; focus moves into the panel on open; Tab wraps last→first; scroll lock
  on and off; `inert` keeps the closed panel's links out of the interactive tree;
  targets 32px (toggle) and 28px (social), both clearing WCAG 2.2 SC 2.5.8's 24x24.
  Suite 995 → 1003. Guard h green across its 26 documents.

- **D8 — NEVER TRANSITION A TOKEN COLOUR DECLARED IN A BASE STATE. Closed 2026-09-14,
  `185c9de`.** A property that is declared in a rule's BASE state from a `var(--token)`
  AND named in that rule's `transition` never lands on the new value when the theme
  swaps the token: in Chrome the computed value stays pinned to the previous theme's
  colour indefinitely. The dark footer was rendering its social icons in the LIGHT
  theme's colour because of it, unnoticed.

  Isolated rather than guessed — `el.style.transition = 'none'` makes a stuck element
  snap immediately to the correct value. Nine rules across eight files: `.footer-social-link`,
  `.audio-container`, `.back-to-top` (border only), `.lo-card`, `.memory-card-back`,
  `.drag-fill-gaps-tile`, `.drag-fill-gaps-slot`, `.phrase-reorder-token`,
  `.word-order-token`.

  **The sweep needs two things a naive one misses**, both of which hid a real hit:
  group declarations BY SELECTOR rather than by rule (`.footer-social-link`'s
  `transition` is on a rule it shares with `.footer-mark`, its `color` is on its own
  rule 40 lines later), and treat the `border` shorthand as declaring `border-color`
  (`.lo-card`).

  **One hit is a legitimate false positive and must stay:** `.back-to-top` keeps its
  `background-color` transition, because `--accent` is `var(--cam-blue)` in BOTH token
  blocks and so has no second value to strand on. Its BORDER was the real bug — the
  rule's own comment says it should "darken on the light page and lighten on the dark
  one", which the transition was silently preventing.

  A hover-only token colour is safe; the base-state declaration is what strands. This
  also happens to be the repo's own rule that motion stays on compositor-friendly
  properties, so there was never a reason to transition these.

  **Verified** with `body` and `h1` as controls, colours painted on a 1x1 canvas:
  `.footer-social-link` 35,40,48 → 236,238,241 (was stuck); `.audio-container`
  84,96,114 → 181,189,200; `.back-to-top` border 100,153,148 → 181,235,225; `.lo-card`
  border 181,189,200 → 255,255,255; `.back-to-top` background invariant as intended.
  Footer social contrast 13.07:1 light, 8.71:1 dark.

  **The remaining five are now verified too (2026-09-14), and the earlier note here
  undercounted them.** It said "the four exercise-token rules"; `.memory-card-back` is a
  fifth, and it is not a token rule. They render only on `exercise-showcase.html`, which
  is opt-in, so `DEBUG=1 bun run build` was needed to reach them. Measured on that page
  with `body` and `h1` as controls, all five switch:

  | rule                       | light       | dark       |
  | -------------------------- | ----------- | ---------- |
  | `.drag-fill-gaps-tile` bg  | 255,255,255 | 61,66,73   |
  | `.drag-fill-gaps-slot` bg  | 255,255,255 | 61,66,73   |
  | `.phrase-reorder-token` bg | 255,255,255 | 61,66,73   |
  | `.word-order-token` bg     | 255,255,255 | 61,66,73   |
  | `.memory-card-back` bg     | 179,191,195 | 86,112,113 |

  All four token borders move 181,189,200 → white as well. One honest limitation of the
  probe: `--border` in dark is a `color-mix()` carrying alpha, and painting it on a 1x1
  canvas and reading three channels drops that alpha — so the dark border figure is the
  colour component, not the composited appearance. The value CHANGING is what this test
  is for, and it changes.

  **The symptom this bug had, for whoever meets it again:** it only shows on a theme
  toggle WHILE an exercise is on screen. A fresh load in dark is fine — the element gets
  the dark value with no transition running to strand it. Toggle mid-exercise and the
  tiles, chips and card backs kept their light surfaces while their text correctly went
  light: near-white chips on a dark page. One gesture reaches it, which is probably why
  it survived this long.

- **D9 — the LO hero banner. DONE 2026-10-05, `fddb8e2`…`e4c9fe0`.** Spec:
  `docs/specs/2026-10-05-lo-hero-banner-design.md`; plan:
  `docs/process/2026-10-05-lo-hero-banner-plan.md`. Every LO page now opens on a
  full-bleed `LoHero` directly under the sticky header, holding the page's one `<h1>`
  (first on a solid `--card` panel; the panel was removed later the same day). The art comes from an optional `hero: { src, alt? }` in
  `lo.json`, decorative unless `alt` is given; without `hero` the banner is a
  `--hero-band` band (`var(--primary)`), so every LO opens the same way.

  **One decision taken during the build, against the plan's stop-and-ask:** React 19's
  server renderer hoists a `<link rel="preload" as="image">` for EVERY non-lazy `<img>`
  — probed with and without `fetchPriority` — so the only way to avoid it is lazy-loading
  the page's LCP image. Accepted. In the prerender it lands at the top of `#root`, and
  hydration skips it: the built page hydrates with a silent console. `LoHero.test.tsx`
  pins the preload so a React upgrade that changes it is noticed.

  **Verified:**
  - **Widths:** 320 · 375 · 768 · 1024 · 1440 with no overflow. The hero sits flush under
    the header, is 224px tall at its 14rem floor and 448px at its 28rem cap, and the
    panel's leading edge equalled the `<h2>`s' at every width. **Superseded the same
    day at the maintainer's request (`8cad626`, then the flush-left commit):** the title
    moved to the hero's top-left, then flush left at the header's 1rem inset directly
    under the course brand, matching french-lo-1. The `<h2>` column stays centred.
  - **Contrast:** first measured on the `--card` panel (14.81:1 light, 8.71:1 dark).
    **Panel removed same day at the maintainer's request:** the title now sits on the
    art in `--hero-title-ink`, one dark ink in both themes because the `<img>` does not
    theme. Worst pixel under the title on the placeholder: 12.38:1 at 1440 (both themes),
    5.67:1 at 375 where it crosses a bubble stroke. Authoring rule added to
    CONTRIBUTING: keep the title's top-left corner light. The band uses
    `--primary-foreground` on `--primary`. **Follow-up the same day:** an a11y checker
    flagged the title in dark mode. It was right: checkers read the CSS background, and
    the image box had none, so they saw dark ink on the dark page (about 1:1) — which is
    also what a reader gets if the image fails to load. The box now carries
    `--hero-art-ground` (Cambridge Light Blue, unthemed): 13.07:1 in both themes and with
    the image hidden.
  - **Build:** `BASE_URL=/course/` resolves the art to
    `/course/images/lo-00-example/hero.svg`. Guard d was planted with a missing `src`
    and seen failing.

  **Bundle (`docs/TOOLING.md`, "Bundle budget"):** `main-*.js` **97.29 kB** gzipped (was
  97.13) and CSS **15.84 kB** (was 15.69). So the CSS breach on §D5 grows from 0.69 to
  **0.84 kB over**, and JS keeps 2.71 kB of headroom. Suite 1025 → 1047.

  **Spec correction:** §10 said to add `--hero-band` to `DESIGNER.md`. That file lists no
  component tokens (not even `--footer`), so the token is documented where it is defined,
  in `tokens.css`, and the spec now says so.

- **D10 — a11y follow-ups surfaced 2026-10-06. DONE 2026-10-06, `f4ca45e`…`a82ef49`.**
  Four findings from the day's axe runs, left alone then to keep each change one concern.
  Handover: `docs/process/2026-10-06-a11y-followups-handover.md`. All confirmed on the
  BUILT site first (`DEBUG=1 bun run build` + `preview`, axe 4.10.2 in headless Chromium,
  nothing added to the repo).

  1. **`word-spot` tokens, axe `target-size` — DECIDED: SC 2.5.8's inline exception
     applies. No change.** The four flagged tokens are `a` and `le` and `e.` (part-words:
     `escu|ch|a`, `le|ch|e.`) and `la` (a whole word mid-sentence). All are 34px tall;
     only width fails (15–20px), and width is the glyphs' own. The reasoning:
     - The exception covers a target that "is in a sentence or its size is otherwise
       constrained by the line-height of non-target text". Every token sits in a
       `<p class="word-spot-line" lang="es">` of running Spanish — that is the exercise.
     - Padding or a gap between part-words would split the word on screen and show the
       learner where the segment boundaries are: the answer. The text layout is the task.
     - A pseudo-element hit area (the LO theme switch's `::after`) cannot help: tokens
       abut, so widening one covers its neighbour and a tap becomes ambiguous.
     - axe cannot apply the exception itself: its "inline in a text block" check needs
       non-target text around the target, and here every glyph is a target.
     - **Not one token "stands alone"** — no line in the engine renders a token outside a
       sentence. Trigger to reopen: a word-spot mode that renders isolated tokens (a word
       list rather than lines), or the maintainer wants a larger `.word-spot-line` font,
       which would lift every token past 24px at the cost of a design change.
     - **The fifth `target-size` node was NOT word-spot**, and the handover had folded it
       in: the flashcards speaker, 22px, sitting ON the full-card flip button — overlap
       rules out the spacing exception, so a real failure. Memory-match's speaker (20px,
       overlaying its card) had the same shape, unflagged only because the showcase deals
       cards face down. **Fixed `f4ca45e`:** the speaker button never renders under 24px
       (one floor in `CircularAudioProgressAnimatedSpeakerDisplay`); both callers ask
       for 24.
  2. **Sandbox `<h1>` ×5 — FIXED `0d2325a`.** Confirmed: the page's own plus each doc's
     `# Title`. Worse than the count: every doc heading sat ABOVE the `<h3>{file}` it
     lives under. `docs-markdown.ts` now renders markdown level + 3 (`#`→h4 … clamped at
     h6); the `.md` sources are untouched. Built page: one `<h1>`, no skipped level, sizes
     unchanged. The test runs guard h's outline rule over each real doc as DocsSection
     places it — the sandbox is outside guard h's sweep, which is how this shipped.
  3. **Sandbox `<pre>` scroll regions — FIXED `a2eee2b`, NOT by wrapping.** 9 blocks at
     1440, 14 at 375. Wrapping was the suggested fix and is wrong here: STRUCTURE's trees
     and DESIGNER's token-flow diagram are column-aligned, and a wrapped tree misreports
     nesting. Each `<pre>` is now `tabindex="0" role="region"` with a unique name
     (`DESIGNER.md code sample 3 (bash)`, so no `landmark-unique`) and a focus ring — the
     RichTextEntries table-scroll pattern. Keyboard scroll confirmed in full Chromium
     (headless-shell does not scroll on arrow keys — a tooling quirk, not the page).
  4. **Dark swatch contrast — FIXED `a82ef49`, at the token.** All 28 nodes were one pair:
     `--muted-foreground` on `--muted`, 4.47:1 in dark, in all four token files. Not a
     sandbox bug — the first lesson with helper text on a muted surface would have
     shipped it. Dark `--muted-foreground` is now Slate 2 mixed 94% with white in oklab
     (4.67:1). New `src/styles/token-contrast.test.ts` holds every `SEMANTIC_SWATCHES`
     pair × 4 token files × light/dark to 4.5:1, with a small resolver calibrated against
     the `#494d55` Chromium painted. CSS 16.53 → **16.55 kB** (budget < 17).

  **Re-run after:** `debug-sandbox.html` zero violations, both themes;
  `exercise-showcase.html` only the four word-spot tokens above, both themes; `index` and
  `example` zero contrast failures, both themes. Suite 1129 → 1239.

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

| Item                       | Trigger to pick it up                                                                                                                                                                                                                                                                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Per-LO chunking (§5.4)     | **~a dozen LOs.** Eager `import.meta.glob` means every page bundles every LO's JSON. Harmless at one. Measure each new LO against the JS budget (`docs/TOOLING.md`, "Bundle budget") — headroom is under 5 kB at one LO (current figure in that section), so this may wake before a dozen. Parsing rich text at build time is the other lever (TOOLING). |
| Rich text: §12 leftovers   | Someone actually needs it. Inline rich text + popups shipped 2026-08-04; block entries (lists, tables, the audio player) in prose AND popups shipped 2026-10-06 (spec §14). Still unbuilt from §12: rich text in exercise content, deep-linking a popup, nested popups.                                                                                  |
| Conjugation v2 choice mode | Someone wants tap-to-answer verb tables. Schema ready, view path unbuilt.                                                                                                                                                                                                                                                                                |

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

| Date       | Commit    | What                                                                                     |
| ---------- | --------- | ---------------------------------------------------------------------------------------- |
| 2026-09-03 | `6c62d6d` | LICENSE added — MIT code + CC-BY-4.0 content (buildlist 28)                              |
| 2026-09-03 | `2104d13` | content licence changed to **CC BY-NC 4.0**, swept through every doc                     |
| 2026-09-03 | `f3f432e` | `main` stays open by decision; protection reframed as a pre-share gate                   |
| 2026-09-03 | `ef9ec8f` | exercise showcase **opt-in per build** — no longer ships (buildlist 17b)                 |
| 2026-09-03 | `2e3e4bd` | this TODO.md added as the live worklist; stale claims corrected                          |
| 2026-09-03 | `c239fa8` | **guard c — asset-path** (buildlist 21): `src/guards/` created, 21 tests                 |
| 2026-09-03 | `4367d31` | **guard d — asset-existence** (buildlist 22), 11 tests                                   |
| 2026-09-07 | `891511c` | **guard b — naming + render-mirror** (buildlist 20), 17 tests                            |
| 2026-09-07 | `22757f5` | **guard e — registry completeness** (buildlist 23), 30 tests                             |
| 2026-09-07 | `0891e27` | guard f **survey** banked in §A-f — the rule, not the guard yet                          |
| 2026-09-07 | —         | GitHub **template repository** box ticked (buildlist 33), verified                       |
| 2026-09-07 | see A8    | `bun run guards` fast subset added (buildlist 31 closed)                                 |
| 2026-09-07 | `df6c987` | **guard f — token integrity** (buildlist 24), 27 tests + shared reader                   |
| 2026-09-07 | `69c254b` | **guard g — CSS layer discipline** (buildlist 25), 21 tests                              |
| 2026-09-07 | `99cd77d` | **guard h — semantic DOM over rendered output** (buildlist 26), 84 tests                 |
| 2026-09-08 | `8c95085` | **DESIGNER / STRUCTURE / AGENTS** written (buildlist 29); §B closed                      |
| 2026-09-08 | `f06295a` | **`bun run docs:tree`** + freshness test (buildlist 30), 8 tests                         |
| 2026-09-08 | `99825af` | README + CONTRIBUTING now link the three new books                                       |
| 2026-09-08 | `0bcd7d7` | markdown **link-existence check** added (`src/docs/md-links.ts`)                         |
| 2026-09-08 | `c5dd291` | **debug sandbox** — palette / type / icons (buildlist 16), 10 tests                      |
| 2026-09-08 | `4029c9a` | **sandbox docs hub** — markdown→HTML (buildlist 18), 26 tests                            |
| 2026-09-09 | `23f1d15` | §D opened, branch protection renumbered to §E                                            |
| 2026-09-09 | `d863465` | **footer defect fixed** — schema-validated config; `href: '#'` now fails the build       |
| 2026-09-09 | `4c70955` | footer assets downscaled 264→52 KB, ratio-normalised, sprite marks themeable             |
| 2026-09-09 | `dad0428` | **preset drift fixed** — `--success` back-ported to all three presets + parity test      |
| 2026-09-09 | `c06a595` | `--footer` surface + six derived crest tokens                                            |
| 2026-09-09 | `6c6d429` | lockup, imprint marks and social row                                                     |
| 2026-09-09 | `999176c` | `footer.css` — editorial colophon, crest in both themes                                  |
| 2026-09-09 | `52e4ca4` | band kept mint; the two footer columns share a baseline                                  |
| 2026-09-10 | `40f4e1b` | mark and social rows share one width, so both edges flush                                |
| 2026-09-10 | `8e8ec94` | icon ink flushed; marks get the social hover + a focus ring they lacked                  |
| 2026-09-10 | `eac73fc` | `prefersReducedMotion` extracted to `src/lib/` — BackToTop is consumer two               |
| 2026-09-10 | `683d1ce` | **`BackToTopButton`** (§D4) — observer deleted, not fixed; unmounted, D2 mounts it       |
| 2026-09-10 | `97a5b4b` | landing page's Lessons heading id now comes from `headingId`, not a literal              |
| 2026-09-10 | `8e3c49f` | **`BackToTopButton` mounted** (§D2) — one per section + the Lessons grid                 |
| 2026-09-10 | `8b26e36` | in-page nav animates — one `scroll-behavior` on `<html>`, reduce-guarded                 |
| 2026-09-10 | `008b082` | back-to-top fades both ways, 3600ms in / 300ms out, after two wrong mechanisms           |
| 2026-09-11 | `7e22990` | `presentation: 'plain'` blocks; the **introduction is no longer an accordion**           |
| 2026-09-11 | `6310dad` | **guard d saw nothing under `image.src`** — nested asset paths now collected             |
| 2026-09-11 | `2592827` | **`outcomes` block** — ticked outcome list beside an illustration, split at `lg`         |
| 2026-09-11 | `f90ac40` | **`intro` block type** — rule down the leading edge; the intro's callout dropped         |
| 2026-09-14 | `d272093` | Header's mobile panel documented as a **disclosure, not a dialog** — no trap owed        |
| 2026-09-14 | `ad627ce` | D5 bundle **attributed by sourcemap** — data recorded, no fix attempted                  |
| 2026-09-14 | `e4b10b4` | **course mark in the header**; guard d now sweeps `course.config.ts`                     |
| 2026-09-14 | `1ca5f3b` | course mark **masked, not `<img>`** — it was invisible in dark                           |
| 2026-09-14 | see below | **vocabulary before grammar** in the example; per-term audio on the word list            |
| 2026-09-14 | `7d6216d` | vocabulary row **clickable end to end**, delegating to its speaker button                |
| 2026-09-14 | see below | page ground is **`--paper`, not white** — off-white for dyslexic readers                 |
| 2026-10-05 | —         | header **scroll-spy deferred** to a later version (§D6 → "Deferred on purpose")          |
| 2026-10-05 | —         | **JS budget raised to < 100 kB** gzipped; one home in `docs/TOOLING.md` (§D5)            |
| 2026-10-05 | `e4c9fe0` | **LO hero banner** — full-bleed, holds the `<h1>`, band fallback (§D9)                   |
| 2026-10-05 | —         | header **scroll-spy reopened** — out of "Deferred on purpose", back on §D6 as next       |
| 2026-10-06 | see §D6   | header **scroll-spy** — highlight follows the section on screen; hash-load parity fixed  |
| 2026-10-06 | see §D6   | **header a11y audit** — one forced-colours-safe focus outline, five fixes                |
| 2026-10-06 | `d72c02f` | **rich-text block entries** — lists, tables, audio player; JS budget < 105 kB            |
| 2026-10-06 | `a82ef49` | **a11y follow-ups (§D10)** — speaker 24px floor, sandbox outline + code regions, AA pair |
