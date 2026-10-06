/**
 * parse-rich-text-entry.test.ts — one array entry is a paragraph OR one whole block.
 *
 * Same contract as the inline parser: every accepted shape produces the right entry,
 * and everything off the list throws with a message an author can act on — never a
 * silent flatten. Spec: docs/specs/lo-rich-text-modals.md §14.
 */
import { describe, expect, test } from 'vitest';
import { parseRichText } from './parse-rich-text';
import { parseRichTextEntry } from './parse-rich-text-entry';

const text = (value: string) => ({ kind: 'text', value }) as const;
const AUDIO = 'audio/lo-00-example/placeholder.m4a';

describe('paragraphs', () => {
  test('a plain or inline-rich string is a paragraph, exactly as before', () => {
    expect(parseRichTextEntry('Bonjour <strong>tous</strong>')).toEqual({
      kind: 'paragraph',
      children: [text('Bonjour '), { kind: 'strong', children: [text('tous')] }],
    });
  });

  test('an inline speaker icon keeps a string a paragraph', () => {
    expect(parseRichTextEntry(`<span data-audio="${AUDIO}"></span>`).kind).toBe('paragraph');
  });
});

describe('lists', () => {
  test('<ul> becomes an unordered list of inline items', () => {
    expect(parseRichTextEntry('<ul><li>one <em>two</em></li><li>three</li></ul>')).toEqual({
      kind: 'list',
      ordered: false,
      items: [[text('one '), { kind: 'em', children: [text('two')] }], [text('three')]],
    });
  });

  test('<ol> becomes an ordered list, and whitespace between items is ignored', () => {
    expect(parseRichTextEntry('<ol>\n  <li>a</li>\n  <li>b</li>\n</ol>')).toEqual({
      kind: 'list',
      ordered: true,
      items: [[text('a')], [text('b')]],
    });
  });

  test('an item can hold a speaker icon and a modal link', () => {
    const entry = parseRichTextEntry(
      `<ul><li><a class="modal-link" data-modal-target="m">x</a> <span data-audio="${AUDIO}"></span></li></ul>`,
    );
    expect(entry.kind === 'list' && entry.items[0].map((node) => node.kind)).toEqual([
      'modalLink',
      'text',
      'audio',
    ]);
  });

  test('rejects an empty list', () => {
    expect(() => parseRichTextEntry('<ul></ul>')).toThrow(/at least one <li>/);
  });

  test('rejects text directly inside the list', () => {
    expect(() => parseRichTextEntry('<ul>stray<li>a</li></ul>')).toThrow(/only <li>/);
  });

  test('rejects a nested list, which v2 does not support', () => {
    expect(() => parseRichTextEntry('<ul><li>a<ul><li>b</li></ul></li></ul>')).toThrow(/nested/);
  });

  test('rejects attributes on structural tags', () => {
    expect(() => parseRichTextEntry('<ul class="x"><li>a</li></ul>')).toThrow(/attributes/);
  });

  test('rejects anything after the closing tag — a block is the whole entry', () => {
    expect(() => parseRichTextEntry('<ul><li>a</li></ul> and more')).toThrow(/whole entry/);
  });

  test('rejects an unclosed list', () => {
    expect(() => parseRichTextEntry('<ul><li>a</li>')).toThrow(/unclosed/);
  });
});

describe('tables', () => {
  const TABLE =
    '<table><caption>Être</caption>' +
    '<thead><tr><th>Pronoun</th><th>Form</th></tr></thead>' +
    `<tbody><tr><th>je</th><td>suis <span data-audio="${AUDIO}"></span></td></tr>` +
    '<tr><th>tu</th><td>es</td></tr></tbody></table>';

  test('parses caption, head and body, scoping header cells by position', () => {
    expect(parseRichTextEntry(TABLE)).toEqual({
      kind: 'table',
      caption: [text('Être')],
      head: [
        [
          { header: true, scope: 'col', children: [text('Pronoun')] },
          { header: true, scope: 'col', children: [text('Form')] },
        ],
      ],
      body: [
        [
          { header: true, scope: 'row', children: [text('je')] },
          {
            header: false,
            children: [text('suis '), { kind: 'audio', soundFile: AUDIO }],
          },
        ],
        [
          { header: true, scope: 'row', children: [text('tu')] },
          { header: false, children: [text('es')] },
        ],
      ],
    });
  });

  test('accepts body rows without <tbody> and a table without <thead>', () => {
    const entry = parseRichTextEntry('<table><caption>c</caption><tr><td>a</td></tr></table>');
    expect(entry).toEqual({
      kind: 'table',
      caption: [text('c')],
      head: [],
      body: [[{ header: false, children: [text('a')] }]],
    });
  });

  test('requires a caption — it names the table and its scroll region', () => {
    expect(() => parseRichTextEntry('<table><tr><td>a</td></tr></table>')).toThrow(/<caption>/);
  });

  test('requires at least one body row', () => {
    expect(() =>
      parseRichTextEntry('<table><caption>c</caption><thead><tr><th>a</th></tr></thead></table>'),
    ).toThrow(/body row/);
  });

  test('rejects ragged rows — every row must be the same width', () => {
    expect(() =>
      parseRichTextEntry(
        '<table><caption>c</caption><tr><td>a</td><td>b</td></tr><tr><td>c</td></tr></table>',
      ),
    ).toThrow(/same number of cells/);
  });

  test('rejects a body <th> anywhere but the first cell', () => {
    expect(() =>
      parseRichTextEntry('<table><caption>c</caption><tr><td>a</td><th>b</th></tr></table>'),
    ).toThrow(/first cell/);
  });

  test('rejects a <td> in the header row', () => {
    expect(() =>
      parseRichTextEntry(
        '<table><caption>c</caption><thead><tr><td>a</td></tr></thead><tr><td>b</td></tr></table>',
      ),
    ).toThrow(/<thead>.*<th>/s);
  });

  test('rejects attributes on table tags, e.g. an authored scope', () => {
    expect(() =>
      parseRichTextEntry('<table><caption>c</caption><tr><th scope="col">a</th></tr></table>'),
    ).toThrow(/attributes/);
  });

  test('rejects an off-allowlist tag inside a cell, via the inline parser', () => {
    expect(() =>
      parseRichTextEntry('<table><caption>c</caption><tr><td><b>a</b></td></tr></table>'),
    ).toThrow(/<strong>/);
  });
});

describe('the audio player', () => {
  test('a whole-entry player span becomes an audioPlayer entry', () => {
    expect(
      parseRichTextEntry(
        `<span data-audio-player="${AUDIO}" data-audio-label="Listen to the dialogue"></span>`,
      ),
    ).toEqual({ kind: 'audioPlayer', soundFile: AUDIO, label: 'Listen to the dialogue' });
  });

  test('requires a label — it is the player’s visible text', () => {
    expect(() => parseRichTextEntry(`<span data-audio-player="${AUDIO}"></span>`)).toThrow(
      /data-audio-label/,
    );
  });

  test('rejects a player with content', () => {
    expect(() =>
      parseRichTextEntry(`<span data-audio-player="${AUDIO}" data-audio-label="L">x</span>`),
    ).toThrow(/empty/);
  });

  test('rejects a player that is not the whole entry', () => {
    expect(() =>
      parseRichTextEntry(`<span data-audio-player="${AUDIO}" data-audio-label="L"></span> more`),
    ).toThrow(/whole entry/);
  });
});

describe('block elements inside a paragraph', () => {
  test.each([
    ['a list', 'Intro <ul><li>a</li></ul>'],
    ['a table', 'Intro <table><caption>c</caption><tr><td>a</td></tr></table>'],
    ['a player', `Intro <span data-audio-player="${AUDIO}" data-audio-label="L"></span>`],
  ])('rejects %s mid-paragraph with an own-entry message', (_label, html) => {
    expect(() => parseRichTextEntry(html)).toThrow(/own entry/);
  });

  test('the inline parser alone gives the same guidance', () => {
    expect(() => parseRichText('x <ol><li>a</li></ol>')).toThrow(/own entry/);
  });
});

describe('error messages', () => {
  test('prefix the author-facing source path', () => {
    expect(() => parseRichTextEntry('<ul></ul>', 'lo-config/x/modals/m/modal.json')).toThrow(
      /^lo-config\/x\/modals\/m\/modal\.json: /,
    );
  });
});
