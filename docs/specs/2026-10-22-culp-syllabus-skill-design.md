# The `culp-syllabus` skill — E31 design

**Date:** 2026-10-22 · **Status:** approved by the maintainer, built and proved
2026-10-22 (§7)
**TODO:** §E31 · **The syllabi:** [`docs/culp-syllabi/README.md`](../culp-syllabi/README.md)

## 1. Why

Courses copied from this template (`lc-french`, `lc-italian`, `lc-german`, …) are built
by developers, not linguists. They turn a teacher's Word document into lessons, and need
to know what the matching CULP level covers and whether the material sits at that level:
"is this too basic, or too advanced, for French Basic 2?". The Language Centre's CULP
syllabi are now in the repo, as generated read-only notes (`docs/culp-syllabi/`). A skill
makes Claude use them the same way every time: find the right note, read the levels
around it, compare, and say what the answer rests on.

## 2. Scope

**In:** one skill, `.claude/skills/culp-syllabus/SKILL.md`; its entry in the shape test;
an optional line in `add-lo`; the docs that point at skills; one line in ROADMAP §1; a
proof by hand.

**Out:** any change to the notes in `docs/culp-syllabi/` (the maintainer's generator owns
them); changing a lesson (that is `add-lo`, when the user asks); a check in CI (no test
can judge a level); right-to-left support (ROADMAP §1).

## 3. Decisions

1. **Read-only, in the template and in course repos alike.** The skill reads the notes
   and the user's document and answers in the conversation. It never edits
   `docs/culp-syllabi/`, and never writes the teacher's document, or a converted copy of
   it, into the repo.
2. **Not a code skill.** It writes no code, so it has no Step 0 ("Where am I") and no
   Step 1 ("Test first"): it behaves the same in every repo. In the shape test it joins
   `SHIPPED_SKILLS`, not `CODE_SKILLS`.
3. **The folder's README is the one description of the notes.** The skill links it for
   the layout, the frontmatter and the caveats, and does not copy them.
4. **The level is asked, not guessed.** A course's title says "Level 1", not a CULP
   level, and the course config does not record one. The skill asks, and confirms the
   note it found before reading on.
5. **The teacher's material stays private.** It is unpublished. The skill quotes only
   what the report needs, and never puts it in an issue, a pull request or a commit.
   Template requests are public and take a made-up sample only
   ([`.claude/skills/README.md`](../../.claude/skills/README.md), "Filing a template
   request").
6. **Word documents are read with the tools on the machine.** Claude Code's file reader
   does not read `.docx`. Checked on 2026-10-22: macOS ships `textutil`, which converts
   one to plain text (`textutil -convert txt -stdout <file>`); `pandoc` does the same
   where it is installed; neither is on Windows by default. Failing both, the skill asks
   the user to paste the text, or to save the document as plain text from Word. A PDF
   is read directly. The converted text is printed, never saved in the repo.

## 4. The skill

**Frontmatter.** `name: culp-syllabus`. The `description` names the requests that should
trigger it: "check this Word document, or this lesson, against the syllabus", "is this
too basic / too advanced for <level>?", "what does <language> <level> cover?"; and says
it is read-only.

**Steps:**

1. **Language.** `languageCode` in `src/config/course.config.ts` is the notes'
   `language_code`, unless the user names another language. No notes for it: say so and
   stop.
2. **Level.** If the user has not named a CULP level, ask, offering the levels listed in
   that language's hub (`docs/culp-syllabi/languages/`). Confirm the note (its title,
   level, strand and dates) before going on.
3. **Read the syllabus side:** the note, its `previous_level` and `next_level`, and its
   `programme_spec`.
4. **Read the material.** Markdown, text, JSON and PDF directly. An existing lesson is
   its folder in `lo-config/`. A Word document by decision 6.
5. **Report, in plain language for someone who is not a linguist:**
   - **Fits:** the topics, functions and grammar the material shares with this level.
   - **Above the level:** grammar or vocabulary the syllabus reaches only later, naming
     the level and lesson where it first appears.
   - **Below the level:** what the previous level already covers. Fine as revision; say
     which.
   - **Gaps:** this level's topics and functions the material does not touch, when the
     user wants to know about coverage.
   - **CEFR:** only where the note states a CEFR level.
   - **Suggestions:** a few, concrete.
   - **Sources:** each note used, with its `document_date` and `source_date`; that a
     syllabus is guidance, not a rule; a warning when the note is old or contradicts
     itself (README, "Read them with care"). The syllabi list grammar and topics, not
     vocabulary, so a judgement on vocabulary is Claude's, and the report says so.
6. **Stop.** Changing the lesson is `add-lo`'s job, if the user asks.

## 5. Where else it is named

- **`add-lo`:** one optional sentence in its "Fill it in" step: when the lesson comes
  from a teacher's document, the `culp-syllabus` skill can check its level first. A link,
  not a copy of the steps.
- **`COURSE_GUIDE.md`, "Claude can help":** a row, "Is this Word document right for Basic
  2?" → `culp-syllabus` → compares it with the CULP syllabus and says what is above or
  below the level.
- **`AGENTS.md` and `CONTRIBUTING.md`:** both list the recurring jobs the skills cover;
  each gains "a level check against the CULP syllabi". `.claude/skills/README.md` lists
  no skills, so it does not change.
- **`docs/culp-syllabi/README.md`:** a link to the skill.
- **`STRUCTURE.md`:** the new skill folder, by `bun run docs:tree`.
- **ROADMAP §1, "Today":** the Arabic, Persian, Urdu and Hebrew syllabi are already in
  `docs/culp-syllabi/`.
- **TODO:** E31.

## 6. The test

`src/docs/claude-skills.test.ts`, written failing first: add `culp-syllabus` to
`SHIPPED_SKILLS`, so "culp-syllabus exists" fails until the skill is written. The
existing checks then cover it: frontmatter `name` equal to the folder, a `description`,
no `bun test`. One check is added for decision 3: the skill links
`docs/culp-syllabi/README.md`, as each code skill's Step 0 links the shared rule.
Broken links are `md-links`' job.

## 7. Proof

By hand, in a scratch run that reads only the skill: "What does French Basic 2 cover?",
and "Is this text too advanced for Spanish Basic 1?" with a short made-up sample, saved
once as a `.docx` (made with `textutil`) to prove step 4's Word path. The answers go to
the maintainer before the pull request.

**Done 2026-10-22**, by two fresh agents told to read the skill first. Both answers were
checked against the notes and held. The French one summarised Basic 2 lesson by lesson,
split it from Basic 1 and Intermediate 1, and flagged that the 2012 programme
specification gives A1 against the syllabus's A2. The Spanish one read the `.docx` with
`textutil` at the first try and caught all three planted structures: the preterite
(Basic 2, lesson 11), the conditional (Intermediate 2, lesson 7) and the imperfect
subjunctive (Upper Intermediate, class 6). Neither wrote a file.

**Changed after the proof**, in the skill's steps 4 and 5 (§4 above is as approved):

- A question with no material ("what does French Basic 2 cover?") skips step 4, and the
  report gives the level lesson by lesson, what is new since the previous level and
  what the next adds. The headings in §4 fit a comparison only.
- "Where it first appears" follows `next_level` past the next note: the Spanish
  subjunctive is three levels up.
- A programme specification has no `document_date`, so Sources gives its
  `spec_produced` and `spec_last_reviewed`.
- When the syllabus and its specification disagree on CEFR, the report gives the
  syllabus's level, names the conflict and says which is newer.

**Changed after review** (the `lc-reviewer` agent, the same day): steps 1–3 had
restated the README's "Finding the right note", against decision 3, so they became one
step that links it, and the skill has five steps. Two facts moved into the README,
where the skill links them: most notes (86 of 124) print no `document_date`, and the
notes name vocabulary by topic at most, never as word lists. A `languageCode` such as
`pt-BR` matches on the part before the `-`. The main README's docs table gained a row
for the folder, and `.gitattributes` marks the generated notes `linguist-generated`, so
GitHub collapses them in a pull request's diff.

## 8. Open question

Should a course record its CULP level, say `culpSyllabus: 'french-basic-2'` in
`course.config.ts`? The skill could then skip its question. It is a schema change in
`src/config/`, owned by the maintainer, so not in this pull request; worth deciding once
the first course uses the skill.
