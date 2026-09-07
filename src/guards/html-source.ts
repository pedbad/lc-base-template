/**
 * html-source.ts — the rendered-markup reader guard h asks its questions of
 * (buildlist 26, spec §17).
 *
 * WHY A READER AND NOT A GREP. Guard c can pattern-match a line, because a URL sink is
 * recognisable on its own. Nothing in §17 is: an `<h4>` is legal or illegal depending on
 * the heading that preceded it, a `<nav>` on whether a `<header>` encloses it, a
 * `<table>` on whether it contains a `<th>`, and a `<button>` on what its descendants
 * say once the `aria-hidden` ones are taken out. Every question is about POSITION in the
 * tree, so the reader has to know where it is — the same reason `css-source.ts` parses
 * rather than greps for guards f and g.
 *
 * WHY IT IS SAFE TO BE THIS SMALL. It is not a general HTML parser and must not be used
 * as one. Its input is always output from `renderToString`, which means well-formed
 * markup with every attribute double-quoted, every void element self-closed and no
 * optional end tags — so the tokeniser below has no error recovery, no implied `<tbody>`
 * and no `<p>` auto-closing, because that input cannot produce them. Feeding it
 * hand-written HTML would be a mistake; guard h never does.
 *
 * THE ONE THING REACT EMITS THAT LOOKS LIKE MARKUP AND IS NOT: `<!-- -->`, which it
 * writes between adjacent text nodes so hydration can tell them apart. There are dozens
 * in the LO page. Reading one as an element would corrupt the path of everything after
 * it, so comments are skipped explicitly.
 *
 * THERE ARE NO LINE NUMBERS HERE, AND THAT IS DELIBERATE. Guards b–g report `file:line`
 * because they read source files. `renderToString` returns ONE line — the LO page is a
 * single 23KB string — so a line number would be `1` on every violation in every
 * document: technically present, and useless. What locates a violation in that string is
 * its position in the tree, so every element carries a `path`
 * (`main > section#exercises > article:nth-of-type(2) > button`), which names the
 * enclosing landmark and the id an author can grep the JSX for. Guard h pairs that with
 * the document name, and the two together are strictly more actionable than `:1`.
 *
 * VISIBLE TEXT IS COMPUTED, NOT SCRAPED. `visibleText` omits every `aria-hidden` subtree;
 * `text` keeps them. That distinction IS the icon-only-button rule: a button whose only
 * content is a hidden `<svg>` has text and no accessible name, and reading the wrong one
 * of the two would either miss the defect guard h was written for (`1ce0275`) or flag
 * every correctly-hidden icon in the repo.
 */

/** Elements with no closing tag and no children, whether or not React self-closes them. */
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/** The entities React escapes text and attribute values into. */
const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  '#39': "'",
  '#x27': "'",
};

/** One element of a rendered document, with enough context to judge its position. */
export interface HtmlElement {
  /** Lowercased tag name. */
  readonly tag: string;
  /** Attributes, names lowercased and values entity-decoded. A valueless attribute is `''`. */
  readonly attrs: Readonly<Record<string, string>>;
  /** Where it sits, e.g. `main > section#exercises > article:nth-of-type(2) > button`. */
  readonly path: string;
  /** Enclosing tag names, outermost first; this element's own is not included. */
  readonly ancestors: readonly string[];
  /** Text of every descendant, entity-decoded — `aria-hidden` subtrees INCLUDED. */
  readonly text: string;
  /** Text an assistive technology would read: every `aria-hidden` subtree removed. */
  readonly visibleText: string;
  /** True when this element or an ancestor carries `aria-hidden="true"`. */
  readonly hidden: boolean;
}

/** Everything guard h needs from one rendered document, read in a single pass. */
export interface HtmlTree {
  readonly elements: readonly HtmlElement[];
}

/** Internal node: the parse builds a tree, then flattens it into `HtmlElement`s. */
interface Node {
  readonly tag: string;
  readonly attrs: Record<string, string>;
  readonly children: Node[];
  /** Raw text directly inside this element, in document order, between its children. */
  readonly ownText: string[];
}

/** Decode the entities React produces. Anything else is left alone. */
function decode(text: string): string {
  return text.replace(/&([a-zA-Z]+|#x?[0-9a-fA-F]+);/g, (match, name: string) => {
    const known = ENTITIES[name.toLowerCase()];
    if (known !== undefined) return known;
    const numeric = /^#(x?)([0-9a-fA-F]+)$/.exec(name);
    if (!numeric) return match;
    const code = Number.parseInt(numeric[2] ?? '', numeric[1] ? 16 : 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : match;
  });
}

/** Read the attributes of one start tag from its raw inner text (`a="b" c`). */
function parseAttributes(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(raw)) !== null) {
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attrs[(match[1] ?? '').toLowerCase()] = decode(value);
  }
  return attrs;
}

/** Build the node tree. See the header on why this needs no error recovery. */
function build(html: string): Node {
  const root: Node = { tag: '#root', attrs: {}, children: [], ownText: [] };
  const stack: Node[] = [root];
  let index = 0;

  const top = (): Node => stack[stack.length - 1] ?? root;

  while (index < html.length) {
    const next = html.indexOf('<', index);
    if (next < 0) {
      top().ownText.push(html.slice(index));
      break;
    }
    if (next > index) top().ownText.push(html.slice(index, next));

    // React's `<!-- -->` text separators, and any doctype/CDATA: not elements.
    if (html.startsWith('<!--', next)) {
      const close = html.indexOf('-->', next);
      index = close < 0 ? html.length : close + 3;
      continue;
    }
    if (html.startsWith('<!', next)) {
      const close = html.indexOf('>', next);
      index = close < 0 ? html.length : close + 1;
      continue;
    }

    const close = html.indexOf('>', next);
    if (close < 0) break;
    const inner = html.slice(next + 1, close);
    index = close + 1;

    if (inner.startsWith('/')) {
      const name = inner.slice(1).trim().toLowerCase();
      // Pop to the nearest matching open tag rather than blindly — a stray end tag
      // must not unwind the whole document.
      for (let depth = stack.length - 1; depth > 0; depth -= 1) {
        if (stack[depth]?.tag === name) {
          stack.length = depth;
          break;
        }
      }
      continue;
    }

    const selfClosed = inner.endsWith('/');
    const body = selfClosed ? inner.slice(0, -1) : inner;
    const space = /\s/.exec(body)?.index ?? body.length;
    const tag = body.slice(0, space).toLowerCase();
    if (tag === '') continue;
    const node: Node = {
      tag,
      attrs: parseAttributes(body.slice(space)),
      children: [],
      ownText: [],
    };
    top().children.push(node);
    if (!selfClosed && !VOID_ELEMENTS.has(tag)) stack.push(node);
  }

  return root;
}

/** Concatenate a subtree's text, optionally dropping `aria-hidden` subtrees. */
function textOf(node: Node, skipHidden: boolean): string {
  const parts = [...node.ownText];
  for (const child of node.children) {
    if (skipHidden && child.attrs['aria-hidden'] === 'true') continue;
    parts.push(textOf(child, skipHidden));
  }
  return decode(parts.join(''));
}

/** One path segment: the tag, disambiguated by id or by position among same-tag siblings. */
function segmentOf(node: Node, siblings: readonly Node[]): string {
  const id = node.attrs.id;
  if (id !== undefined && id !== '') return `${node.tag}#${id}`;
  const sameTag = siblings.filter((sibling) => sibling.tag === node.tag);
  if (sameTag.length < 2) return node.tag;
  return `${node.tag}:nth-of-type(${sameTag.indexOf(node) + 1})`;
}

/** Flatten the tree in document order, computing path, ancestry and text per element. */
function flatten(root: Node): HtmlElement[] {
  const elements: HtmlElement[] = [];

  const step = (
    node: Node,
    siblings: readonly Node[],
    ancestors: readonly string[],
    parentPath: string,
    hiddenAbove: boolean,
  ): void => {
    const segment = segmentOf(node, siblings);
    const path = parentPath === '' ? segment : `${parentPath} > ${segment}`;
    const hidden = hiddenAbove || node.attrs['aria-hidden'] === 'true';
    elements.push({
      tag: node.tag,
      attrs: node.attrs,
      path,
      ancestors,
      text: textOf(node, false),
      visibleText: textOf(node, true),
      hidden,
    });
    const nextAncestors = [...ancestors, node.tag];
    for (const child of node.children) step(child, node.children, nextAncestors, path, hidden);
  };

  for (const child of root.children) step(child, root.children, [], '', false);
  return elements;
}

/** Read one rendered document into the elements it contains. */
export function parseHtml(html: string): HtmlTree {
  return { elements: flatten(build(html)) };
}

/** Whitespace-collapsed text, for comparing an accessible name against nothing. */
export function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}
