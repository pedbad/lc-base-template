/**
 * PresetPicker.test.tsx — the drop-down's markup: a labelled native select whose
 * first option is the build as it is, then one option per preset.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PresetPicker } from './PresetPicker';
import { presetsFromFiles } from './preset-preview';

const presets = presetsFromFiles({
  'tokens-variant-a-x-ray.css': ':root { --primary: var(--a); }',
  'tokens-variant-b-yankee.css': ':root { --primary: var(--b); }',
});

const render = (activeCss: string) =>
  renderToStaticMarkup(<PresetPicker presets={presets} activeCss={activeCss} />);

describe('PresetPicker', () => {
  it('is a native select with a visible label', () => {
    const html = render('');
    const id = /<select[^>]*id="([^"]+)"/.exec(html)?.[1];
    expect(id).toBeTruthy();
    expect(html).toMatch(new RegExp(`<label[^>]*for="${id}"[^>]*>Preview preset</label>`));
  });

  it('offers "as built" first and selected, then every preset in order', () => {
    const options = [...render('').matchAll(/<option value="([^"]*)"[^>]*>([^<]*)</g)].map((m) => [
      m[1],
      m[2],
    ]);
    expect(options).toEqual([
      ['', 'As built (tokens.css)'],
      ['a-x-ray', 'A · X Ray'],
      ['b-yankee', 'B · Yankee'],
    ]);
    expect(render('')).toMatch(/<option value=""[^>]*selected/);
  });

  it('names the preset tokens.css was copied from in the "as built" option', () => {
    expect(render('/* active */ :root { --primary: var(--b); }')).toContain(
      'As built (tokens.css = B · Yankee)',
    );
  });

  // §E18 follow-up: presets differ only in the primary and ring colours, so the change
  // must be visible where you click, wherever on the page you are.
  it('shows a live sample of the primary colour and its text colour, hidden from screen readers', () => {
    const html = render('');
    const sample =
      /<span[^>]*data-slot="preset-sample"[^>]*>.*?<\/span><\/span>/s.exec(html)?.[0] ?? '';
    expect(sample).toContain('aria-hidden="true"');
    expect(sample).toMatch(/class="[^"]*\bbg-primary\b[^"]*\btext-primary-foreground\b/);
    expect(sample).toMatch(/class="[^"]*\brounded-full\b[^"]*\bbg-primary\b/);
  });

  // Maintainer, 2026-10-16: a narrow column, so the theme switch fits back at the top
  // right — the label above the drop-down, the samples and the hint below it.
  it('stacks the label above the select, and the samples and the hint below it', () => {
    const html = render('');
    const at = (needle: string) => html.indexOf(needle);
    expect(at('<label')).toBeGreaterThan(-1);
    expect(at('<label')).toBeLessThan(at('<select'));
    expect(at('</select>')).toBeLessThan(at('data-slot="preset-sample"'));
    expect(at('data-slot="preset-sample"')).toBeLessThan(at('Presets change'));
    // No row holds the label and the select side by side.
    const labelParent = /<div class="([^"]*)"><label/.exec(html)?.[1] ?? '';
    expect(labelParent).toMatch(/\bflex-col\b/);
  });

  // Maintainer, 2026-10-16: small icon-only buttons in several variants, as the audio
  // button and the exercise footer use them, repaint with the preset too.
  it('samples icon-only buttons in several variants, none of them focusable', () => {
    const html = render('');
    const start = html.indexOf('data-slot="preset-sample"');
    const sample = html.slice(start, html.indexOf('Presets change'));
    const icons = [...sample.matchAll(/data-slot="preset-icon-sample"[^>]*class="([^"]*)"/g)].map(
      (m) => m[1],
    );
    expect(icons.length).toBeGreaterThanOrEqual(4);
    expect(icons.some((c) => /\bbg-primary\b/.test(c))).toBe(true);
    expect(icons.some((c) => /\bbg-secondary\b/.test(c))).toBe(true);
    expect(icons.some((c) => /\bborder-border\b/.test(c))).toBe(true);
    expect(icons.some((c) => /\btext-destructive-text\b/.test(c))).toBe(true);
    expect(sample.match(/<svg/g)?.length).toBeGreaterThanOrEqual(icons.length);
    // Decorative inside aria-hidden, so nothing in it may take focus.
    expect(sample).not.toMatch(/<button|<a |tabindex/);
  });

  it("says what a preset changes, as the select's description", () => {
    const html = render('');
    const describedBy = /<select[^>]*aria-describedby="([^"]+)"/.exec(html)?.[1];
    expect(describedBy).toBeTruthy();
    expect(html).toMatch(
      new RegExp(`id="${describedBy}"[^>]*>Presets change the button and focus-ring colours`),
    );
  });
});
