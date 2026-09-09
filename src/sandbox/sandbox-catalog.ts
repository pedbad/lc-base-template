/**
 * sandbox-catalog.ts — WHAT the debug sandbox shows, as names only (buildlist 16).
 *
 * The sandbox is a reference for the designer: every colour token, both font families
 * and every icon in the sprite, on one page, so "what may I edit?" has a visual answer
 * that is not a stylesheet. This file is the list; the sections render it.
 *
 * NAMES, NEVER VALUES. Not one hex or pixel length appears here. A swatch renders
 * `var(--slate-2)`, so the square shows whatever `palette.css` currently says — which
 * is the whole promise of DESIGNER.md's one-file re-skin, and the only way this page
 * cannot drift from the theme. A catalog holding copies of the values would be the
 * hand-copied duplication the docs hub exists to avoid, one layer down.
 *
 * `sandbox-catalog.test.ts` joins these names back to `palette.css`, `tokens.css` and
 * `public/icons.svg` in BOTH directions, so a renamed token fails the suite and a newly
 * added one fails until it is listed.
 *
 * BROWSER-SAFE: plain data, no `node:fs`, no Vite-only syntax. The test does the file
 * reading, not this module.
 */

/** A group of primitive colour tokens — Layer 1, the only place real values live. */
export interface PrimitiveGroup {
  readonly title: string;
  readonly note: string;
  readonly tokens: readonly string[];
}

/** A semantic surface and the text token meant to sit on it — Layer 2. */
export interface SemanticPair {
  readonly token: string;
  readonly on: string;
  /** What the pair is FOR, in the designer's terms rather than the token's. */
  readonly use: string;
}

/** A group of semantic pairs. */
export interface SemanticGroup {
  readonly title: string;
  readonly note: string;
  readonly pairs: readonly SemanticPair[];
}

/** Tokens with no text partner — lines, rings, and the data-viz ramp. */
export interface StripGroup {
  readonly title: string;
  readonly note: string;
  readonly tokens: readonly string[];
}

/** One font family, shown at the sizes it is actually used at. */
export interface TypeSpecimen {
  readonly font: string;
  readonly label: string;
  readonly note: string;
  /** Tailwind utility that selects this family, so the specimen uses the real path. */
  readonly utility: string;
}

/**
 * Layer 1 — the primitives, grouped as `palette.css` groups them. Editing one of these
 * re-skins everything downstream, which is why they come first on the page.
 */
export const PRIMITIVE_SWATCHES: readonly PrimitiveGroup[] = [
  {
    title: 'Greyscale — Cambridge Slate',
    note: 'Text is Slate 4, never pure black. Slate 2 is lines and borders.',
    tokens: ['--white', '--slate-1', '--slate-2', '--slate-3', '--slate-4'],
  },
  {
    title: 'Core — Cambridge Blue family',
    note: 'Cambridge Blue is the prominent brand colour; Dark Blue is an accent.',
    tokens: ['--cam-blue', '--cam-light-blue', '--cam-warm-blue', '--cam-dark-blue'],
  },
  {
    title: 'Secondary accents',
    note: 'Used alongside the core family, never alone: states and data viz.',
    tokens: ['--cam-crest', '--cam-cherry', '--cam-purple', '--cam-indigo', '--cam-dark-crest'],
  },
  {
    title: 'Greens — three, on purpose',
    note: 'Bright for charts, deep for AA success text on light, soft for AA on dark.',
    tokens: ['--cam-green', '--cam-green-deep', '--cam-green-soft'],
  },
] as const;

/**
 * Layer 2 — the semantic pairs. These are what components name, and every one of them
 * flips between light and dark, so the page is worth looking at twice with the theme
 * toggle. The `on` token is the text colour the pair guarantees contrast for.
 */
export const SEMANTIC_SWATCHES: readonly SemanticGroup[] = [
  {
    title: 'Surfaces',
    note: 'The page, cards and popovers, each with the text colour meant to sit on it.',
    pairs: [
      { token: '--background', on: '--foreground', use: 'the page itself' },
      { token: '--card', on: '--card-foreground', use: 'panels and lesson cards' },
      { token: '--popover', on: '--popover-foreground', use: 'menus, tooltips, dialogs' },
    ],
  },
  {
    title: 'Actions',
    note: 'Primary is the CTA colour a preset switch changes — see DESIGNER.md Job 2.',
    pairs: [
      { token: '--primary', on: '--primary-foreground', use: 'the main call to action' },
      { token: '--secondary', on: '--secondary-foreground', use: 'quieter buttons' },
      { token: '--accent', on: '--accent-foreground', use: 'hover and highlight' },
      { token: '--muted', on: '--muted-foreground', use: 'disabled and helper text' },
    ],
  },
  {
    title: 'States',
    note: 'Answer feedback lives here. Both are AA against their own foreground.',
    pairs: [
      { token: '--destructive', on: '--destructive-foreground', use: 'wrong answers, errors' },
      { token: '--success', on: '--success-foreground', use: 'correct answers' },
    ],
  },
  {
    title: 'Sidebar',
    note: 'A neutral surface with brand-blue actions, kept separate from the page.',
    pairs: [
      { token: '--sidebar', on: '--sidebar-foreground', use: 'the sidebar surface' },
      { token: '--sidebar-primary', on: '--sidebar-primary-foreground', use: 'its actions' },
      { token: '--sidebar-accent', on: '--sidebar-accent-foreground', use: 'its hover state' },
    ],
  },
] as const;

/** Tokens shown as bars: nothing sits on top of them, so there is no pair to show. */
export const SWATCH_STRIPS: readonly StripGroup[] = [
  {
    title: 'Lines and rings',
    note: 'Borders, input outlines and the focus ring. Never set these per component.',
    tokens: ['--border', '--input', '--ring', '--sidebar-border', '--sidebar-ring'],
  },
  {
    title: 'Data viz ramp',
    note: 'Five chart slots, in order. Charts pick these up by index, not by name.',
    tokens: ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'],
  },
] as const;

/**
 * The two families, and only two by decision (DESIGNER.md Job 3). Both are declared in
 * `palette.css` rather than a preset file, so switching presets never moves the type.
 */
export const TYPE_SPECIMENS: readonly TypeSpecimen[] = [
  {
    font: '--font-display',
    label: 'Display — Feijoa',
    note: 'Commercial and git-ignored. Absent here, this renders as Open Sans.',
    utility: 'font-heading',
  },
  {
    font: '--font-body',
    label: 'Body — Open Sans',
    note: 'The free public default. Arial is the specified system fallback.',
    utility: 'font-sans',
  },
] as const;

/**
 * The sizes worth eyeballing. Every one is a Tailwind step, not a raw length: guard f
 * bans raw `px` in CSS and the same discipline applies here by using utilities.
 */
export const TYPE_SCALE: readonly { readonly utility: string; readonly label: string }[] = [
  { utility: 'text-3xl', label: 'text-3xl — page title' },
  { utility: 'text-xl', label: 'text-xl — section heading' },
  { utility: 'text-base', label: 'text-base — body copy' },
  { utility: 'text-sm', label: 'text-sm — helper and captions' },
] as const;

/**
 * Every `<symbol>` in `public/icons.svg`, in sprite order. The preview exists because
 * an icon's id is the only handle on it and ids are invisible in the file.
 */
export const SANDBOX_ICON_IDS: readonly string[] = [
  'bluesky-icon',
  'discord-icon',
  'documentation-icon',
  'github-icon',
  'social-icon',
  'x-icon',
  // The five social marks the footer's colophon links (§D · D1).
  //
  // PREFIXED `brand-`, not `social-`, and not following the `<name>-icon` convention
  // above, because both alternatives collide. `social-*` also matches the generic
  // `social-icon` already in this list; `x-icon` is taken by a different drawing that
  // carries a hardcoded fill. The collision is not cosmetic — the theme test below
  // selects these marks BY PREFIX, so a prefix that also catches `social-icon` makes
  // that test fail on a symbol it was never about. It did, on its first run.
  //
  // These five are `fill="currentColor"`, so they follow the theme wherever they are
  // placed. That is asserted rather than trusted — see sandbox-catalog.test.ts.
  'brand-facebook',
  'brand-x',
  'brand-youtube',
  'brand-linkedin',
  'brand-instagram',
] as const;
