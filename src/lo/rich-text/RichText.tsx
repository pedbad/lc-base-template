/**
 * RichText — render a parsed inline rich-text node list as React.
 *
 * The other half of the no-raw-HTML contract: the parser guarantees only allowlisted
 * nodes exist, so this maps a closed union to elements with no escaping, no
 * sanitising and no `dangerouslySetInnerHTML` anywhere. An audio node becomes a real
 * `AudioClip`, which is the whole reason the pipeline parses instead of injecting
 * (spec §6, §13).
 *
 * Inline-only: no node here produces a block element, so `RichText` is always safe to
 * drop inside a `<p>` — which is exactly how `TextBlock` and the modal body use it.
 *
 * Spec: docs/specs/lo-rich-text-modals.md §4, §6, §10.
 */
import { ExternalLink } from 'lucide-react';
import { AudioClip } from '@/components/audio/AudioClip';
import { resolveLabel } from '@/config/ui-strings';
import { resolveAsset } from '@/lib/assets';
import type { RichTextNode } from './rich-text-nodes';
import { ModalLink } from './modal/ModalLink';
import { HoverTerm } from './hover/HoverTerm';

/** A speaker inside a line of text: 36px, so the line keeps its rhythm. Stand-alone
 *  speakers are 54px (maintainer, 2026-10-08). */
const INLINE_SPEAKER_SIZE = 36;

/** Render one node. Split out so parents can recurse over their children. */
function RichTextNodeView({ node }: { node: RichTextNode }) {
  switch (node.kind) {
    case 'text':
      return node.value;
    case 'strong':
      return (
        <strong>
          <RichText nodes={node.children} />
        </strong>
      );
    case 'em':
      return (
        <em>
          <RichText nodes={node.children} />
        </em>
      );
    case 'break':
      return <br />;
    case 'modalLink':
      return (
        <ModalLink target={node.target}>
          <RichText nodes={node.children} />
        </ModalLink>
      );
    case 'link':
      // Always a new tab, and said so: the icon for the eye, the sr-only text for a
      // screen reader (maintainer, 2026-10-09).
      return (
        <a
          href={resolveAsset(node.href)}
          target="_blank"
          rel="noopener noreferrer"
          className="rich-text-link"
        >
          <RichText nodes={node.children} />
          <ExternalLink className="rich-text-link-icon" aria-hidden="true" />
          <span className="sr-only">{` ${resolveLabel('opensInNewTab')}`}</span>
        </a>
      );
    case 'hoverTerm':
      return (
        <HoverTerm target={node.target}>
          <RichText nodes={node.children} />
        </HoverTerm>
      );
    case 'audio':
      // The speaker variant has no visible text, so `title` is its accessible name.
      // Omitted when unauthored, letting AudioClip fall back to its play/pause hint.
      return (
        <AudioClip
          className="super-compact-speaker"
          inline
          size={INLINE_SPEAKER_SIZE}
          soundFile={node.soundFile}
          title={node.label}
        />
      );
  }
}

/** Render a node list in order. */
export function RichText({ nodes }: { nodes: readonly RichTextNode[] }) {
  return (
    <>
      {nodes.map((node, index) => (
        // Index is a stable key here: rich text comes from static authored config and
        // is never reordered at runtime — the same reasoning TextBlock uses for its
        // paragraph list.
        <RichTextNodeView key={index} node={node} />
      ))}
    </>
  );
}
