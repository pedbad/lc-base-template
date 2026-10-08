/**
 * VocabularyBlock.test.tsx — the gloss lines up with its term. The term shares a
 * centred row with its 54px speaker (maintainer, 2026-10-08), so the gloss centres in
 * the row too instead of riding at the top.
 */
import { expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { VocabularyBlock } from './VocabularyBlock';

test('centres each gloss against its term and speaker', () => {
  const html = renderToStaticMarkup(
    <VocabularyBlock
      content={{
        items: [
          { term: 'la casa', gloss: 'the house', audio: 'audio/lo-00-example/placeholder.m4a' },
        ],
      }}
    />,
  );

  expect(html).toContain('<dd class="self-center text-muted-foreground">the house</dd>');
});
