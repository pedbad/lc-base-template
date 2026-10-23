# DEPLOY.md — building and publishing a course

**For whoever puts a course on a web server.** You build the site on your own machine
from the repo's `main` branch, with the licensed Feijoa fonts added, check it, then copy
the finished files into a folder on the server. The site is plain files: no database, no
server code, nothing to run on the server. One build works in any folder.

If you write lessons rather than publish them, see [`COURSE_GUIDE.md`](COURSE_GUIDE.md).

## The short version

```bash
git switch main && git pull --ff-only
bun install
# once per checkout: the three Feijoa files into public/fonts/feijoa/
bun run build
bun run preview   # check it, then Ctrl+C
# copy everything INSIDE dist/ into the course's folder on the server
```

Every step, and the checks before it goes live, are below.

## What you need, once

| Tool                 | Check                       | Why                                                                  |
| -------------------- | --------------------------- | -------------------------------------------------------------------- |
| **Git**              | `git --version`             | to fetch the course from GitHub                                      |
| **Bun** 1.3 or later | `bun --version`             | runs every command in this guide (`bun install`, `bun run build`, …) |
| **Node** 22          | `node --version` → `v22.…`  | the build tools run on Node; `.nvmrc` pins 22, and CI uses the same  |
| **Feijoa** fonts     | the three files below       | the Cambridge heading font; licensed, so never in the repo           |
| The **web address**  | ask whoever runs the server | which server folder to copy into (step 4)                            |

Install Bun from [bun.sh](https://bun.sh). For Node, [nvm](https://github.com/nvm-sh/nvm)
is easiest: in the repo folder, `nvm install` reads `.nvmrc` and installs 22. In each
new terminal, `nvm use` in the repo folder switches to it.

## 1. Get the code

The first time:

```bash
git clone https://github.com/<organisation>/<course-repo>.git
cd <course-repo>
```

Every time after that, from the repo folder:

```bash
git switch main
git pull --ff-only
```

Build only from `main`, and only when its CI is green: on GitHub open the repo's
**Actions** tab, and the latest run on `main` should have a green tick. A red cross means
something is broken; tell the maintainer and do not deploy.

Note which version you are building, for step 9:

```bash
git log --oneline -1
```

## 2. Install the dependencies

```bash
bun install
```

Run it after **every** pull, not just the first time: an update can change the
dependencies. It is quick when nothing changed.

## 3. Add the Feijoa fonts

Copy your licensed files into `public/fonts/feijoa/`, with exactly these names (the
names Cambridge distributes them under; do not rename):

- `Feijoa-Medium-Cambridge.otf`
- `Feijoa-MediumItalic-Cambridge.otf`
- `Feijoa-Bold-Cambridge.otf`

They stay there between builds, so this is once per checkout. Git ignores that folder,
so they cannot be committed by accident: `git status` should still say the working tree
is clean. **Never commit them or force-add them**; the repo is public and the licence
does not allow sharing them. More: [`public/fonts/feijoa/README.md`](public/fonts/feijoa/README.md).

Without the fonts the site still works, but every heading falls back to Open Sans.

## 4. Any folder, by default

Every page finds its styles, pictures, sounds and fonts **relative to itself** (`./…`),
so you do not tell the build where the course will live. The same `dist/` works copied
into `https://server.cam.ac.uk/`, `https://server.cam.ac.uk/courses/spanish-1/` or any
other folder, on any server, and moving it later needs no new build.

One thing the server must do, and nearly every server does by default: send a visit to
`…/spanish-1` (no final slash) on to `…/spanish-1/`. Without the slash, the browser looks
one folder too high. Step 8 checks it.

**A fixed address instead (optional).** If you want the build tied to one address, give
it as `BASE_URL`: the part of the address after the server name, starting and ending
with `/`, spelt exactly as the server spells it (`BASE_URL=/courses/spanish-1/`). That
build then works **only** at that address, as every build did before 2026-10. There is
rarely a reason to.

## 5. Build

```bash
bun run build
```

For a fixed address (step 4), `BASE_URL=/courses/spanish-1/ bun run build`; on Windows
PowerShell, `$env:BASE_URL = "/courses/spanish-1/"; bun run build`.

It takes under a minute and writes the finished site into `dist/`. A good build:

- ends without an error;
- prints **no** line starting `Feijoa:`. That line means one or two font files are
  missing or misnamed, and every heading will use Open Sans. Fix step 3 and build again.

If it stops with a message naming a file under `lo-config/`, a lesson has a mistake in
it. Do not deploy: send the message to the lesson's author or the maintainer.

**Never build with `DEBUG=1` for the course's address.** That adds four internal pages
(listed in step 6) and the palette preview to `dist/`; they belong only on a
[demo build for the team](#demo-build-for-the-team).

## 6. Check the build before uploading

### Quick checks in the terminal

1. **The fonts are in.** This prints a number above 0:

   ```bash
   grep -c Feijoa dist/index.html
   ```

   `0` means the fonts were not found at build time (step 3).

2. **The addresses are relative.** This prints a number above 0:

   ```bash
   grep -c '"./assets/' dist/index.html
   ```

   `0` means `BASE_URL` was set in this terminal (step 4). Open a new terminal and build
   again. (For a deliberate fixed-address build, look for your path instead:
   `grep -c '/courses/spanish-1/assets/' dist/index.html`.)

3. **No internal pages.** This lists `index.html`, one page per lesson, and
   `example.html` (the example lesson: built, but not linked from anywhere, which is
   normal):

   ```bash
   ls dist/*.html
   ```

   If you see `exercise-showcase.html`, `ui-showcase.html`, `debug-sandbox.html`,
   `code-style.html` or `culp-syllabi.html`, the build ran with `DEBUG` set. Open a new terminal and build again.

### Look at it in a browser

Serve the build on your own machine, from the folder it will live in on the server (or
any folder: that is the point):

```bash
bun run preview --base /courses/spanish-1/
```

It prints an address such as `http://localhost:4173/courses/spanish-1/`. Open it and
go through this list:

- [ ] The home page shows the course title, the banner and a card for every lesson,
      and no card for the example lesson.
- [ ] Headings are in Feijoa. To be sure: right-click a heading, **Inspect**, and under
      **Computed** the rendered font says Feijoa, not Open Sans.
- [ ] Every lesson card opens its lesson, and the way back to the home page works.
- [ ] In one lesson: open an exercise, answer it, press **Check**, then **Reset**.
- [ ] An audio clip plays.
- [ ] Pictures show.
- [ ] The light/dark switch works.
- [ ] With the developer tools open (F12, or Cmd+Option+I on a Mac) and the page
      reloaded: no red errors in **Console**, and no red rows in **Network**.
- [ ] At phone width (narrow the window, or the developer tools' device toolbar) the
      page does not scroll sideways.

Stop the preview with **Ctrl+C**.

### The full automatic check (optional, recommended for a first deploy)

The same tests CI runs, against your build. Two to three minutes in all:

```bash
bun run test
bunx playwright install chromium firefox webkit   # once per machine
SERVE_PATH=/courses/spanish-1/ bun run test:e2e
```

`test:e2e` drives Chromium, Firefox and WebKit through the built pages, served from the
folder you name, and checks loading, keyboard use and accessibility. Run it straight
after the build (for a fixed-address build, with the same `BASE_URL` instead of
`SERVE_PATH`). Every test should pass.

## 7. Upload

Copy **everything inside `dist/`** (not the `dist` folder itself) into the server folder
for your address. Afterwards the server folder holds `index.html`, `assets/`, `audio/`,
`fonts/`, `images/` and the rest directly, and the address has no `dist` in it.

Replacing an earlier version:

1. **Keep a copy** of what is on the server now (copy or rename the folder). It is your
   way back if something is wrong.
2. **Empty the folder, then copy the new files in.** Script and style files have a code
   in their names that changes every build, so copying on top leaves old files behind.
   They do no harm, but they pile up.

What the server needs: to serve plain files, nothing more. No rewrite rules, no server
code. It must send fonts (`.otf`), pictures (`.svg`, `.png`, `.jpg`, `.webp`), audio
(`.m4a`, `.wav`, `.mp3`) and video (`.mp4`) with their proper types, and allow partial
(range) requests for audio and video, which standard web servers do by default.

Optional, for speed: files in `assets/` never change under the same name, so the server
may let browsers keep them for a long time. Do **not** do that for the `.html` files, or
learners keep seeing the old version.

## 8. Check the live site

Open the real address and go through the browser checklist in step 6 again. Reload with
**Cmd+Shift+R** (Mac) or **Ctrl+F5** (Windows) so you see the new files, not your
browser's saved copy. Also:

- [ ] In **Network**, filter for `Feijoa`: the font files load with status `200`.
- [ ] Type the address **without** its final slash (`…/spanish-1`): the browser ends up
      at `…/spanish-1/` and the page has its styling. If not, ask whoever runs the
      server to redirect folders to their slash (step 4).
- [ ] Open the site on a phone.

## 9. Write it down

Tell the maintainer the date, the address and the version from step 1
(`git log --oneline -1`), so everyone knows what is live.

## When something is wrong

| What you see                                      | Most likely cause                                                     | Fix                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| No styling, broken pictures, no sound             | address missing its final `/`, or a `BASE_URL` build copied elsewhere | step 8's slash check; or build without `BASE_URL` (step 4) |
| Headings in a plain font                          | fonts missing or misnamed when you built                              | step 3, build again; check 1 of step 6 must print above 0  |
| Fonts fine in preview, `404` or blocked when live | the server does not serve `.otf` files                                | ask whoever runs the server to allow `font/otf`            |
| Audio or video plays in preview, not live         | the server's media types or range requests                            | ask whoever runs the server (step 7)                       |
| A lesson page is "not found"                      | not every file was copied                                             | copy the whole of `dist/` again                            |
| The old version still shows                       | your browser's saved copy                                             | Cmd+Shift+R / Ctrl+F5, or a private window                 |

**Going back:** put the copy you kept in step 7 back in place. Or rebuild an earlier
version: `git switch --detach <version>`, then steps 2, 5, 6 and 7, then
`git switch main` to return.

**Moving a course to a new folder** needs no new build: copy the same files (step 7).
Learners' saved flashcard progress stays behind at the old folder: their browser keeps
it per folder, so two courses on one server never mix. A fixed-address build (step 4)
does need building again.

## Demo build for the team

To let the team try a palette a designer sent (`DESIGNER.md` → "Preview a palette"),
build a **separate demo site** with the debug pages in it:

```bash
DEBUG=1 bun run build
```

Upload `dist/` to a team-only folder such as `/demo/`, **never** to the course's live
folder: the demo carries internal test pages. On the demo site, open
`debug-sandbox.html`, pick the palette, then browse the course home, the example lesson,
`exercise-showcase.html` and `ui-showcase.html` in those colours. The choice is kept in
each viewer's own browser; "Reset" in the corner label undoes it. A new palette file
needs a new demo build.

## Never

- commit the Feijoa files, or put them anywhere public other than the built site;
- build with `DEBUG=1` for the course's address (only for the
  [team demo](#demo-build-for-the-team));
- copy a fixed-address (`BASE_URL`) build anywhere but its own address;
- deploy from a branch other than `main`, or when `main`'s CI is red.
