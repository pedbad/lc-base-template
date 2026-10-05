# Handover — the LO header scroll-spy (TODO §D6)

**Written:** 2026-10-05 at `main` after the LO hero banner (§D9) shipped.
**Decision:** the maintainer reopened the scroll-spy the same day it was deferred. It is
the next job. It has been removed from TODO's "Deferred on purpose" table and is back on
§D6 as an open bullet.

## Prompt to start the next session with

> Read `AGENTS.md`, then `docs/process/TODO.md` §D6, then this handover
> (`docs/process/2026-10-05-scroll-spy-handover.md`). Build the LO header scroll-spy
> it describes. Follow the repo's usual flow: a short spec in `docs/specs/`, a TDD plan,
> then implementation on a feature branch. Respect every trap listed in the handover.
> When it ships, close the §D6 scroll-spy bullet, add a "Done recently" row, and
> correct every doc that still calls `activeSectionId` "the section last navigated to".
> Run the full gate before every commit.

---

## 1. What it is

On an LO page, the sticky `Header` lists one link per section (Introduction, Vocabulary,
Grammar, Exercises on the example LO). The active link carries `aria-current` and an
active style.

**Today the active link only moves when a link is clicked.** `PageLayout` seeds
`activeSectionId` from the URL hash at mount and then updates it only on `hashchange`.
So if a reader clicks "Vocabulary" and then scrolls down to Grammar, "Vocabulary" stays
highlighted.

**The job:** make the highlight follow the section on screen while the reader scrolls.
Keep the click-to-jump behaviour as it is.

## 2. Where the code is

| File                                     | What is there now                                                                                                                                                                                                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/shell/PageLayout.tsx`    | `useState(currentHashId)` (~line 56), and a `hashchange` effect that sets `activeSectionId` and **moves focus to the section's `<h2>`** (`headingId(id)`). Sections render inside `.lo-content`.                                                                  |
| `src/components/shell/Header.tsx`        | The `activeSectionId` prop doc (~lines 34–51) states it is "the section last NAVIGATED to", NOT the one in view. Links set `aria-current={… ? 'page' : undefined}` (~line 79). The prop feeds BOTH the desktop nav (~152) and the mobile disclosure panel (~202). |
| `src/hooks/useRevealWhileInView.ts`      | The repo's existing `IntersectionObserver` hook (BackToTop's fade), with a delivery fallback. It is the precedent to read for observer style, cleanup and the "no callback arrives" fallback. Do not reuse it blindly: it watches ONE element.                    |
| `src/lib/prefersReducedMotion.ts`        | The only sanctioned reduced-motion read. Call it from effects or handlers only, never at module scope or during render (AGENTS.md).                                                                                                                               |
| `docs/specs/lo-semantic-structure.md` §1 | The skeleton already shows `aria-current="true"` on a nav link, so the spec anticipated a non-`page` value.                                                                                                                                                       |

**Layout facts that matter for the trigger line:**

- The header is sticky and **73px tall** since the course mark was doubled (`63ed4fd`).
- Sections carry `scroll-mt-20` (5rem = 80px).
- A full-bleed hero (`LoHero`, 224–448px) now sits above the first section, so at the
  top of the page NO section is in view yet.

## 3. The traps (found before it was deferred; all still apply)

1. **Never write the URL hash from the spy.** The `hashchange` handler moves keyboard
   focus to the section heading. If the spy changed the hash, focus would jump on every
   scroll and every section would add a history entry. The spy only changes the
   highlight.
2. **A clicked jump flickers through the sections in between.** Clicking a link
   smooth-scrolls past them, so the spy would highlight each in turn. Pause the spy
   while a click-initiated scroll is in flight, and let the clicked section win until
   scrolling settles. There are two ways to tell it has settled, both to check against
   browser support:
   - the `scrollend` event, which the support floor (`chrome111`, `firefox114`,
     `safari16.4`) may not have everywhere, so check before relying on it;
   - a debounce.
3. **The last section may never become active.** A short final section cannot scroll up
   to the trigger line. Treat "scrolled to the bottom" as the last section.
4. **`aria-current="page"` becomes the wrong value.** `page` means the current page.
   For "the section in view" use `aria-current="location"` (or `"true"`, which the
   semantic-structure spec already shows). This changes Header tests and possibly guard
   h's expectations, so read `src/guards/semantic-dom.ts` before changing it.
5. **Above the first section, nothing is active.** With the hero, the reader starts
   with no section in view. Decide explicitly whether that state is "none" or
   "the first section", and test it.
6. **Hidden-pane verification limit.** The Browser pane, when hidden, delivers no
   `IntersectionObserver` callbacks. The spy cannot be confirmed working by an agent
   alone, so a human must scroll the page and watch. Record that in the verification
   notes rather than claiming it was observed.

## 4. Constraints from AGENTS.md that bite here

- **Prerendered markup must equal the first client render.** The observer runs only in
  `useEffect`.
- **A parity question to check, not assume.** `useState(currentHashId)` already reads
  `window.location.hash` during the FIRST client render, while the prerender produced
  `''`. On a page loaded with `#grammar`, the first client render's `aria-current`
  differs from the prerendered markup. Verify whether that logs a hydration warning
  today (load `/example.html#grammar` on the BUILT site through the `preview` launch
  config). If it does, fix it in this job by seeding `''` and reading the hash in an
  effect.
- **Reduced motion:** the scroll-spy itself has no motion. If the active-link style gains
  a transition, it goes in CSS under the repo's `reduce` override, and it never
  transitions a token colour declared in a base state (TODO §D8).
- **Bundle:** JS is 97.28 kB gzipped against < 100 kB (`docs/TOOLING.md`, "Bundle
  budget"). A hook costs a few hundred bytes. Measure it and record the figure anyway.

## 5. Suggested shape (not decided — the spec decides)

- A hook, e.g. `src/hooks/useSectionInView.ts`, that takes the section ids and returns
  the id in view (or `undefined`). It uses one `IntersectionObserver` over all sections,
  with a `rootMargin` that puts the trigger line just under the 73px header. Pure
  selection logic goes in a separate, unit-tested function: given entries or positions,
  which id wins, including the bottom-of-page rule. Tests live beside it.
- `PageLayout` combines the two sources. A click sets the active id immediately and
  suspends the spy until scrolling settles; otherwise the spy's id wins.
- Rename `activeSectionId` only if the spec decides the name now lies. Header's doc
  comment must be rewritten either way, because "NOT the section currently in view"
  stops being true.

## 6. Done means

- Scrolling moves the highlight in both the desktop nav and the mobile panel.
- A clicked jump lands on the clicked section with no flicker.
- The last section activates at the bottom of the page.
- Focus never moves on scroll, and the hash never changes on scroll.
- `aria-current` uses the chosen non-`page` value, and Header tests and guard h agree.
- No hydration warning, including for a page loaded with a hash.
- **Gate green:**
  `bun run format && bun run lint && bun run lint:css && bun run test && bun run build`.
- **Docs updated:**
  - Header's prop doc and PageLayout's comments.
  - `lo-semantic-structure.md` §1, if the `aria-current` value differs from what it
    shows.
  - TODO §D6: close the scroll-spy bullet, record verification and bundle figures, and
    add a "Done recently" row.
- **A human has scrolled the page and confirmed the highlight follows** (trap 6).
