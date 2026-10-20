---
name: build-for-upload
description: Use when someone wants to build the course to put it on a web server — "build it for upload", "deploy the course", "publish it". Walks DEPLOY.md step by step.
---

# Build a course for upload

[`DEPLOY.md`](../../../DEPLOY.md) is the step-by-step. Go through it **in order** with the
user, one step at a time, and do not skip its checks.

## What to watch for

- **The Feijoa fonts** are the user's own licensed files, copied into
  `public/fonts/feijoa/`. Never commit them
  ([`AGENTS.md` → "Hard constraints"](../../../AGENTS.md)). If they are missing, the
  build warns and uses the fallback font; say so, and ask whether to go on.
- **The folder.** Ask where on the server the course will live: that is where the files
  go, not something the build needs. Leave `BASE_URL` unset, so one build works in any
  folder (DEPLOY.md, "Any folder, by default"), and walk step 8's final-slash check after
  the upload. Set `BASE_URL` only if the user asks for a build tied to one address.
- **No debug pages.** Build without `DEBUG=1`, and run DEPLOY.md's check that no debug
  page is in `dist/`.
- **Upload what is inside `dist/`**, not the folder itself.
- After the upload, walk DEPLOY.md's "Check the live site" with the user, then "Write it
  down".

If a step fails, use DEPLOY.md's "When something is wrong" before changing anything.
