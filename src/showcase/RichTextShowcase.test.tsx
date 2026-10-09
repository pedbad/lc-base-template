/**
 * RichTextShowcase.test.tsx — the showcase's rich-text authoring reference (spec §14).
 *
 * It must demonstrate every entry kind, offer the same content as a popup, and keep its
 * audio inside the showcase quarantine (`audio/showcase-demo/`) like every other
 * showcase fixture — real course audio never mixes with demo clips.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { collectEntryAudioPaths, collectEntryHoverTargets } from '@/lo/rich-text/rich-text-nodes';
import RichTextShowcase from './RichTextShowcase';
import { RICH_TEXT_SHOWCASE_ENTRIES, RICH_TEXT_SHOWCASE_HOVERS } from './rich-text.fixture';

const PUBLIC_DIR = path.resolve(import.meta.dirname, '../../public');

describe('RichTextShowcase', () => {
  test('the fixture covers every entry kind, both list orders included', () => {
    const kinds = RICH_TEXT_SHOWCASE_ENTRIES.map((entry) =>
      entry.kind === 'list' ? (entry.ordered ? 'ol' : 'ul') : entry.kind,
    );
    expect(new Set(kinds)).toEqual(new Set(['paragraph', 'ul', 'ol', 'table', 'audioPlayer']));
  });

  test('renders the entries inline and a button that opens them as a popup', () => {
    const html = renderToStaticMarkup(<RichTextShowcase />);
    expect(html).toContain('<ul');
    expect(html).toContain('<ol');
    expect(html).toMatch(/<table/);
    expect(html).toMatch(/<audio[^>]*controls/);
    expect(html).toContain('super-compact-speaker');
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>[^<]*Open[^<]*popup/i);
  });

  test('shows authors the source they would write', () => {
    expect(renderToStaticMarkup(<RichTextShowcase />)).toContain('data-audio-player=');
  });

  test('keeps its audio under audio/showcase-demo/, on disk', () => {
    const paths = collectEntryAudioPaths(RICH_TEXT_SHOWCASE_ENTRIES);
    expect(paths.length).toBeGreaterThan(0);
    paths.forEach((soundFile) => {
      expect(soundFile).toMatch(/^audio\/showcase-demo\//);
      expect(existsSync(path.join(PUBLIC_DIR, soundFile)), soundFile).toBe(true);
    });
  });

  // TODO §D14 (2026-10-09): the reference showed lists, a table and speakers, but no
  // plain link and no hover term, so neither could be checked on a debug page.
  test('demonstrates a plain link, opening in a new tab', () => {
    const html = renderToStaticMarkup(<RichTextShowcase />);
    expect(html).toMatch(
      /<a [^>]*href="[^"]*debug-sandbox\.html"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/,
    );
  });

  test('demonstrates a hover term, with a card declared for it', () => {
    const targets = collectEntryHoverTargets(RICH_TEXT_SHOWCASE_ENTRIES);
    expect(targets.length).toBeGreaterThan(0);
    targets.forEach((target) => expect(RICH_TEXT_SHOWCASE_HOVERS).toHaveProperty(target));

    const html = renderToStaticMarkup(<RichTextShowcase />);
    expect(html).toMatch(/<button type="button" class="hover-term" aria-expanded="false">/);
  });

  test('shows the hover card source an author would write in hover.json', () => {
    const html = renderToStaticMarkup(<RichTextShowcase />);
    expect(html).toContain('data-hover-target=');
    expect(html).toContain('hover.json');
  });
});
