# Handover — one content width, a reading measure, and breakout (TODO §D11)

**Written:** 2026-10-06 at `main` (`27c5d89`), after §D10 closed.

## Prompt to start the next session with

> Read `AGENTS.md`, then `docs/process/TODO.md` §D11, then this handover
> (`docs/process/2026-10-06-content-width-handover.md`). Work it on a feature branch,
> tests first. Measure on the BUILT site before and after (320 · 768 · 1024 · 1440, both
> themes). Run the full gate before every commit.

## Why this job

The maintainer reported two things on 2026-10-06: the debug sandbox's rendered docs
scroll sideways, and the centre column feels narrow, with too much empty space either
side. Measuring showed they are two different problems.

## What was measured (dev server, 2026-10-06)

| Page                     | Column                                  | max-width         | side padding  | content at 1440 | empty space each side at 1440 |
| ------------------------ | --------------------------------------- | ----------------- | ------------- | --------------- | ----------------------------- |
| `example.html` (LO)      | `.lo-content` (`PageLayout.tsx`)        | 1024px (`5xl`)    | 16px (`px-4`) | 992px           | 208px                         |
| `exercise-showcase.html` | `main` (`src/showcase/Showcase.tsx:36`) | **768px (`3xl`)** | 24px (`px-6`) | 720px           | **336px**                     |
| `debug-sandbox.html`     | `main` (`src/sandbox/Sandbox.tsx:50`)   | 1024px (`5xl`)    | 24px (`px-6`) | 976px           | 208px                         |
| …the sandbox's doc text  | `.doc-prose` (`sandbox.css:17`)         | **68ch = 605px**  | 0             | 605px           | —                             |

**The sideways scroll comes from the 68ch cap, not the page width.** The sandbox column
gives 976px, but `.doc-prose` caps everything inside it at 68ch, `<pre>` included. The
widest block (DESIGNER's three-layers diagram) needs **786px**. 9 blocks overflow at both
1440 and 1280. (They are keyboard-reachable regions since §D10 `a2eee2b`, so this is a
layout problem, not an a11y one.)

## The design, as recommended and accepted

Pull apart two widths that are tangled today:

1. **Reading measure — keep it narrow.** Body text reads best at about 60–75 characters
   per line, so 68ch stays right for paragraphs, lists and headings. Do NOT widen prose
   to fit the code: 786px of running text is about 90 characters per line.
2. **Breakout — wide things use the whole column.** `pre`, `table`, images, exercise
   widgets: not held to the text measure. In the sandbox, that alone gives code 976px
   and ends all 9 overflows at desktop widths. Below about 830px they still scroll, which
   is correct.
3. **One page width: 1152px (`72rem`) — maintainer's decision, 2026-10-06.** All three
   pages move to one frame token. The LO page and the sandbox go from 1024px, and the
   showcase from 768px, which is now the narrowest column holding the widest content.
   With the 32px desktop gutter (point 4), the content column is **1088px**, and the
   empty space each side is 144px at 1440 and 64px at 1280.
4. **One side padding**, as a token (for example `clamp(1rem, 4vw, 2rem)`): 16px on a
   phone, 32px on a desktop. Today it is 16px on the LO page and 24px on the debug pages.

**Point 1 is NOT optional at 1152px.** Without a reading measure, text in a 1088px column
runs about 130 characters per line. Every page that holds running text in the frame needs
the measure: LO prose, block text, the showcase's notes, and the sandbox docs.

**Watch what grows with the frame.** Anything sized `width: 100%` gets 64–96px wider at 1440. Most of it is fine. Some is not:

- **The flashcards card is `width: 100%` with `aspect-ratio: 3 / 2`**, so it would grow to
  about 1088 × 725px. Give exercise widgets a sensible cap of their own, or a "wide"
  track narrower than the full frame, and decide per engine. Measure all 15 engines on
  the showcase at 1440 and list any that look stretched.
- **Images and the LO hero:** check the hero title still lines up with the header inset.
- **The header:** its width must move to the same frame token, or the header and content
  edges stop lining up.

## Check FIRST — unmeasured

**Does the LO page's prose have a measure?** `.lo-content` is 992px wide at 1440. If the
lesson paragraphs run the full width, that is about 110 characters per line today: the
same tangle as the sandbox, on a page that ships. Measure line length on `example.html`.
If it is uncapped, the reading measure (point 1) applies there too, in the same pass. If
that grows the job past one concern per commit, split it.

## Where things live

- `src/components/shell/PageLayout.tsx:122`: `lo-content mx-auto max-w-5xl px-4 pb-8`.
  `PageLayout.test.tsx:124-125` pins `max-w-5xl` on `.lo-content`, not on `<main>`. Read
  why before changing it.
- `src/showcase/Showcase.tsx:36`: `max-w-3xl px-6`.
- `src/sandbox/Sandbox.tsx:50` and `src/sandbox/DebugPageHeader.tsx:74`: `max-w-5xl px-6`.
  Both must move together, or the header and the body lose their shared edge.
- `src/sandbox/sandbox.css:17`: `.doc-prose { max-width: 68ch }`. This is where the
  breakout goes: either cap the text children (`p`, `ul`, `ol`, `h4`–`h6`, `blockquote`)
  instead of the container, or put the container on a grid with named `content` /
  `wide` tracks.
- `src/components/shell/footer.css:308`: another `68ch`. Leave it unless it is the same
  concern.

## Traps

- **Tokens only** (AGENTS.md): no raw px on spacing or sizing. A width belongs in a token
  in `rem` or `ch`. Guard f fires on raw px.
- **Every CSS rule inside `@layer`. No `!important`.** (guard g)
- **CSS budget < 17 kB gzip; now 16.55 kB.** Measure any CSS you add. Swapping Tailwind
  utilities for one token should be close to neutral.
- **Debug pages build only with `DEBUG=1 bun run build`**, and the plain `bun run build`
  in the gate OVERWRITES `dist/` without them. Rebuild with `DEBUG=1` before you measure
  them.
- **Hidden-pane trap:** measure in headless Chromium (`playwright-core` from the
  scratchpad), not the hidden in-app Browser pane. Headless-shell does not scroll on arrow
  keys; use full Chromium (`ms-playwright/chromium-*`) for keyboard checks.
- The header has its own width rules (the §D6 header work). Check that the header and
  content edges still line up after any frame change.
- `bun run test`, never `bun test`.

## Done means

- Zero `<pre>` overflow on `debug-sandbox.html` at 1440 and 1280; still scrollable, still
  focusable, at 375.
- One 72rem frame token and one gutter token shared by the LO page, showcase, sandbox and header, with
  edges lined up between header and content.
- Paragraph line length within about 75 characters wherever the reading measure applies.
- No horizontal page scroll at 320. Screenshots at 320 · 768 · 1024 · 1440, both themes.
- axe re-run on all three pages: no new violations.
- Gate green; §D11 closed in TODO with figures; a "Done recently" row.
