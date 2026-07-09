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
 * KEYING: no LO/exercise id flows through `ExerciseComponentProps` (it carries only
 * `config: unknown`), so the persistence key is derived from a hash of the deck content
 * (term/translation/asset of each card) via the shared `seedFromId`. This is stable
 * across reloads and distinct per distinct deck — the practical "per LO + exercise"
 * distinction, since different exercises carry different cards. Two byte-identical decks
 * in two LOs would share progress; accepted, as there is no id available to separate
 * them. Bump `STORAGE_VERSION` if the persisted shape ever changes.
 *
 * Spec: docs/specs/2026-07-03-new-exercise-engines-design.md §4.2.
 */
import { z } from 'zod';
import { seedFromId } from '@/exercises/lib/exerciseScaffold';
import {
  SRS_MIN_BOX,
  SRS_MAX_BOX,
  initSrsState,
  reconcileSrsState,
  type SrsState,
} from './srs-scheduler';
import type { FlashcardsContent } from './flashcards-schema';

const STORAGE_VERSION = 'v1';
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

/** A stable per-deck storage key derived from the card content (see file header). */
export function storageKey(content: FlashcardsContent): string {
  const fingerprint = content.cards
    .map((c) => `${c.target}|${c.native}|${c.image ?? ''}|${c.audio ?? ''}`)
    .join('~');
  return `${STORAGE_PREFIX}${seedFromId(fingerprint)}`;
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

/** Clear persisted progress for `key` (the "Reset progress" action). No-op / logs. */
export function clearSrsState(key: string): void {
  const store = getStorage();
  if (!store) return;
  try {
    store.removeItem(key);
  } catch (error) {
    console.warn(`flashcards SRS: could not clear progress for ${key}.`, error);
  }
}
