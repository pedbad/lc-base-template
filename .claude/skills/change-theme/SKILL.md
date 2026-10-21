---
name: change-theme
description: Use when someone asks to change the look of the courses — colours, the palette, the button preset or the fonts. In the template it makes the change test-first; in a course repo it files a request to the template instead, because every course shares one look.
---

# Change the theme

Every course shares one look (decided 2026-10-16), set in the template. How the theme is
built, and the jobs a designer does, is in [`DESIGNER.md`](../../../DESIGNER.md).

## Step 0 — Where am I

Apply the rule in [`.claude/skills/README.md` → "Where am I"](../README.md#where-am-i).

- **The template**: go on to Step 1.
- **A course repo**: the look is changed once, in the template, for every course
  ([`COURSE_GUIDE.md` → "What you may edit"](../../../COURSE_GUIDE.md#what-you-may-edit)).
  Change no file. Go to **Request mode** at the end of this file.

## Step 1 — Test first

1. Write the expectation the change adds. Both theme tests read their cases from data,
   so the expectation goes in the data, not in the test file:
   - a **new colour pairing** (text on a new surface, say): add the pair to
     `SEMANTIC_SWATCHES` in [`src/sandbox/sandbox-catalog.ts`](../../../src/sandbox/sandbox-catalog.ts).
     [`src/styles/token-contrast.test.ts`](../../../src/styles/token-contrast.test.ts)
     checks the text contrast of every pair there, in every token file;
   - a **new token**: add it to `tokens.css` first.
     [`src/styles/token-presets.test.ts`](../../../src/styles/token-presets.test.ts)
     then fails for every preset that does not declare it yet.
2. Run `bun run test`, and show the user the failure.
3. Check it fails for the expected reason, not a typo.
4. Only then change the rest of the CSS, and run `bun run test` again until it passes.

A change that only alters existing values (a different blue, a swapped preset) adds
nothing new to expect: the existing contrast tests are its check. So does a new preset
file: both tests find a new `tokens-variant-*.css` by themselves. Say so to the user and
run them; do not invent a test to see red. If the change does not fit either case, stop
and ask the user.

## Step 2 — Make the change

Follow the job in [`DESIGNER.md`](../../../DESIGNER.md) that matches the request: Job 1
for colours, Job 2 for the button preset, Job 3 for fonts. That file says which file to
edit, which never to hand-edit, and what each preset's contrast trade-off is; tell the
user about the trade-off before switching. Before a preset switch, or for a palette a
designer sent, let the user see it first in the sandbox's **Preview preset** drop-down
(`DESIGNER.md` → "Preview a palette", which also says how to add a new palette file); it
is preview only, so the switch itself is still Job 2. Raw colours belong only where
[`AGENTS.md` → "Code rules"](../../../AGENTS.md#code-rules) allows.

Check light **and** dark in the sandbox, as `DESIGNER.md` → "How to read the sandbox"
says. If a guard goes red, `DESIGNER.md` → "If a test goes red" explains it.

## Step 3 — Finish

Use the `before-pr` skill. If a request issue started this, put `Closes #N` in the pull
request so merging closes it.

## Request mode (course repo)

1. **Check what exists.** Three button presets ship (`DESIGNER.md`, Job 2). If one of
   them is what the user wants, say so: the maintainer can switch it in the template.
2. **Interview the user**, one question at a time: what should change and why, which
   colours (with their values, if known), and whether it is for every course or only
   theirs. Every course shares one look, so say so if it is only for theirs.
3. **File it** by [`.claude/skills/README.md` → "Filing a template request"](../README.md#filing-a-template-request).
