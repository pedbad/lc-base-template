/**
 * Tests for ReadingExercise (design §6, engine #4.4). Rendered to static markup via
 * react-dom/server so no DOM is needed under `bun test` (matches the conjugation /
 * ExerciseInstructions convention). These assert the initial render: the lang-tagged
 * passage, one radiogroup per question, radio + true-false option labels, and the
 * invalid-config guard.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TARGET_LANG } from '@/lib/lang';
import ReadingExercise from './ReadingExercise';
import { readingFixtures } from './reading.fixture';

const baseConfig = {
  type: 'reading',
  content: {
    passage: 'Ana vive en Madrid.\n\nTrabaja en una oficina.',
    questions: [
      {
        type: 'radio',
        prompt: '¿Dónde vive Ana?',
        options: ['Madrid', 'Sevilla'],
        answer: 'Madrid',
      },
      { type: 'true-false', prompt: 'Ana trabaja en una oficina.', answer: true },
    ],
    trueLabel: 'Verdadero',
    falseLabel: 'Falso',
    footnote: 'Lee con atención.',
  },
};

describe('ReadingExercise', () => {
  test('renders the passage split into paragraphs, tagged with the target language', () => {
    const html = renderToStaticMarkup(<ReadingExercise config={baseConfig} />);
    expect(html).toContain('Ana vive en Madrid.');
    expect(html).toContain('Trabaja en una oficina.');
    expect(html).toContain(`lang="${TARGET_LANG}"`);
  });

  // §D11: the passage is running text, so it reads at the shared measure even inside
  // the 48rem exercise track (about 99 characters per line without it).
  test('holds every passage paragraph to the reading measure', () => {
    const html = renderToStaticMarkup(<ReadingExercise config={baseConfig} />);
    expect(html).toContain('<p class="max-w-(--measure)">Ana vive en Madrid.</p>');
    expect(html).toContain('<p class="mt-3 max-w-(--measure)">Trabaja en una oficina.</p>');
  });

  // The passage and its illustration share a row at a wide exercise width; the
  // questions run full width under them. reading.css decides when they split.
  describe('passage, image and questions', () => {
    const withImage = {
      ...baseConfig,
      content: { ...baseConfig.content, image: { src: 'images/lo-placeholder.svg', alt: '' } },
    };

    // Maintainer, 2026-10-08: the picture sits INSIDE the grey passage card, so the
    // card runs as tall as the row and leaves no empty band under shorter text.
    test('puts the image inside the passage card, before the text', () => {
      const html = renderToStaticMarkup(<ReadingExercise config={withImage} />);
      const card = html.indexOf('<article class="reading-passage');
      const image = html.indexOf('reading-image');
      const text = html.indexOf('<div class="reading-text px-4 py-3" lang=');
      const close = html.indexOf('</article>');

      expect(html).toMatch(/^<div class="reading flex flex-col gap-4">/);
      expect(card).toBeGreaterThan(-1);
      // DOM order is the phone order: picture, then text, both inside the card.
      expect(image).toBeGreaterThan(card);
      expect(text).toBeGreaterThan(image);
      expect(close).toBeGreaterThan(text);
      expect(html.indexOf('role="radiogroup"')).toBeGreaterThan(close);
    });

    // An authored alt describes the picture in the course's UI language, so only the
    // passage text carries the target-language tag, not the card around the image.
    test('tags the passage text, not the card, with the target language', () => {
      const html = renderToStaticMarkup(<ReadingExercise config={withImage} />);

      expect(html).toContain(`<div class="reading-text px-4 py-3" lang="${TARGET_LANG}">`);
      expect(html).toMatch(/<article class="reading-passage[^"]*">/);
    });

    test("draws the image in the outcomes block's 3:2 contain box", () => {
      const html = renderToStaticMarkup(<ReadingExercise config={withImage} />);

      expect(html).toContain('<div class="reading-image aspect-[3/2] w-full"><img');
      expect(html).toMatch(/<img src="[^"]*images\/lo-placeholder\.svg" alt=""/);
      expect(html).toContain('class="size-full object-contain"');
    });

    test('takes a decorative image out of the accessibility tree', () => {
      const html = renderToStaticMarkup(<ReadingExercise config={withImage} />);
      expect(html).toContain('aria-hidden="true"');

      const described = renderToStaticMarkup(
        <ReadingExercise
          config={{
            ...baseConfig,
            content: { ...baseConfig.content, image: { src: 'images/a.svg', alt: 'Ana' } },
          }}
        />,
      );
      expect(described).toContain('alt="Ana"');
      expect(described).not.toMatch(/<img[^>]*aria-hidden/);
    });

    test('renders no image box when none is authored', () => {
      const html = renderToStaticMarkup(<ReadingExercise config={baseConfig} />);
      expect(html).not.toContain('reading-image');
      expect(html).not.toContain('<img');
    });

    test('keeps status, footer and footnote after the questions', () => {
      const html = renderToStaticMarkup(<ReadingExercise config={withImage} />);
      const lastQuestion = html.lastIndexOf('role="radiogroup"');

      expect(html.indexOf('Check')).toBeGreaterThan(lastQuestion);
      expect(html.indexOf('Lee con atención.')).toBeGreaterThan(html.indexOf('Check'));
    });
  });

  test('renders one radiogroup per question', () => {
    const html = renderToStaticMarkup(<ReadingExercise config={baseConfig} />);
    expect((html.match(/role="radiogroup"/g) ?? []).length).toBe(2);
  });

  test('renders radio options and the true/false labels', () => {
    const html = renderToStaticMarkup(<ReadingExercise config={baseConfig} />);
    expect(html).toContain('Madrid');
    expect(html).toContain('Sevilla');
    expect(html).toContain('Verdadero');
    expect(html).toContain('Falso');
  });

  test('falls back to English True/False labels when none are authored', () => {
    const html = renderToStaticMarkup(
      <ReadingExercise
        config={{
          type: 'reading',
          content: {
            passage: 'Texto.',
            questions: [{ type: 'true-false', prompt: 'Afirmación.', answer: false }],
          },
        }}
      />,
    );
    expect(html).toContain('True');
    expect(html).toContain('False');
  });

  test('renders the optional footnote', () => {
    const html = renderToStaticMarkup(<ReadingExercise config={baseConfig} />);
    expect(html).toContain('Lee con atención.');
  });

  test('renders an error message for an invalid config', () => {
    const html = renderToStaticMarkup(<ReadingExercise config={{ type: 'reading' }} />);
    expect(html).toContain('Invalid');
  });
});

// TODO §D13 (2026-10-08): reading's answer pills wrapped inside themselves at 320 and
// 375px; its groups are block-level, so they stack while narrow (ChoicePillGroup).
test("stacks every question's pills while its column is narrow", () => {
  const html = renderToStaticMarkup(<ReadingExercise config={readingFixtures[0].config} />);
  const groups = [...html.matchAll(/<div[^>]*class="([^"]*)"[^>]*role="radiogroup"/g)];

  expect(groups.length).toBeGreaterThan(0);
  for (const [, classes] of groups) expect(classes.split(' ')).toContain('choice-pills-group');
});
