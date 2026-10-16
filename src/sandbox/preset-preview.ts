/**
 * preset-preview.ts — the sandbox's preset drop-down (TODO §E18): try a
 * `tokens-variant-*.css` on the whole page, light and dark, without a rebuild.
 *
 * PREVIEW ONLY. Nothing here changes what ships. The real switch is still DESIGNER.md
 * Job 2 — copy a variant over `tokens.css` — and a reload drops the preview.
 *
 * HOW IT RECOLOURS. Each preset file declares the same tokens as `tokens.css`, on the
 * same selectors (`:root`, `.dark`), inside the same `@layer base`. Its text goes into
 * one `<style>` at the END of `<head>`: same layer, same specificity, later in source
 * order, so it wins. Every swatch and component reads `var(--token)`, so all of them
 * follow, and the theme switch keeps working because the `.dark` block comes along.
 *
 * WHY THE RAW TEXT AND NOT A `<link>`. A text swap is synchronous, so a choice repaints
 * once, with no unstyled flash while a stylesheet loads, and no URL to route through
 * the base (AGENTS.md hard constraint 3).
 *
 * ON EVERY PAGE, NOT ONLY HERE. The choice is remembered (preset-choice.ts) and applied
 * by preset-preview-boot.ts, which dev and `DEBUG=1` builds add to every page and a
 * normal build adds to none (src/build/preset-preview-plugin.ts).
 *
 * NO LIST TO KEEP. The glob below IS the list: a new `tokens-variant-*.css` appears in
 * the drop-down by itself, named from its file name.
 */

/** One preset the drop-down offers. */
export interface TokenPreset {
  /** The file name between `tokens-variant-` and `.css`, e.g. `a-cambridge-blue`. */
  readonly id: string;
  /** What the drop-down shows, e.g. `A · Cambridge Blue`. */
  readonly label: string;
  /** The file's text, injected as it is. */
  readonly css: string;
}

/** The `<style>` element a chosen preset lives in. */
export const PRESET_STYLE_ID = 'sandbox-token-preset';

const PRESET_FILE = /tokens-variant-([a-z0-9-]+)\.css$/;

const capitalise = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/** `a-cambridge-blue` → `A · Cambridge Blue`. */
function labelFor(id: string): string {
  const [letter = '', ...words] = id.split('-');
  return `${letter.toUpperCase()} · ${words.map(capitalise).join(' ')}`;
}

/** Turns a glob result (path → file text) into presets, sorted by file name. */
export function presetsFromFiles(files: Readonly<Record<string, string>>): TokenPreset[] {
  return Object.entries(files)
    .flatMap(([file, css]) => {
      const id = PRESET_FILE.exec(file)?.[1];
      return id ? [{ id, label: labelFor(id), css }] : [];
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** The declarations alone: comments and whitespace say nothing about the colours. */
const declarations = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, '');

/**
 * The preset `tokens.css` was copied from, if any. A copy differs only in its header
 * comment (DESIGNER.md Job 2 says to copy, never hand-edit), so comments are ignored.
 */
export function matchingPreset(
  activeCss: string,
  presets: readonly TokenPreset[],
): TokenPreset | undefined {
  const active = declarations(activeCss);
  return presets.find((preset) => declarations(preset.css) === active);
}

/**
 * Shows `css` on the page, or — given `null` — removes the preview so `tokens.css`
 * applies again. Call it from an event handler: it touches the DOM.
 */
export function applyTokenPreset(doc: Document, css: string | null): void {
  const existing = doc.getElementById(PRESET_STYLE_ID);
  if (css === null) {
    existing?.remove();
    return;
  }
  const style = existing ?? doc.createElement('style');
  style.id = PRESET_STYLE_ID;
  style.textContent = css;
  // Re-appended every time: a stylesheet added after ours (an HMR update) would win.
  doc.head.append(style);
}

/** Every preset file in `src/styles/`, as text. */
export const TOKEN_PRESETS: readonly TokenPreset[] = presetsFromFiles(
  import.meta.glob<string>('../styles/tokens-variant-*.css', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
);

/** The active `tokens.css`, as text, so the drop-down can say which preset it is. */
export { default as ACTIVE_TOKENS_CSS } from '../styles/tokens.css?raw';
