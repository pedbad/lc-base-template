---
name: add-block-type
description: Use when someone asks for a new kind of content block that lessons do not have yet — for example "a dialogue block with speech bubbles". In the template it builds the block test-first; in a course repo it files a request to the template instead.
---

# Add a block type

A **block type** is a new kind of content component (like `tabs` or `sources`), not a new
block of an existing kind. For a new block of an existing kind, use the `add-lo` skill.

## Step 0 — Where am I

Apply the rule in [`.claude/skills/README.md` → "Where am I"](../README.md#where-am-i).

- **The template**: go on to Step 1.
- **A course repo**: block types are built once, in the template, for every course
  ([`COURSE_GUIDE.md` → "What you may edit"](../../../COURSE_GUIDE.md#what-you-may-edit)).
  Write no code. Go to **Request mode** at the end of this file.

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

1. **Copy the shape of the `sources` block**, file for file: its content schema
   ([`sources-block-schema.ts`](../../../src/lo/blocks/sources-block-schema.ts)), its
   renderer ([`SourcesBlock.tsx`](../../../src/lo/blocks/SourcesBlock.tsx)) and its test
   ([`sources-block.test.tsx`](../../../src/lo/blocks/sources-block.test.tsx)).
2. **Register it** in `BLOCK_RENDERERS`
   ([`src/lo/blocks/block-renderers.ts`](../../../src/lo/blocks/block-renderers.ts)).
   The UI showcase builds its groups from that map by itself.
3. **Give the showcase something to render**: a fixture in
   [`src/ui-showcase/block-fixtures.ts`](../../../src/ui-showcase/block-fixtures.ts).
   Its header says when one is needed and when it is not. Do not edit
   `lo-config/lo-00-example/` ([`AGENTS.md` → "Content rules"](../../../AGENTS.md#content-rules));
   adding the type to the example is the maintainer's call, asked separately.
4. **The rules.** Keep to [`AGENTS.md`](../../../AGENTS.md) "Hard constraints" and "Code
   rules" throughout, and watch the bundle budget
   ([`docs/TOOLING.md` → "Bundle budget"](../../../docs/TOOLING.md)).
5. **The docs** authors read: a section beside "Sources block" in
   [`CONTRIBUTING.md`](../../../CONTRIBUTING.md), and
   [`public/llms.txt`](../../../public/llms.txt) (it lists the block types).

## Step 3 — Finish

Use the `before-pr` skill. If a request issue started this, put `Closes #N` in the pull
request so merging closes it.

## Request mode (course repo)

1. **Check what exists.** The block types are the keys of `BLOCK_RENDERERS` in
   [`src/lo/blocks/block-renderers.ts`](../../../src/lo/blocks/block-renderers.ts); each
   is used in the example lesson or has a fixture in `src/ui-showcase/block-fixtures.ts`.
   A `tabs` block can hold several of them. If one fits, show the user and stop.
2. **Interview the user**, one question at a time:
   - what the learner sees, and what they can do with it (keyboard, phone, audio);
   - what the author writes: a short, made-up sample in the shape of a lesson's
     `block.json`;
   - how it should look on a phone and in dark mode;
   - which course and lesson need it.
3. **File it** by [`.claude/skills/README.md` → "Filing a template request"](../README.md#filing-a-template-request).
