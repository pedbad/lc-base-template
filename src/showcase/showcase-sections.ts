/**
 * showcase-sections.ts — the showcase's "Jump to card" menu entries.
 *
 * A `.ts` file of its own because the react-refresh lint rule forbids a component file
 * from exporting anything but components.
 */
import { SHOWCASE_FIXTURES } from './fixtures';

/** The "jump to" menu: the rich-text card, then one entry per engine card, in fixture order. */
export const SHOWCASE_SECTIONS = [
  { id: 'rich-text', label: 'Rich text' },
  ...SHOWCASE_FIXTURES.map((fixture) => ({ id: fixture.id, label: fixture.title })),
];
