/**
 * rich-text-nodes.ts — the node union authored inline rich text parses INTO.
 *
 * This union is the stable interface of the rich-text pipeline: the parser produces
 * it, `RichText` renders it, and `assembleLo` stores it. Swapping the hand-rolled
 * tokenizer for a real HTML parser later (spec §9) changes neither side.
 *
 * Inline-only by design (spec R4): paragraph breaks come from the authored `string[]`
 * array, never from a `<p>` tag inside a string, so there is no block level here.
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
