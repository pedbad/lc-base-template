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

  it("says what a preset changes, as the select's description", () => {
    const html = render('');
    const describedBy = /<select[^>]*aria-describedby="([^"]+)"/.exec(html)?.[1];
    expect(describedBy).toBeTruthy();
    expect(html).toMatch(
      new RegExp(`id="${describedBy}"[^>]*>Presets change the button and focus-ring colours`),
    );
  });
});
