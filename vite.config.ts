/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { loDevPages } from './src/build/lo-dev-pages';
import { sandboxDocs } from './src/build/sandbox-docs-plugin';
import { buildBase } from './src/build/build-base';
import { debugEntries } from './src/build/build-entries';
import { feijoaFonts } from './src/build/feijoa-fonts';
import { presetPreview } from './src/build/preset-preview-plugin';

// https://vite.dev/config/
export default defineConfig({
  // `./` by default: one build that works copied into any folder. A fixed address is
  // still `BASE_URL=/course/ bun run build`. Read from the environment rather than the
  // CLI `--base` because the post-build prerender pass needs the SAME value: Bun exposes
  // process.env as `import.meta.env`, and resolveAsset() falls back to the same default
  // when BASE_URL is unset (src/build/build-base.ts). One knob, both steps.
  base: buildBase(process.env),
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
  // sandboxDocs() renders the markdown docs into `virtual:sandbox-docs` at dev-server
  // and build time, so the debug sandbox's Docs hub shows the real `.md` files with no
  // copy to drift and no markdown parser in any bundle (spec §14, buildlist 18). It is
  // inert for every entry that does not import that module.
  // feijoaFonts() adds Feijoa's @font-face rules to each page only when the licensed
  // files are in public/fonts/feijoa/, so a clone or deploy without them requests no
  // missing font (TODO §E5).
  // presetPreview() adds the sandbox's palette preview to every page in dev and in a
  // DEBUG=1 build, and to no page of a normal build (TODO §E18).
  plugins: [
    react(),
    tailwindcss(),
    loDevPages(),
    sandboxDocs(import.meta.dirname),
    feijoaFonts(),
    presetPreview(),
  ],
  // `@` → ./src so shadcn component imports resolve (e.g. `@/components/ui/button`).
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  // Multi-page build. The course (index.html) always builds. The five debug-only pages —
  // the exercise showcase, the UI showcase, the designer's sandbox, the code style page
  // and the CULP syllabi page — are OPT-IN behind one flag, `DEBUG=1 bun run build`, because an unconditional
  // entry put `dist/exercise-showcase.html` on every deploy: unlinked, but a public URL
  // on a live course (Phase C · Part D §5, closed 2026-09-03). See src/build/build-entries.ts
  // for the fail-closed rule and why `SHOWCASE=1` still works; the entry list is
  // `DEBUG_ENTRY_FILES` in src/build/page-names.ts. The DEV
  // server is unaffected: Vite serves any root-level .html regardless of this list, so
  // every debug page still works in `bun run dev`.
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        ...debugEntries(process.env, import.meta.dirname),
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
    // DOM) and the two storage tests stub `window`/`localStorage` themselves. The one
    // test that replays real DOM events (SequenceAudioController.test.tsx, TODO §E23)
    // opts in to happy-dom with a `@vitest-environment` comment; nothing else does.
    environment: 'node',
    // Vitest hands every CSS import back as '' unless it is listed here — `?raw` too.
    // The sandbox's preset preview reads the token files as text (src/sandbox/
    // preset-preview.ts), so its tests need the real text of these files alone.
    css: { include: [/src\/styles\/tokens[^/]*\.css/] },
    include: ['src/**/*.test.{ts,tsx}'],
    // Explicit imports in every test (no globals) — keep it that way for clarity.
    globals: false,
    // `default` = human console output; `tdd-guard-vitest` writes results to
    // .claude/tdd-guard/data/test.json, which the TDD guard reads when someone opts
    // in to it (off by default — docs/TOOLING.md, "TDD guard"). projectRoot pins it.
    reporters: ['default', ['tdd-guard-vitest', { projectRoot: import.meta.dirname }]],
    // Coverage runs in CI only (`bun run test:coverage`), never in the pre-push hook.
    // Per-file bars, so a new file with no test at all (0%) fails instead of
    // disappearing into an average. Measured and agreed: docs/TOOLING.md, "Coverage".
    coverage: {
      provider: 'v8',
      // Every source file counts, including ones no test imports.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/**/*.fixture.ts',
        // Vendored shadcn wrappers belong to the shadcn CLI, not this repo.
        'src/components/ui/**',
        // The browser entry: one createRoot/hydrate call.
        'src/main.tsx',
        // Debug pages, built only under DEBUG=1.
        'src/sandbox/**',
        'src/showcase/**',
        'src/ui-showcase/**',
        'src/code-style/**',
        'src/culp-syllabi/**',
        // Wiring, not logic. lazy-registry.ts is a table of lazy() imports that only a
        // browser resolves; its keys are checked by registry-completeness.
        'src/exercises/lazy-registry.ts',
        // Vite plugin glue that only runs inside a dev server / build.
        'src/build/lo-dev-pages.ts',
        'src/build/sandbox-docs-plugin.ts',
      ],
      reporter: ['text-summary', 'json-summary'],
      // Vitest checks EVERY file against the top-level bar as well as against any
      // glob it matches, so the top level stays 0 and each group names its files.
      // `perFile` is read ONLY here, never inside a glob entry: without it each glob
      // is one average, and a small untested file vanishes into it (verified
      // 2026-10-14 — an untested file passed until this moved up here).
      thresholds: {
        perFile: true,
        lines: 0,
        // Logic: grading, schemas, config, src/lo, src/build, src/lib — every .ts
        // that is not browser glue (below).
        'src/!(audio|hooks)/**/!(use*|reorder-animation).ts': { lines: 80 },
        // Views: the suite renders static markup, so event handlers never run.
        // The floor catches a component with no test; raise it as tests grow.
        'src/**/*.tsx': { lines: 20 },
        // Browser glue — src/hooks/, src/audio/, use*.ts, reorder-animation.ts
        // (scroll, audio, animation) — needs a DOM to test: counted and reported,
        // no bar yet.
      },
    },
  },
});
