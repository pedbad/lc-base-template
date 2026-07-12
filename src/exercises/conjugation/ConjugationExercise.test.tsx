/**
 * Tests for ConjugationExercise (design §5, engine #4.3). Rendered to static markup
 * via react-dom/server so no DOM is needed under `bun test` (matches the
 * ExerciseInstructions test convention). These assert the initial paradigm grid:
 * heading, per-row pronouns + typed inputs, target-language tagging, the choice-mode
 * notice, and the invalid-config guard.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TARGET_LANG } from '@/lib/lang';
import ConjugationExercise from './ConjugationExercise';

const baseConfig = {
  type: 'conjugation',
  content: {
    verb: 'être',
    tense: 'présent',
    rows: [
      { person: 'je', answer: 'suis' },
      { person: 'tu', answer: 'es' },
    ],
  },
};

describe('ConjugationExercise', () => {
  test('renders the verb + tense heading and each pronoun', () => {
    const html = renderToStaticMarkup(<ConjugationExercise config={baseConfig} />);
    expect(html).toContain('être');
    expect(html).toContain('présent');
    expect(html).toContain('je');
    expect(html).toContain('tu');
  });

  test('renders one typed input per row, tagged with the target language', () => {
    const html = renderToStaticMarkup(<ConjugationExercise config={baseConfig} />);
    expect((html.match(/<input/g) ?? []).length).toBe(2);
    expect(html).toContain(`lang="${TARGET_LANG}"`);
  });

  test('renders the optional prompt and footnote', () => {
    const html = renderToStaticMarkup(
      <ConjugationExercise
        config={{
          type: 'conjugation',
          content: {
            verb: 'avoir',
            prompt: 'Conjuguez au présent.',
            rows: [{ person: 'je', answer: 'ai' }],
            footnote: 'Bonne chance.',
          },
        }}
      />,
    );
    expect(html).toContain('Conjuguez au présent.');
    expect(html).toContain('Bonne chance.');
  });

  test('surfaces a notice for a choice-mode config instead of typed inputs', () => {
    const html = renderToStaticMarkup(
      <ConjugationExercise
        config={{
          type: 'conjugation',
          content: {
            verb: 'être',
            answerMode: 'choice',
            rows: [{ person: 'je', answer: 'suis', options: ['suis', 'es'] }],
          },
        }}
      />,
    );
    expect(html).toContain('choice mode');
    expect(html).not.toContain('<input');
  });

  test('renders an error message for an invalid config', () => {
    const html = renderToStaticMarkup(<ConjugationExercise config={{ type: 'conjugation' }} />);
    expect(html).toContain('Invalid');
  });
});
