/**
 * playwright.config.ts — the browser suite (TODO §E12, spec
 * docs/specs/2026-10-14-browser-tests-design.md). Runs against the BUILT site: build
 * first, then `bun run test:e2e`. A default build is `./` and works in any folder:
 * `SERVE_PATH=/any/folder/ bun run test:e2e` serves the same files from a nested folder.
 * A fixed address is `BASE_URL=/course/` on both commands, and is served there.
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

import { servePath } from './src/build/build-base';
import { isDebugRequested } from './src/build/build-entries';

const PORT = 4173;
/** Where the built site is served: a fixed BASE_URL, or SERVE_PATH for a `./` build. */
const BASE_PATH = servePath(process.env);
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
    // `--base` serves dist/ from BASE_PATH whatever it was built with: a `./` build is
    // the same files in any folder, which is what serving it from SERVE_PATH proves.
    command: `bun run preview --port ${PORT} --strictPort --base ${BASE_PATH}`,
    url: SITE_URL,
    // Always a fresh preview: a left-running one may serve another base or an old build.
    reuseExistingServer: false,
  },
});
