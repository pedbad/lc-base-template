/**
 * build-entries.ts — which HTML entries `vite build` emits.
 *
 * THE PROBLEM. `exercise-showcase.html` is a debug gallery of every exercise engine,
 * driven by fixtures rather than course content. It was an unconditional build entry,
 * so `dist/exercise-showcase.html` shipped with every deploy: unlinked from anywhere
 * (Phase D decision D declined to link it), but publicly reachable by URL on a live
 * course. Open since Phase C · Part D §5.
 *
 * THE FIX. The showcase is opt-in per build. `bun run build` — what CI and any deploy
 * runs — emits the course only. `SHOWCASE=1 bun run build` adds it back, for when the
 * no-JS/production behaviour of the gallery itself is what needs checking.
 *
 * WHAT THIS DOES NOT CHANGE: the dev server. Vite serves any root-level `.html` in
 * dev regardless of `rollupOptions.input`, so `bun run dev` still answers
 * `/exercise-showcase.html`. Authoring content against the gallery is unaffected —
 * only the deployed artefact loses it.
 *
 * WHY A MODULE AND NOT AN INLINE TERNARY: this is reachable from `vite.config.ts`, so
 * it must stay alias-free (`@/…` imports break `bun run dev` and `tsc -b` — see the
 * config's own note). Being a plain function also makes the fail-closed rule testable,
 * which matters more than the line count: a truthiness check would read `SHOWCASE=0`
 * as ON and publish the gallery.
 */

/** Env var that opts a build into emitting the showcase entry. */
export const SHOWCASE_ENV_VAR = 'SHOWCASE';

/** Values that mean "yes, build it". Compared lowercased and trimmed. */
const TRUTHY = ['1', 'true'];

/**
 * Whether this build should emit the exercise showcase.
 *
 * Fails CLOSED: absent, empty, explicitly off, or unrecognised all mean no. An
 * unbuilt showcase is a rebuild away; a published one is already public.
 */
export function isShowcaseRequested(env: Record<string, string | undefined>): boolean {
  const raw = env[SHOWCASE_ENV_VAR];
  if (raw === undefined) return false;
  return TRUTHY.includes(raw.trim().toLowerCase());
}
