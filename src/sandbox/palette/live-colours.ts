/**
 * live-colours.ts — the brand board's live values (§E19). The catalog holds token
 * NAMES only; the colours are read off the page after hydration, so a value shown here
 * is what the browser paints right now, through every `var()` and `color-mix()` in
 * tokens.css, under the current theme and preview preset. Nothing can go stale.
 *
 * The page is INJECTED — a reader and the change sources — so Vitest's node
 * environment tests all of this with stubs. useLiveColours.ts supplies the browser's.
 *
 * A store for useSyncExternalStore: `getSnapshot` returns the same Map until a change
 * source fires, so React re-renders once per theme or preset change, not per call.
 */
import { PRESET_CHANGE_EVENT } from '../preset-choice';
import type { Rgb } from './colour-math';

/** How a colour is read: resolve a CSS colour on the page, then turn it into bytes. */
export interface ColourReader {
  /** `var(--x)` → the computed colour string, e.g. `rgb(142, 232, 216)` or `oklab(…)`. */
  readonly resolve: (cssColour: string) => string;
  /** A computed colour string → sRGB bytes, or null when it cannot be read. */
  readonly toBytes: (resolved: string) => Rgb | null;
}

/** What can change a colour: a preset or storage event on `win`, a class on `<html>`. */
export interface ChangeSources {
  readonly win: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;
  /** Calls `onChange` when `<html>`'s class changes (the theme); returns a stop. */
  readonly observeRootClass: (onChange: () => void) => () => void;
}

/** Token name → its colour now. A token the page cannot read is absent. */
export type LiveColours = ReadonlyMap<string, Rgb>;

export interface ColourStore {
  readonly subscribe: (onChange: () => void) => () => void;
  readonly getSnapshot: () => LiveColours;
}

const NO_COLOURS: LiveColours = new Map();

export function readColours(tokens: readonly string[], reader: ColourReader): LiveColours {
  return new Map(
    tokens.flatMap((token) => {
      const rgb = reader.toBytes(reader.resolve(`var(${token})`));
      return rgb ? [[token, rgb] as const] : [];
    }),
  );
}

export function createColourStore(
  tokens: readonly string[],
  reader: ColourReader | null,
  sources: ChangeSources,
): ColourStore {
  const read = () => (reader ? readColours(tokens, reader) : NO_COLOURS);
  let snapshot: LiveColours | null = null;
  return {
    subscribe(onChange) {
      const refresh = () => {
        snapshot = read();
        onChange();
      };
      sources.win.addEventListener(PRESET_CHANGE_EVENT, refresh);
      sources.win.addEventListener('storage', refresh);
      const stopObserving = sources.observeRootClass(refresh);
      return () => {
        sources.win.removeEventListener(PRESET_CHANGE_EVENT, refresh);
        sources.win.removeEventListener('storage', refresh);
        stopObserving();
      };
    },
    getSnapshot() {
      snapshot ??= read();
      return snapshot;
    },
  };
}
