/**
 * parse-rich-text.test.ts — the allowlist IS the contract, so this guards both halves
 * of it: every accepted shape produces the right node, and everything off the list
 * throws rather than degrading. Spec: docs/specs/lo-rich-text-modals.md §2, §4, §11.
 */
import { describe, expect, test } from 'vitest';
import { parseRichText } from './parse-rich-text';

describe('plain text', () => {
  test('parses a string with no markup as a single text node', () => {
    expect(parseRichText('Bonjour tout le monde')).toEqual([
      { kind: 'text', value: 'Bonjour tout le monde' },
    ]);
  });

  test('accepts an empty string as no nodes', () => {
    expect(parseRichText('')).toEqual([]);
  });

  test('leaves a bare ampersand verbatim rather than guessing an entity', () => {
    expect(parseRichText('Tom & Jerry')).toEqual([{ kind: 'text', value: 'Tom & Jerry' }]);
  });
});

describe('entities', () => {
  test('decodes the five XML entities', () => {
    expect(parseRichText('&lt;tag&gt; &amp; &quot;quoted&quot; &apos;s')).toEqual([
      { kind: 'text', value: '<tag> & "quoted" \'s' },
    ]);
  });

  test('decodes a non-breaking space to U+00A0, not to a plain space', () => {
    expect(parseRichText('a&nbsp;b')).toEqual([{ kind: 'text', value: 'a\u00a0b' }]);
  });

  test('decodes decimal and hexadecimal numeric references', () => {
    expect(parseRichText('caf&#233; cr&#xe8;me')).toEqual([{ kind: 'text', value: 'café crème' }]);
  });

  test('leaves an unrecognised named entity verbatim rather than dropping it', () => {
    expect(parseRichText('&foo; bar')).toEqual([{ kind: 'text', value: '&foo; bar' }]);
  });

  test('decodes entities inside an element', () => {
    expect(parseRichText('<strong>caf&#233;</strong>')).toEqual([
      { kind: 'strong', children: [{ kind: 'text', value: 'café' }] },
    ]);
  });
});

describe('semantic emphasis', () => {
  test('parses strong', () => {
    expect(parseRichText('say <strong>vous</strong> here')).toEqual([
      { kind: 'text', value: 'say ' },
      { kind: 'strong', children: [{ kind: 'text', value: 'vous' }] },
      { kind: 'text', value: ' here' },
    ]);
  });

  test('parses em', () => {
    expect(parseRichText('<em>you</em>')).toEqual([
      { kind: 'em', children: [{ kind: 'text', value: 'you' }] },
    ]);
  });

  test('parses nested emphasis', () => {
    expect(parseRichText('<strong>très <em>très</em> formel</strong>')).toEqual([
      {
        kind: 'strong',
        children: [
          { kind: 'text', value: 'très ' },
          { kind: 'em', children: [{ kind: 'text', value: 'très' }] },
          { kind: 'text', value: ' formel' },
        ],
      },
    ]);
  });

  test('rejects <b> and names the semantic replacement', () => {
    expect(() => parseRichText('<b>no</b>')).toThrow(/<b>.*<strong>/s);
  });

  test('rejects <i> and names the semantic replacement', () => {
    expect(() => parseRichText('<i>no</i>')).toThrow(/<i>.*<em>/s);
  });
});

describe('line breaks', () => {
  test.each(['<br>', '<br/>', '<br />'])('parses %s', (markup) => {
    expect(parseRichText(`a${markup}b`)).toEqual([
      { kind: 'text', value: 'a' },
      { kind: 'break' },
      { kind: 'text', value: 'b' },
    ]);
  });

  test('rejects a closing tag for the void break element', () => {
    expect(() => parseRichText('a<br>b</br>')).toThrow(/br/);
  });
});

describe('modal links', () => {
  test('parses a modal link into a target plus children', () => {
    expect(
      parseRichText('use <a class="modal-link" data-modal-target="tuvous">vous</a> here'),
    ).toEqual([
      { kind: 'text', value: 'use ' },
      { kind: 'modalLink', target: 'tuvous', children: [{ kind: 'text', value: 'vous' }] },
      { kind: 'text', value: ' here' },
    ]);
  });

  test('accepts single-quoted attributes, as the authoring rule writes them', () => {
    expect(parseRichText("<a class='modal-link' data-modal-target='tuvous'>vous</a>")).toEqual([
      { kind: 'modalLink', target: 'tuvous', children: [{ kind: 'text', value: 'vous' }] },
    ]);
  });

  test('accepts and ignores the href the authoring rule mandates', () => {
    expect(
      parseRichText('<a class="modal-link" href="#content" data-modal-target="tuvous">v</a>'),
    ).toEqual([{ kind: 'modalLink', target: 'tuvous', children: [{ kind: 'text', value: 'v' }] }]);
  });

  test('accepts attributes in any order', () => {
    expect(parseRichText('<a data-modal-target="tuvous" class="modal-link">v</a>')).toEqual([
      { kind: 'modalLink', target: 'tuvous', children: [{ kind: 'text', value: 'v' }] },
    ]);
  });

  test('allows emphasis inside a modal link', () => {
    expect(parseRichText('<a class="modal-link" data-modal-target="t"><em>v</em></a>')).toEqual([
      {
        kind: 'modalLink',
        target: 't',
        children: [{ kind: 'em', children: [{ kind: 'text', value: 'v' }] }],
      },
    ]);
  });

  test('rejects an anchor with no data-modal-target', () => {
    expect(() => parseRichText('<a class="modal-link">v</a>')).toThrow(/data-modal-target/);
  });

  test('rejects an anchor that is not a modal link, so real navigation is never silently swallowed', () => {
    expect(() => parseRichText('<a href="https://example.com">v</a>')).toThrow(/modal-link/);
  });

  test('rejects an empty data-modal-target', () => {
    expect(() => parseRichText('<a class="modal-link" data-modal-target="">v</a>')).toThrow(
      /data-modal-target/,
    );
  });
});

describe('audio icons', () => {
  test('parses an audio span into an audio node', () => {
    expect(parseRichText('listen <span data-audio="audio/lo-00/tu.mp3"></span>')).toEqual([
      { kind: 'text', value: 'listen ' },
      { kind: 'audio', soundFile: 'audio/lo-00/tu.mp3' },
    ]);
  });

  test('parses a self-closing audio span', () => {
    expect(parseRichText('<span data-audio="a.mp3" />')).toEqual([
      { kind: 'audio', soundFile: 'a.mp3' },
    ]);
  });

  test('carries data-audio-label through as the accessible name override', () => {
    expect(parseRichText('<span data-audio="a.mp3" data-audio-label="Play tu"></span>')).toEqual([
      { kind: 'audio', soundFile: 'a.mp3', label: 'Play tu' },
    ]);
  });

  test('rejects a non-empty audio span, whose children would be silently dropped', () => {
    expect(() => parseRichText('<span data-audio="a.mp3">listen</span>')).toThrow(/empty/i);
  });

  test('rejects a span with no data-audio, so a styling span never vanishes', () => {
    expect(() => parseRichText('<span class="x">v</span>')).toThrow(/data-audio/);
  });

  test('rejects an empty data-audio path', () => {
    expect(() => parseRichText('<span data-audio=""></span>')).toThrow(/data-audio/);
  });
});

describe('rejections', () => {
  test('rejects an unknown tag rather than dropping it', () => {
    expect(() => parseRichText('<storng>typo</storng>')).toThrow(/storng/);
  });

  test('rejects a script tag', () => {
    expect(() => parseRichText('<script>alert(1)</script>')).toThrow(/script/);
  });

  test('rejects an unclosed tag', () => {
    expect(() => parseRichText('<strong>unclosed')).toThrow(/strong/);
  });

  test('rejects a mismatched closing tag', () => {
    expect(() => parseRichText('<strong>x</em>')).toThrow(/strong|em/);
  });

  test('rejects a stray closing tag', () => {
    expect(() => parseRichText('x</strong>')).toThrow(/strong/);
  });

  test('names the source in the message when given one', () => {
    expect(() => parseRichText('<b>x</b>', 'modals/tuvous/modal.json')).toThrow(
      /modals\/tuvous\/modal\.json/,
    );
  });
});
