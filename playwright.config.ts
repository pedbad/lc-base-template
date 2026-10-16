/**
 * playwright.config.ts — the browser suite (TODO §E12, spec
 * docs/specs/2026-10-14-browser-tests-design.md). Runs against the BUILT site: build
 * first, then `bun run test:e2e`. `vite preview` reads the same BASE_URL as the build
 * (vite.config.ts), so `BASE_URL=/course/` on both gives the sub-path run.
 *
 * Two suites, one per build (TODO §E12c). A normal build runs every spec except
 * `e2e/debug/`; a `DEBUG=1` build runs ONLY `e2e/debug/`, the specs for the debug pages
 * that exist nowhere else. The same flag, read by the same function, as the build itself
 * (`src/build/build-entries.ts`), so `DEBUG=1` on both commands picks the matching suite:
 * `DEBUG=1 bun run build && DEBUG=1 bun run test:e2e`.
 *
 * Not imported by vite.config.ts, so the `@/` alias rule (AGENTS.md hard constraint 1)
 * does not reach it; its one src/ import is the alias-free module vite.config.ts imports.
 */
import { defineConfig, devices } from '@playwright/test';

import { isDebugRequested } from './src/build/build-entries';

const PORT = 4173;
const BASE_PATH = process.env.BASE_URL ?? '/';
const SITE_URL = `http://localhost:${PORT}${BASE_PATH}`;
const IS_CI = Boolean(process.env.CI);
/** `e2e/debug/`, anchored: a bare 'debug/**' would also match a checkout's own path. */
const DEBUG_DIR = /[\\/]e2e[\\/]debug[\\/]/;
const DEBUG_SPEC = /[\\/]e2e[\\/]debug[\\/][^\\/]+\.spec\.ts$/;

export default defineConfig({
  testDir: './e2e',
  ...(isDebugRequested(process.env) ? { testMatch: DEBUG_SPEC } : { testIgnore: DEBUG_DIR }),
  fullyParallel: true,
  forbidOnly: IS_CI,
  // Retries only in CI, where a trace of the retried run is kept for the report.
  retries: IS_CI ? 2 : 0,
  reporter: IS_CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    // Specs navigate with RELATIVE paths ('example.html'), so they resolve under the base.
    baseURL: SITE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `bun run preview --port ${PORT} --strictPort`,
    url: SITE_URL,
    // Always a fresh preview: a left-running one may serve another base or an old build.
    reuseExistingServer: false,
  },
});
