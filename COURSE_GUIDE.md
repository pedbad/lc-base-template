# COURSE_GUIDE.md — writing a course

**For a colleague writing a course in its own repo** (one repo per course, such as
`lc-french`). You write lessons; the maintainer looks after the machinery, and the
course is published by following [`DEPLOY.md`](DEPLOY.md).
If you are changing the template itself, this is the wrong page: see
[`CONTRIBUTING.md`](CONTRIBUTING.md).

> **Only add pictures and audio that we made or are clearly allowed to share: no
> textbook-CD audio, no images from the web without an open licence.** Everything you
> add is published under CC BY-NC 4.0, and content pull requests skip review, so nobody
> else checks this for you. What is allowed and what is not:
> [`CONTRIBUTING.md` → "Authoring a Learning Object"](CONTRIBUTING.md#authoring-a-learning-object).
> If you are not sure, ask the maintainer before adding it.

---

## Once: set up your machine

You need Bun and Git; Node is optional for you. The versions are in the
[README](README.md#prerequisites). The maintainer gives you your course repo's address
and invites you to it. Then:

```bash
git clone https://github.com/<organisation>/<course-repo>.git
cd <course-repo>
bun install
```

`bun install` also switches on the checks that run when you commit and push; there is
nothing else to configure. Clone the **course repo**, never the template. If you hold a
Feijoa font licence, the [README](README.md#fonts-cambridge-developers) says where the
font files go; without them, headings use Open Sans.

## What you may edit

What counts is the path **and** what it is for, never a whole folder: your course's own
lessons, one folder each, each lesson's own media folder, and your course's settings in
`course.json`.

| Path                                                                                                                                                   | What it is                                                                                                | Your pull request                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `lo-config/lo-NN-slug/`                                                                                                                                | one of your lessons: `lo.json`, its blocks, exercises, popups and hover cards                             | merges once CI is green, no review   |
| `public/images/lo-NN-slug/`                                                                                                                            | that lesson's images, its card and banner art included                                                    | merges once CI is green, no review   |
| `public/audio/lo-NN-slug/`                                                                                                                             | that lesson's audio                                                                                       | merges once CI is green, no review   |
| `course.json`                                                                                                                                          | your course's title, language code, home-page heading and subheading, logo and icon names                 | merges once CI is green, no review   |
| `lo-config/lo-00-example/`, `public/images/lo-00-example/`, `public/audio/lo-00-example/`                                                              | the template's example lesson: copy it, never change it                                                   | waits for the maintainer             |
| `public/images/footer/`, `public/images/line-match/`, `public/images/placeholders/`, `public/images/lo-placeholder.svg`, `public/audio/showcase-demo/` | the template's shared media: the institutional logos, and what the exercises and showcase use             | waits for the maintainer             |
| anything else in `lo-config/`, `public/images/` or `public/audio/`                                                                                     | not a lesson's own folder (a loose file, another subfolder)                                               | waits for the maintainer — ask first |
| anything else                                                                                                                                          | the template's machinery, and your course's logo and icon files (`public/logo.svg`, `public/favicon.svg`) | waits for the maintainer — ask first |

`course.json` is checked when the site builds: a blank title or a misspelt key stops the
build with a message naming `course.json` and the field. Its rules are the template's
(`src/config/course.config.ts`), so ask the maintainer for a new setting.

`.github/CODEOWNERS` encodes this table, and a test (`src/docs/codeowners.test.ts`) holds
the file to it. A pull request that mixes a lesson with anything from the last four rows
waits for the maintainer as a whole, so keep lessons in pull requests of their own.

If a lesson seems to need a change outside its own two or three folders, **stop and ask
the maintainer**: it usually means the content model needs extending, which is done once
in the template for every course. The full rule:
[`CONTRIBUTING.md` → "Adding content vs. changing the system"](CONTRIBUTING.md#adding-content-vs-changing-the-system-read-before-a-pr).

## Every day: the loop

1. **Start from an up-to-date `main`, on a branch per lesson.**

   ```bash
   git switch main && git pull
   git switch -c lo-03-food
   ```

2. **Write.** A new lesson starts as a copy of `lo-config/lo-00-example/`; copy it, never
   edit or delete the example itself (it belongs to the template, and the checks run on
   it). Students never see it: once your course has a lesson of its own, the home page
   leaves the example out by itself. Copy it again for every new lesson. How a lesson
   folder works, and what each block and exercise accepts, is in
   [`CONTRIBUTING.md` → "Authoring a Learning Object"](CONTRIBUTING.md#authoring-a-learning-object).
   `bun run dev` shows the course with hot reload while you write.
3. **Check the real pages** before you open a pull request. If a lesson file is wrong,
   the build stops and names the file; for a block's `content`, it names the block type
   and the field instead.

   ```bash
   bun run build && bun run preview
   ```

4. **Commit and push.** The commit check tidies formatting for you; the push check runs
   the tests and stops the push if one fails.

   ```bash
   git add lo-config/lo-03-food public/images/lo-03-food public/audio/lo-03-food
   git commit -m "feat: add lesson 3, food"
   git push -u origin lo-03-food
   ```

5. **Open a pull request into your course repo's `main`.** CI runs every check, browser
   tests included; the checklist in the pull request form is for changes to the
   machinery, so for a content-only pull request a green CI is enough, and it can be
   merged. Merging does not publish it: the course goes live when it is next built and
   uploaded ([`DEPLOY.md`](DEPLOY.md)).

## When the template changes

The maintainer improves the template (a new exercise type, a fix). The change reaches
your course through an update pull request into its `main`, prepared by the maintainer or
by a colleague the maintainer asks, and merged once CI is green and the code owner has
approved it ([`docs/ORGANIZATION.md` step 9](docs/ORGANIZATION.md#step-9--bringing-template-updates-into-a-course)).
Then you are told. Your part, on your machine, has two halves.

Update `main`:

```bash
git switch main && git pull && bun install
```

Then, separately, each lesson branch you still have open, so its pull request is tested
against the updated course:

```bash
git status                  # commit your work first
git switch lo-03-food && git merge main
git push
```

`bun install` is not optional: an update can add a package, and the checks fail without
it. Pushing keeps what you have **committed**; edits you never committed are not saved
by it, so commit before you switch branches. An update clashes with your work only where
it changes a file you also changed, so add your own lesson folders and media and leave
the template's own files alone. If `git merge main` reports a conflict, stop and ask the
maintainer.

## Claude can help

The repo comes with recipes that Claude Code follows, in
[`.claude/skills/`](.claude/skills/). Ask in your own words; Claude picks the matching
recipe and keeps to this guide's rules.

| Say something like                         | Claude follows       | It                                                                           |
| ------------------------------------------ | -------------------- | ---------------------------------------------------------------------------- |
| "Add a lesson about food"                  | `add-lo`             | copies the example lesson, fills it in, checks it                            |
| "Is this ready for a pull request?"        | `before-pr`          | runs every check and walks the pull request form                             |
| "Build the course for the server"          | `build-for-upload`   | goes through [`DEPLOY.md`](DEPLOY.md) step by step                           |
| "Is this Word document right for Basic 2?" | `culp-syllabus`      | compares it with the CULP syllabus and says what is above or below the level |
| "I need a new kind of exercise"            | see the next section | asks the maintainer for it, rather than building it                          |

## Need a new exercise, block or look?

Exercise types, block types and the look are shared by every course, so they are built
once, in the template, never in your course repo. Ask Claude anyway (say, "I need an
exercise where learners drag words onto a picture"):

1. Claude checks whether a type that already exists does the job. Often one does, and
   you can use it today.
2. If not, it asks what learners see and do, how answers are marked (with examples from
   your lesson) and for a short sample.
3. It shows you a request and, when you say yes, files it as an issue on the template's
   GitHub page. Without Claude: the template repo → **Issues** → **New issue** →
   **Template request**, and fill in the form yourself. **Issues there are public**, so
   the sample is made up for the request: never your unpublished lesson text, nothing
   copied from a textbook, no images or audio.
4. The maintainer is emailed, may ask questions on the issue (you are emailed when they
   do), and builds it. When it is done the issue closes, and the new type reaches your
   course with the next template update (above).

Meanwhile, keep writing the lesson with the types that exist.

## When you are stuck

- **The build or CI fails** and names a file in `lo-config/`: the message says what is
  wrong with it. Compare with the same kind of file in `lo-config/lo-00-example/`. If it
  says a block type "has invalid content" instead, it names no file: look in the
  `block.json` files of that type in your lesson's `blocks/` folder.
- **It names a blank** in a sentence, such as `the blank [soy|eres|es] has no correct
option`: each message and its fix are in
  [`CONTRIBUTING.md` → "Blanks in a sentence"](CONTRIBUTING.md#blanks-in-a-sentence).
- **It names a question, row or item**, such as `question 2 offers "sí" twice`: each
  message and its fix are in
  [`CONTRIBUTING.md` → "Answers in their own fields"](CONTRIBUTING.md#answers-in-their-own-fields).
- **It fails anywhere else**, or the message does not make sense: ask the maintainer
  rather than changing files outside your folders.
- **What a folder is for:** [`STRUCTURE.md`](STRUCTURE.md).
