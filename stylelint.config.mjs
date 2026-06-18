// Stylelint configuration — LC Base Template
// ---------------------------------------------------------------------------
// Stylelint is to CSS what ESLint is to TypeScript: it lints stylesheets for
// errors and bad patterns. Prettier still owns CSS *layout* — Stylelint 16+
// dropped all stylistic rules, so the two no longer conflict (no truce package).
//
// This base config is the foundation for two spec guards, added in later steps:
//   guard f (token-integrity)     — forbid raw hex/px in components; use tokens.
//   guard g (css-layer-discipline) — every rule inside @layer; zero !important.
//
// Tailwind v4 (Step 8) adds CSS at-rules (@theme, @utility, @apply, …) that
// `config-standard` flags as "unknown at-rule". We allow them via an at-rule
// allowlist below (Option A — no extra dependency, vs the community
// stylelint-config-tailwindcss whose Stylelint-17 peer support can lag).
//
// Distinction: Tailwind utility *classes* (class="bg-slate-500 p-4") live in
// .tsx markup, not in .css — Stylelint never sees them, so they need no config.
// Only the at-rule directives inside stylesheets concern Stylelint.

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // Tailwind v4 requires string import notation (`@import 'tailwindcss'`).
    // config-standard defaults to `url(...)`, which Tailwind rejects — flip it.
    // (String notation is also the modern CSS default.)
    'import-notation': 'string',
    // Allow Tailwind v4's CSS-first at-rules; everything else stays validated.
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'theme',
          'source',
          'utility',
          'variant',
          'custom-variant',
          'apply',
          'reference',
          'config',
          'plugin',
          'tailwind',
        ],
      },
    ],
  },
};
