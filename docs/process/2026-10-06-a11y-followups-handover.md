# Handover — a11y follow-ups surfaced 2026-10-06 (TODO §D10)

**Written:** 2026-10-06 at `main` (`3918591`), after rich-text block entries and the
debug pages' shared "Jump to" bar shipped.

## Prompt to start the next session with

> Read `AGENTS.md`, then `docs/process/TODO.md` §D10, then this handover
> (`docs/process/2026-10-06-a11y-followups-handover.md`). Work the four items below on a
> feature branch, tests first. For each: confirm it on the BUILT site, then fix it or
> record a reasoned decision in TODO §D10. Run the full gate before every commit.

## Why this job

Today's axe runs (headless Chromium, see "How to check" below) flagged four things that
were **not** caused by today's work and were left alone to keep each change one concern.
Nothing records them except this file and §D10 — so they are next, before they are
forgotten. §D6 (the landing page reads sparse at 1440) is the only other open item, and it
is design work that needs the maintainer's direction first.

## The four items

1. **`word-spot` tokens — axe `target-size` (WCAG 2.2 SC 2.5.8).** On
   `exercise-showcase.html`, 4–5 `.word-spot-token` nodes per run. `word-spot.css` gives
   the token `padding: 0.05em 0.15em`. **Decide before fixing:** the tokens are part-words
   INSIDE a word in running text, and 2.5.8 exempts **inline** targets ("in a sentence or
   block of text"). If the exemption holds, record it with the reasoning; if not (e.g. a
   token is a whole short word standing alone), enlarge the hit area without changing the
   text layout (a pseudo-element hit area, as the LO theme switch does with `::after`).
   This engine ships in real lessons, so it is the highest-value item.
2. **Debug sandbox — 5 `<h1>`.** The page has its own `<h1>` plus, apparently, one per
   rendered doc in the Docs section (each markdown file's `# Title`). Confirm, then demote
   the rendered docs' top level (render at `h2`) in `src/build/docs-markdown.ts` or the
   Docs section, without editing the markdown sources.
3. **Debug sandbox — `scrollable-region-focusable` on `<pre>` code blocks** (9–16 per
   run). Rendered doc code blocks scroll sideways but cannot be reached by keyboard. Either
   make them wrap (`white-space: pre-wrap`, as the showcase's "Authored source" does) or
   give them `tabindex="0"` + a name. Wrapping is simpler and needs no tab stops.
4. **Debug sandbox — `color-contrast`, dark theme only** (28 nodes,
   `.overflow-hidden.rounded-md.border > .py-5.px-4 > .font-semibold.text-sm` — the palette
   swatch cards). Measure which text/ground pair fails and fix it with tokens.

Items 2–4 are on a debug-only page that never ships, so they are lower stakes than item 1 —
but the sandbox is the designer's reference, and the repo's standing rule is "fully
accessible, valid HTML and CSS".

## Not on the list, on purpose

- axe `region` and `aria-hidden-focus` while the debug "Jump to" menu is open: Base UI's
  portal sits outside landmarks, and its focus guards are `aria-hidden` by design. Both
  are best-practice rules, not WCAG failures. Accept unless a fix is trivial.

## How to check (the hidden-pane trap)

The in-app Browser pane is usually HIDDEN, which freezes the document timeline: CSS
transitions never finish and colours read mid-transition. Measure in headless Chromium:
`playwright-core` from the session scratchpad, pointed at the cached
`~/Library/Caches/ms-playwright/chromium_headless_shell-*/…/chrome-headless-shell`, with
axe-core 4.10.2 injected from cdnjs. **Nothing goes into the repo** (the no-axe decision in
`docs/TOOLING.md` stands). Debug pages need `DEBUG=1 bun run build` + the `preview`
launch config.

## Traps

- `bun run test`, never `bun test`.
- The shadcn CLI now emits `import { cn } from "cn"` and installs the `cn` package; this
  repo keeps `@/lib/utils`. Fix the import and revert `package.json`/`bun.lock` if you
  run `shadcn add`.
- Bundle budget lives only in `docs/TOOLING.md` (JS < 105 kB, CSS < 17 kB). CSS is at
  16.53 kB — measure any CSS you add.

## Done means

- Each item fixed with a test that failed first, or decided and recorded in §D10.
- axe re-run on `exercise-showcase.html` and `debug-sandbox.html`, both themes.
- Gate green; a "Done recently" row in TODO.
