/**
 * ContrastBadge.test.tsx — the verdict chip on every card and token fold (§E19).
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ContrastBadge } from './ContrastBadge';

const WHITE = { r: 255, g: 255, b: 255 };

describe('ContrastBadge', () => {
  it('shows a dash until both colours are known', () => {
    const html = renderToStaticMarkup(<ContrastBadge a={WHITE} b={undefined} withName="Paper" />);
    expect(html).toContain('Contrast with Paper: —');
  });

  it('names the verdict and the ratio, rounded down', () => {
    const html = renderToStaticMarkup(
      <ContrastBadge a={WHITE} b={{ r: 0, g: 0, b: 0 }} withName="Slate 4" />,
    );
    expect(html).toMatch(/>AAA<\/span>/);
    expect(html).toContain('21.0:1 with Slate 4');
  });

  it('colours a failing verdict as muted, not as a pass', () => {
    const html = renderToStaticMarkup(<ContrastBadge a={WHITE} b={WHITE} withName="White" />);
    expect(html).toMatch(/class="[^"]*\bbg-muted\b[^"]*">Decorative only</);
  });
});
