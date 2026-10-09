/**
 * rich-text.fixture.ts — the showcase's rich-text authoring reference (spec §14).
 *
 * AUTHORED strings, exactly as they would appear in a `block.json` `text[]` or a
 * `modal.json` `content[]`, parsed here by the same `parseRichTextEntry` the loader
 * uses — so the showcase renders what an author's file would, and a typo here fails
 * at import like a bad LO file fails at load.
 *
 * Audio stays in the showcase quarantine, `audio/showcase-demo/` (see
 * showcase-audio-assets.test.ts); a real LO uses `audio/<lo-slug>/`.
 */
import type { HoverContent } from '@/lo/rich-text/hover/hover-context';
import { parseRichText } from '@/lo/rich-text/parse-rich-text';
import { parseRichTextEntry } from '@/lo/rich-text/parse-rich-text-entry';
import type { RichTextEntry } from '@/lo/rich-text/rich-text-nodes';

const CLIP = 'audio/showcase-demo/flashcards/casa.m4a';
const HOVER_ID = 'showcase-hover-term';
const SOURCE = 'src/showcase/rich-text.fixture.ts';

/**
 * The two links a paragraph can hold besides a popup link (TODO §D14): a plain link,
 * which opens in a new tab, and a hover term. Its own export so the debug sandbox's type
 * reference renders this string, not a copy of it.
 */
export const RICH_TEXT_LINKS_SOURCE = `Besides a popup link, a paragraph can hold a <a href="debug-sandbox.html">plain link</a> to another page and a <span class="hover-term" data-hover-target="${HOVER_ID}">hover term</span> with more to say.`;

/** The hover card, exactly as `hovers/<id>/hover.json` would hold it. */
export const RICH_TEXT_SHOWCASE_HOVER_SOURCE = {
  [HOVER_ID]: {
    title: 'A hover card',
    path: 'lo-config/lo-NN-slug/hovers/<id>/hover.json',
    content: [
      'A term with <strong>more to say</strong>, declared in <em>lo.json</em>’s hovers list.',
      'Its lines are inline rich text only: the card sits inside a paragraph.',
    ],
  },
} as const;

/** One per entry kind, in the order an author would most likely meet them. */
export const RICH_TEXT_SHOWCASE_SOURCE: readonly string[] = [
  `A paragraph holds inline rich text: <strong>strong</strong>, <em>em</em>, a line break,<br>and a speaker icon mid-sentence <span data-audio="${CLIP}" data-audio-label="Play the demo clip"></span>`,
  '<ul><li>An unordered list for loose points.</li><li>Items hold inline rich text — <strong>strong</strong>, <em>em</em>, popup links and speakers.</li></ul>',
  '<ol><li>An ordered list for steps.</li><li>Use it when the order matters.</li></ol>',
  `<table><caption>A captioned table (the caption is required)</caption><thead><tr><th>Column header</th><th>Another</th><th>Listen</th></tr></thead><tbody><tr><th>Row header</th><td>A cell</td><td><span data-audio="${CLIP}" data-audio-label="Play row one"></span></td></tr><tr><th>Row header</th><td>Another cell</td><td><span data-audio="${CLIP}" data-audio-label="Play row two"></span></td></tr></tbody></table>`,
  RICH_TEXT_LINKS_SOURCE,
  `<span data-audio-player="${CLIP}" data-audio-label="The audio player, labelled"></span>`,
];

export const RICH_TEXT_SHOWCASE_ENTRIES: readonly RichTextEntry[] = RICH_TEXT_SHOWCASE_SOURCE.map(
  (entry) => parseRichTextEntry(entry, SOURCE),
);

export const RICH_TEXT_LINKS_ENTRY: RichTextEntry = parseRichTextEntry(
  RICH_TEXT_LINKS_SOURCE,
  SOURCE,
);

/** The cards, parsed as the loader parses `hover.json` (assemble-lo.ts). */
export const RICH_TEXT_SHOWCASE_HOVERS: Readonly<Record<string, HoverContent>> = Object.fromEntries(
  Object.entries(RICH_TEXT_SHOWCASE_HOVER_SOURCE).map(([id, { title, path, content }]) => [
    id,
    { id, title, path, content: content.map((line) => parseRichText(line, SOURCE)) },
  ]),
);
