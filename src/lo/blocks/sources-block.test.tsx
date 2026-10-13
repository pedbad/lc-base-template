/**
 * sources-block.test.tsx — the `sources` block's content contract and its markup.
 *
 * The CONTRACT: `kind` is a closed set, so a typo fails the build instead of rendering
 * an iconless entry; a `web` source must carry a link, because a web citation the
 * learner cannot follow is the one mistake an author cannot see in their own JSON.
 *
 * The MARKUP: a list of citations is a list, so <ul>/<li>. The icon says print or
 * web to the eye; the same fact goes to a screen reader as sr-only text, because here
 * the icon is information, not decoration. Group headings sit one level below
 * whatever heads the block — the section's <h2> for a plain block, the accordion's
 * <h3> for a card.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { test, expect } from 'vitest';
import { getBlockRenderer } from './block-renderers';
import { SourcesBlockContentSchema } from './sources-block-schema';

const printItem = {
  kind: 'print',
  citation: 'Fabricius, K.E., et al. (2011) Losers and winners. <em>Nature Climate Change</em>',
  note: 'This extract from p165, first 3 paragraphs',
};

const webItem = {
  kind: 'web',
  citation:
    'Daily Telegraph article entitled <a href="https://example.org/coral">Coral reefs on edge of extinction</a>',
};

const valid = { groups: [{ heading: 'Strategies', items: [printItem, webItem] }] };

/** Render through the registry, as the page adapter does. */
function renderSources(content: unknown, presentation: 'card' | 'plain' = 'plain'): string {
  const Renderer = getBlockRenderer('sources');
  if (!Renderer) throw new Error('no renderer for "sources"');
  return renderToStaticMarkup(<Renderer content={content} presentation={presentation} />);
}

test('a block with headed groups of print and web sources parses', () => {
  expect(SourcesBlockContentSchema.safeParse(valid).success).toBe(true);
});

test('a group heading and an item note are both optional', () => {
  const result = SourcesBlockContentSchema.safeParse({
    groups: [{ items: [{ kind: 'print', citation: 'Pax Leonard, S. (2012)' }] }],
  });

  expect(result.success).toBe(true);
});

test('an unknown kind is rejected, naming the field', () => {
  const result = SourcesBlockContentSchema.safeParse({
    groups: [{ items: [{ ...printItem, kind: 'book' }] }],
  });

  if (result.success) throw new Error('expected a validation failure');
  expect(result.error.issues[0]?.path).toEqual(['groups', 0, 'items', 0, 'kind']);
});

test('a web source with no link in its citation is rejected', () => {
  const result = SourcesBlockContentSchema.safeParse({
    groups: [{ items: [{ kind: 'web', citation: 'Daily Telegraph, 30/05/2011' }] }],
  });

  if (result.success) throw new Error('expected a validation failure');
  expect(result.error.issues[0]?.path).toEqual(['groups', 0, 'items', 0, 'citation']);
});

test('a misspelt key fails rather than being silently dropped', () => {
  expect(
    SourcesBlockContentSchema.safeParse({
      groups: [{ items: [{ ...printItem, notes: 'p165' }] }],
    }).success,
  ).toBe(false);
  expect(
    SourcesBlockContentSchema.safeParse({ groups: [{ heading: 'A', item: [printItem] }] }).success,
  ).toBe(false);
  expect(SourcesBlockContentSchema.safeParse({ ...valid, group: [] }).success).toBe(false);
});

test('empty groups and empty item lists are rejected', () => {
  expect(SourcesBlockContentSchema.safeParse({ groups: [] }).success).toBe(false);
  expect(SourcesBlockContentSchema.safeParse({ groups: [{ items: [] }] }).success).toBe(false);
});

test('renders each group as a headed <ul>, one <li> per source', () => {
  const html = renderSources(valid);

  expect(html).toContain('Strategies');
  expect(html.match(/<ul/g)).toHaveLength(1);
  expect(html.match(/<li/g)).toHaveLength(2);
  expect(html).toContain('<em>Nature Climate Change</em>');
  expect(html).toContain('This extract from p165, first 3 paragraphs');
});

test('a web citation link opens in a new tab and says so', () => {
  const html = renderSources(valid);

  expect(html).toContain('href="https://example.org/coral"');
  expect(html).toContain('target="_blank"');
  expect(html).toContain('(opens in a new tab)');
});

test('icons are hidden, and the kind reaches a screen reader as text', () => {
  const html = renderSources(valid);

  const svgs = html.match(/<svg[^>]*>/g) ?? [];
  // Two source icons plus the rich-text link's external-link icon.
  expect(svgs.length).toBeGreaterThanOrEqual(2);
  for (const svg of svgs) expect(svg).toContain('aria-hidden="true"');
  expect(html).toContain('Print source:');
  expect(html).toContain('Web source:');
});

test('group headings are <h3> in a plain block and <h4> inside a card', () => {
  expect(renderSources(valid, 'plain')).toMatch(/<h3[^>]*>Strategies<\/h3>/);
  expect(renderSources(valid, 'card')).toMatch(/<h4[^>]*>Strategies<\/h4>/);
});

test('a group with no heading renders no heading element', () => {
  const html = renderSources({ groups: [{ items: [printItem] }] });

  expect(html).not.toMatch(/<h[1-6]/);
});

// Redesign (maintainer, 2026-10-13): groups as cards side by side, a heading rule,
// divided entries, the kind icon in a tinted chip. Plan amendment in
// docs/process/2026-10-12-sources-block-plan.md.
const twoGroups = {
  groups: [
    { heading: 'Strategies', items: [printItem, webItem] },
    { heading: 'Vocabulary', items: [printItem] },
  ],
};

/** The class list captured by `pattern`'s first group, split into classes. */
function classesOf(html: string, pattern: RegExp): string[] {
  return (html.match(pattern)?.[1] ?? '').split(' ');
}

test('groups flow into an auto-fit grid, no longer held to the reading measure', () => {
  const root = classesOf(renderSources(twoGroups), /^<div class="([^"]*)"/);

  expect(root).toContain('grid-cols-[repeat(auto-fit,minmax(min(100%,26rem),1fr))]');
  expect(root).not.toContain('max-w-(--measure)');
});

test('in a plain block each group is a card; inside a card it is not', () => {
  const frame = ['rounded-lg', 'border', 'bg-card', 'shadow-sm'];
  const plainGroup = classesOf(
    renderSources(twoGroups, 'plain'),
    /^<div[^>]*><div class="([^"]*)"/,
  );
  const cardGroup = classesOf(renderSources(twoGroups, 'card'), /^<div[^>]*><div class="([^"]*)"/);

  for (const cls of frame) expect(plainGroup).toContain(cls);
  for (const cls of frame) expect(cardGroup).not.toContain(cls);
});

test('a group heading carries the primary rule; entries are divided', () => {
  const html = renderSources(twoGroups);

  expect(classesOf(html, /<h3 class="([^"]*)"/)).toEqual(
    expect.arrayContaining(['text-lg', 'border-b-2', 'border-primary']),
  );
  expect(classesOf(html, /<ul class="([^"]*)"/)).toContain('divide-y');
});

test('the kind icon sits in a tinted chip that is itself hidden', () => {
  const html = renderSources(valid);

  expect(html).toMatch(/<li[^>]*><span aria-hidden="true" class="[^"]*bg-primary\/10[^"]*"><svg/);
});

test('an extract note is small, italic and muted', () => {
  expect(classesOf(renderSources(valid), /<p class="([^"]*)">This extract/)).toEqual(
    expect.arrayContaining(['text-sm', 'italic', 'text-muted-foreground']),
  );
});
