/**
 * flashcards-storage.ts — the localStorage boundary for the flashcards SRS layer
 * (Step 2, design §4.2). The scheduler in `srs-scheduler.ts` is pure; this module owns
 * the one impure edge: reading and writing persisted progress. It is deliberately thin
 * and defensive.
 *
 * BOUNDARY RULES (project conventions):
 *   - Stored JSON is UNTRUSTED. Every read is `JSON.parse` in a try/catch, then
 *     Zod-validated; any failure returns a fresh deck — the engine never throws on
 *     bad/absent/cleared storage. Failures are logged (console.warn), never silently
 *     swallowed (log-and-recover).
 *   - SSR / no-window safe. With no `window` (or a `localStorage` that throws, e.g.
 *     Safari private mode), reads return a fresh in-memory deck and writes are no-ops.
 *   - Content drift safe. A load reconciles the stored state against the deck's current
 *     ids (`reconcileSrsState`), so adding/removing/renaming cards can never desync.
 *
 * KEYING (E13a, 2026-10-15): a deck's progress lives under the course's base path plus
 * its `progressId` — the LO and exercise folders it sits in (`lo-03-food/02-flashcards`),
 * handed down by the LO page through `ExerciseHost`. It does not depend on what the
 * cards say, so a typo fix keeps the deck's progress (a fixed target word restarts
 * that one card); two decks are two folders, so they never share it; and the base
 * path keeps two courses on one site apart. Renaming either folder (reordering a
 * course) or moving the base path starts that deck afresh: the maintainer chose
 * folder names over an authored id. Inside a deck, cards are kept by their target word
 * (`cardId` in `flashcards-deck.ts`). A deck with no `progressId` saves nothing.
 *
 * Bump `STORAGE_VERSION` if the key or the persisted shape ever changes. v1 keyed a
 * hash of the card content; v2 ignores v1 entries rather than migrating them, as no
 * learner had saved progress when it changed.
 *
 * Spec: docs/specs/2026-07-03-new-exercise-engines-design.md §4.2.
 */
import { z } from 'zod';
import {
  SRS_MIN_BOX,
  SRS_MAX_BOX,
  initSrsState,
  reconcileSrsState,
  type SrsState,
} from './srs-scheduler';

const STORAGE_VERSION = 'v2';
const STORAGE_PREFIX = `flashcards-srs:${STORAGE_VERSION}:`;

/** Untrusted-input schema for a persisted scheduler state (mirrors `SrsState`). */
const StoredSrsStateSchema = z.object({
  step: z.number().int().min(0),
  cards: z.record(
    z.string(),
    z.object({
      box: z.number().int().min(SRS_MIN_BOX).max(SRS_MAX_BOX),
      due: z.number().int().min(0),
    }),
  ),
});

/**
 * A deck's storage key: the course's folder (`storageScope()`, ending in `/`) plus its `progressId`
 * (see file header).
 */
export function storageKey(base: string, progressId: string): string {
  return `${STORAGE_PREFIX}${base}${progressId}`;
}

/**
 * The active `localStorage`, or `null` when unavailable — no `window` (SSR) or an
 * access that throws (privacy modes). Callers treat `null` as "run in memory".
 */
function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Load persisted progress for `key`, reconciled against the deck's current `ids`.
 * Returns a fresh deck on any of: no storage, absent key, unparseable JSON, or
 * schema-invalid data (the latter two are logged). Never throws.
 */
export function loadSrsState(key: string, ids: readonly string[]): SrsState {
  const fresh = initSrsState(ids);
  const store = getStorage();
  if (!store) return fresh;

  let raw: string | null;
  try {
    raw = store.getItem(key);
  } catch (error) {
    console.warn(`flashcards SRS: could not read storage for ${key}; using a fresh deck.`, error);
    return fresh;
  }
  if (raw === null) return fresh;

  try {
    const parsed = StoredSrsStateSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.warn(`flashcards SRS: stored progress for ${key} is invalid; using a fresh deck.`);
      return fresh;
    }
    return reconcileSrsState(parsed.data, ids);
  } catch (error) {
    console.warn(
      `flashcards SRS: stored progress for ${key} is corrupt; using a fresh deck.`,
      error,
    );
    return fresh;
  }
}

/** Persist scheduler state under `key`. No-op without storage; logs on write failure. */
export function saveSrsState(key: string, state: SrsState): void {
  const store = getStorage();
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.warn(`flashcards SRS: could not save progress for ${key}.`, error);
  }
}

/** Clear persisted progress for `key` (the Clear saved progress button). No-op / logs. */
export function clearSrsState(key: string): void {
  const store = getStorage();
  if (!store) return;
  try {
    store.removeItem(key);
  } catch (error) {
    console.warn(`flashcards SRS: could not clear progress for ${key}.`, error);
  }
}
