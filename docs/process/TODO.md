# TODO — the live worklist

**This file is the single source of truth for "what is next".** Start here in a new
session, on either machine.

| File                                  | Role                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| **this file**                         | what is still open, ordered, with a verify line each       |
| `LC_BASE_TEMPLATE_BUILD_HANDOVER.md`  | the numbered buildlist + tick history (steps 1–34)         |
| `2026-08-06-post-phase-d-handover.md` | state snapshot at end of Phase D, plus the §5 decision log |

**Last updated:** 2026-09-07 · **HEAD:** see `git log` · **Suite:** 81 files · 659 tests green
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

`bun run test` (Vitest), **not** `bun test` — Bun's own runner throws on the
`import.meta.glob` in `load-lo-glob.ts` and reports a false failure.

---

## A. Guards — 4 of 8 still open (the main body of work)

Guards **a** (config-schema, 19), **b** (naming + render-mirror, 20), **c** (asset-path, 21) and **d** (asset-existence, 22) are done. The other four are one commit each, and each
follows the same ritual: **write a deliberately-broken fixture first, prove the guard
blocks it, then make the real repo green.** A guard that was never seen to fail is a guard
that might be asleep.

Recommended order — **e next.** b, c and d were the ones that mattered: c and d cover the
family of bug that actually bit french-lo-1 twice, and b closed the only silent gap left in
LO structure (a folder no manifest names). What remains is tidiness enforcement — real, but
nothing has broken from it yet, so pick the order that suits you. e is next only because it
is the one with a seed already written.

| Order | Buildlist | Guard | Checks                                       | Head start already in repo                                |
| ----- | --------- | ----- | -------------------------------------------- | --------------------------------------------------------- |
| 1     | 23        | **e** | every `type` resolves to a registered engine | seeded by the per-type schema map in `example-lo.test.ts` |
| 2     | 24        | **f** | no raw hex or px                             | `public/images/lo-placeholder.svg` is the one exception   |
| 3     | 25        | **g** | CSS all in `@layer`, no `!important`         | —                                                         |
| 4     | 26        | **h** | w3c + a11y over rendered pages               | landing page + sliding nav are new, unvalidated surface   |

### A8 — wire the guards up (buildlist 31, currently `[~]`)

There is no `bun run guards` script yet, and CI is partial **by design** — guards join as
they land. Once e–h exist: add the script, add the CI step, close 31.

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

## D. Repo setup (buildlist 33)

- **D1 — tick the GitHub "template repository" box.** Verified `is_template: false` on
  2026-09-03. One checkbox in Settings; adds the "Use this template" button so a new
  course starts from a clean history instead of a fork. This repo is _called_ a template
  and GitHub does not know it.

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
