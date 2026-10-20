/**
 * flip-cue-store.ts — the saved "this exercise's flip cue has retired" flag (TODO §E21).
 *
 * One localStorage entry per exercise, keyed like flashcards progress (E13a): the
 * course base path plus the exercise's `progressId`. Without a `progressId` there is no
 * key, nothing is saved, and the cue retires for the visit only.
 *
 * BOUNDARY RULES, as flashcards-storage.ts: the stored value is untrusted (only the
 * exact marker counts); no `window` (the prerender) or a storage that throws reads as
 * "not retired" and writes nothing, logged and never thrown. `subscribeFlipCue` lets
 * `useSyncExternalStore` re-read after a retire in this tab.
 */

const STORAGE_PREFIX = 'flip-cue:v1:';
const RETIRED = 'retired';

const listeners = new Set<() => void>();

/** An exercise's key: the course's folder (`storageScope()`, ending in `/`) plus its `progressId`. */
export function flipCueKey(base: string, progressId: string): string {
  return `${STORAGE_PREFIX}${base}${progressId}`;
}

/** The active `localStorage`, or `null` with no `window` or an access that throws. */
function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** True once this exercise's cue has retired, in this visit or an earlier one. */
export function isFlipCueRetired(key: string | null): boolean {
  const store = key ? getStorage() : null;
  if (!key || !store) return false;
  try {
    return store.getItem(key) === RETIRED;
  } catch (error) {
    console.warn(`flip cue: could not read ${key}; showing the cue.`, error);
    return false;
  }
}

/** Save the retirement and tell subscribers. No-op with no key or no storage. */
export function retireFlipCue(key: string | null): void {
  const store = key ? getStorage() : null;
  if (!key || !store) return;
  try {
    store.setItem(key, RETIRED);
  } catch (error) {
    console.warn(`flip cue: could not save ${key}.`, error);
    return;
  }
  listeners.forEach((listener) => listener());
}

/**
 * Forget the retirement, so the cue shows again, and tell subscribers. Flashcards'
 * Clear saved progress calls it (maintainer, 2026-10-16). No-op with no key or storage.
 */
export function restoreFlipCue(key: string | null): void {
  const store = key ? getStorage() : null;
  if (!key || !store) return;
  try {
    store.removeItem(key);
  } catch (error) {
    console.warn(`flip cue: could not clear ${key}.`, error);
    return;
  }
  listeners.forEach((listener) => listener());
}

/** Hear every retire or restore in this tab; returns the unsubscribe. */
export function subscribeFlipCue(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
