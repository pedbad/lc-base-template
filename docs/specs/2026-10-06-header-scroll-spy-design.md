# LO header scroll-spy — design

**Status:** shipped 2026-10-06 (TODO §D6) · **Owner:** maintainer ·
**Handover:** `docs/process/2026-10-05-scroll-spy-handover.md`

## 1. Goal

On an LO page the sticky `Header` lists one link per section. Today the highlighted
link (`aria-current`) only moves when a link is followed: `PageLayout` seeds it from the
hash and updates it on `hashchange`. A reader who clicks "Vocabulary" and scrolls on to
Grammar still sees "Vocabulary" lit.

**Success means:**

- The highlight follows the section on screen while the reader scrolls, in the desktop
  nav and in the mobile panel.
- A clicked jump lands on the clicked section with no flicker through the ones between.
- The last section lights at the bottom of the page, however short it is.
- Scrolling never moves focus and never writes the URL hash.
- Prerendered markup equals the first client render, including on a page loaded with a
  hash.

## 2. Decisions

| #   | Question                                 | Decision                                                                                       |
| --- | ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| S1  | Which `aria-current` value?              | **`location`** — "the current location within a context". `page` claims a whole page.          |
| S2  | Above the first section (the hero)?      | **No link is active.** The reader is on the title, not on "Introduction".                      |
| S3  | Where is the trigger line?               | The section's own **`scroll-margin-top` + 8px** — where a followed link lands it, plus slack.  |
| S4  | When does the last section win?          | **At the bottom of the page** (and only after some scrolling), whatever the positions say.     |
| S5  | How is "the click has settled" detected? | **A debounce: no scroll event for 150 ms.** `scrollend` is not used — see §4.                  |
| S6  | Observer or scroll listener?             | **A passive `scroll` listener** reading each section's rect — see §4.                          |
| S7  | Rename `activeSectionId`?                | **No.** "Active" is now true in both senses (in view, or just followed). The doc is rewritten. |

## 3. Behaviour

**The rule.** The active section is the last one whose top is at or above the trigger
line. With none there, nothing is active (S2). At the bottom of a page that has scrolled
at all, the last section is active (S4).

**A followed link wins until scrolling settles.** A click on an in-page link to a
section, or a `hashchange` to one (which also covers Back and Forward), sets that section
active at once and holds it. While held, each scroll event only extends the hold. When
150 ms pass with no scroll event the hold lapses, and the highlight stays on the followed
section until the reader scrolls again. Recomputing at the moment of release was
rejected: a followed section that cannot reach the trigger line (one near the end) would
be replaced by the last section the instant the jump finished, which reads as a bug.

**Focus and hash.** The `hashchange` handler keeps moving focus to the section's `<h2>`
exactly as before. The spy only ever calls `setState`; it never touches focus, the hash
or history.

**First render.** State starts as `''` on the server and on the first client render. The
hash is read in an effect. The current `useState(currentHashId)` reads
`window.location.hash` during the first client render, and on the built site
`/example.html#grammar` hydrates with **no link marked at all** — checked 2026-10-06.
Production React neither patches nor reports an attribute mismatch, so this was silent.

## 4. Why not the alternatives

**Not an IntersectionObserver.** The question is positional: which section's top last
crossed a line. An observer answers "does X overlap a region", and a region thin enough
to stand for a line needs a bottom `rootMargin` of `innerHeight − line` in px (rootMargin
takes no `calc()`), rebuilt on every resize. A section's top crossing the region's top
edge fires nothing when the section already overlapped the region, so the obvious
`-80px 0px 0px 0px` setup misses exactly the transitions that matter. The bottom rule
needs the scroll position anyway. A passive scroll listener over a handful of sections is
one rect read per section per scroll event, and browsers fire `scroll` at most once per
frame. `useRevealWhileInView`'s observer answers a different question ("seen yet"),
which is why §D4's lesson does not transfer either way.

**Not `scrollend`.** Safari does not ship it within the support floor (chrome111,
firefox114, safari16.4), and a debounce is needed there regardless. One mechanism
everywhere is simpler than a feature-detected pair.

## 5. Shape

| Unit                              | What                                                                   |
| --------------------------------- | ---------------------------------------------------------------------- |
| `src/lib/sectionInView.ts` + test | pure: `pickSectionInView`, `isScrolledToBottom`                        |
| `src/lib/jumpHold.ts` + test      | the debounced hold: `hold()`, `isHeld()`, `dispose()`                  |
| `src/hooks/useScrollSpy.ts`       | thin: listens, measures, calls the two above; returns `[id, hold(id)]` |
| `PageLayout.tsx`                  | seeds `''`; click + `hashchange` call `hold(id)`; hash read in effect  |
| `Header.tsx` + test               | `aria-current="location"`; prop doc rewritten                          |

The hook has no unit test: the suite runs in `node` with no DOM (vite.config.ts), as
`useRevealWhileInView` has none. Its logic lives in the two tested modules.

## 6. Verification

- Unit tests for every rule in §3 (`bun run test`), and the full gate.
- Built site: `/example.html#grammar` hydrates with the Grammar link marked.
- **A human scrolls the page.** The hidden Browser pane freezes frame delivery, so an
  agent cannot watch the highlight move. Recorded as such in TODO, not claimed.
- Bundle: measure `main-*.js` gzipped before and after; record in TODO.
