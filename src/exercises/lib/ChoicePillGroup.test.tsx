/**
 * ChoicePillGroup.test.tsx — the segmented control's two layouts (TODO §D13,
 * 2026-10-08). At 320 and 375px a row of three pills was wider than a question's
 * column, so each pill wrapped INSIDE itself ("En / bicicleta"). A block-level group
 * (radio-quiz, reading) stacks its pills into a vertical list while its column is
 * narrow, and is the connected row again from 30rem. inline-choice's group sits inside
 * a sentence, so it never stacks.
 *
 * A container query, not a viewport one (as reading.css): an exercise can sit in an
 * accordion or a tab panel. The rules live in the lazy `choice-pill-group.css`, so the
 * main sheet does not grow.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { ChoicePillGroup } from './ChoicePillGroup';

const props = {
  options: ['En bicicleta', 'En coche', 'En autobús'],
  selectedIndex: -1,
  groupId: 'g',
  groupLabel: 'Choose answer for question 1',
  onSelect: () => undefined,
};

/** The radiogroup's class list. */
function groupClasses(html: string): string[] {
  return (/<div[^>]*class="([^"]*)"[^>]*role="radiogroup"/.exec(html)?.[1] ?? '').split(' ');
}

const css = readFileSync(path.join(import.meta.dirname, 'choice-pill-group.css'), 'utf8');
const rule = (selector: string, source: string): string => {
  const escaped = selector.replace(/[.:()>*]/g, (char) => `\\${char}`);
  return new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(source)?.[1] ?? '';
};
const wide =
  /@container choice-pills \(width >= 30rem\)\s*\{([\s\S]*?)\n {2}\}/.exec(css)?.[1] ?? '';

describe('ChoicePillGroup layout', () => {
  test('is one connected inline row by default, at every width', () => {
    const html = renderToStaticMarkup(<ChoicePillGroup {...props} />);

    expect(groupClasses(html)).toEqual(expect.arrayContaining(['inline-flex', 'divide-x']));
    expect(html).not.toContain('choice-pills');
  });

  test('stacksWhenNarrow: the group sits in a container and owns its layout in CSS', () => {
    const html = renderToStaticMarkup(<ChoicePillGroup {...props} stacksWhenNarrow />);
    const classes = groupClasses(html);

    expect(html).toMatch(/^<div class="choice-pills"><div[^>]*role="radiogroup"/);
    expect(classes).toContain('choice-pills-group');
    // No layout utility may fight the stylesheet (utilities beat @layer components).
    expect(classes).not.toContain('inline-flex');
    expect(classes).not.toContain('divide-x');
  });

  test('choice-pill-group.css: a vertical list while narrow', () => {
    expect(rule('.choice-pills', css)).toContain('container: choice-pills / inline-size;');
    expect(rule('.choice-pills-group', css)).toContain('display: flex;');
    expect(rule('.choice-pills-group', css)).toContain('flex-direction: column;');
    expect(rule('.choice-pills-group > :not(:last-child)', css)).toContain(
      'border-block-end: 1px solid var(--border);',
    );
  });

  test('choice-pill-group.css: the connected row from 30rem', () => {
    expect(rule('.choice-pills-group', wide)).toContain('display: inline-flex;');
    expect(rule('.choice-pills-group', wide)).toContain('flex-direction: row;');
    const separator = rule('.choice-pills-group > :not(:last-child)', wide);
    expect(separator).toContain('border-block-end: 0;');
    expect(separator).toContain('border-inline-end: 1px solid var(--border);');
  });
});
