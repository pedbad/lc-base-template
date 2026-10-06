/**
 * The one keyboard focus indicator the page chrome draws — both headers, the LO nav
 * and the landing rail's panel (header a11y audit, 2026-10-06, TODO §D6).
 *
 * It is the Tailwind spelling of the rule the plain-CSS chrome already uses
 * (`.skip-link`, `.lesson-rail-toggle`, `.back-to-top`): a 2px solid `--ring` outline
 * offset 2px. One shape everywhere, for two measured reasons:
 *
 *   - An OUTLINE, never a box-shadow ring. Windows forced colours drops `box-shadow`,
 *     so a ring drawn over `outline-none` leaves no indicator at all there.
 *   - FULL `--ring`, never the browser's `outline: auto` in `ring/50` that the base
 *     layer falls back to. That measured 2.88:1 on the light header, under the 3:1
 *     SC 1.4.11 asks of a focus indicator; full `--ring` is 12.4:1 light, 7.7:1 dark.
 *
 * `outline-solid` is spelled out because a control whose base classes include
 * `outline-none` (the vendored Switch) sets `--tw-outline-style: none`, which a bare
 * `outline-2` would inherit and draw nothing.
 */
export const FOCUS_OUTLINE =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring';
