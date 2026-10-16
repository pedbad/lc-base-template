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

| Path             | What it is                    | Your pull request                    |
| ---------------- | ----------------------------- | ------------------------------------ |
| `lo-config/`     | your lessons, one folder each | merges once CI is green, no review   |
| `public/images/` | the lessons' images           | merges once CI is green, no review   |
| `public/audio/`  | the lessons' audio            | merges once CI is green, no review   |
| anything else    | the template's machinery      | waits for the maintainer — ask first |

If a lesson seems to need a change outside those three folders, **stop and ask the
maintainer**: it usually means the content model needs extending, which is done once in
the template for every course. The full rule:
[`CONTRIBUTING.md` → "Adding content vs. changing the system"](CONTRIBUTING.md#adding-content-vs-changing-the-system-read-before-a-pr).

## Every day: the loop

1. **Start from an up-to-date `main`, on a branch per lesson.**

   ```bash
   git switch main && git pull
   git switch -c lo-03-food
   ```

2. **Write.** A new lesson starts as a copy of `lo-config/lo-00-example/`; copy it, never
   edit the example itself (it belongs to the template). How a lesson
   folder works, and what each block and exercise accepts, is in
   [`CONTRIBUTING.md` → "Authoring a Learning Object"](CONTRIBUTING.md#authoring-a-learning-object).
   `bun run dev` shows the course with hot reload while you write.
3. **Check the real pages** before you open a pull request. If a lesson file is wrong,
   the build stops and names the file.

   ```bash
   bun run build && bun run preview
   ```

4. **Commit and push.** The commit check tidies formatting for you; the push check runs
   the tests and stops the push if one fails.

   ```bash
   git add lo-config public/images public/audio
   git commit -m "feat: add lesson 3, food"
   git push -u origin lo-03-food
   ```

5. **Open a pull request into your course repo's `main`.** CI runs every check, browser
   tests included; the checklist in the pull request form is for changes to the
   machinery, so for a content-only pull request a green CI is enough, and it can be
   merged. Merging does not publish it: the course goes live when it is next built and
   uploaded ([`DEPLOY.md`](DEPLOY.md)).

## When the template changes

The maintainer improves the template (a new exercise type, a fix) and brings the change
into each course repo, then tells you. Your part, on your machine:

```bash
git switch main && git pull && bun install
```

`bun install` is not optional: an update can add a package, and the checks fail without
it. An update clashes with your work only where it changes a file you also changed, so
add your own lesson folders and media and leave the template's own files alone.

## When you are stuck

- **The build or CI fails** and names a file in `lo-config/`: the message says what is
  wrong with it. Compare with the same kind of file in `lo-config/lo-00-example/`.
- **It fails anywhere else**, or the message does not make sense: ask the maintainer
  rather than changing files outside your folders.
- **What a folder is for:** [`STRUCTURE.md`](STRUCTURE.md).
