/**
 * AnswerFeedback.test.tsx — the line under a wrong typed answer (TODO §D15). A hint
 * names the error in the UI language and never shows the answer; a reveal shows the
 * answer in the course language with the differing part in a <mark>, and says it in
 * words for a screen reader.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { AnswerFeedback } from './AnswerFeedback';

describe('AnswerFeedback', () => {
  test.each([
    ['accent', 'Almost. Check the accents.'],
    ['ending', 'Close. Look at the ending.'],
    ['missing', 'Close. Something is missing.'],
    ['close', 'Close. Check the spelling.'],
    ['far', 'Not quite. Try again.'],
  ] as const)('a %s hint says "%s" and no answer', (reason, text) => {
    const html = renderToStaticMarkup(
      <AnswerFeedback feedback={{ kind: 'hint', reason }} contentLang="es" />,
    );

    expect(html).toContain(text);
    expect(html).not.toContain('Answer:');
    expect(html).not.toContain('lang="es"');
  });

  test('a reveal shows the answer in the course language, the difference marked', () => {
    const html = renderToStaticMarkup(
      <AnswerFeedback
        feedback={{
          kind: 'reveal',
          answer: 'los gatos',
          segments: [
            { text: 'los gat', differs: false },
            { text: 'o', differs: true },
            { text: 's', differs: false },
          ],
        }}
        contentLang="es"
      />,
    );

    expect(html).toContain('Answer:');
    expect(html).toMatch(/<span lang="es"[^>]*>los gat<mark[^>]*>o<\/mark>s<\/span>/);
    // Bold, a thick primary underline and an opaque tint (answer-feedback.css): the
    // info alert's tint was invisible in dark and a sliver on one letter (maintainer,
    // 2026-10-09).
    expect(html).toMatch(/<mark class="answer-diff">o<\/mark>/);
    expect(html).toMatch(/class="sr-only"[^>]*>[^<]*Highlighted: what differs from yours/);
  });

  test('the visible key shows only where the engine asks for it', () => {
    const feedback = {
      kind: 'reveal',
      answer: 'los gatos',
      segments: [
        { text: 'los gat', differs: false },
        { text: 'o', differs: true },
        { text: 's', differs: false },
      ],
    } as const;
    const withKey = renderToStaticMarkup(
      <AnswerFeedback feedback={feedback} contentLang="es" showKey />,
    );
    const withoutKey = renderToStaticMarkup(
      <AnswerFeedback feedback={feedback} contentLang="es" />,
    );

    expect(withKey.match(/Highlighted: what differs from yours/g)).toHaveLength(2);
    expect(withoutKey.match(/Highlighted: what differs from yours/g)).toHaveLength(1);
  });

  test('a far-miss reveal is the plain answer, nothing marked', () => {
    const html = renderToStaticMarkup(
      <AnswerFeedback
        feedback={{
          kind: 'reveal',
          answer: 'los gatos',
          segments: [{ text: 'los gatos', differs: false }],
        }}
        contentLang="es"
        showKey
      />,
    );

    expect(html).not.toContain('<mark');
    expect(html).not.toContain('Highlighted');
  });

  test('an exercise can reword a message', () => {
    const html = renderToStaticMarkup(
      <AnswerFeedback
        feedback={{ kind: 'hint', reason: 'far' }}
        contentLang="es"
        labels={{ hintFar: 'Try once more.' }}
      />,
    );
    expect(html).toContain('Try once more.');
  });
});
