/**
 * preset-choice.ts — which preset this browser is previewing (TODO §E18).
 *
 * Kept in localStorage so the choice made in the sandbox follows the viewer to every
 * page of a DEBUG build. Per viewer and per browser by design: nothing is shared, and
 * nothing reaches a learner, because a normal build carries none of this code.
 *
 * Every access is wrapped: storage throws in some private modes and when site data is
 * blocked, and a debug preview must never be the reason a page breaks. A refused read
 * is "no choice", which shows the course's real colours.
 */

/** The one storage key. */
export const PRESET_STORAGE_KEY = 'lc-debug-palette-preset';

/** Fired on `window` whenever the choice changes in this tab. */
export const PRESET_CHANGE_EVENT = 'lc-palette-preset-change';

/** The previewed preset's id, or null for the course's own `tokens.css`. */
export function readChoice(storage: Storage): string | null {
  try {
    return storage.getItem(PRESET_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Remembers `id`, or forgets the choice when it is null. */
export function writeChoice(storage: Storage, id: string | null): void {
  try {
    if (id === null) storage.removeItem(PRESET_STORAGE_KEY);
    else storage.setItem(PRESET_STORAGE_KEY, id);
  } catch {
    // Storage refused: the preview still applies to this page, it just is not kept.
  }
}
