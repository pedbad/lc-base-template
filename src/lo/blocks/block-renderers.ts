/**
 * block-renderers.ts — maps a block `type` to the component that renders its body.
 *
 * The block-side counterpart of `lazyRegistry`: the single place that says "this
 * block `type` is rendered by this component". Blocks are NOT in the exercise
 * registry (they are content, not engines), so they need their own map — but the same
 * contract: a `type` with no entry resolves to `undefined` and the caller handles it
 * visibly, never silently.
 *
 * Not lazy: block bodies are a few paragraphs of static markup with no per-type
 * dependencies, so there is nothing worth code-splitting. (Part D also pre-renders
 * every LO through `renderToStaticMarkup`, where `React.lazy` cannot resolve.)
 *
 * Each renderer validates its own `content` against its per-type schema — the same
 * deliberate deferral the 12 exercise engines use, so `BlockConfigSchema.content`
 * stays loose while every shipped type is still strictly checked.
 */
import type { ComponentType } from 'react';
import { ProseBlock, GrammarBlock } from './TextBlock';
import { VocabularyBlock } from './VocabularyBlock';

/** Props every block renderer receives: the block's raw, type-specific `content`. */
export interface BlockRendererProps {
  content: unknown;
}

export type BlockRenderer = ComponentType<BlockRendererProps>;

/** The registry. Add an entry when a new block `type` ships. */
export const BLOCK_RENDERERS: Readonly<Record<string, BlockRenderer>> = {
  prose: ProseBlock,
  grammar: GrammarBlock,
  vocabulary: VocabularyBlock,
};

/** Resolve a block renderer by type, or `undefined` if no such type ships. */
export function getBlockRenderer(type: string): BlockRenderer | undefined {
  return BLOCK_RENDERERS[type];
}
