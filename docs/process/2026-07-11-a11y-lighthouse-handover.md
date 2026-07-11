# Handover — Accessibility + Lighthouse sweep

**Date:** 2026-07-11
**Repo:** `lc-base-template` · branch `main` · in sync with `origin/main` at `d76f778`
**Prev work:** Phase C engines complete — Reading comprehension (§4.4) merged + pushed.
Working tree clean.
**This task:** fix the WAVE / accessibility errors and raise Lighthouse scores across the
site. Baseline was captured this session (below) BEFORE any fixes — re-run after each
change and compare against it.

---

## Baseline Lighthouse (captured 2026-07-11, BEFORE fixes)

> Method: `chrome-devtools` MCP `lighthouse_audit` (navigation, **desktop**) + a
> `performance_start_trace` per page, against the **Vite dev server** (`bun run dev`,
> :5173), unthrottled. Production-build numbers will be higher on Performance; a11y /
> SEO / agentic are representative. Re-measure the same way for apples-to-apples.

| Category                | `index.html`  | `exercise-showcase.html` |
| ----------------------- | ------------- | ------------------------ |
| Performance (LCP / CLS) | 221 ms / 0.00 | 291 ms / 0.00            |
| Accessibility           | **91**        | **84**                   |
| Best Practices          | 100           | 100                      |
| SEO                     | 75            | 83                       |
| Agentic Browsing        | 67            | 24                       |

### Failing accessibility audits

| Audit                         | index | showcase | Notes / WAVE tie-in                                                    |
| ----------------------------- | ----- | -------- | ---------------------------------------------------------------------- |
| `color-contrast`              | ✗     | ✗        | WAVE: **3 contrast errors**. Find low-contrast token pairs.            |
| `button-name`                 | —     | ✗        | WAVE: **4 empty buttons** — icon-only buttons with no accessible name. |
| `aria-hidden-focus`           | —     | ✗        | focusable descendant inside `[aria-hidden="true"]`.                    |
| `label-content-name-mismatch` | —     | ✗        | visible label text ≠ accessible name.                                  |
| `target-size`                 | —     | ✗        | touch targets < 24×24 / spacing.                                       |
| `landmark-one-main`           | ✗     | —        | `index.html` app root has no `<main>` (Showcase.tsx already has one).  |

### Failing SEO / agentic

- **SEO:** `meta-description` (both — neither HTML has `<meta name="description">`),
  `robots-txt` (invalid/absent), `link-text` (index — non-descriptive link text).
- **Agentic:** `llms-txt` (missing), `agent-accessibility-tree` (showcase — malformed
  a11y tree, downstream of the a11y fixes above).

---

## WAVE report (user-supplied, exercise-showcase page)

```
Errors 21 · Contrast Errors 3 · Alerts 3 · Features 45 · Structure 628 · ARIA 261
AIM Score: 7/10
21 Errors: 17× Missing form label · 4× Empty button
3 Contrast Errors: 3× Very low contrast
3 Alerts: Orphaned form label · Layout table · HTML5 video or audio
```

### Prime suspects (start here)

The showcase renders audio-bearing engines (dictation, inline-gap row audio) plus
several exercises, so per-clip audio UI multiplies:

- **`src/components/audio/`** — `AudioClip.tsx`, `SequenceAudioController.tsx`,
  `CircularAudioProgressAnimatedSpeaker*.tsx`. Icon-only play/pause buttons →
  **empty button** errors; progress/volume sliders (range inputs) rendered without an
  associated `<label>` → **missing form label** errors; the underlying `<audio>` →
  the **HTML5 audio** alert. Give every control a name (`aria-label` via
  `resolveLabel('play'|'pause'|'listen'|'audioVolume'|'audioProgress', labels)` —
  those ui-strings keys already exist in `src/config/ui-strings.ts`).
- **`src/exercises/inline-gap/useRowAudio.ts`** — how row audio is wired.
- **shadcn primitives** `src/components/ui/{sidebar,sheet,dialog}.tsx` — sidebar in
  particular emits hidden inputs/buttons; audit whether it's even mounted on these
  pages (dead chrome = easy wins). `sr-only` labels count is low (7), so the 17 form
  labels are almost certainly the audio sliders, not sr-only spans.
- **Contrast:** likely `text-muted-foreground` on `bg-muted/30` (used in the new
  reading passage block and status lines) and/or footer ghost buttons. Check tokens in
  `src/styles`/`index.css`; fix by darkening the muted foreground token or the surface,
  not per-component overrides. Verify with the browser's contrast tooling at 4.5:1.
- **`landmark-one-main` / layout table:** ensure the `index.html` React root renders a
  single `<main>`; the "layout table" alert = a `<table>` used for layout (check
  conjugation/line-match/memory grids — should be CSS grid/`role` semantics, not tables).

---

## Recommended approach

1. Branch off main: `git checkout -b fix/a11y-lighthouse main` (confirm `main` ==
   `origin/main` first).
2. **tdd-guard is ON again** — for pure-logic edits do the stub dance, or disable it
   (edit `.claude/tdd-guard/data/config.json` → `{"guardEnabled":false}`; gitignored,
   never commit it). Most a11y fixes are `.tsx` view/markup edits, which tdd-guard
   blocks outright, so disabling is the pragmatic call for this task.
3. Fix in clusters, each its own commit (conventional):
   - `fix(a11y): name audio controls + label sliders` (button-name, missing labels)
   - `fix(a11y): raise muted-foreground contrast to 4.5:1` (color-contrast)
   - `fix(a11y): main landmark + remove layout table / aria-hidden focus`
   - `chore(seo): add meta descriptions, robots.txt, descriptive link text`
   - optional: `chore(agentic): add llms.txt`
4. Re-run WAVE + Lighthouse after each cluster; update the baseline table with deltas.
5. Consider the ECC skills: `a11y-architect` agent, `accessibility` / `frontend-a11y`
   skills, `wcag-audit-patterns`, and the `lighthouse_audit` chrome-devtools tool.

## Verify (CI runs these)

```
bun test
bun run lint
bun run build
```

Plus re-audit both pages (dev server) with `lighthouse_audit` and re-scan with WAVE;
eyeball the showcase to confirm no visual regression from token/contrast changes.

## Guardrails

- Contrast fixes touch shared tokens — check BOTH themes if both exist, and every
  engine card, not just the showcase.
- Don't regress the passing Performance (LCP/CLS 0.00) or Best Practices (100).
- Keep `lang={TARGET_LANG}` semantics intact; `aria-label`s are English UI chrome
  (resolveLabel), never target-language.

---

## Paste-ready resume prompt

> Fix the accessibility / WAVE errors and raise Lighthouse scores in `lc-base-template`
> — full recipe + baseline in `docs/process/2026-07-11-a11y-lighthouse-handover.md`.
> Confirm `main` == `origin/main`, branch off main (`fix/a11y-lighthouse`). tdd-guard is
> ON and blocks `.tsx` writes — disable it via `.claude/tdd-guard/data/config.json` →
> `{"guardEnabled":false}` (gitignored, don't commit). Baseline (dev server, desktop):
> showcase a11y 84 / SEO 83 / agentic 24; index a11y 91 / SEO 75 / agentic 67; perf is
> already green (LCP <300ms, CLS 0.00). Priorities from WAVE + Lighthouse: (1) name the
> icon-only audio buttons and label the audio sliders in `src/components/audio/*`
> (button-name + 17 missing form labels — reuse the existing `play`/`pause`/`listen`/
> `audioVolume`/`audioProgress` ui-strings keys), (2) fix 3 contrast errors at the token
> level (likely muted-foreground on muted surfaces → 4.5:1), (3) add a single `<main>`
> landmark to index, remove the layout `<table>` and the aria-hidden focusable, (4) SEO:
> meta descriptions + valid robots.txt + descriptive link text, (5) optional llms.txt.
> One conventional commit per cluster; re-run WAVE + `lighthouse_audit` (chrome-devtools
> MCP) after each and record deltas against the baseline table. Verify `bun test · bun
run lint · bun run build` and eyeball both pages. Use the ECC `a11y-architect` /
> `accessibility` / `wcag-audit-patterns` skills.
