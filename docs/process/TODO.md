# TODO — the live worklist

**This file is the single source of truth for "what is next".** Start here in a new
session, on either machine.

| File                                  | Role                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| **this file**                         | what is still open, ordered, with a verify line each       |
| `LC_BASE_TEMPLATE_BUILD_HANDOVER.md`  | the numbered buildlist + tick history (steps 1–34)         |
| `2026-08-06-post-phase-d-handover.md` | state snapshot at end of Phase D, plus the §5 decision log |

**Last updated:** 2026-09-07 · **HEAD:** see `git log` · **Suite:** 82 files · 689 tests green
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

`bun run guards` (`vitest run src/guards`) is the fast subset — 79 tests in ~0.5s — for
when you only want to know whether you broke a repo-wide invariant. It is a subset of
`bun run test`, never a replacement for the gate above.

`bun run test` (Vitest), **not** `bun test` — Bun's own runner throws on the
`import.meta.glob` in `load-lo-glob.ts` and reports a false failure.

---

## A. Guards — 3 of 8 still open (the main body of work)

Guards **a** (config-schema, 19), **b** (naming + render-mirror, 20), **c** (asset-path,
21), **d** (asset-existence, 22) and **e** (registry, 23) are done. The other three are one
commit each, and each follows the same ritual: **write a deliberately-broken fixture first,
prove the guard blocks it, then make the real repo green.** A guard that was never seen to
fail is a guard that might be asleep.

Recommended order — **f next.** Everything load-bearing is now guarded: c and d cover the
bug family that bit french-lo-1 twice, b closed the last silent gap in LO structure, and e
stops an unresolvable `type` reaching a learner as a red error box. What remains is
presentation discipline — real, but nothing has broken from it yet, so pick the order that
suits you. f is next only because it is the most mechanical.

| Order | Buildlist | Guard | Checks                               | Head start already in repo                              |
| ----- | --------- | ----- | ------------------------------------ | ------------------------------------------------------- |
| 1     | 24        | **f** | no raw hex or px                     | **surveyed 2026-09-07 — see A-f below**                 |
| 2     | 25        | **g** | CSS all in `@layer`, no `!important` | **surveyed 2026-09-07 — see A-g below**                 |
| 3     | 26        | **h** | w3c + a11y over rendered pages       | landing page + sliding nav are new, unvalidated surface |

### A-f — guard f survey (done 2026-09-07, read this before building it)

The rule was the expensive part and it is now settled. **Guard f is a rule-definition job,
not a fix-the-repo job**: the repo is already compliant. Its value is stopping the first
author who writes `padding: 24px` instead of a token — which nothing catches today.

**Hex is already clean. Do not write a blanket ban.**

| Where                    | Count | Verdict                                                                      |
| ------------------------ | ----- | ---------------------------------------------------------------------------- |
| `src/styles/palette.css` | 17    | **Correct** — Layer 1 primitives, "the ONLY place real colour literals live" |
| `tokens-variant-a/b/c`   | 4     | **False positives** — all inside comment bodies naming the brand colour      |
| everywhere else          | 0     | —                                                                            |

Guard c's lesson repeats exactly: **strip comments first**, or guard f flags the
documentation that explains guard f.

**px is not a token bypass anywhere.** 52 real sites in component CSS, grouped by the
property they set:

```
box-shadow 10 · outline-offset 9 · outline 9 · border 8 · border-radius 6
border-top 4 · perspective 2 · transform 1 · border-left 1
border-inline-end 1 · backdrop-filter 1
```

ZERO on `font-size`, `padding`, `margin`, `gap`, `width`, `height`, `inset`. 44 of the 52
are 1–4px hairlines and focus rings, where px is the CORRECT unit and rem would be wrong.
So spec §138's "no raw px in components" **cannot be a blanket ban** — the real rule is a
PROPERTY ALLOWLIST.

**The TSX surface.** 11 Tailwind arbitrary values: 9 in `src/components/ui/`
(shadcn-generated — `switch`, `tabs`, `sidebar`, `tooltip`, `badge`), 2 first-party in
`LineMatchExercise.tsx:497,500` (`[980px]`). 4 inline `style={{}}`, all computed and all
clean (`animationDelay` from a constant, `accentColor: 'var(--primary)'`, a transition
string, a `ch` width) — none hardcodes a colour or a px. Both entry HTML files are clean.

**All four decisions are now ANSWERED** (2026-09-07). State each in the module header
anyway, the way c and d did — deciding the rule was the real work there and the code fell
out after.

1. **Exempt `src/components/ui/`** — yes. Nine of the eleven arbitrary-value hits live
   there and they are shadcn-generated; `shadcn add` would re-break the build on every
   regeneration. Guard c set the precedent for a written-down scope exclusion (it skips
   `*.test.*` and `*.fixture.*`). Exempt it, with the reason in the header.
2. **`border-radius` in px is NOT a violation** — the earlier concern was wrong. Four of
   the six sites go THROUGH the token: `calc(var(--radius) + 4px)` in `home.css` and
   `flashcards.css`, `calc(var(--radius) - 4px)` in `drag-fill-gaps.css` and
   `word-spot.css`. That is the chain working as designed — a derivative offset, not a
   bypass. The other two are `border-radius: 999px`, the standard pill idiom.
   **Consequence for the guard: the allowlist must permit a `calc()` that references a
   token, or it flags correct code.**
3. **Property allowlist — confirmed.** px is legitimate on `border*`, `outline*`,
   `box-shadow`, `backdrop-filter`, `perspective`, `transform` and inside `@media`.
   Everything else must be a token or a relative unit. The 52 real sites are all in the
   allowed set, so the repo passes.
4. **`[980px]` in `LineMatchExercise.tsx` is NOT a violation** — it is
   `min-[980px]:hidden` / `min-[980px]:block`, a Tailwind arbitrary BREAKPOINT, i.e. a
   media query, which rule 3 already allows.

**Net: the repo is fully compliant and guard f fixes nothing.** Its whole value is
stopping the first author who writes `padding: 24px` instead of a token. The real work is
avoiding FALSE POSITIVES on correct code — comment bodies and token-referencing `calc()`.

**Mechanism note.** Stylelint already runs and could own the CSS half via
`declaration-property-unit-allowed-list`. Guards a–e are all Vitest and `bun run guards`
globs `src/guards/`, so Vitest keeps all eight in one place and in that script — but the
CSS half is a genuine choice, not a foregone one.

### A-g — guard g survey (done 2026-09-07, read this before building it)

Same shape as f: **the repo is already clean, and the naive rule produces false
positives.**

**`!important` — zero real ones.** Six files match a grep, and all six matches are in the
COMMENT HEADER of the file, each saying "no raw hex, no `!important`":

```
flashcards.css:4 · word-spot.css:4 · memory-match.css:4
drag-fill-gaps.css:3 · phrase-reorder.css:3 · word-order.css:3
```

That is the THIRD guard in a row whose correctness turns on stripping comments first (c,
f, now g). Guard c's `stripComments()` is string-aware and offset-preserving so line
numbers stay truthful — **reuse it, do not write a second one.** It already lives in
`src/guards/asset-path.ts`; export it rather than copying it.

**`@layer` — every one of the 15 CSS files contains at least one `@layer`.** But that is
NOT the check. A file having `@layer` once does not prove every RULE sits inside a layer
block, and an unlayered rule beats every layered one in the cascade regardless of
specificity — which is the whole reason spec §5 demands layering. **This is the one thing
the survey did not verify, so it is guard g's first real job:** parse each file's brace
depth and assert no selector rule sits outside an `@layer` block. Expect `@import`,
`@charset`, `:root` custom-property blocks and `@media` inside a layer to need thinking
about; a naive depth counter will get at least one of them wrong.

**Shared work between f and g.** Both walk the same 15 CSS files, both need the same
comment-stripping, both report `file:line`. Build the reader ONCE — a shared helper in
`src/guards/` used by both — then two scanner modules and two commits, one concern each.

### A8 — wire the guards up (buildlist 31) — **DONE 2026-09-07**

`bun run guards` = `vitest run src/guards`. 79 tests in ~0.5s against the full suite's
~2s. It did NOT need to wait for f–h: a path glob picks up a new guard the moment its
file lands, so nothing has to be edited when one does. A hand-kept list is the thing that
goes stale — the same argument guard e makes for a schema convention over a central map.

Two things settled while closing it, both written up in `docs/TOOLING.md`:

- **Guard a is deliberately outside the script.** Config-schema is not a sweep — the Zod
  schemas run inside `assembleLo` on every load, in the app itself. Its contract tests
  are colocated (`src/config/lo-schema.test.ts`), and every LO on disk is parsed
  end-to-end by `lo-rich-text.test.ts`, which loads them all through `loadLo`.
  `bun run test` covers both; `bun run guards` covers the four sweeps.
- **No CI step was added**, contrary to what this section used to say. CI runs
  `bun run test`, a strict superset — a guards step would re-run the same 79 tests for
  no extra signal.

**Convention to keep:** every guard's scanner module lives in `src/guards/`. That is what
makes the glob honest, so put guard f, g and h there too.

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
