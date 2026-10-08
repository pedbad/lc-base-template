/**
 * Tests for ConjugationExercise (design §5, engine #4.3). Rendered to static markup
 * via react-dom/server so no DOM is needed under `bun test` (matches the
 * ExerciseInstructions test convention). These assert the initial paradigm grid:
 * heading, per-row pronouns + typed inputs, target-language tagging, the choice-mode
 * notice, and the invalid-config guard.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
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

  // TODO §D13 (2026-10-08): at 320px the 8rem pronoun column left the input 22px wide
  // (67px at 375). While the exercise is narrow the pronoun takes its own line above
  // the input; from 30rem it is the pronoun | input | verdict row (conjugation.css).
  test('the row and pronoun take their layout from conjugation.css, not utilities', () => {
    const html = renderToStaticMarkup(<ConjugationExercise config={baseConfig} />);
    const row = /<div class="([^"]*\bconjugation-row\b[^"]*)"/.exec(html)?.[1].split(' ') ?? [];
    const pronoun =
      /<span class="([^"]*)" lang="[^"]*">je<\/span>/.exec(html)?.[1].split(' ') ?? [];

    expect(html).toMatch(/^<div class="conjugation /);
    expect(row).toContain('grid');
    expect(row.some((c) => c.startsWith('grid-cols-'))).toBe(false);
    expect(pronoun).toContain('conjugation-person');
    expect(pronoun).not.toContain('text-right');
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

describe('conjugation.css', () => {
  const css = readFileSync(path.join(import.meta.dirname, 'conjugation.css'), 'utf8');
  const rule = (selector: string, source: string): string => {
    const escaped = selector.replace(/[.:()>]/g, (char) => `\\${char}`);
    return new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(source)?.[1] ?? '';
  };
  const wide =
    /@container conjugation \(width >= 30rem\)\s*\{([\s\S]*?)\n {2}\}/.exec(css)?.[1] ?? '';

  test('the engine root is a named inline-size container', () => {
    expect(rule('.conjugation', css)).toContain('container: conjugation / inline-size;');
  });

  test('narrow: the pronoun spans the row above the input and its verdict', () => {
    expect(rule('.conjugation-row', css)).toContain(
      'grid-template-columns: minmax(0, 1fr) 2.5rem;',
    );
    expect(rule('.conjugation-person', css)).toContain('grid-column: 1 / -1;');
  });

  test('from 30rem: pronoun | input | verdict, the pronoun right-aligned', () => {
    expect(rule('.conjugation-row', wide)).toContain(
      'grid-template-columns: minmax(5rem, 8rem) minmax(0, 1fr) 2.5rem;',
    );
    expect(rule('.conjugation-person', wide)).toContain('grid-column: auto;');
    expect(rule('.conjugation-person', wide)).toContain('text-align: end;');
  });
});
