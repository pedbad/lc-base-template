/**
 * intro-image.test.tsx — an intro may carry an illustration beside it (maintainer,
 * 2026-10-08, after french-lo-1's instructions-media): text left, picture right from
 * `lg`, the outcomes block's split and 3:2 contain box, so the picture is the
 * introduction illustration's size. On a phone the picture sits ON TOP (maintainer,
 * 2026-10-08, as the reading exercise does) while the DOM keeps the text first, so a
 * screen reader still meets the words before the picture. With no image the intro
 * renders exactly as before.
 */
import { expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { IntroBlock } from './TextBlock';

const text = ['Opening paragraph.'];

test('without an image the intro is the ruled text alone, as before', () => {
  const html = renderToStaticMarkup(<IntroBlock content={{ text }} />);

  expect(html).toMatch(/^<div class="rich-text-full border-s-4 border-accent ps-5">/);
  expect(html).not.toContain('<img');
});

test('with an image: picture on top on a phone, the outcomes split from lg, text first in the DOM', () => {
  const html = renderToStaticMarkup(
    <IntroBlock content={{ text, image: { src: 'images/a.svg', alt: '' } }} />,
  );

  expect(html).toMatch(
    /^<div class="flex flex-col-reverse gap-6 lg:grid lg:grid-cols-\[minmax\(0,1fr\)_minmax\(0,1fr\)\] lg:items-start">/,
  );
  expect(html.indexOf('border-s-4')).toBeLessThan(html.indexOf('<img'));
  expect(html).toContain('<div class="aspect-[3/2] w-full"><img');
  expect(html).toContain('class="size-full object-contain"');
  expect(html).toContain('aria-hidden="true"');
});

test('an authored alt is announced, not hidden', () => {
  const html = renderToStaticMarkup(
    <IntroBlock content={{ text, image: { src: 'images/a.svg', alt: 'Two people talking' } }} />,
  );
  expect(html).toContain('alt="Two people talking"');
  expect(html).not.toMatch(/<img[^>]*aria-hidden/);
});
