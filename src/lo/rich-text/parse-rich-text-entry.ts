/**
 * parse-rich-text-entry.ts — one authored array entry → a paragraph OR one whole block.
 *
 * Spec §14. An entry that starts with `<ul>`, `<ol>`, `<table>` or a
 * `<span data-audio-player>` is a block and must span the whole entry; anything else
 * is a paragraph, parsed exactly as before by `parseRichText`. The same closed-allowlist,
 * loud-failure contract as the inline parser (R2): every structural rule below throws
 * with a message an author can act on, and nothing is ever silently flattened.
 *
 * STRUCTURE HERE, INLINE THERE. This module reads only the structural tags — list,
 * item, table, caption, row, cell — and hands each item, caption and cell BODY to
 * `parseRichText`, so emphasis, modal links and speaker icons have exactly one parser.
 * Structural tags take no attributes: header `scope` is derived from position by the
 * renderer, not authored.
 *
 * Still hand-rolled (§14 amends R7): ~2.3 kB of JS headroom does not fit `htmlparser2`,
 * and the node types stay the stable interface if that ever changes.
 */
import { failWith, parseRichText, readTag } from './parse-rich-text';
import type { Tag } from './parse-rich-text';
import type { RichTextEntry, RichTextNode, TableCell } from './rich-text-nodes';

type Fail = (message: string) => never;

/** A cursor over one entry's source, shared by the structural readers below. */
class Cursor {
  readonly html: string;
  readonly fail: Fail;
  position: number;

  constructor(html: string, start: number, fail: Fail) {
    this.html = html;
    this.fail = fail;
    this.position = start;
  }

  /** Skip whitespace; any other text before the next tag is a structural error. */
  skipToTag(context: string): void {
    const next = this.html.indexOf('<', this.position);
    const end = next === -1 ? this.html.length : next;
    if (this.html.slice(this.position, end).trim() !== '') {
      this.fail(`${context} — found text outside any allowed element`);
    }
    this.position = end;
  }

  atEnd(): boolean {
    return this.position >= this.html.length;
  }

  /** Read the next tag, which must take no attributes. */
  readBareTag(): Tag {
    const tag = readTag(this.html, this.position, this.fail);
    if (!tag.isClosing && Object.keys(tag.attributes).length > 0) {
      this.fail(
        `<${tag.name}> takes no attributes here — structure is fixed and header scope is ` +
          'derived by the renderer',
      );
    }
    this.position = tag.end;
    return tag;
  }

  /** The raw inline body up to `</name>`, consuming the closing tag. */
  readBodyUntilClose(name: string): string {
    const close = new RegExp(`</${name}\\s*>`, 'i').exec(this.html.slice(this.position));
    if (close === null) this.fail(`unclosed <${name}>`);
    const body = this.html.slice(this.position, this.position + close.index);
    this.position += close.index + close[0].length;
    return body;
  }

  /** Everything after the block must be whitespace: a block is the whole entry. */
  expectEnd(name: string): void {
    if (this.html.slice(this.position).trim() !== '') {
      this.fail(`<${name}> must be the whole entry — move the text after it into its own entry`);
    }
  }
}

function parseList(cursor: Cursor, name: 'ul' | 'ol', source?: string): RichTextEntry {
  const items: (readonly RichTextNode[])[] = [];
  for (;;) {
    cursor.skipToTag(`<${name}> may contain only <li> elements`);
    if (cursor.atEnd()) cursor.fail(`unclosed <${name}>`);
    const tag = cursor.readBareTag();
    if (tag.isClosing) {
      if (tag.name !== name) cursor.fail(`mismatched tags: <${name}> closed by </${tag.name}>`);
      break;
    }
    if (tag.name !== 'li')
      cursor.fail(`<${name}> may contain only <li> elements, found <${tag.name}>`);
    const body = cursor.readBodyUntilClose('li');
    if (/<(ul|ol|li)\b/i.test(body)) {
      cursor.fail('nested lists are not supported in v2 — flatten the list or split it');
    }
    items.push(parseRichText(body, source));
  }
  if (items.length === 0) cursor.fail(`<${name}> needs at least one <li>`);
  cursor.expectEnd(name);
  return { kind: 'list', ordered: name === 'ol', items };
}

function parseRow(cursor: Cursor, inHead: boolean, source?: string): readonly TableCell[] {
  const cells: TableCell[] = [];
  for (;;) {
    cursor.skipToTag('<tr> may contain only <th> and <td> cells');
    if (cursor.atEnd()) cursor.fail('unclosed <tr>');
    const tag = cursor.readBareTag();
    if (tag.isClosing) {
      if (tag.name !== 'tr') cursor.fail(`mismatched tags: <tr> closed by </${tag.name}>`);
      break;
    }
    if (tag.name !== 'th' && tag.name !== 'td') {
      cursor.fail(`<tr> may contain only <th> and <td> cells, found <${tag.name}>`);
    }
    const children = parseRichText(cursor.readBodyUntilClose(tag.name), source);
    if (inHead) {
      if (tag.name === 'td') cursor.fail('<thead> rows may hold only <th> cells');
      cells.push({ header: true, scope: 'col', children });
    } else if (tag.name === 'th') {
      if (cells.length > 0) {
        cursor.fail("a <th> in a body row is allowed only as the row's first cell (a row header)");
      }
      cells.push({ header: true, scope: 'row', children });
    } else {
      cells.push({ header: false, children });
    }
  }
  if (cells.length === 0) cursor.fail('<tr> needs at least one cell');
  return cells;
}

function parseTable(cursor: Cursor, source?: string): RichTextEntry {
  let caption: readonly RichTextNode[] | undefined;
  const head: (readonly TableCell[])[] = [];
  const body: (readonly TableCell[])[] = [];
  let section: 'none' | 'thead' | 'tbody' = 'none';

  for (;;) {
    cursor.skipToTag('<table> may contain only <caption>, <thead>, <tbody> and <tr>');
    if (cursor.atEnd()) cursor.fail('unclosed <table>');
    const tag = cursor.readBareTag();
    if (tag.isClosing) {
      if (tag.name === 'table') break;
      if (tag.name !== section) cursor.fail(`stray closing tag </${tag.name}> in <table>`);
      section = 'none';
      continue;
    }
    switch (tag.name) {
      case 'caption':
        if (caption !== undefined || head.length > 0 || body.length > 0) {
          cursor.fail('<caption> must come first in a <table>, once');
        }
        caption = parseRichText(cursor.readBodyUntilClose('caption'), source);
        break;
      case 'thead':
        if (section !== 'none' || head.length > 0 || body.length > 0) {
          cursor.fail('<thead> must come before any body row, once');
        }
        section = 'thead';
        break;
      case 'tbody':
        if (section !== 'none') cursor.fail(`<tbody> cannot open inside <${section}>`);
        section = 'tbody';
        break;
      case 'tr':
        (section === 'thead' ? head : body).push(parseRow(cursor, section === 'thead', source));
        break;
      default:
        cursor.fail(
          `<table> may contain only <caption>, <thead>, <tbody> and <tr>, found <${tag.name}>`,
        );
    }
  }

  if (caption === undefined) {
    cursor.fail('<table> needs a <caption> — it names the table and its scroll region');
  }
  if (body.length === 0) cursor.fail('<table> needs at least one body row');
  const width = (head[0] ?? body[0]).length;
  if ([...head, ...body].some((row) => row.length !== width)) {
    cursor.fail('every row of a <table> must have the same number of cells (no colspan)');
  }
  cursor.expectEnd('table');
  return { kind: 'table', caption, head, body };
}

function parsePlayer(cursor: Cursor, tag: Tag): RichTextEntry {
  const soundFile = tag.attributes['data-audio-player'];
  if (soundFile.trim() === '') cursor.fail('<span> has an empty data-audio-player path');
  const label = tag.attributes['data-audio-label'];
  if (label === undefined || label.trim() === '') {
    cursor.fail(
      `<span data-audio-player="${soundFile}"> needs a data-audio-label — it is the ` +
        "player's visible label",
    );
  }
  if (!tag.isSelfClosing && cursor.readBodyUntilClose('span').trim() !== '') {
    cursor.fail(
      `<span data-audio-player="${soundFile}"> must be empty — put the label in data-audio-label`,
    );
  }
  cursor.expectEnd('span data-audio-player');
  return { kind: 'audioPlayer', soundFile, label };
}

/**
 * Parse one authored rich-text array entry.
 *
 * @param html the authored string
 * @param source optional author-facing path, prefixed onto any error message
 * @throws Error on any structural rule in spec §14, and on anything `parseRichText` rejects
 */
export function parseRichTextEntry(html: string, source?: string): RichTextEntry {
  const fail = failWith(source);
  const start = html.length - html.trimStart().length;
  if (html[start] === '<') {
    const first = readTag(html, start, fail);
    if (!first.isClosing) {
      if (first.name === 'span' && first.attributes['data-audio-player'] !== undefined) {
        return parsePlayer(new Cursor(html, first.end, fail), first);
      }
      if (first.name === 'ul' || first.name === 'ol' || first.name === 'table') {
        const cursor = new Cursor(html, start, fail);
        cursor.readBareTag();
        return first.name === 'table'
          ? parseTable(cursor, source)
          : parseList(cursor, first.name, source);
      }
    }
  }
  return { kind: 'paragraph', children: parseRichText(html, source) };
}
