# Claude skills for this repo

Task recipes Claude Code loads by itself, one folder each (`<name>/SKILL.md`). Course
repos inherit them, and a template sync updates them. Design:
[`docs/specs/2026-10-16-claude-skills-design.md`](../../docs/specs/2026-10-16-claude-skills-design.md).
The two procedures below are shared by several skills, so they live here once.

## Where am I

Several skills behave differently in the template and in a course repo. This is the
**template** only when all three hold:

1. `git remote get-url origin` ends in `lc-base-template` or `lc-base-template.git`;
2. `git remote get-url upstream` fails (a course made as a linked copy has an
   `upstream` remote pointing at the template);
3. `gh repo view --json isFork --jq .isFork` prints `false` (a course made as a fork
   keeps the template's name until it is renamed).

Otherwise it is a **course repo**. If `origin` is missing or `gh` cannot answer, ask the
user which it is; never guess "template".

## Filing a template request

Used by the code skills in a course repo, after they have checked the existing types and
interviewed the user.

1. **Warn first: issues on the template are public.** Anyone can read them. The sample
   must be short and made up for the request, never the colleague's unpublished lesson
   text, never copied from a textbook, and no images or audio.
2. **Draft the body** in a temporary file outside the repo (`mktemp`); write no file in
   the course repo. Use the request form's field labels as `###` headings, in its order
   ([`.github/ISSUE_TEMPLATE/template-request.yml`](../../.github/ISSUE_TEMPLATE/template-request.yml)),
   ending with `- [x] I checked the existing types and none of them fits`. Show it to the
   user.
3. **Find the template's address** from this repo, never from memory:
   `git remote get-url upstream` (a linked copy), else
   `gh repo view --json parent --jq '.parent.owner.login + "/" + .parent.name'` (a
   fork), else ask.
4. **File it only when the user says yes:**

   ```bash
   gh issue create --repo <owner/name> --title "[Request] <short name>" \
     --label "template request" --body-file <draft file>
   ```

   If `gh` says the label does not exist, file it again without `--label` and tell the
   user. If `gh` is not installed or not signed in, give the user the text and the link
   `https://github.com/<owner/name>/issues/new?template=template-request.yml`.

5. **Tell the user what happens next:** the maintainer is emailed, replies on the issue
   (they are emailed when that happens), and builds it in the template; it reaches their
   course with the next template update. They can keep writing with the existing types.
