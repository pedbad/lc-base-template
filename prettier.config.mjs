// Prettier configuration — LC Base Template
// ---------------------------------------------------------------------------
// This config ships with every clone, so formatting is IDENTICAL across all
// courses spun up from this template. The exact Prettier version is pinned in
// `bun.lock`, so output is reproducible on any machine — we do not need to pin
// settings just for reproducibility (the lockfile already guarantees it).
//
// What we list below, and why:
//   (a) deliberate OVERRIDES of a Prettier default, or
//   (b) defaults that have HISTORICALLY FLIPPED across Prettier major versions
//       (pinned here as self-documentation so a future major can't change them
//       silently), or
//   (c) `endOfLine`, which is about the contributor's OS, not Prettier at all.
// Permanent, never-changed defaults (e.g. bracketSpacing) are intentionally
// omitted to keep this file signal-only.
//
// Enforcement — formatting is CHECKED, not merely suggested. Three layers:
//   1. format-on-save  → .vscode/settings.json   (convenience; VS Code only)
//   2. pre-commit hook → husky + lint-staged      (Step 7; blocks locally)
//   3. CI              → `bun run format:check`    (unbypassable backstop)
// Layer 1 alone is NOT enforcement — it needs VS Code + the Prettier extension
// + workspace trust. Layers 2 and 3 are what actually guarantee clean code.
//
// Docs: https://prettier.io/docs/options

/** @type {import("prettier").Config} */
export default {
  // End statements with a semicolon. (Prettier default: true — pinned for clarity.)
  semi: true,

  // Use 'single quotes' instead of "double quotes".
  // OVERRIDE (default: false). Matches the project's web coding-style rule.
  singleQuote: true,

  // Trailing commas everywhere they're valid → cleaner git diffs when you add a
  // line to a multi-line literal/param list.
  // Prettier 3 default, but FLIPPED from "es5" in v2 → pinned so it can't drift.
  trailingComma: 'all',

  // Wrap lines at 100 characters. OVERRIDE (default: 80) — roomier for JSX + TS.
  printWidth: 100,

  // Always wrap arrow-function params in parens: (x) => x, never x => x.
  // Prettier 3 default, but FLIPPED from "avoid" in v1 → pinned so it can't drift.
  arrowParens: 'always',

  // Force LF (Unix) line endings.
  // NOT about Prettier versions — about the OS a clone is checked out on. This
  // template is PUBLIC; Windows contributors will clone it. Backstopped by
  // `.gitattributes` (`* text=auto eol=lf`) so git normalizes on checkout too.
  endOfLine: 'lf',
};
