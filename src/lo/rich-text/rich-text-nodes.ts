/**
 * rich-text-nodes.ts — the node union authored inline rich text parses INTO.
 *
 * This union is the stable interface of the rich-text pipeline: the parser produces
 * it, `RichText` renders it, and `assembleLo` stores it. Swapping the hand-rolled
 * tokenizer for a real HTML parser later (spec §9) changes neither side.
 *
 * The inline union is inline-only: paragraph breaks come from the authored `string[]`
 * array, never from a `<p>` tag. Block entries (lists, tables, the audio player) wrap
 * it at the bottom of this file (spec §14, which amends R4).
 *
 * Spec: docs/specs/lo-rich-text-modals.md §4.
 */

/** Plain text, with entities already decoded. */
export interface TextNode {
  readonly kind: 'text';
  readonly value: string;
}

/** `<strong>` — semantic emphasis. Never `<b>` (carry-forward anti-pattern #16). */
export interface StrongNode {
  readonly kind: 'strong';
  readonly children: readonly RichTextNode[];
}

/** `<em>` — semantic stress. Never `<i>`. */
export interface EmNode {
  readonly kind: 'em';
  readonly children: readonly RichTextNode[];
}

/** `<br>` — an author-chosen line break inside one paragraph. */
export interface BreakNode {
  readonly kind: 'break';
}

/** A link that opens modal `target` — rendered as a button, not an anchor (spec §7). */
export interface ModalLinkNode {
  readonly kind: 'modalLink';
  readonly target: string;
  readonly children: readonly RichTextNode[];
}

/** An inline audio icon, rendered by `AudioClip`'s speaker variant (spec §6). */
export interface AudioNode {
  readonly kind: 'audio';
  readonly soundFile: string;
  /** Overrides the control's accessible name when the default is too generic. */
  readonly label?: string;
}

export type RichTextNode = TextNode | StrongNode | EmNode | BreakNode | ModalLinkNode | AudioNode;

/** Nodes that wrap other nodes — the ones a walker must recurse into. */
export type RichTextParentNode = StrongNode | EmNode | ModalLinkNode;

/** True when `node` has children to walk. */
export function isParentNode(node: RichTextNode): node is RichTextParentNode {
  return node.kind === 'strong' || node.kind === 'em' || node.kind === 'modalLink';
}

/**
 * Every modal id linked from `nodes`, at any depth. Used by the loader's
 * cross-reference guard (spec §5) and by tests that assert a link resolves.
 */
export function collectModalTargets(nodes: readonly RichTextNode[]): readonly string[] {
  return nodes.flatMap((node) => {
    if (node.kind === 'modalLink') return [node.target, ...collectModalTargets(node.children)];
    return isParentNode(node) ? collectModalTargets(node.children) : [];
  });
}

/** Every audio path referenced by `nodes`, at any depth. Used by the asset guard. */
export function collectAudioPaths(nodes: readonly RichTextNode[]): readonly string[] {
  return nodes.flatMap((node) => {
    if (node.kind === 'audio') return [node.soundFile];
    return isParentNode(node) ? collectAudioPaths(node.children) : [];
  });
}

/*
 * --- Block entries (spec §14) ----------------------------------------------------
 *
 * One authored array entry is a paragraph of the inline nodes above OR one whole
 * block. The inline union stays untouched: entries WRAP it, so every inline walker
 * keeps working and only these entry-level helpers know blocks exist.
 */

/** A paragraph of inline rich text — what every entry was before §14. */
export interface ParagraphEntry {
  readonly kind: 'paragraph';
  readonly children: readonly RichTextNode[];
}

/** `<ul>` / `<ol>`: one inline node list per `<li>`. No nesting in v2. */
export interface ListEntry {
  readonly kind: 'list';
  readonly ordered: boolean;
  readonly items: readonly (readonly RichTextNode[])[];
}

/** One `<th>`/`<td>`. `scope` is derived from position, never authored. */
export interface TableCell {
  readonly header: boolean;
  readonly scope?: 'col' | 'row';
  readonly children: readonly RichTextNode[];
}

/** A captioned table. The caption is required: it names the table and its scroll region. */
export interface TableEntry {
  readonly kind: 'table';
  readonly caption: readonly RichTextNode[];
  readonly head: readonly (readonly TableCell[])[];
  readonly body: readonly (readonly TableCell[])[];
}

/** `<span data-audio-player>`: the full native player, with a required visible label. */
export interface AudioPlayerEntry {
  readonly kind: 'audioPlayer';
  readonly soundFile: string;
  readonly label: string;
}

export type RichTextEntry = ParagraphEntry | ListEntry | TableEntry | AudioPlayerEntry;

/** Every inline node list inside one entry, in reading order. */
function inlineListsOf(entry: RichTextEntry): readonly (readonly RichTextNode[])[] {
  switch (entry.kind) {
    case 'paragraph':
      return [entry.children];
    case 'list':
      return entry.items;
    case 'table':
      return [entry.caption, ...[...entry.head, ...entry.body].flat().map((c) => c.children)];
    case 'audioPlayer':
      return [];
  }
}

/** Every modal id linked from `entries`, at any depth — the entry-level `collectModalTargets`. */
export function collectEntryModalTargets(entries: readonly RichTextEntry[]): readonly string[] {
  return entries.flatMap(inlineListsOf).flatMap(collectModalTargets);
}

/** Every audio path in `entries` — inline speakers AND players — for the asset guard. */
export function collectEntryAudioPaths(entries: readonly RichTextEntry[]): readonly string[] {
  return entries.flatMap((entry) => [
    ...(entry.kind === 'audioPlayer' ? [entry.soundFile] : []),
    ...inlineListsOf(entry).flatMap(collectAudioPaths),
  ]);
}
