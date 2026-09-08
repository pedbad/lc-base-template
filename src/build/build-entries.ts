/**
 * build-entries.ts — which HTML entries `vite build` emits.
 *
 * THE PROBLEM. This repo has two debug artifacts. `exercise-showcase.html` is a gallery
 * of every exercise engine driven by fixtures rather than course content;
 * `debug-sandbox.html` is the designer's palette/type/icon reference and the docs hub.
 * Neither is course content, and neither should exist on a deployed course. The showcase
 * was once an unconditional build entry, so `dist/exercise-showcase.html` shipped with
 * every deploy: unlinked from anywhere (Phase D decision D declined to link it), but
 * publicly reachable by URL on a live course. Open since Phase C · Part D §5, closed
 * 2026-09-03. The sandbox has the same exposure, so it follows the same rule.
 *
 * THE FIX. Both are opt-in per build, behind ONE flag. `bun run build` — what CI and any
 * deploy runs — emits the course only. `DEBUG=1 bun run build` adds both back.
 *
 * WHY ONE FLAG AND NOT TWO. Two flags would be two fail-closed rules to keep in step for
 * no gain: the dev server serves BOTH pages regardless of this list, so nobody needs a
 * deploy carrying one debug page and not the other. One name, one decision, one place a
 * mistake can be made.
 *
 * WHY `SHOWCASE` IS STILL RECOGNISED. `SHOWCASE=1 bun run build` is documented in dated
 * handover records and in the spec, and those are historical records — rewriting them to
 * match a renamed variable is worse than accepting an alias. It is an alias, not a second
 * code path: both names go through the same list and the same fail-closed check, and both
 * emit the same entries.
 *
 * WHAT THIS DOES NOT CHANGE: the dev server. Vite serves any root-level `.html` in dev
 * regardless of `rollupOptions.input`, so `bun run dev` still answers
 * `/exercise-showcase.html` and `/debug-sandbox.html`. Authoring content against the
 * gallery, or reading tokens in the sandbox, is unaffected — only the deployed artefact
 * loses them.
 *
 * WHY A MODULE AND NOT AN INLINE TERNARY: this is reachable from `vite.config.ts`, so it
 * must stay alias-free (`@/…` imports break `bun run dev` and `tsc -b` — see the config's
 * own note). Being a plain function also makes the fail-closed rule testable, which
 * matters more than the line count: a truthiness check would read `DEBUG=0` as ON and
 * publish both pages.
 */
import path from 'node:path';

/**
 * Env var names that opt a build into the debug entries. `DEBUG` is the documented
 * name; `SHOWCASE` is the pre-sandbox name, kept working (see the header).
 */
export const DEBUG_ENV_VARS = ['DEBUG', 'SHOWCASE'] as const;

/** Values that mean "yes, build it". Compared lowercased and trimmed. */
const TRUTHY = ['1', 'true'];

/** Rollup input name → root-level HTML file, for every debug entry. */
export const DEBUG_ENTRY_FILES = {
  showcase: 'exercise-showcase.html',
  sandbox: 'debug-sandbox.html',
} as const;

/** Whether one env value reads as an explicit yes. */
function isOn(raw: string | undefined): boolean {
  if (raw === undefined) return false;
  return TRUTHY.includes(raw.trim().toLowerCase());
}

/**
 * Whether this build should emit the debug entries.
 *
 * Fails CLOSED: absent, empty, explicitly off, or unrecognised all mean no. An unbuilt
 * debug page is a rebuild away; a published one is already public.
 */
export function isDebugRequested(env: Record<string, string | undefined>): boolean {
  return DEBUG_ENV_VARS.some((name) => isOn(env[name]));
}

/**
 * The debug additions to `build.rollupOptions.input`, resolved against `rootDir`.
 * Empty unless the flag is on, so spreading it into the input map is always safe.
 */
export function debugEntries(
  env: Record<string, string | undefined>,
  rootDir: string,
): Record<string, string> {
  if (!isDebugRequested(env)) return {};
  return Object.fromEntries(
    Object.entries(DEBUG_ENTRY_FILES).map(([name, file]) => [name, path.resolve(rootDir, file)]),
  );
}
