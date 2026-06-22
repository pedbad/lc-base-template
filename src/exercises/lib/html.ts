/**
 * html.ts — HTML-entity decoding for authored exercise text (spec §8, "ported
 * once"). Ported from french-lo-1's htmlUtils.decodeHtmlEntities.
 *
 * Authored content may embed entities (e.g. `l&apos;école`, `&lt;b&gt;`). The
 * sentence parser decodes each text/option segment through this before display.
 *
 * Three branches, cheapest first:
 *   1. Fast-path — no `&` at all → return as-is (the common case).
 *   2. Non-browser (bun test / SSR) — no `document`, so decode only `&apos;`, the
 *      entity that dominates language content (contractions like l'école).
 *   3. Browser — delegate to the HTML parser via an off-screen <textarea>, which
 *      covers all named (`&eacute;`), decimal (`&#233;`) and hex (`&#xE9;`)
 *      entities with no regex table to maintain.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §8.
 */
export const decodeHtmlEntities = (value: string = ''): string => {
  const text = `${value}`;

  // 1. Fast-path: nothing to decode.
  if (!text.includes('&')) return text;

  // 2. Non-browser: handle the one entity that appears most often in content.
  if (typeof document === 'undefined') {
    return text.replaceAll('&apos;', "'");
  }

  // 3. Browser: let the HTML parser decode every entity.
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};
