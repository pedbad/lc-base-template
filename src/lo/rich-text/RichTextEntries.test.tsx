/**
 * RichTextEntries.test.tsx — entries → DOM (spec §14). The assertions that matter
 * encode a11y decisions, not markup trivia: header cells carry a DERIVED `scope`, the
 * table's scroll region is focusable and named by the caption, and the player is the
 * labelled native control rather than the icon.
 *
 * `renderToStaticMarkup` in the node env, like the rest of the suite.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ModalProvider } from './modal/ModalProvider';
import { parseRichTextEntry } from './parse-rich-text-entry';
import { RichTextEntries } from './RichTextEntries';

const AUDIO = 'audio/lo-00-example/placeholder.m4a';

function renderAuthored(...entries: readonly string[]): string {
  return renderToStaticMarkup(
    <ModalProvider modals={{}}>
      <RichTextEntries entries={entries.map((entry) => parseRichTextEntry(entry))} />
    </ModalProvider>,
  );
}

describe('RichTextEntries', () => {
  test('a paragraph renders as <p> holding its inline nodes', () => {
    expect(renderAuthored('Hola <strong>mundo</strong>')).toMatch(
      /<p[^>]*>Hola <strong>mundo<\/strong><\/p>/,
    );
  });

  test('lists render as real <ul>/<ol> with one <li> per item', () => {
    const html = renderAuthored('<ul><li>a</li><li>b</li></ul>', '<ol><li>c</li></ol>');
    expect(html).toMatch(/<ul[^>]*><li>a<\/li><li>b<\/li><\/ul>/);
    expect(html).toMatch(/<ol[^>]*><li>c<\/li><\/ol>/);
  });

  // §D11: paragraphs and lists hold the reading measure (rich-text.css); tables and
  // the player do not, so they can break out to the column.
  test('paragraphs and lists carry the measure classes; a caller class is kept', () => {
    const html = renderToStaticMarkup(
      <ModalProvider modals={{}}>
        <RichTextEntries
          entries={['Hola', '<ul><li>a</li></ul>'].map((entry) => parseRichTextEntry(entry))}
          paragraphClassName="text-foreground"
        />
      </ModalProvider>,
    );
    expect(html).toContain('<p class="rich-text-paragraph text-foreground">Hola</p>');
    expect(html).toMatch(/<ul class="rich-text-list"/);
  });

  test('a list is never wrapped in a <p>, which would be invalid HTML', () => {
    expect(renderAuthored('<ul><li>a</li></ul>')).not.toMatch(/<p[^>]*><ul/);
  });

  test('table header cells carry scope derived from position', () => {
    const html = renderAuthored(
      '<table><caption>Être</caption><thead><tr><th>P</th><th>F</th></tr></thead>' +
        '<tbody><tr><th>je</th><td>suis</td></tr></tbody></table>',
    );
    expect(html).toContain('<th scope="col">P</th>');
    expect(html).toContain('<th scope="row">je</th>');
    expect(html).toContain('<td>suis</td>');
    expect(html).toMatch(/<caption[^>]*>Être<\/caption>/);
  });

  test('the table sits in a focusable scroll region named by its caption', () => {
    const html = renderAuthored('<table><caption>Être</caption><tr><td>a</td></tr></table>');
    const region = /<div[^>]*role="region"[^>]*>/.exec(html)?.[0] ?? '';
    const labelId = /aria-labelledby="([^"]+)"/.exec(region)?.[1];

    expect(region).toContain('tabindex="0"');
    expect(labelId).toBeDefined();
    expect(html).toContain(`<caption id="${labelId ?? ''}"`);
  });

  test('omits <thead> when the table has no header row', () => {
    expect(renderAuthored('<table><caption>c</caption><tr><td>a</td></tr></table>')).not.toContain(
      '<thead',
    );
  });

  test('the audio player renders the labelled native control', () => {
    const html = renderAuthored(
      `<span data-audio-player="${AUDIO}" data-audio-label="Listen to the dialogue"></span>`,
    );
    expect(html).toContain('Listen to the dialogue: ');
    expect(html).toMatch(/<audio[^>]*aria-label="Listen to the dialogue"[^>]*controls/);
    expect(html).toContain(`src="/${AUDIO}"`);
  });

  test('a speaker icon inside a table cell still mounts the icon variant', () => {
    const html = renderAuthored(
      `<table><caption>c</caption><tr><td>suis <span data-audio="${AUDIO}"></span></td></tr></table>`,
    );
    expect(html).toContain('super-compact-speaker');
  });
});
