---
name: culp-syllabus
description: Use when someone asks whether lesson material fits a CULP level, or what a level covers — "check this Word document (or this lesson) against the syllabus", "is this too basic / too advanced for French Basic 2?", "what does Spanish Basic 1 cover?". Read-only — reads docs/culp-syllabi and the user's document, reports in plain language, edits neither.
---

# Check material against a CULP syllabus

The Language Centre's CULP syllabi are generated, read-only notes in `docs/culp-syllabi/`.
Read [their README](../../../docs/culp-syllabi/README.md) first: it describes the notes'
layout and fields, and what to be careful of. Design:
[`docs/specs/2026-10-22-culp-syllabus-skill-design.md`](../../../docs/specs/2026-10-22-culp-syllabus-skill-design.md).

**This skill only reads.** It never edits anything in `docs/culp-syllabi/` (if a note
looks wrong, tell the user to tell the maintainer), and never saves the user's document,
or a converted copy of it, in the repo. It writes no code, so it has no test-first step,
and it works the same in the template and in a course repo.

**The teacher's material is unpublished.** Quote only what the report needs. Never put
it in an issue, a pull request or a commit message; a template request takes a made-up
sample only ([`.claude/skills/README.md` → "Filing a template request"](../README.md#filing-a-template-request)).

## Steps

1. **Find the note** by the README's
   ["Finding the right note"](../../../docs/culp-syllabi/README.md#finding-the-right-note),
   in the language the user names if they name one. If no note is in that language, say
   so and stop. If the user has not named a CULP level, ask, offering the levels in that
   language's hub. Before going on, confirm the note you found: its title, level, strand
   and dates.
2. **Read the syllabus side:** the note, and the notes its `previous_level`,
   `next_level` and `programme_spec` name. Some notes are written in the course language
   (`document_language`); report in the user's language all the same.
3. **Read the material.** If the user only asks what a level covers, there is none: go
   to step 4.
   - Markdown, plain text, JSON or PDF: read it directly.
   - A lesson already in the course: its folder in `lo-config/` (`lo.json`, `blocks/`,
     `exercises/`).
   - A Word document (`.docx`): the file reader cannot open it. On a Mac, run
     `textutil -convert txt -stdout <file>`; where `pandoc` is installed,
     `pandoc -t plain <file>`. Read the printed text; never save it in the repo. If
     neither works, ask the user to paste the text, or to save the document as plain
     text from Word (File → Save As → Plain Text).
4. **Report in plain language**: the user is a developer, not a linguist, so explain a
   grammar term the first time you use it. With no material, report the level's topics,
   functions and grammar lesson by lesson, what is new since `previous_level` and what
   `next_level` adds, then **CEFR** and **Sources** as below. With material, use these
   headings, and leave out any with nothing under it:
   - **Fits** — the topics, functions and grammar the material shares with this level.
   - **Above the level** — grammar or topics the syllabus reaches only later. Name the
     note and lesson where it first appears ("the imperfect tense: French Basic 2,
     lesson 9"), following `next_level` past the next note until you find it.
   - **Below the level** — what the previous level already covers. Fine as revision;
     say which.
   - **Gaps** — this level's topics and functions the material does not touch. Only
     when the user asks about coverage.
   - **CEFR** — only when a note states a level (`cefr`); never infer one. If the
     syllabus and its programme specification disagree, give the syllabus's level, name
     the conflict, and say which document is newer.
   - **Suggestions** — a few, concrete: move it to a later lesson, gloss a word, cut a
     structure.
   - **Sources** — every note used, with the dates the README's
     ["Read them with care"](../../../docs/culp-syllabi/README.md#read-them-with-care)
     asks for. Say that a syllabus is guidance, not a rule; warn when a note is old or
     contradicts itself; and say that a judgement on vocabulary is yours (same section).
5. **Stop.** Changing the lesson is the [`add-lo`](../add-lo/SKILL.md) skill's job, and
   only if the user asks.
