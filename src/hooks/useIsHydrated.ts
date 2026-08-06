/**
 * useIsHydrated — false while rendering on the server AND during the hydration
 * render, true from the first client-only render onward (Part D).
 *
 * WHY not `useState(false)` + a mount effect: that is a setState-in-an-effect, which
 * the React lint rules reject, and it costs a wasted render pass. `useSyncExternalStore`
 * with a never-firing subscription is the sanctioned form — React reads
 * `getServerSnapshot` for the server and hydration passes, then `getSnapshot`
 * afterwards, so markup matches on hydration with no mismatch and no effect.
 *
 * NOTE the asymmetry that makes this useful: on a fresh `createRoot` render (the dev
 * server and the exercise showcase) React uses `getSnapshot` immediately, so those
 * paths see `true` on their very first render and lose nothing. Only a hydrating
 * prerendered page passes through the `false` state.
 *
 * Use this for content that CANNOT exist server-side — a lazily-imported component,
 * a portal, anything reading `window` — so the static page states what it is instead
 * of shipping a Suspense boundary that fails server-side and gets thrown away.
 */
import { useSyncExternalStore } from 'react';

/** Nothing ever changes this value, so the subscription is a no-op unsubscribe. */
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
