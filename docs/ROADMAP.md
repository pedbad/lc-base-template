# Roadmap — what the template could become

**Larger work beyond the current queue, each with the trigger that should start it.**
Nothing here is scheduled. [`docs/process/TODO.md`](process/TODO.md) is the queue: what
is next, in order. This file is what comes after it. When an item is picked up it moves
into TODO.md with an E-number, and its entry here shrinks to a pointer.

New exercise types are parked separately, tiered by what each needs, in
[`docs/process/FUTURE_EXERCISE_IDEAS.md`](process/FUTURE_EXERCISE_IDEAS.md).
`docs/process/FUTURE_PROJECTS.md` is the historical blueprint this template was built
from, not a plan.

Each entry says why it matters, where it stands today, what it touches, and when to
start.

---

## 1. Right-to-left languages (Persian, Arabic)

**Why.** The template teaches left-to-right languages only. A Persian or Arabic course
built today would show its text without a direction: punctuation, digits and English
words inside a sentence land on the wrong side, and the default fonts have no Arabic
script.

**Today.** No `dir` attribute anywhere in `src/`, the HTML pages or the prerender.
Engines already mark the course language: they wrap learner content in
`lang={TARGET_LANG}` ([`src/lib/lang.ts`](../src/lib/lang.ts)). That is the hook the
direction hangs on. The CULP syllabi for Arabic, Persian, Urdu and Hebrew are already
in [`docs/culp-syllabi/`](culp-syllabi/README.md) (E31).

**What it touches.**

- **Direction on the course-language parts, not the page.** The instructions stay in
  English, left to right; the content is right to left. So a page is mixed-direction,
  not mirrored. Wherever `lang={TARGET_LANG}` goes, `dir` goes too, set from the course
  config. A course-language word inside an English sentence is isolated (`<bdi>`, or
  `dir` on its span) so the characters around it stay put.
- **Typed answers.** An input for a course-language answer takes the same `dir`.
- **Fonts.** Open Sans covers Latin, Cyrillic, Greek, Hebrew and Vietnamese, not Arabic
  script; Feijoa is Latin only ([`src/styles/palette.css`](../src/styles/palette.css)).
  Add an openly licensed font that covers Persian and Arabic (Vazirmatn, under the SIL
  Open Font Licence, is one) for course-language text only, with its own size and
  line-height tokens if the script needs them. Hebrew needs the direction work but
  not a font.
- **Grading.** `normalizeAnswer` and `normalizeForDictation`
  ([`src/exercises/lib/answers.ts`](../src/exercises/lib/answers.ts)) NFC-normalise,
  fold apostrophe variants into one and collapse spaces; dictation also ignores Latin
  sentence punctuation and quote marks, but not the Arabic comma, semicolon or question
  mark (، ؛ ؟). Nothing in them knows a script. Per language, decide what counts as the
  same answer: Arabic and
  Persian forms of yeh and kaf (ي/ی, ك/ک), the zero-width non-joiner (U+200C),
  Persian and Arabic-Indic digits, and whether short-vowel marks count. Grading keeps
  accents on purpose today, so the vowel marks are a deliberate choice, not a default.
- **Engines with an order or a side.** Word order, phrase reorder, line match, the
  flashcards' arrows and the audio scrubbers (which arrow key moves forward?) each
  need a check in right-to-left, and an RTL fixture.
- **Layout.** Small. Counted 2026-10-23, our own CSS names a physical side in eleven
  rules: seven on course pages (a `padding-left`, a `border-left` and three
  `translateX` in `src/components/home/home.css`, a corner radius in
  `src/exercises/lib/flip-cue.css`, a `text-align: left` in `phrase-reorder.css`) and
  four in the debug sandbox's `sandbox.css`. The components add seven physical Tailwind
  classes (`mr-`, `ml-auto`, `pl-`, `border-l-`, `text-left`) in the typed gap, the
  instructions, line match and the text block. Those inside course-language content
  become start and end (`ms-`, `ps-`, `border-s-`, `text-start`); the English chrome
  around them can stay as it is.
- **Tests.** An RTL lesson or fixtures in the browser suite, with axe, so the
  direction cannot quietly regress.

**Open question.** Is the instruction language always English? If a course ever runs
its interface in Persian too (the labels are overridable,
[`src/config/ui-strings.ts`](../src/config/ui-strings.ts)), the whole page mirrors.
That is a bigger job than the mixed-direction one above.

**Start when** the first Persian or Arabic course is planned. Before its content, not
after.

## 2. Other writing systems

**Why.** The same family of work as right to left. The defaults assume a script Open
Sans covers and words separated by spaces.

**Today.** Open Sans has no Chinese, Japanese, Korean or Devanagari. No engine splits
text on spaces (words and phrases are authored as lists), so word order already works
for languages without them.

**What it touches.** A course-language font chosen per course, beside the one item 1
adds; line breaking for scripts without spaces; ruby annotations (pinyin, furigana) in
rich text.

**Start when** a course is planned in a script Open Sans does not cover.

## 3. Template releases for course repos

**Why.** Course repos take template changes with the
[`sync-from-template`](../.claude/skills/sync-from-template/SKILL.md) skill, but the
template has no versions (no git tags) and no changelog. A course cannot tell what a
sync brings, or whether it will reject its existing content.

**What it touches.** Tags on `main` with semantic versions (a schema change that
rejects existing content is a major version); a `CHANGELOG.md`; the sync skill reads
it and says what changed.

**Start when** the organisation move is done (TODO §E2) and a second course repo syncs
from the template.

## 4. Packaging for Moodle or another learning platform

**Why.** A course is a folder of static pages ([`DEPLOY.md`](../DEPLOY.md)), linked
from wherever. Inside a learning platform it could report completion and scores.

**Today.** One build already works from any folder (E24), which a package served from
the platform's own path needs. Exercises score locally
([`src/exercises/lib/scoring.ts`](../src/exercises/lib/scoring.ts)); progress stays in
the browser, keyed per course by `storageScope()`.

**What it touches.** A SCORM package (a zip with a manifest) needs no server; LTI needs
one. Either way, scores leave the browser for the first time.

**Start when** the language centre decides courses should sit inside Moodle with
tracked results. That is a decision first; no code until it is made.

## 5. Splitting the code per lesson

Already parked, with its trigger (about a dozen lessons), in TODO.md → "Deferred on
purpose", "Per-LO chunking". Listed here so the roadmap is complete; the detail stays
there.

## 6. Speech and AI exercises

Tiers B and C of [`FUTURE_EXERCISE_IDEAS.md`](process/FUTURE_EXERCISE_IDEAS.md). Tier B
runs in the browser: speech recognition, recording yourself to compare with the native
clip, and text-to-speech as a fallback only. Tier C needs a model: feedback on free
writing, a conversation partner, adaptive items. The template is static by design, so
Tier C starts with a decision too: what runs where, and who pays for it.
