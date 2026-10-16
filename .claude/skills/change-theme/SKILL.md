---
name: change-theme
description: Use when someone asks to change the look of the courses — colours, the palette, the button preset or the fonts. In the template it makes the change test-first; in a course repo it files a request to the template instead, because every course shares one look.
---

# Change the theme

Every course shares one look (decided 2026-10-16), set in the template. How the theme is
built, and the three jobs a designer does, is in [`DESIGNER.md`](../../../DESIGNER.md).

## Step 0 — Where am I

Run `git remote get-url origin`. The repository name is the last part of the address,
without `.git`.

- **`lc-base-template`**: this is the template. Go on to Step 1.
- **Any other name**: this is a course repo. The look is changed once, in the template,
  for every course ([`COURSE_GUIDE.md` → "What you may edit"](../../../COURSE_GUIDE.md#what-you-may-edit)).
  Change no file. Go to **Request mode** at the end of this file.
- **No `origin`, or you cannot tell**: ask the user which it is.

## Step 1 — Test first

1. Write the expectation first:
   - a colour change: the contrast it must keep, in
     [`src/styles/token-contrast.test.ts`](../../../src/styles/token-contrast.test.ts)
     (text 4.5:1, a control's edge 3:1);
   - a new or changed preset: in
     [`src/styles/token-presets.test.ts`](../../../src/styles/token-presets.test.ts).
2. Run `bun run test`, and show the user the failure.
3. Check it fails for the expected reason, not a typo.
4. Only then change the CSS, and run `bun run test` again until it passes.

## Step 2 — Make the change

Follow the job in [`DESIGNER.md`](../../../DESIGNER.md) that matches the request: Job 1
for colours (`src/styles/palette.css`), Job 2 for the button preset (edit the
`tokens-variant-*.css` file, then copy it over `tokens.css`; never hand-edit
`tokens.css`), Job 3 for fonts. Raw hex lives in `palette.css` only
([`AGENTS.md` → "Code rules"](../../../AGENTS.md#code-rules)).

Check light **and** dark in the sandbox (`bun run dev`, then `/debug-sandbox.html`), as
`DESIGNER.md` → "How to read the sandbox" says. If a guard goes red, `DESIGNER.md` →
"If a test goes red" explains it.

## Step 3 — Finish

Use the `before-pr` skill. If a request issue started this, put `Closes #N` in the pull
request so merging closes it.

## Request mode (course repo)

1. **Check what exists.** Three button presets ship (`DESIGNER.md`, Job 2). If one of
   them is what the user wants, say so: the maintainer can switch it in the template.
2. **Interview the user**, one question at a time: what should change and why, which
   colours (with their values, if known), and whether it is for every course or only
   theirs. Every course shares one look, so say so if it is only for theirs.
3. **Draft the issue** with the fields of the template's request form
   ([`.github/ISSUE_TEMPLATE/template-request.yml`](../../../.github/ISSUE_TEMPLATE/template-request.yml)),
   and show it to the user. Write no file in this repo; keep any draft in a temporary
   file outside it (`mktemp`).
4. **File it only when the user says yes.** Find the template's address from this repo,
   never from memory: `git remote get-url upstream` (a linked copy), else
   `gh repo view --json parent --jq .parent.nameWithOwner` (a fork), else ask. Then:

   ```bash
   gh issue create --repo <owner/name> --title "[Request] <short name>" \
     --label "template request" --body-file <draft file>
   ```

   If `gh` is not installed or not signed in, give the user the text and the link
   `https://github.com/<owner/name>/issues/new?template=template-request.yml` to paste
   it into. Tell them the maintainer is emailed and replies on the issue.
