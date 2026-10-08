/**
 * ImagesSection.test.tsx — the sandbox's Images section renders a tile per image
 * with its path, and puts the dark-ground marks on a dark tile.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { APP_IMAGES } from './app-assets';
import ImagesSection from './ImagesSection';
import IconsSection from './IconsSection';
import { APP_ICONS } from './app-assets';

test('one tile per image, labelled with its public/ path', () => {
  const html = renderToStaticMarkup(<ImagesSection />);
  expect((html.match(/<li[\s>]/g) ?? []).length).toBe(APP_IMAGES.length);
  for (const file of APP_IMAGES) expect(html).toContain(`public/${file}`);
});

test('white and dark-ground marks sit on a dark tile', () => {
  const html = renderToStaticMarkup(<ImagesSection />);
  const tile = (file: string) =>
    html
      .slice(0, html.indexOf(`public/${file}`))
      .split('<li')
      .pop() ?? '';
  expect(tile('images/footer/lc-logo-white.svg')).toContain('bg-foreground');
  expect(tile('images/footer/lc-logo-black.svg')).toContain('bg-muted');
});

test('the Icons section also shows every lucide icon the app uses', () => {
  const html = renderToStaticMarkup(<IconsSection />);
  expect(html).toContain('Lucide icons the app uses');
  for (const name of Object.keys(APP_ICONS)) expect(html).toContain(`>${name}</code>`);
});

// Maintainer, 2026-10-08: the pixel size sits in a shadcn Badge so it stands out.
test('shows each image size in a shadcn badge', () => {
  const html = renderToStaticMarkup(<ImagesSection />);
  expect((html.match(/data-slot="badge"/g) ?? []).length).toBe(APP_IMAGES.length);
});
