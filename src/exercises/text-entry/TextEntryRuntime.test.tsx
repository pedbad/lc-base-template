/**
 * TextEntryRuntime.test.tsx — row alignment in the shared typed-answer table that
 * dictation and typed-transform render through. Since the speakers doubled to 54px
 * (maintainer, 2026-10-08) a row's speaker is taller than its 36px input, so every
 * cell centres vertically; top-aligned cells left the prompt and input riding high.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import DictationExercise from '@/exercises/dictation/DictationExercise';
import TypedTransformExercise from '@/exercises/typed-transform/TypedTransformExercise';
import { dictationFixtures } from '@/exercises/dictation/dictation.fixture';
import { typedTransformFixtures } from '@/exercises/typed-transform/typed-transform.fixture';

const cells = (html: string): string[] => html.match(/<td[^>]*class="[^"]*"/g) ?? [];

describe('typed-answer rows', () => {
  test.each([
    ['dictation', <DictationExercise key="d" config={dictationFixtures[0]?.config} />],
    [
      'typed-transform',
      <TypedTransformExercise key="t" config={typedTransformFixtures[0]?.config} />,
    ],
  ])('%s centres every cell vertically', (_name, element) => {
    const tds = cells(renderToStaticMarkup(element));

    expect(tds.length).toBeGreaterThan(0);
    for (const td of tds) {
      expect(td).toContain('align-middle');
      expect(td).not.toContain('align-top');
    }
  });

  // The speaker is an inline-flex button; on the baseline it left a descender gap
  // and sat 3px above the input's centre. `inline` gives it vertical-align: middle.
  test('renders the row speaker inline, so it centres in its cell', () => {
    const html = renderToStaticMarkup(<DictationExercise config={dictationFixtures[0]?.config} />);
    expect(html).toMatch(/class="audio-container[^"]* inline/);
  });
});
