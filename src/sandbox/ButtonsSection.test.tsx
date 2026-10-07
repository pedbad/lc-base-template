/**
 * ButtonsSection.test.tsx — the sandbox's button reference shows the buttons the app
 * actually has: every `Button` variant and size, and the real exercise footer.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ExerciseFooter } from '@/exercises/lib/ExerciseFooter';
import ButtonsSection from './ButtonsSection';
import { BUTTON_SIZES, BUTTON_VARIANTS } from './sandbox-catalog';

const html = renderToStaticMarkup(<ButtonsSection />);
const count = (pattern: RegExp) => (html.match(pattern) ?? []).length;

describe('ButtonsSection', () => {
  it('is a headed section the in-page nav can reach', () => {
    expect(html).toMatch(/<section[^>]*id="buttons"/);
    expect(html).toMatch(/<section[^>]*aria-labelledby="buttons-heading"/);
    expect(html).toContain('id="buttons-heading"');
  });

  // The catalog is a Record over the cva keys, so a new variant or size will not
  // compile until it is listed; these pin that every one reaches the page.
  it.each(Object.keys(BUTTON_VARIANTS))('shows the %s variant', (variant) => {
    expect(html).toContain(`data-variant="${variant}"`);
  });

  it.each(Object.keys(BUTTON_SIZES))('shows the %s size', (size) => {
    expect(html).toContain(`data-size="${size}"`);
  });

  it('names every icon-only button, since it has no visible text', () => {
    const iconOnly = html.match(/<button[^>]*data-size="icon[^"]*"[^>]*>/g) ?? [];
    expect(iconOnly.length).toBeGreaterThan(0);
    for (const button of iconOnly) expect(button).toContain('aria-label="');
  });

  it('marks every icon decorative', () => {
    expect(count(/<svg/g)).toBe(count(/<svg[^>]*aria-hidden="true"/g));
  });

  it('renders the exercise footer exactly as an exercise does', () => {
    const noop = () => {};
    const footer = renderToStaticMarkup(
      <ExerciseFooter onCheck={noop} onReset={noop} showReset onShowAnswers={noop} showAnswers />,
    );
    expect(html).toContain(footer);
  });
});
