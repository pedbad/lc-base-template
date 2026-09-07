# TODO — the live worklist

**This file is the single source of truth for "what is next".** Start here in a new
session, on either machine.

| File                                  | Role                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| **this file**                         | what is still open, ordered, with a verify line each       |
| `LC_BASE_TEMPLATE_BUILD_HANDOVER.md`  | the numbered buildlist + tick history (steps 1–34)         |
| `2026-08-06-post-phase-d-handover.md` | state snapshot at end of Phase D, plus the §5 decision log |

**Last updated:** 2026-09-07 · **HEAD:** see `git log` · **Suite:** 84 files · 737 tests green
· CI green · `main` unprotected by decision (job D1).

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

`bun run guards` (`vitest run src/guards`) is the fast subset — 127 tests in ~0.4s — for
when you only want to know whether you broke a repo-wide invariant. It is a subset of
`bun run test`, never a replacement for the gate above.

`bun run test` (Vitest), **not** `bun test` — Bun's own runner throws on the
`import.meta.glob` in `load-lo-glob.ts` and reports a false failure.

---

## A. Guards — 1 of 8 still open (the main body of work)

Guards **a** (config-schema, 19), **b** (naming + render-mirror, 20), **c** (asset-path,
21), **d** (asset-existence, 22), **e** (registry, 23), **f** (token integrity, 24) and
**g** (CSS layer discipline, 25) are done. Only **h** is left, and it follows the same
ritual: **write a deliberately-broken fixture first, prove the guard blocks it, then make
the real repo green.** A guard that was never seen to fail is a guard that might be asleep.

**Expect h to be different in kind.** Every guard so far reads SOURCE; h is the only one
that validates RENDERED output. The landing page and the sliding nav have never been
validated by anything, so h will probably find real problems — plan for a guard plus a fix
campaign, not one commit.

| Order | Buildlist | Guard | Checks                         | Head start already in repo                              |
| ----- | --------- | ----- | ------------------------------ | ------------------------------------------------------- |
| 1     | 26        | **h** | w3c + a11y over rendered pages | landing page + sliding nav are new, unvalidated surface |

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

## B. Docs (buildlist 29, 30)

- **B1 — the three missing books (29).** README and CONTRIBUTING exist and are current.
  Never written: `DESIGNER.md` (change colours/fonts without touching code),
  `STRUCTURE.md` (what every folder is for), `AGENTS.md` (for AI helpers).
  `French-Basic-2026` has a working `AGENTS.md` to crib from.
- **B2 — `bun run docs:tree` (30).** Auto-generate the STRUCTURE tree so it cannot go
  stale. Do after B1, so it has a file to write into. Script does not exist yet.

## C. Dev artifacts (buildlist 16, 18)

- **C1 — debug sandbox (16).** Never started. Debug-flag-gated page showing palette,
  fonts and SVG preview, for the designer. `French-Basic-2026` already ships one
  (`debug-sandbox.html`) — copy the shape rather than inventing it. Natural home for the
  exercise showcase, which is now opt-in per build (`SHOWCASE=1 bun run build`).
- **C2 — sandbox renders docs as HTML (18).** Depends on C1.

## D. Before sharing with other developers

- **D1 — branch protection (buildlist 34).** **Deferred by decision 2026-09-03**: `main`
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

### Three small known edges (§5.7)

- `Footer.tsx` ships **placeholder links** — "Accessibility" and "Privacy" both `#`, plus
  a stale "real links land in a later Phase C part" note.
- A **typo'd slug in dev** (`/greetigns.html`) renders the landing page rather than 404ing.
  Deliberate: owning that means owning Vite's dev 404 behaviour. Recorded in `TOOLING.md`.
- Landing-page chrome words ("Lessons", "Start learning") are hardcoded in the components,
  not in `ui-strings.ts`, because that schema requires every key and adding landing keys
  is a contract change nobody has needed.

---

## Done recently (so a new session does not redo it)

| Date       | Commit    | What                                                                     |
| ---------- | --------- | ------------------------------------------------------------------------ |
| 2026-09-03 | `6c62d6d` | LICENSE added — MIT code + CC-BY-4.0 content (buildlist 28)              |
| 2026-09-03 | `2104d13` | content licence changed to **CC BY-NC 4.0**, swept through every doc     |
| 2026-09-03 | `f3f432e` | `main` stays open by decision; protection reframed as a pre-share gate   |
| 2026-09-03 | `ef9ec8f` | exercise showcase **opt-in per build** — no longer ships (buildlist 17b) |
| 2026-09-03 | `2e3e4bd` | this TODO.md added as the live worklist; stale claims corrected          |
| 2026-09-03 | `c239fa8` | **guard c — asset-path** (buildlist 21): `src/guards/` created, 21 tests |
| 2026-09-03 | `4367d31` | **guard d — asset-existence** (buildlist 22), 11 tests                   |
| 2026-09-07 | `891511c` | **guard b — naming + render-mirror** (buildlist 20), 17 tests            |
| 2026-09-07 | `22757f5` | **guard e — registry completeness** (buildlist 23), 30 tests             |
| 2026-09-07 | `0891e27` | guard f **survey** banked in §A-f — the rule, not the guard yet          |
| 2026-09-07 | —         | GitHub **template repository** box ticked (buildlist 33), verified       |
| 2026-09-07 | see A8    | `bun run guards` fast subset added (buildlist 31 closed)                 |
| 2026-09-07 | `df6c987` | **guard f — token integrity** (buildlist 24), 27 tests + shared reader   |
| 2026-09-07 | `69c254b` | **guard g — CSS layer discipline** (buildlist 25), 21 tests              |
