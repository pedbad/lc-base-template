/**
 * playwright.config.ts — the browser suite (TODO §E12, spec
 * docs/specs/2026-10-14-browser-tests-design.md). Runs against the BUILT site: build
 * first, then `bun run test:e2e`. `vite preview` reads the same BASE_URL as the build
 * (vite.config.ts), so `BASE_URL=/course/` on both gives the sub-path run.
 *
 * Not imported by vite.config.ts, so the `@/` alias rule (AGENTS.md hard constraint 1)
 * does not reach it; it imports nothing from src/ anyway.
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BASE_PATH = process.env.BASE_URL ?? '/';
const SITE_URL = `http://localhost:${PORT}${BASE_PATH}`;
const IS_CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
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
