# Header Scroll-Spy Implementation Plan

**Goal:** the LO header's active link follows the section on screen. Spec:
`docs/specs/2026-10-06-header-scroll-spy-design.md` — read it first.

**Gate before every commit:**
`bun run format && bun run lint && bun run lint:css && bun run test && bun run build`
(`bun run test`, never `bun test`).

Each task is red → green: write the test, watch it fail, implement, watch it pass.

- [x] **1. `src/lib/sectionInView.ts`.** Tests first:
  - `pickSectionInView` returns `undefined` for no sections, and when every top is
    below the line (S2: the hero case).
  - It returns the LAST section whose top is at or above the line, including exactly on it.
  - `atBottom` returns the last section regardless of positions (S4).
  - `isScrolledToBottom` is false at `scrollY = 0` even on a page that fits the viewport,
    true within the tolerance of the end, false short of it.
- [x] **2. `src/lib/jumpHold.ts`.** Tests with fake timers:
  - not held at first; held after `hold()`; released `SETTLE_MS` later;
  - a second `hold()` inside the window extends it (the debounce);
  - `dispose()` releases at once and clears the timer.
- [x] **3. `src/hooks/useScrollSpy.ts`.** Thin wiring only (no DOM in the test env):
      passive `scroll` + `resize` listeners; trigger line from the first section's computed
      `scroll-margin-top` plus slack; while held, a scroll extends the hold and changes
      nothing; returns `[activeId, hold]`. Initial state `''`.
- [x] **4. `Header`.** Test: the active link carries `aria-current="location"`, and
      never `page`; no link is marked when `activeSectionId` is `''`. Then flip the value and
      rewrite the prop doc.
- [x] **5. `PageLayout`.** Test: with no hash, static markup marks no link (parity).
      Then: seed `''`, read the hash in an effect, call `hold` from a document click on an
      in-page section link and from `hashchange` (which still moves focus).
- [x] **6. Verify.** Gate; built site `/example.html#grammar` marks Grammar after
      hydration; bundle figure; human scroll check.
- [x] **7. Docs.** `lo-semantic-structure.md` §1 (`aria-current="location"`); TODO §D6
      bullet closed with verification + bundle figures; "Done recently" row; correct every
      "last navigated to" phrasing.
