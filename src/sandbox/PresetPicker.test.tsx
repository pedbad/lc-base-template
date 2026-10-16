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
});
