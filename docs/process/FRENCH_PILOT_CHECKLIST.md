# French course pilot — checklist

**Prepared 2026-10-23 (TODO §E34). Not run yet.** The automated checks prove the code;
this proves the people and the route: that a colleague can build a French lesson from
the guide alone, read the build's errors, and get it published. Run it once, on the
first course repo (`lc-french`), after the organisation move
([`docs/ORGANIZATION.md`](../ORGANIZATION.md) steps 1–8). Tick each step only when its
expected result was seen. Note what went wrong under it, even when it was fixed on the
spot: that is what the pilot is for.

**Who:** the colleague writing the lesson (A), the maintainer (M), the colleague who
publishes (P).

## 1. A starts from a fresh clone

- [ ] A follows [`COURSE_GUIDE.md` → "Once: set up your machine"](../../COURSE_GUIDE.md#once-set-up-your-machine)
      on their own machine, with no help.
- **Expected:** `bun run dev` serves the course; the example lesson opens in the browser.

## 2. A creates a lesson from the guide only

- [ ] A follows [`COURSE_GUIDE.md` → "Every day: the loop"](../../COURSE_GUIDE.md#every-day-the-loop):
      a branch, a copy of `lo-config/lo-00-example/` as `lo-config/lo-01-<name>/`, one
      select exercise of their own. M answers questions but does not touch the files.
- **Expected:** the new lesson shows on the home page in `bun run dev`, the example does
  not, and the select's dropdowns offer A's options.

## 3. A breaks an answer on purpose, and reads the error

- [ ] A removes the `*` from one blank, so `[*suis|es|est]` becomes `[suis|es|est]`, and
      runs `bun run build`.
- **Expected:** the build stops before writing any page. Its message names the file, the
  blank and the sentence (`… has no correct option … → at content.items[0].text`). A can
  say, without M, what is wrong and which line to change, using
  [`CONTRIBUTING.md` → "Blanks in a sentence"](../../CONTRIBUTING.md#blanks-in-a-sentence).

## 4. A fixes it, previews it, and checks grading and audio

- [ ] A puts the `*` back and runs `bun run build && bun run preview`.
- [ ] In the preview: the right option, then **Check**, is marked correct; a wrong
      option is marked incorrect; **Show answers** shows the marked options.
- [ ] If the lesson has audio: a speaker plays its clip, and pressing it again pauses it.
      In a playlist (inline-gap with `useSequenceAudioController`): **Pause** holds,
      including while the next track loads, and playing another clip silences the
      playlist, gap included.
- **Expected:** all of the above, with no error in the browser console.

## 5. A pushes the branch and opens a pull request

- [ ] `git push -u origin <branch>`, then a pull request into `lc-french`'s `main`.
- **Expected:** the push check passes; the pull request shows the five checks running.

## 6. The checks and review complete

- [ ] All five checks pass. A content-only pull request (only `lo-config/`,
      `public/images/`, `public/audio/`) merges with no review; a change to anything
      else waits for M ([`docs/ORGANIZATION.md`](../ORGANIZATION.md) step 6).
- **Expected:** A merges their own content pull request once it is green.

## 7. P builds and publishes the approved revision

- [ ] P follows [`DEPLOY.md`](../../DEPLOY.md) from `main` at the merged commit: the
      Feijoa fonts, `BASE_URL` for the course's folder, the build, the checks before
      upload, the upload.
- **Expected:** the lesson is live at its address, with the fonts; P writes down the
  commit that went live (DEPLOY.md, "Write it down").

## 8. The published lesson, checked by a person

- [ ] **Keyboard only:** Tab reaches every control in order with a visible focus; a
      select can be opened, answered and checked without a mouse.
- [ ] **Screen reader** (VoiceOver on a Mac, or NVDA): the instructions and each
      sentence are read; after **Check**, each answer is announced as correct or
      incorrect.
- [ ] **Playback:** each clip plays from the live address, and pause holds.
- **Expected:** all three, on the live page, not the preview.

## Afterwards

Record the date, who took part, and what failed at each step in TODO.md, and turn each
failure into a fix or a line in the guide. The pilot passes when every step's expected
result was seen with no help beyond what the guides say.
