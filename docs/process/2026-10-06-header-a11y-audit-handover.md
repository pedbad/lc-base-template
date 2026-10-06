# Handover — a11y + validity audit of both headers (TODO §D6)

**Written:** 2026-10-06 at `main`, after the header scroll-spy shipped.
**Status: DONE 2026-10-06** — results, fixes and what was not run are in TODO §D6
("Header a11y + validity audit").
**Decision behind it:** the LO header and the landing-page header need not match. Both
must stay **fully accessible** and emit **valid HTML and CSS** (TODO §D6, "Two headers").

## Prompt to start the next session with

> Read `AGENTS.md`, then `docs/process/TODO.md` §D6, then this handover
> (`docs/process/2026-10-06-header-a11y-audit-handover.md`). Audit both headers on the
> BUILT site as it describes, fix what fails on a feature branch, and record the results
> in TODO §D6. Run the full gate before every commit.

## 1. The two headers

| Page           | File                                                | Shape                                                                                                                     |
| -------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `example.html` | `src/components/shell/Header.tsx`                   | sticky, full-width; brand link home; `<nav>` with section links + mobile disclosure; scroll-spy `aria-current="location"` |
| `index.html`   | `src/components/home/` (`CourseHome`, `LessonRail`) | `max-w-6xl`, static; brand is a `<p>`; landmark inside `LessonRail`'s off-canvas dialog                                   |

## 2. What already enforces the rule

- `eslint-plugin-jsx-a11y` (`recommended`) over every `.tsx`.
- Guard h, `src/guards/semantic-dom.ts`: both built pages — one named `<nav>`, labelled
  sections, named controls, `aria-hidden` decorative icons, resolving `aria-controls`.
- HTML well-formedness by construction: React emits every byte, and the repo has zero
  `dangerouslySetInnerHTML` (TODO §A-h, decision 2).
- Stylelint (`stylelint-config-standard`) — not the same as W3C CSS validation.

## 3. What nothing automated checks — the audit

Run on `bun run build` + the `preview` launch config, at **375px and 1440px**, **both
themes**:

1. **Keyboard.** Tab order through each header; visible focus ring on every stop;
   mobile disclosure (LO) — Escape closes and returns focus; `LessonRail` dialog
   (landing) — focus moves in, Tab is trapped, Escape restores focus.
2. **Contrast.** Brand text, nav links, the active link (`text-primary`), the toggle
   borders — AA 4.5:1 text, 3:1 non-text, light and dark.
3. **Target size.** Toggle buttons and nav links ≥ 24×24 CSS px (WCAG 2.2 AA 2.5.8).
4. **axe-core** injected into the Browser pane from cdnjs for a one-off scan. Page-only;
   do NOT add it to the repo — the node-env, no-axe decision in `docs/TOOLING.md` stands.
5. **HTML validator — undecided.** The W3C Nu validator online means uploading
   `dist/index.html` and `dist/example.html` to validator.w3.org. **Ask the maintainer
   before sending anything** — they were asked 2026-10-06 and have not answered.

## 4. Traps

- The hidden Browser pane freezes frames: no `scroll` events, no IntersectionObserver
  callbacks, no smooth-scroll progress. Anything motion- or scroll-dependent needs a
  human check, recorded as such.
- The pane cannot emulate the OS reduced-motion preference (TODO §D4).
- Contrast of a token is measured in BOTH themes; `--paper` (not white) is the page
  ground and `bg-card` the header ground.
- Do not change a guard to make a finding pass (AGENTS.md).

## 5. Done means

- Every check in §3 run, per page, per width, per theme — results recorded in TODO §D6.
- Every failure fixed, or written down with a reason. Gate green.
- A "Done recently" row in TODO.
