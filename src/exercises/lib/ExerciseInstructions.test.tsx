/**
 * Tests for ExerciseInstructions (handover spec §3). Rendered to static markup via
 * react-dom/server so no DOM is needed under `bun test`.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ExerciseInstructions } from './ExerciseInstructions';

describe('ExerciseInstructions', () => {
  test('renders the text inside a role="note" box', () => {
    const html = renderToStaticMarkup(<ExerciseInstructions text="Type your answer." />);
    expect(html).toContain('role="note"');
    expect(html).toContain('Type your answer.');
  });

  test('bolds button names marked with ** **', () => {
    const html = renderToStaticMarkup(
      <ExerciseInstructions text="Select **Check** to mark, **Reset** to clear." />,
    );
    expect(html).toContain('<strong');
    expect(html).toContain('>Check</strong>');
    expect(html).toContain('>Reset</strong>');
    // The ** markers themselves must not leak into the output.
    expect(html).not.toContain('**');
  });

  test('prefixes known button names with their coloured control glyph', () => {
    const html = renderToStaticMarkup(
      <ExerciseInstructions text="Select **Check**, **Reset**, or **Show answers**." />,
    );
    // One svg per matched button name (three), each in its identity colour.
    expect((html.match(/<svg/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect(html).toContain('text-success');
    expect(html).toContain('text-destructive');
    expect(html).toContain('text-primary');
  });

  test('bolds an unknown button name without a glyph', () => {
    const html = renderToStaticMarkup(<ExerciseInstructions text="Press **Submit** now." />);
    expect(html).toContain('>Submit</strong>');
    // Only the Alert header Info glyph is present — no button glyph inside the strong.
    expect((html.match(/<svg/g) ?? []).length).toBe(1);
  });

  test('renders nothing when text is null', () => {
    expect(renderToStaticMarkup(<ExerciseInstructions text={null} />)).toBe('');
  });

  test('renders nothing when text is empty or whitespace-only', () => {
    expect(renderToStaticMarkup(<ExerciseInstructions text="" />)).toBe('');
    expect(renderToStaticMarkup(<ExerciseInstructions text="   " />)).toBe('');
  });

  test('is not tagged with a lang attribute (author chrome, §3)', () => {
    const html = renderToStaticMarkup(<ExerciseInstructions text="Do the task." />);
    expect(html).not.toContain('lang=');
  });
});
