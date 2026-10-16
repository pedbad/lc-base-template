/**
 * ImageCompare.test.tsx — the light/dark comparison slider's first render (E20). Drag
 * and keys are browser behaviour, checked by hand; the pointer maths is in
 * compare-position.test.ts.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import ImageCompare from './ImageCompare';

const html = renderToStaticMarkup(
  <ImageCompare
    name="lc-logo"
    light="images/footer/lc-logo-black.svg"
    dark="images/footer/lc-logo-white.svg"
  />,
);

test('a native range from 0 to 100 holds the position, starting at 50', () => {
  expect(html).toMatch(/<input[^>]*type="range"/);
  expect(html).toContain('min="0"');
  expect(html).toContain('max="100"');
  expect(html).toContain('value="50"');
});

test('the range is named for the mark it compares', () => {
  expect(html).toContain('aria-label="Compare light and dark: lc-logo"');
});

test('the light layer is clipped at the handle', () => {
  expect(html).toContain('clip-path:inset(0 50% 0 0)');
});

test('the visible handle is decorative', () => {
  expect(html).toMatch(/<div aria-hidden="true"[^>]*left:50%/);
});

test('both images sit on their own fixed ground, each with its chip', () => {
  expect(html).toContain('lc-logo-black.svg');
  expect(html).toContain('lc-logo-white.svg');
  expect(html).toContain('bg-(--mark-ground-light)');
  expect(html).toContain('bg-(--mark-ground-dark)');
  expect(html).toContain('>Light<');
  expect(html).toContain('>Dark<');
});
