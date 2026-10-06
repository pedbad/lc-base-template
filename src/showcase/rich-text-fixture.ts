/**
 * rich-text-fixture.ts — the showcase's rich-text authoring reference (spec §14).
 *
 * AUTHORED strings, exactly as they would appear in a `block.json` `text[]` or a
 * `modal.json` `content[]`, parsed here by the same `parseRichTextEntry` the loader
 * uses — so the showcase renders what an author's file would, and a typo here fails
 * at import like a bad LO file fails at load.
 *
 * Audio stays in the showcase quarantine, `audio/showcase-demo/` (see
 * showcase-audio-assets.test.ts); a real LO uses `audio/<lo-slug>/`.
 */
import { parseRichTextEntry } from '@/lo/rich-text/parse-rich-text-entry';
import type { RichTextEntry } from '@/lo/rich-text/rich-text-nodes';

const CLIP = 'audio/showcase-demo/flashcards/casa.m4a';

/** One per entry kind, in the order an author would most likely meet them. */
export const RICH_TEXT_SHOWCASE_SOURCE: readonly string[] = [
  `A paragraph holds inline rich text: <strong>strong</strong>, <em>em</em>, a line break,<br>and a speaker icon mid-sentence <span data-audio="${CLIP}" data-audio-label="Play the demo clip"></span>`,
  '<ul><li>An unordered list for loose points.</li><li>Items hold inline rich text — <strong>strong</strong>, <em>em</em>, popup links and speakers.</li></ul>',
  '<ol><li>An ordered list for steps.</li><li>Use it when the order matters.</li></ol>',
  `<table><caption>A captioned table (the caption is required)</caption><thead><tr><th>Column header</th><th>Another</th><th>Listen</th></tr></thead><tbody><tr><th>Row header</th><td>A cell</td><td><span data-audio="${CLIP}" data-audio-label="Play row one"></span></td></tr><tr><th>Row header</th><td>Another cell</td><td><span data-audio="${CLIP}" data-audio-label="Play row two"></span></td></tr></tbody></table>`,
  `<span data-audio-player="${CLIP}" data-audio-label="The audio player, labelled"></span>`,
];

export const RICH_TEXT_SHOWCASE_ENTRIES: readonly RichTextEntry[] = RICH_TEXT_SHOWCASE_SOURCE.map(
  (entry) => parseRichTextEntry(entry, 'src/showcase/rich-text-fixture.ts'),
);
