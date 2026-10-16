/**
 * ColourCard.test.tsx — ② of the brand board (§E19): one primitive's name, job, live
 * values and contrast, with the token folded away for designers.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ColourCard } from './ColourCard';

const colour = {
  token: '--cam-blue',
  name: 'Cambridge Blue',
  job: 'The prominent brand colour.',
  partner: '--cam-dark-blue',
};
const live = new Map([
  ['--cam-blue', { r: 142, g: 232, b: 216 }],
  ['--cam-dark-blue', { r: 19, g: 56, b: 68 }],
]);

const render = (values: typeof live | null) =>
  renderToStaticMarkup(
    <ColourCard colour={colour} partnerName="Cambridge Dark Blue" live={values} />,
  );

describe('ColourCard', () => {
  it('leads with the name and the job, not the token', () => {
    const html = render(live);
    expect(html).toMatch(/<h5[^>]*>Cambridge Blue<\/h5>/);
    expect(html).toContain('The prominent brand colour.');
  });

  it('shows dashes before the colours are read', () => {
    const html = render(null);
    expect(html).toMatch(/data-slot="hex"[^>]*>—</);
    expect(html).toContain('Contrast with Cambridge Dark Blue: —');
    expect(html).not.toMatch(/#[0-9A-F]{6}/);
  });

  it('shows HEX, RGB and the verdict once they are', () => {
    const html = render(live);
    expect(html).toMatch(/data-slot="hex"[^>]*>#8EE8D8</);
    expect(html).toContain('RGB 142 232 216');
    expect(html).toMatch(/>AAA<\/span>/);
  });

  it('paints the swatch and its "Aa" from the colour and its partner, hidden from screen readers', () => {
    const swatch = /<div[^>]*aria-hidden="true"[^>]*style="([^"]*)"[^>]*>Aa<\/div>/.exec(
      render(live),
    );
    expect(swatch?.[1]).toContain('background:var(--cam-blue)');
    expect(swatch?.[1]).toContain('color:var(--cam-dark-blue)');
  });

  it('folds the token and its file into a details element', () => {
    expect(render(live)).toMatch(
      /<details[^>]*><summary[^>]*>Token<\/summary>.*<code>--cam-blue<\/code>.*src\/styles\/palette\.css/s,
    );
  });
});
