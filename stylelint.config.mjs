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
// `config-standard` flags as "unknown at-rule". We extend this config THEN
// (e.g. stylelint-config-tailwindcss or an at-rule allowlist) — not now.
//
// Distinction: Tailwind utility *classes* (class="bg-slate-500 p-4") live in
// .tsx markup, not in .css — Stylelint never sees them, so they need no config.
// Only the at-rule directives inside stylesheets concern Stylelint.

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
};
