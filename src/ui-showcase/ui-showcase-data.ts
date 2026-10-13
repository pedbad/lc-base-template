/**
 * ui-showcase-data.ts — the example LO, the block groups built from it, and the
 * "Jump to block type" entries. A `.ts` file of its own because the react-refresh lint
 * rule forbids a component file from exporting anything but components.
 */
import { loadLo } from '@/lo/load-lo-glob';
import { BLOCK_FIXTURES } from './block-fixtures';
import { EXAMPLE_LO_SLUG, buildBlockGroups } from './block-groups';

/** The example LO: its blocks, and the popups and hover cards their rich text opens. */
export const EXAMPLE_LO = loadLo(EXAMPLE_LO_SLUG);

export const UI_SHOWCASE_GROUPS = buildBlockGroups(EXAMPLE_LO, BLOCK_FIXTURES);

export const UI_SHOWCASE_SECTIONS = UI_SHOWCASE_GROUPS.map((group) => ({
  id: group.type,
  label: group.label,
}));
