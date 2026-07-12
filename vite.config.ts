/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  // tailwindcss() is Tailwind v4's first-party Vite plugin — it compiles the
  // `@import "tailwindcss"` in src/index.css and generates utilities on demand.
  // Faster than the v3 PostCSS path; no postcss.config / tailwind.config needed
  // (v4 is CSS-first — theme tokens live in CSS via @theme, added at Step 10).
  plugins: [react(), tailwindcss()],
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
