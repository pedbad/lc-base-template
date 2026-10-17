/**
 * debug-support.ts — helpers for the specs that need a `DEBUG=1` build (TODO §E12c).
 * Not a spec itself: the config collects only the `*.spec.ts` files in this folder, and
 * only when `DEBUG=1` is set (playwright.config.ts).
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { expect, type Locator, type Page } from '@playwright/test';

import { animationsInside } from '../support';

const DIST = path.resolve(import.meta.dirname, '../../dist');

/** The base the build was made for, ending in a slash as `resolveHomeHref()` gives it. */
const BASE_PATH = (process.env.BASE_URL ?? '/').replace(/\/?$/, '/');

/**
 * Fails with the fix spelled out when `dist/` is a normal build. Without this, a debug
 * page that was never built answers with the landing page (vite preview's SPA fallback,
 * e2e/support.ts) and every spec fails on a missing element instead.
 */
export function requireDebugBuild(): void {
  const missing = ['exercise-showcase.html', 'debug-sandbox.html'].filter(
    (file) => !existsSync(path.join(DIST, file)),
  );
  expect(missing, 'dist/ is a normal build: run `DEBUG=1 bun run build` first').toEqual([]);
}

/**
 * exercise-showcase.html is ready: hydrated, every lazy engine chunk rendered, none
 * failed. The engines render only after hydration, so a flashcards flip control proves
 * both; the rest is exampleReady()'s check (e2e/support.ts) for the showcase.
 */
export async function showcaseReady(page: Page): Promise<void> {
  await expect(page.locator('#flashcards .flashcards-flip-hit')).toBeVisible();
  await expect(page.getByText('Loading…', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
}

/** Opens the showcase and waits for it. */
export async function openShowcase(page: Page): Promise<void> {
  requireDebugBuild();
  await page.goto('exercise-showcase.html');
  await showcaseReady(page);
}

/**
 * Turns a flashcards deck's current card to its back. Waits for the deck's animations
 * first: in WebKit on CI a click landing while the next card eases in was sometimes
 * lost (the same cause as `openExercise`'s note in e2e/support.ts), and the rating
 * buttons then never showed. The aria-pressed check names that failure if it recurs.
 */
export async function flipCard(deck: Locator): Promise<void> {
  await animationsInside(deck);
  const flip = deck.locator('.flashcards-flip-hit');
  await flip.click();
  await expect(flip).toHaveAttribute('aria-pressed', 'true');
}

/** A showcase card: its `<article>`, whose id is the fixture id. */
export function card(page: Page, fixtureId: string): Locator {
  return page.locator(`article#${fixtureId}`);
}

/**
 * The key a retired flip cue is saved under: `flip-cue:v1:` + base + progressId
 * (src/exercises/lib/flip-cue-store.ts). The showcase's progressId is
 * `showcase/<fixture id>` (src/showcase/Showcase.tsx).
 */
export function flipCueKey(fixtureId: string): string {
  return `flip-cue:v1:${BASE_PATH}showcase/${fixtureId}`;
}

/** One localStorage value, or null. */
export function stored(page: Page, key: string): Promise<string | null> {
  return page.evaluate((storageKey) => localStorage.getItem(storageKey), key);
}
