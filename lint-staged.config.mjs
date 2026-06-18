// lint-staged — runs formatters/linters on STAGED files only, as a pre-commit gate.
//
// WHY: Steps 4–6 added Prettier, ESLint, and Stylelint, but nothing enforced them.
// This config is the "stick": `.husky/pre-commit` runs `bunx lint-staged`, which
// applies the commands below to just the files staged for the current commit
// (fast — it never scans the whole repo). A staged file that can't be auto-fixed
// fails the commit locally. CI (Step 31) is the real wall; this catches issues early.
//
// Each glob is scoped so a tool only ever sees files it understands:
//   - ESLint   → JS/TS source only
//   - Stylelint→ CSS only
//   - Prettier → everything it can format
// `--fix` / `--write` mutate the file; lint-staged re-stages the result automatically.
export default {
  '*.{js,jsx,ts,tsx}': ['prettier --write', 'eslint --fix'],
  '*.{json,md,html,mjs,cjs}': ['prettier --write'],
  '*.css': ['prettier --write', 'stylelint --fix'],
};
