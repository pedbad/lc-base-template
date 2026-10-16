/**
 * useLiveColours — the brand board's live colours, for React (§E19). live-colours.ts
 * holds the logic; this file supplies the browser's pieces and the hook.
 *
 * READING A COLOUR. A hidden probe `<span>` takes `color: var(--token)`; its computed
 * colour is whatever the browser resolved (hex, `color-mix()`, `oklch()` all arrive as
 * a colour string). A 1×1 canvas painted with that string turns any syntax into sRGB
 * bytes, so there is no CSS colour parser to write. Alpha is dropped: the board names
 * colours, and no token it shows is translucent.
 *
 * SERVER-SAFE. The sandbox mounts with `createRoot` and is never prerendered, but the
 * hook stays safe if that changes: `getServerSnapshot` is null and the store is built
 * only when `window` exists, so a server or hydrating render shows "—" (AGENTS.md hard
 * constraint 4). The probe is added when the store first subscribes, never in render. Nothing touches
 * `window` or `document` at module scope.
 */
import { useMemo, useSyncExternalStore } from 'react';
import {
  createColourStore,
  type ChangeSources,
  type ColourReader,
  type LiveColours,
} from './live-colours';

/** One reader for the page's life, so a re-render never adds a second probe. */
let browserReader: ColourReader | null | undefined;

function createBrowserReader(doc: Document): ColourReader | null {
  const canvas = doc.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  const probe = doc.createElement('span');
  probe.hidden = true;
  probe.dataset.slot = 'colour-probe';
  doc.body.append(probe);
  return {
    resolve(cssColour) {
      probe.style.color = cssColour;
      return getComputedStyle(probe).color;
    },
    toBytes(resolved) {
      if (!resolved) return null;
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = resolved;
      context.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data;
      return { r, g, b };
    },
  };
}

function pageReader(): ColourReader | null {
  browserReader ??= createBrowserReader(document);
  return browserReader;
}

function pageSources(): ChangeSources {
  return {
    win: window,
    observeRootClass(onChange) {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    },
  };
}

const noSubscription = () => () => {};
const noColours = (): LiveColours | null => null;

/** Each token's colour now, or null where the page cannot be read (render "—" then). */
export function useLiveColours(tokens: readonly string[]): LiveColours | null {
  const key = tokens.join(' ');
  const store = useMemo(
    () =>
      typeof window === 'undefined'
        ? null
        : createColourStore(key.split(' '), pageReader, pageSources()),
    [key],
  );
  return useSyncExternalStore(
    store?.subscribe ?? noSubscription,
    store?.getSnapshot ?? noColours,
    noColours,
  );
}
