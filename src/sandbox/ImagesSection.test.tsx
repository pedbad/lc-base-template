/**
 * ImagesSection.test.tsx — the sandbox's Images section renders a tile per image or
 * light/dark pair, with every path, and gives each side of a pair a ground that does
 * not flip with the theme (E20).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { APP_ICONS, APP_IMAGES } from './app-assets';
import { groupImages } from './image-pairs';
import ImagesSection from './ImagesSection';
import IconsSection from './IconsSection';

const html = renderToStaticMarkup(<ImagesSection />);
const { pairs, singles } = groupImages(APP_IMAGES);

test('one tile per light/dark pair and one per single image', () => {
  expect((html.match(/<li[\s>]/g) ?? []).length).toBe(pairs.length + singles.length);
});

test('every image is still labelled with its public/ path', () => {
  for (const file of APP_IMAGES) expect(html).toContain(`public/${file}`);
});

test('each pair is one comparison slider', () => {
  expect((html.match(/type="range"/g) ?? []).length).toBe(pairs.length);
  for (const { name } of pairs) expect(html).toContain(`Compare light and dark: ${name}`);
});

test('the two ground tokens are set once, the same in both themes', () => {
  const tokens = readFileSync(path.resolve(import.meta.dirname, '../styles/tokens.css'), 'utf8');
  const dark = tokens.slice(tokens.indexOf('.dark {'));
  for (const name of ['--mark-ground-light', '--mark-ground-dark']) {
    expect(tokens).toContain(`${name}:`);
    expect(dark).not.toContain(`${name}:`);
  }
});

test('the Icons section also shows every lucide icon the app uses', () => {
  const icons = renderToStaticMarkup(<IconsSection />);
  expect(icons).toContain('Lucide icons the app uses');
  for (const name of Object.keys(APP_ICONS)) expect(icons).toContain(`>${name}</code>`);
});

// Maintainer, 2026-10-08: the pixel size sits in a shadcn Badge so it stands out.
test('shows each image size in a shadcn badge', () => {
  expect((html.match(/data-slot="badge"/g) ?? []).length).toBe(APP_IMAGES.length);
});
