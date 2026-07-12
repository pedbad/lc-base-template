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
