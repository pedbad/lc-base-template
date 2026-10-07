/**
 * MediaPanel.test.tsx — one media group's markup for each layout: portrait beside
 * the player, figure in <figure>, audio alone, and the transcript toggle.
 *
 * Spec: docs/specs/2026-10-07-tabs-media-design.md §4.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { MediaPanel } from './MediaPanel';
import { MediaSchema } from './media-schema';

const audio = { src: 'audio/lo-00-example/placeholder.m4a', label: 'Listen to Claire' };
const transcript = ['Bonjour, je suis Claire.'];

/** Parse like the block does, then render. */
function render(input: unknown): string {
  return renderToStaticMarkup(<MediaPanel media={MediaSchema.parse(input)} />);
}

test('a decorative portrait renders beside the player, out of the a11y tree', () => {
  const html = render({
    image: { kind: 'portrait', src: 'images/x/speaker.svg', alt: '' },
    audio,
    transcript,
  });

  expect(html).toMatch(/<img[^>]*alt=""[^>]*aria-hidden="true"/);
  expect(html).toContain('speaker.svg');
  expect(html).not.toContain('<figure');
  expect(html).toContain('<audio');
  expect(html).toContain('placeholder.m4a');
  expect(html).toContain('Listen to Claire');
});

test('a figure renders in <figure> with its caption and alt', () => {
  const html = render({
    image: {
      kind: 'figure',
      src: 'images/x/chart.svg',
      alt: 'Visits peak on Saturday',
      caption: 'Visits per day',
    },
    audio,
    transcript,
  });

  expect(html).toContain('<figure');
  expect(html).toMatch(/<figcaption[^>]*>Visits per day<\/figcaption>/);
  expect(html).toMatch(/<img[^>]*alt="Visits peak on Saturday"/);
  // Real alt: the image stays in the accessibility tree.
  expect(html).toMatch(/<img(?![^>]*aria-hidden)[^>]*>/);
  expect(html.indexOf('<figure')).toBeLessThan(html.indexOf('<audio'));
});

test('audio alone renders the player and toggle, no image', () => {
  const html = render({ audio, transcript });

  expect(html).not.toContain('<img');
  expect(html).toContain('<audio');
  expect(html).toContain('<details');
});

test('an image without audio renders no player and no toggle', () => {
  const html = render({
    image: { kind: 'figure', src: 'images/x/chart.svg', alt: 'A chart' },
  });

  expect(html).not.toContain('<audio');
  expect(html).not.toContain('<details');
});

test('the transcript sits closed behind a summary carrying both labels', () => {
  const html = render({ audio, transcript });

  expect(html).toMatch(/<details(?![^>]*\bopen\b)[^>]*>/);
  const summary = /<summary[^>]*>([\s\S]*?)<\/summary>/.exec(html)?.[1] ?? '';
  expect(summary).toContain('Show transcript');
  expect(summary).toContain('Hide transcript');
  // Icons repeat the words, so they stay out of the accessible name.
  const icons = summary.match(/<svg[^>]*>/g) ?? [];
  expect(icons).toHaveLength(2);
  icons.forEach((icon) => expect(icon).toContain('aria-hidden="true"'));
  // The text is in the static page, after the summary.
  expect(html.indexOf('Bonjour, je suis Claire.')).toBeGreaterThan(html.indexOf('</summary>'));
});
