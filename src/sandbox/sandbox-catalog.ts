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
 * The primitives also carry what a client reads on the brand board (§E19): a plain name,
 * a one-sentence job, a partner token and an optional share. That is prose and judgement,
 * not colour — the live values come from the page, never from here.
 *
 * `sandbox-catalog.test.ts` joins these names back to `palette.css`, `tokens.css` and
 * `public/icons.svg` in BOTH directions, so a renamed token fails the suite and a newly
 * added one fails until it is listed.
 *
 * BROWSER-SAFE: plain data, no `node:fs`, no Vite-only syntax. The test does the file
 * reading, not this module.
 */
import type { VariantProps } from 'class-variance-authority';
import type { CalloutVariant } from '@/components/shell/Callout';
import type { buttonVariants } from '@/components/ui/button';

/** One primitive as the brand board shows it (§E19). Names only, never a value. */
export interface PrimitiveColour {
  readonly token: string;
  /** What a client calls it: "Cambridge Blue", not `--cam-blue`. */
  readonly name: string;
  /** Its job in one plain sentence. */
  readonly job: string;
  /** The primitive it pairs with: the swatch's "Aa" and the contrast badge use it. */
  readonly partner: string;
  /**
   * Its share of the course's visual weight, for the "at a glance" bar. A design
   * judgement, tuned by eye; a primitive without one is not in the bar.
   */
  readonly share?: number;
}

/** A group of primitive colours — Layer 1, the only place real values live. */
export interface PrimitiveGroup {
  readonly title: string;
  readonly note: string;
  readonly colours: readonly PrimitiveColour[];
}

/** How the brand board draws a group of semantic tokens in use (§E19). */
export type SpecimenKind = 'surfaces' | 'actions' | 'states' | 'sidebar' | 'lines' | 'chart';

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
  readonly specimen: SpecimenKind;
}

/** Tokens with no text partner — lines, rings, and the data-viz ramp. */
export interface StripGroup {
  readonly title: string;
  readonly note: string;
  readonly tokens: readonly string[];
  readonly specimen: SpecimenKind;
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
 * Layer 1 — the primitives, grouped by the job they do for a client. Editing one of these
 * re-skins everything downstream, which is why they come first on the page.
 */
export const PRIMITIVE_SWATCHES: readonly PrimitiveGroup[] = [
  {
    title: 'Core — the Cambridge Blue family',
    note: 'The brand. Cambridge Blue leads; Dark Blue carries text and the main buttons.',
    colours: [
      {
        token: '--cam-blue',
        name: 'Cambridge Blue',
        job: 'The prominent brand colour.',
        partner: '--cam-dark-blue',
        share: 16,
      },
      {
        token: '--cam-light-blue',
        name: 'Cambridge Light Blue',
        job: 'A soft brand tint for highlights.',
        partner: '--cam-dark-blue',
      },
      {
        token: '--cam-warm-blue',
        name: 'Cambridge Warm Blue',
        job: 'A brighter brand blue for details.',
        partner: '--slate-4',
        share: 6,
      },
      {
        token: '--cam-dark-blue',
        name: 'Cambridge Dark Blue',
        job: 'The accent, and the colour of the main buttons.',
        partner: '--white',
        share: 10,
      },
    ],
  },
  {
    title: 'Neutrals — Cambridge Slate and paper',
    note: 'Most of every page. Text is Slate 4, never pure black; the page ground is Paper.',
    colours: [
      {
        token: '--paper',
        name: 'Paper',
        job: 'The page ground, off-white to spare dyslexic readers glare.',
        partner: '--slate-4',
        share: 40,
      },
      {
        token: '--white',
        name: 'White',
        job: 'Cards, so they lift off the paper.',
        partner: '--slate-4',
      },
      { token: '--slate-1', name: 'Slate 1', job: 'The lightest surface.', partner: '--slate-4' },
      { token: '--slate-2', name: 'Slate 2', job: 'Lines and borders.', partner: '--slate-4' },
      { token: '--slate-3', name: 'Slate 3', job: 'Secondary text.', partner: '--white' },
      { token: '--slate-4', name: 'Slate 4', job: 'Body text.', partner: '--paper', share: 22 },
    ],
  },
  {
    title: 'Accents',
    note: 'Used alongside the core, never alone: charts, states and the odd highlight.',
    colours: [
      {
        token: '--cam-crest',
        name: 'Crest',
        job: 'A warm accent for charts.',
        partner: '--slate-4',
        share: 2,
      },
      {
        token: '--cam-cherry',
        name: 'Cherry',
        job: 'A strong accent for charts.',
        partner: '--white',
        share: 2,
      },
      {
        token: '--cam-purple',
        name: 'Purple',
        job: 'A cool accent for charts.',
        partner: '--slate-4',
        share: 2,
      },
      {
        token: '--cam-indigo',
        name: 'Indigo',
        job: 'A deep accent for charts.',
        partner: '--white',
        share: 2,
      },
      {
        token: '--cam-dark-crest',
        name: 'Dark Crest',
        job: 'Errors and wrong answers.',
        partner: '--white',
        share: 2,
      },
    ],
  },
  {
    title: 'Feedback — greens and ambers',
    note: 'Two or three of each on purpose: one per job, each passing AA where it is used.',
    colours: [
      {
        token: '--cam-green',
        name: 'Green',
        job: 'Bright green for charts.',
        partner: '--slate-4',
      },
      {
        token: '--cam-green-deep',
        name: 'Deep Green',
        job: 'Correct answers on light surfaces.',
        partner: '--white',
      },
      {
        token: '--cam-green-soft',
        name: 'Soft Green',
        job: 'Correct answers on dark surfaces.',
        partner: '--slate-4',
      },
      {
        token: '--amber-deep',
        name: 'Deep Amber',
        job: 'Warnings on light surfaces.',
        partner: '--white',
      },
      {
        token: '--amber-soft',
        name: 'Soft Amber',
        job: 'Warnings on dark surfaces.',
        partner: '--slate-4',
      },
    ],
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
    specimen: 'surfaces',
    note: 'The page, cards and popovers, each with the text colour meant to sit on it.',
    pairs: [
      { token: '--background', on: '--foreground', use: 'the page itself' },
      { token: '--card', on: '--card-foreground', use: 'panels and lesson cards' },
      { token: '--popover', on: '--popover-foreground', use: 'menus, tooltips, dialogs' },
    ],
  },
  {
    title: 'Actions',
    specimen: 'actions',
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
    specimen: 'states',
    note: 'Answer feedback lives here. Both are AA against their own foreground.',
    pairs: [
      { token: '--destructive', on: '--destructive-foreground', use: 'wrong answers, errors' },
      { token: '--success', on: '--success-foreground', use: 'correct answers' },
      { token: '--warning', on: '--warning-foreground', use: 'cautions' },
    ],
  },
  {
    title: 'Sidebar',
    specimen: 'sidebar',
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
    specimen: 'lines',
    note: 'Borders, input outlines and the focus ring. Never set these per component.',
    tokens: ['--border', '--input', '--ring', '--sidebar-border', '--sidebar-ring'],
  },
  {
    title: 'Data viz ramp',
    specimen: 'chart',
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

/**
 * The alert variants `AlertsSection` shows (maintainer, 2026-10-07): DATA ONLY. The
 * look belongs to `Callout`, the component lessons render, so the sandbox can never
 * drift from them — it holds no colour, icon or class of its own.
 */
export interface AlertExample {
  readonly variant: CalloutVariant;
  readonly title: string;
  readonly body: string;
}

export const ALERT_EXAMPLES: readonly AlertExample[] = [
  { variant: 'info', title: 'Info', body: 'Neutral guidance and learning instructions.' },
  { variant: 'success', title: 'Success', body: 'The action worked and the learner can go on.' },
  { variant: 'warning', title: 'Warning', body: 'Something needs attention before continuing.' },
  { variant: 'danger', title: 'Danger', body: 'An error occurred and needs correcting.' },
];

type ButtonProps = VariantProps<typeof buttonVariants>;

/**
 * The `Button` variants and sizes `ButtonsSection` shows (maintainer, 2026-10-07, after
 * the french-lo-1 sandbox's "Buttons (Current App Types)"): DATA ONLY, the look belongs
 * to `src/components/ui/button.tsx`. Each is a `Record` over the cva keys, so a variant
 * or size added to Button does not compile until it is listed here too.
 */
export const BUTTON_VARIANTS: Readonly<Record<NonNullable<ButtonProps['variant']>, string>> = {
  default: 'Primary',
  secondary: 'Secondary',
  outline: 'Outline',
  ghost: 'Ghost',
  destructive: 'Destructive',
  link: 'Link',
};

/** `text` sizes take a label; `icon` sizes are square and icon-only. */
export const BUTTON_SIZES: Readonly<Record<NonNullable<ButtonProps['size']>, 'text' | 'icon'>> = {
  xs: 'text',
  sm: 'text',
  default: 'text',
  lg: 'text',
  'icon-xs': 'icon',
  'icon-sm': 'icon',
  icon: 'icon',
  'icon-lg': 'icon',
};
