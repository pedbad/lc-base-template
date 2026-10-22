# CULP syllabi

The Cambridge Language Centre's current CULP (Cambridge University Language Programme)
syllabi, converted from PDF to Markdown on 2026-10-21: 124 documents in 20 languages.
Staff names and email addresses have been removed. They are here so that anyone turning
a teacher's material into a lesson, people or agents, can check it against the matching
CULP level: what that level covers, and whether the material is too basic or too
advanced for it. In Claude Code, the
[`culp-syllabus`](../../.claude/skills/culp-syllabus/SKILL.md) skill does this check.

> **Do not edit anything in this folder by hand.** It is a generated, read-only copy;
> the master and its generator live outside this repo, and the maintainer regenerates
> it. If a note is wrong, tell the maintainer. Prettier skips the folder
> ([`.prettierignore`](../../.prettierignore)) so that every file stays byte-identical
> to the generator's output. This README is the one exception: it is written in the repo,
> and the generator leaves it alone.

The syllabi belong to the Language Centre, University of Cambridge. They are shared here
for reference only and are not covered by this repo's CC BY-NC 4.0 licence
([`LICENSE`](../../LICENSE)).

## Layout

| Path                                   | Holds                                                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [`syllabi/`](syllabi/)                 | 124 notes, one per document: 102 syllabi, 21 programme specifications (`*-programme-spec.md`) and one assessment framework |
| [`languages/`](languages/)             | 20 hubs, one per language, listing its documents in level order                                                            |
| [`strands/`](strands/)                 | 6 hubs: Medics, BioMed, Academic Reading, Academic Purposes, Business, MBA                                                 |
| [`CULP Syllabi.md`](<CULP Syllabi.md>) | the index: every hub, with its counts                                                                                      |

A note's file name is its language, then its strand if it has one, then its level, then a
theme or `programme-spec`: [`french-basic-2.md`](syllabi/french-basic-2.md),
`spanish-medics-intermediate-1.md`, `greek-modern-basic-1.md`. Notes link to each other
with Obsidian wikilinks: `[[french-basic-2]]` is `syllabi/french-basic-2.md`, and
`[[French]]` is `languages/French.md`. The folder opens as an Obsidian vault, but it is
plain Markdown with YAML frontmatter, readable by any tool.

## Frontmatter

Every note in `syllabi/` starts with these fields. A field that does not apply is left
out.

| Field                                          | Holds                                                                                                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title`, `aliases`                             | the document's own title, and a common name (`French Basic 2`)                                                                                                           |
| `doc_type`                                     | `syllabus`, `programme-spec` or `assessment-framework` (the hubs are `language-hub`, `strand-hub` and `index`)                                                           |
| `language`, `language_code`                    | a link to the language's hub, and its ISO code: `fr`, `es`, `de`, `it`, `pt`, `ru`, `zh`, `ja`, `ko`, `ar`, `fa`, `ur`, `he`, `hi`, `el`, `grc`, `la`, `sw`, `tr`, `bfi` |
| `document_language`                            | the language the document is written in, when it is not English (French Advanced is in French)                                                                           |
| `level`, `level_order`                         | the CULP level, and a number to sort by (below). Five theme courses have no level                                                                                        |
| `strand`                                       | `General`, or a link to a strand hub (`"[[Medics]]"`)                                                                                                                    |
| `previous_level`, `next_level`                 | the levels before and after, in the same language and strand                                                                                                             |
| `programme_spec` / `syllabi`                   | a syllabus's programme specification, and a specification's syllabi                                                                                                      |
| `related`                                      | parallel versions at the same level, and the assessment framework ↔ Portuguese Advanced                                                                                  |
| `cefr`                                         | the CEFR level, only where the document states one                                                                                                                       |
| `lessons` or `weeks`                           | how many                                                                                                                                                                 |
| `document_date`, `source_date`                 | the date printed in the document, where it prints one (86 of 124 do not), and the date the original PDF was last modified (every note)                                   |
| `award`, `spec_produced`, `spec_last_reviewed` | programme specifications only                                                                                                                                            |
| `main_text`                                    | the course book (Latin)                                                                                                                                                  |

`level_order` puts the levels in course order:

| `level_order` | `level`                                          |
| ------------- | ------------------------------------------------ |
| 10            | Basic 1, Basic, Absolute Beginners, Introduction |
| 20            | Basic 2, Advanced Beginners                      |
| 30            | Elementary 1, Elementary                         |
| 40            | Elementary 2                                     |
| 45            | Pre-Intermediate                                 |
| 50            | Intermediate 1, Intermediate                     |
| 55            | Intermediate 1 to 2 (bridging)                   |
| 60            | Intermediate 2                                   |
| 70            | Upper Intermediate                               |
| 80            | Advanced                                         |
| 90            | Advanced Plus                                    |

The body is one `#` title, then the document's own sections. A lesson grid is one
heading per lesson or week, with bold labels (**Language Functions**, **Grammar and
structures**, …) over lists; most syllabi open with a "Lessons at a glance" table; an
assessment is a `> [!important]` callout. There is no HTML.

## Finding the right note

1. **Language.** A course's `languageCode` in
   [`src/config/course.config.ts`](../../src/config/course.config.ts), up to any `-`
   (`pt-BR` is `pt`), is the notes' `language_code`. The language's hub in `languages/`
   lists every document for it, in order.
2. **Level.** A course's own title says "Level 1", not a CULP level, so ask which CULP
   course the material is for, then pick the note whose `level` matches, in the right
   `strand` (`General` unless the course is for medics, say).
3. **Around it.** `previous_level` says what learners already know; `next_level` says
   what comes later; `programme_spec` gives the aims and outcomes for the whole level.

## Read them with care

- **They are guidance, not rules**, and many are old: the programme specifications date
  from 2011–2012 and several syllabi from 2013–2015. Whatever an answer rests on, name
  the note, its `source_date`, and its `document_date` where it has one (a programme
  specification has none: give its `spec_produced` and `spec_last_reviewed`).
- **Vocabulary is named by topic at most** ("common vocabulary in legends and fairy
  tales"), never as word lists. Whether a word suits a level is a judgement, not
  something a note says.
- **The teaching content is the reliable part.** About 38 notes contradict themselves,
  mostly on when assessments happen and what they are worth, and those are still with
  the teachers. About 40 syllabi give no assessment weights at all.
- **The template is left-to-right only for now.** The Arabic, Persian, Urdu and Hebrew
  syllabi are here for when right-to-left support lands
  ([`ROADMAP.md` §1](../ROADMAP.md#1-right-to-left-languages-persian-arabic)).
