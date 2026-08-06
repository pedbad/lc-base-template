/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { loDevPages } from './src/build/lo-dev-pages';

// https://vite.dev/config/
export default defineConfig({
  // Serve-from-a-sub-path support, e.g. `BASE_URL=/course/ bun run build`. Read from
  // the environment rather than hardcoded because the post-build prerender pass needs
  // the SAME value: Bun exposes process.env as `import.meta.env`, so resolveAsset()
  // resolves audio/image URLs against this base while rendering static pages. One
  // knob, both steps — set it via CLI `--base` and the prerender would not see it.
  base: process.env.BASE_URL ?? '/',
  // tailwindcss() is Tailwind v4's first-party Vite plugin — it compiles the
  // `@import "tailwindcss"` in src/index.css and generates utilities on demand.
  // Faster than the v3 PostCSS path; no postcss.config / tailwind.config needed
  // (v4 is CSS-first — theme tokens live in CSS via @theme, added at Step 10).
  // loDevPages() is serve-only: it answers `/<slug>.html` on the DEV server by stamping
  // that LO's folder onto the dev index.html, through the SAME injectRootDiv() the
  // post-build prerender pass uses. Without it, dev has no `<slug>.html` file, Vite's
  // SPA fallback returns the unstamped landing template, and a lesson card silently
  // re-renders the landing page (Phase D decision A, revised 2026-08-06 — see
  // docs/TOOLING.md). The LO list is read from lo-config/ per request, so there is no
  // entry list here to drift from the folders on disk.
  plugins: [react(), tailwindcss(), loDevPages()],
  // `@` → ./src so shadcn component imports resolve (e.g. `@/components/ui/button`).
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  // Multi-page build: the course (index.html) plus the debug-only exercise
  // showcase (exercise-showcase.html). Each becomes its own entry; the dev server
  // serves both, so the showcase opens at /exercise-showcase.html.
  // (Later step: gate the showcase behind a debug flag / strip it from prod builds.)
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        showcase: path.resolve(import.meta.dirname, 'exercise-showcase.html'),
      },
    },
  },
  // Vitest is the test runner (Vite-native: reuses the plugins + `@` alias above,
  // so JSX/TSX and shadcn imports resolve in tests exactly as in the app). We run
  // it via Bun (`bun run test` → `vitest run`) — Bun stays the installer/runtime,
  // Vitest owns testing. Chosen over Bun's built-in `bun test` because tdd-guard
  // can watch a Vitest reporter but has no Bun-test reporter. See docs/TOOLING.md.
  test: {
    // node env: the suite renders via `renderToStaticMarkup` (string output, no
    // DOM) and the two storage tests stub `window`/`localStorage` themselves, so
    // no jsdom/happy-dom is needed. Add one here only if a real DOM test appears.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    // Explicit imports in every test (no globals) — keep it that way for clarity.
    globals: false,
    // `default` = human console output; `tdd-guard-vitest` writes results to
    // .claude/tdd-guard/data/test.json so the repo-local TDD guard (see
    // .claude/settings.json) can read Red/Green state. projectRoot pins that path.
    reporters: ['default', ['tdd-guard-vitest', { projectRoot: import.meta.dirname }]],
  },
});
