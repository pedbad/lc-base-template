/**
 * prefersReducedMotion — the ONE reduced-motion read for the whole app (§D · D4).
 *
 * Extracted from LoAccordion, which had it as a file-local function, because the
 * back-to-top scroll is a second consumer and two copies of a media query is how the
 * two drift apart — the same reasoning that gave `headingId` its own module (§5).
 *
 * CALL IT FROM AN EVENT HANDLER OR AN EFFECT, NEVER AT MODULE SCOPE OR DURING RENDER.
 * `bun run build` prerenders 26 documents in Bun, where there is no `window`: a
 * module-scope read would throw at import time, and a read during render would make
 * the client's first render disagree with the prerendered markup. The guards below
 * make the call SAFE in those places rather than correct — the timing rule still
 * stands. LoAccordion's two call sites (`:98`, `:126`) are both effects.
 *
 * WHY BOTH GUARDS. `typeof window` covers the prerender; `typeof matchMedia` covers
 * user agents that expose `window` without it, which is what makes this fail closed —
 * an unknown environment gets motion rather than an exception.
 */

/** True when the reader has asked their OS to reduce motion. False if unknowable. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
