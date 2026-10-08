/**
 * VocabularyBlock.test.tsx — the gloss lines up with its term. The term shares a
 * centred row with its 54px speaker (maintainer, 2026-10-08), so the gloss centres in
 * the row too instead of riding at the top.
 */
import { describe, expect, test } from 'vitest';
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

const items = [
  { term: 'Salut', gloss: 'hi' },
  { term: 'Bonjour', gloss: 'hello' },
];

// Maintainer, 2026-10-08, after french-lo-1: a "You will learn" info alert and two
// sort buttons above the terms.
describe('vocabulary summary and sort', () => {
  test('renders the summary as an info alert: the lead, then a ticked list', () => {
    const html = renderToStaticMarkup(
      <VocabularyBlock
        content={{
          summary: { lead: 'You will learn:', items: ['Greetings (<em>Hola</em>)', 'Farewells'] },
          items,
        }}
      />,
    );

    expect(html).toContain('role="note"');
    expect(html).toContain('You will learn:');
    expect(html).toContain('<em>Hola</em>');
    expect((html.match(/<li/g) ?? []).length).toBe(2);
    expect(html.indexOf('You will learn:')).toBeLessThan(html.indexOf('<dl'));
  });

  test('offers Semantic and Alphabetical above the terms, Semantic pressed first', () => {
    const html = renderToStaticMarkup(<VocabularyBlock content={{ items }} />);

    expect(html).toContain('role="group" aria-label="Sort the vocabulary"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>.*Semantic<\/button>/);
    expect(html).toMatch(/aria-pressed="false"[^>]*>.*Alphabetical<\/button>/);
    expect(html.indexOf('Semantic')).toBeLessThan(html.indexOf('<dl'));
    // Authored order until the learner sorts.
    expect(html.indexOf('Salut')).toBeLessThan(html.indexOf('Bonjour'));
  });

  // Maintainer, 2026-10-08: the alert once sat flush against the accordion header and
  // carried its own mt-2. Every accordion body now has that 8px of top padding
  // (LoAccordion), so the alert must not add a second 8px on top of it.
  test('leaves the space above the summary alert to the accordion body', () => {
    const html = renderToStaticMarkup(
      <VocabularyBlock
        content={{ summary: { lead: 'You will learn:', items: ['Greetings'] }, items }}
      />,
    );
    expect(html).toMatch(/role="note"/);
    expect(html).not.toMatch(/role="note"[^>]*class="[^"]*\bmt-2\b/);
  });

  test('hides the sort buttons when there is nothing to sort', () => {
    const html = renderToStaticMarkup(
      <VocabularyBlock content={{ items: [{ term: 'Hola', gloss: 'hello' }] }} />,
    );
    expect(html).not.toContain('Sort the vocabulary');
  });
});
