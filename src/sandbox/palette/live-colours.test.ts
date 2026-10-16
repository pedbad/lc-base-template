/**
 * live-colours.test.ts — the store behind the brand board's live values (§E19). The
 * page is injected (a reader and the change sources), so this runs in Vitest's node
 * environment with stubs and a plain EventTarget; useLiveColours.ts supplies the real
 * browser pieces.
 */
import { describe, expect, it } from 'vitest';
import { PRESET_CHANGE_EVENT } from '../preset-choice';
import {
  createColourStore,
  readColours,
  type ChangeSources,
  type ColourReader,
} from './live-colours';
import type { Rgb } from './colour-math';

/** A reader over a table the test can change, as a theme switch changes the page. */
function tableReader(table: Map<string, Rgb>): ColourReader {
  return {
    resolve: (css) => css,
    toBytes: (resolved) => table.get(resolved) ?? null,
  };
}

function stubSources() {
  const win = new EventTarget();
  let onRootClass: (() => void) | null = null;
  const sources: ChangeSources = {
    win,
    observeRootClass: (onChange) => {
      onRootClass = onChange;
      return () => {
        onRootClass = null;
      };
    },
  };
  return {
    win,
    sources,
    flipTheme: () => onRootClass?.(),
    isObserving: () => onRootClass !== null,
  };
}

const BLUE = { r: 142, g: 232, b: 216 };
const DARK = { r: 19, g: 56, b: 68 };

describe('readColours', () => {
  it('reads each token through var() and leaves out what it cannot read', () => {
    const reader = tableReader(new Map([['var(--cam-blue)', BLUE]]));
    const colours = readColours(['--cam-blue', '--missing'], reader);
    expect([...colours]).toEqual([['--cam-blue', BLUE]]);
  });
});

describe('createColourStore', () => {
  it('returns the same snapshot until something changes', () => {
    const { sources } = stubSources();
    const store = createColourStore(
      ['--cam-blue'],
      tableReader(new Map([['var(--cam-blue)', BLUE]])),
      sources,
    );
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it('reads again on a theme flip, a preset change and a storage event', () => {
    const table = new Map([['var(--primary)', BLUE]]);
    const { win, sources, flipTheme } = stubSources();
    const store = createColourStore(['--primary'], tableReader(table), sources);
    let notified = 0;
    store.subscribe(() => {
      notified += 1;
    });
    expect(store.getSnapshot().get('--primary')).toEqual(BLUE);

    table.set('var(--primary)', DARK);
    flipTheme();
    expect(store.getSnapshot().get('--primary')).toEqual(DARK);

    win.dispatchEvent(new Event(PRESET_CHANGE_EVENT));
    win.dispatchEvent(new Event('storage'));
    expect(notified).toBe(3);
  });

  it('stops listening when unsubscribed', () => {
    const { win, sources, isObserving } = stubSources();
    const store = createColourStore(['--primary'], tableReader(new Map()), sources);
    let notified = 0;
    const unsubscribe = store.subscribe(() => {
      notified += 1;
    });
    unsubscribe();
    win.dispatchEvent(new Event(PRESET_CHANGE_EVENT));
    expect(notified).toBe(0);
    expect(isObserving()).toBe(false);
  });

  // A browser that gives no 2D canvas: the board still renders, its values stay "—".
  it('holds no colours when there is no reader', () => {
    const { sources } = stubSources();
    expect(createColourStore(['--primary'], null, sources).getSnapshot().size).toBe(0);
  });
});
