// ESLint configuration — LC Base Template (flat config, ESLint 10)
// ---------------------------------------------------------------------------
// ESLint polices CORRECTNESS (bugs, bad patterns, accessibility); Prettier owns
// LAYOUT (see prettier.config.mjs). The two are kept from fighting by the
// `eslintConfigPrettier` entry at the very bottom of this file.
//
// Rule sources, in order:
//   js.configs.recommended               core JS correctness
//   tseslint.configs.recommended         TypeScript correctness
//   reactHooks.configs.flat.recommended  Rules of Hooks
//   reactRefresh.configs.vite            Fast-Refresh safety (Vite)
//   jsxA11y.flatConfigs.recommended      ACCESSIBILITY — lints the JSX markup in
//                                         .tsx files (missing alt, unreachable
//                                         click handlers, bad ARIA, …). The lint
//                                         half of spec guard h (W3C/a11y); the
//                                         static-page axe/pa11y half lands later.
//   eslintConfigPrettier                 LAST. Disables every ESLint rule that
//                                         overlaps with Prettier. Adds no rules.
//
// Note: eslint-plugin-jsx-a11y@6.10 declares a peer range up to ESLint 9, so
// `bun install` warns on ESLint 10. It uses the stable flat-config API and runs
// correctly under 10 (verified by a clean `bun run lint`). Remove this note once
// the plugin publishes ESLint 10 in its peer range.
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // shadcn/ui primitives are vendored copy-in source. Relax two rules that
  // produce false positives on them (the rest of jsx-a11y — guard h — stays ON):
  //   react-refresh/only-export-components — ui files intentionally export
  //     variant helpers (badgeVariants) and hooks (useSidebar) beside the
  //     component; harmless, and the rule is an HMR-only dev concern.
  //   jsx-a11y/label-has-associated-control — the Label primitive renders a
  //     <label> the *consumer* associates with a control at the usage site.
  {
    files: ['src/components/ui/**'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
    },
  },
  // MUST stay last: turns off ESLint rules that conflict with Prettier.
  eslintConfigPrettier,
]);
