/**
 * parse-rich-text.ts — one authored inline-HTML string → `RichTextNode[]`.
 *
 * A CLOSED allowlist with loud failure (spec R2): six known shapes are accepted and
 * everything else throws. That inversion is the whole safety argument — this parser
 * can never silently mis-render unknown input, because unknown input is an error, so
 * no sanitiser and no `dangerouslySetInnerHTML` are involved anywhere downstream.
 *
 * Hand-rolled rather than `htmlparser2` because `load-lo-glob.ts` runs in the BROWSER
 * (`import.meta.glob` inlines the JSON into the bundle), so a parser dependency plus
 * its four transitive deps would ship to every visitor to parse a six-tag grammar.
 * The node union is the stable interface: if the grammar ever grows to block-level
 * content, swap the tokenizer and leave `RichText.tsx` untouched (spec §9, §12).
 *
 * Runs at LOAD, not at render, so a bad tag dies with the author-facing file path the
 * same way a bad schema does — and Part D's Node pre-render needs no DOM (spec §5).
 *
 * Spec: docs/specs/lo-rich-text-modals.md §2, §4, §5, §9.
 */
import type { RichTextNode } from './rich-text-nodes';

/** Named entities worth decoding. Anything else is left verbatim — see `decode`. */
const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
};

/** Presentational tags the repo bans, mapped to the semantic tag to use instead. */
const BANNED_TAGS: Readonly<Record<string, string>> = { b: 'strong', i: 'em' };

/** Matches a named, decimal or hexadecimal character reference. */
const ENTITY_PATTERN = /&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi;

/**
 * Decode character references in authored text.
 *
 * An unrecognised `&foo;` is left VERBATIM rather than dropped or guessed at: a bare
 * `&` in prose is far likelier than a named entity we forgot, and silently deleting
 * authored text is the worse failure. Single pass, so `&amp;lt;` correctly yields the
 * literal `&lt;` instead of being decoded twice into `<`.
 */
function decode(text: string): string {
  return text.replace(ENTITY_PATTERN, (match, reference: string) => {
    if (reference.startsWith('#x') || reference.startsWith('#X')) {
      return String.fromCodePoint(Number.parseInt(reference.slice(2), 16));
    }
    if (reference.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(reference.slice(1), 10));
    }
    return NAMED_ENTITIES[reference.toLowerCase()] ?? match;
  });
}

/** One parsed tag: its name, attributes, and which of the three forms it took. */
interface Tag {
  readonly name: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly isClosing: boolean;
  readonly isSelfClosing: boolean;
  /** Index just past the tag's `>`. */
  readonly end: number;
}

/** Matches one attribute: quoted value, or bare name with no value. */
const ATTRIBUTE_PATTERN = /([a-z][a-z0-9-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/gi;

/** Parse the attribute section of a tag into a lowercased-key map. */
function parseAttributes(source: string): Readonly<Record<string, string>> {
  const attributes: Record<string, string> = {};
  for (const match of source.matchAll(ATTRIBUTE_PATTERN)) {
    const [, name, doubleQuoted, singleQuoted, bare] = match;
    attributes[name.toLowerCase()] = decode(doubleQuoted ?? singleQuoted ?? bare ?? '');
  }
  return attributes;
}

/**
 * Read the tag starting at `html[start]` (which must be `<`). Scans to the closing
 * `>` while respecting quoted attribute values, so a `>` inside a value cannot end
 * the tag early.
 */
function readTag(html: string, start: number, fail: (message: string) => never): Tag {
  let index = start + 1;
  const isClosing = html[index] === '/';
  if (isClosing) index += 1;

  const nameStart = index;
  while (index < html.length && /[a-z0-9]/i.test(html[index])) index += 1;
  const name = html.slice(nameStart, index).toLowerCase();
  if (name === '') fail(`malformed tag at position ${String(start)} — no tag name`);

  let quote: string | null = null;
  const bodyStart = index;
  while (index < html.length) {
    const character = html[index];
    if (quote !== null) {
      if (character === quote) quote = null;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      break;
    }
    index += 1;
  }
  if (index >= html.length) fail(`unclosed tag <${name}> — no ">" found`);

  const body = html.slice(bodyStart, index).trim();
  const isSelfClosing = body.endsWith('/');

  return {
    name,
    attributes: parseAttributes(isSelfClosing ? body.slice(0, -1) : body),
    isClosing,
    isSelfClosing,
    end: index + 1,
  };
}

/** True when `value`'s whitespace-separated tokens include `token`. */
function hasToken(value: string | undefined, token: string): boolean {
  return (value ?? '').split(/\s+/).includes(token);
}

/** Build the node for a `<a>`, enforcing the modal-link contract (spec §7). */
function makeModalLink(
  attributes: Readonly<Record<string, string>>,
  children: readonly RichTextNode[],
  fail: (message: string) => never,
): RichTextNode {
  const target = attributes['data-modal-target'];
  if (target === undefined) {
    fail(
      '<a> is only supported as a modal link: it needs class="modal-link" and a ' +
        'non-empty data-modal-target. Plain links are not part of the allowlist.',
    );
  }
  if (target.trim() === '') fail('<a> has an empty data-modal-target');
  if (!hasToken(attributes.class, 'modal-link')) {
    fail(`<a data-modal-target="${target}"> is missing class="modal-link"`);
  }
  return { kind: 'modalLink', target, children };
}

/** Build the node for an audio `<span>`, enforcing emptiness (spec §6). */
function makeAudio(
  attributes: Readonly<Record<string, string>>,
  children: readonly RichTextNode[],
  fail: (message: string) => never,
): RichTextNode {
  const soundFile = attributes['data-audio'];
  if (soundFile === undefined) {
    fail('<span> is only supported as an audio icon: it needs a non-empty data-audio path');
  }
  if (soundFile.trim() === '') fail('<span> has an empty data-audio path');
  if (children.length > 0) {
    fail(
      `<span data-audio="${soundFile}"> must be empty — a speaker icon has no text ` +
        'content, and children here would be silently dropped. Put the label in ' +
        'data-audio-label instead.',
    );
  }
  const label = attributes['data-audio-label'];
  return label === undefined || label === ''
    ? { kind: 'audio', soundFile }
    : { kind: 'audio', soundFile, label };
}

/** An open element awaiting its closing tag. */
interface Frame {
  readonly name: string;
  readonly children: RichTextNode[];
  /** Builds the finished node once the closing tag arrives. */
  readonly close: (children: readonly RichTextNode[]) => RichTextNode;
}

/**
 * Parse one authored inline-rich-text string.
 *
 * @param html the authored string; plain text with no markup is valid and yields one text node
 * @param source optional author-facing path, prefixed onto any error message
 * @throws Error on any tag outside the allowlist, and on unclosed, mismatched or stray tags
 */
export function parseRichText(html: string, source?: string): readonly RichTextNode[] {
  // Annotated on the CONST, not just the arrow's return: TypeScript only treats calls
  // to a never-returning function as unreachable (so `frame` narrows after a
  // `fail(...)` guard) when the identifier itself carries the type.
  const fail: (message: string) => never = (message) => {
    throw new Error(source === undefined ? message : `${source}: ${message}`);
  };

  const root: RichTextNode[] = [];
  const stack: Frame[] = [];
  const current = (): RichTextNode[] => stack[stack.length - 1]?.children ?? root;

  const pushText = (raw: string): void => {
    if (raw === '') return;
    current().push({ kind: 'text', value: decode(raw) });
  };

  let index = 0;
  while (index < html.length) {
    const next = html.indexOf('<', index);
    if (next === -1) {
      pushText(html.slice(index));
      break;
    }
    pushText(html.slice(index, next));

    const tag = readTag(html, next, fail);
    index = tag.end;

    if (BANNED_TAGS[tag.name] !== undefined) {
      fail(
        `<${tag.name}> is not allowed — use <${BANNED_TAGS[tag.name]}> instead. ` +
          'Presentational emphasis tags carry no meaning for assistive tech.',
      );
    }

    if (tag.isClosing) {
      const frame = stack.pop();
      if (frame === undefined) fail(`stray closing tag </${tag.name}>`);
      if (frame.name !== tag.name) {
        fail(`mismatched tags: <${frame.name}> closed by </${tag.name}>`);
      }
      current().push(frame.close(frame.children));
      continue;
    }

    switch (tag.name) {
      case 'br':
        current().push({ kind: 'break' });
        continue;
      case 'strong':
      case 'em': {
        const kind = tag.name;
        stack.push({
          name: kind,
          children: [],
          close: (children) => ({ kind, children }),
        });
        break;
      }
      case 'a':
        stack.push({
          name: 'a',
          children: [],
          close: (children) => makeModalLink(tag.attributes, children, fail),
        });
        break;
      case 'span':
        stack.push({
          name: 'span',
          children: [],
          close: (children) => makeAudio(tag.attributes, children, fail),
        });
        break;
      default:
        fail(
          `<${tag.name}> is not in the rich-text allowlist ` +
            '(strong, em, br, a.modal-link, span[data-audio])',
        );
    }

    // A self-closing form closes the frame we just opened, with no children.
    if (tag.isSelfClosing) {
      const frame = stack.pop();
      if (frame !== undefined) current().push(frame.close(frame.children));
    }
  }

  if (stack.length > 0) fail(`unclosed tag <${stack[stack.length - 1].name}>`);
  return root;
}
