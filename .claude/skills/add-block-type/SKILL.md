---
name: add-block-type
description: Use when someone asks for a new kind of content block that lessons do not have yet — for example "a dialogue block with speech bubbles". In the template it builds the block test-first; in a course repo it files a request to the template instead.
---

# Add a block type

A **block type** is a new kind of content component (like `tabs` or `sources`), not a new
block of an existing kind. For a new block of an existing kind, use the `add-lo` skill.

## Step 0 — Where am I

Run `git remote get-url origin`. The repository name is the last part of the address,
without `.git`.

- **`lc-base-template`**: this is the template. Go on to Step 1.
- **Any other name**: this is a course repo. Block types are built once, in the
  template, for every course ([`COURSE_GUIDE.md` → "What you may edit"](../../../COURSE_GUIDE.md#what-you-may-edit)).
  Write no code. Go to **Request mode** at the end of this file.
- **No `origin`, or you cannot tell**: ask the user which it is.

## Step 1 — Test first

Every file you add in Step 2 starts from its test. For each one:

1. Write the test beside the code, as `<name>.test.ts(x)`
   ([`AGENTS.md` → "Code rules"](../../../AGENTS.md#code-rules)).
2. Run `bun run test`, and show the user the failure.
3. Check it fails for the expected reason (the file or function is missing), not a typo.
4. Only then write the code, and run `bun run test` again until it passes.

Start with the content contract: which `content` parses and which is rejected, with the
message an author would see.

## Step 2 — Build it

Copy the shape of the `sources` block, file for file:

- its content schema, [`src/lo/blocks/sources-block-schema.ts`](../../../src/lo/blocks/sources-block-schema.ts);
- its renderer, [`src/lo/blocks/SourcesBlock.tsx`](../../../src/lo/blocks/SourcesBlock.tsx),
  and its test, [`sources-block.test.tsx`](../../../src/lo/blocks/sources-block.test.tsx);
- its entry in `BLOCK_RENDERERS`, [`src/lo/blocks/block-renderers.ts`](../../../src/lo/blocks/block-renderers.ts);
- its use in the example lesson, [`lo-config/lo-00-example/blocks/`](../../../lo-config/lo-00-example/blocks/)
  (this is the one time the example is changed: it is the template's own copy, and the
  tests run on it);
- its place in [`src/ui-showcase/block-groups.ts`](../../../src/ui-showcase/block-groups.ts).

Keep to [`AGENTS.md`](../../../AGENTS.md) while you build: semantic HTML, tokens only,
every CSS rule in `@layer`, prerendered markup equal to the first client render. Watch the
bundle budget ([`docs/TOOLING.md` → "Bundle budget"](../../../docs/TOOLING.md)).

Then document it where authors look: a section beside "Sources block" in
[`CONTRIBUTING.md`](../../../CONTRIBUTING.md), and
[`public/llms.txt`](../../../public/llms.txt) (it lists the block types).

## Step 3 — Finish

Use the `before-pr` skill. If a request issue started this, put `Closes #N` in the pull
request so merging closes it.

## Request mode (course repo)

1. **Check what exists.** The block types are the keys of `BLOCK_RENDERERS` in
   [`src/lo/blocks/block-renderers.ts`](../../../src/lo/blocks/block-renderers.ts), and
   the example lesson uses each one. A `tabs` block can hold several of them. If one
   fits, show the user and stop.
2. **Interview the user**, one question at a time:
   - what the learner sees, and what they can do with it (keyboard, phone, audio);
   - what the author writes: a sample with their real content, in the shape of a
     lesson's `block.json`;
   - how it should look on a phone and in dark mode;
   - which course and lesson need it.
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
   it into. Tell them the maintainer is emailed, replies on the issue, and that the new
   block reaches their course with the next template update.
