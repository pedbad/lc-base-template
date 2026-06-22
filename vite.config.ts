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
});
