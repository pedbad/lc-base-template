/**
 * html.ts — HTML-entity decoding for authored exercise text (spec §8, "ported
 * once"). Ported from french-lo-1's htmlUtils.decodeHtmlEntities.
 *
 * Authored content may embed entities (e.g. `l&apos;école`, `caf&#233;`). The sentence
 * parser decodes each text/option segment through this before display, and the
 * build-time content checks read the same decoded text (TODO §E35).
 *
 * One decoder everywhere: the `entities` package's HTML5 decoder, which knows every
 * named (`&eacute;`), decimal (`&#233;`) and hexadecimal (`&#xE9;`) reference the way a
 * browser parsing page text does. It once decoded through an off-screen <textarea> in
 * the browser and only `&apos;` in Node, so the prerendered page, the build's checks and
 * the learner's page each read a different string.
 *
 * Decodes once: `&amp;eacute;` is the text `&eacute;`, never `é`.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §8.
 */
import { decodeHTML } from 'entities/decode';

export const decodeHtmlEntities = (value: string = ''): string => {
  const text = `${value}`;
  // Fast-path: nothing to decode, the common case.
  return text.includes('&') ? decodeHTML(text) : text;
};
