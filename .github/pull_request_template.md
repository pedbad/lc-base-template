<!--
  PR template for lc-base-template. Tick every box that applies; delete
  sections that genuinely don't. A green CI run is required but NOT sufficient —
  the accessibility + visual checks below are the parts CI can't fully judge.
-->

## What & why

<!-- One or two sentences: what this PR changes and the reason. Link the LO / issue / spec section. -->

## Type of change

- [ ] New Learning Object / content (JSON, fixtures — no engine or token changes)
- [ ] New or changed exercise engine
- [ ] Design system / tokens / global CSS
- [ ] Build / tooling / CI / config
- [ ] Docs only

## Checks (all must pass locally before review)

- [ ] `bun run test` — green
- [ ] `bun run lint` · `bun run lint:css` — clean
- [ ] `bun run build` — succeeds
- [ ] `bun run format:check` — clean
- [ ] New pure logic has colocated tests (≥80% on the logic file)

## Accessibility (required for any UI change)

- [ ] **Keyboard-only pass** — Tab/Shift+Tab reach everything, visible focus, no traps; Esc closes overlays
- [ ] **Landmarks + headings** — one `<main>`, logical `h1→h2→h3` with no skips, no decorative heading before `<h1>`
- [ ] **Screen-reader smoke check** — controls have accessible names; `lang={TARGET_LANG}` only on target-language content, never on UI chrome/aria
- [ ] **Contrast** — text and controls meet WCAG AA (4.5:1)
- [ ] **Reduced motion** — animation respects `prefers-reduced-motion`
- [ ] No new WAVE / Lighthouse-a11y regressions vs `main`

## Visual (required for any UI change)

- [ ] Before/after screenshots attached (below)
- [ ] Checked light **and** dark theme
- [ ] Checked responsive widths (≥ 320 / 768 / 1024 / 1440)

<!-- paste screenshots here -->

## Anything reviewers should know

<!-- Trade-offs, follow-ups deliberately left out, risky areas. -->
