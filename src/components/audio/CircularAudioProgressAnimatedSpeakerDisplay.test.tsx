/**
 * CircularAudioProgressAnimatedSpeakerDisplay.test.tsx — the speaker's hit target.
 *
 * WCAG 2.2 SC 2.5.8 (Target Size Minimum, AA) wants 24x24 CSS px unless a 24px circle
 * around the target clears every other target. Two callers break that spacing on
 * purpose: the flashcards speaker sits ON the full-card flip button, and the
 * memory-match speaker overlays its card. axe flagged the flashcards one at 22px
 * (2026-10-06, TODO §D10). So the floor lives here, once, not at each call site.
 *
 * `renderToStaticMarkup` in the node env, like the rest of the suite.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CircularAudioProgressAnimatedSpeakerDisplay } from './CircularAudioProgressAnimatedSpeakerDisplay';

function buttonStyle(size?: number): string {
  const html = renderToStaticMarkup(<CircularAudioProgressAnimatedSpeakerDisplay size={size} />);
  return /<button[^>]*style="([^"]*)"/.exec(html)?.[1] ?? '';
}

describe('speaker hit target (SC 2.5.8)', () => {
  test('a size under 24 still renders a 24x24 button', () => {
    expect(buttonStyle(20)).toBe('width:24px;height:24px');
  });

  test('a size over the floor is left alone', () => {
    expect(buttonStyle(27)).toBe('width:27px;height:27px');
  });

  // Maintainer, 2026-10-08: every circular speaker doubled, 27 → 54px.
  test('the default size is 54px, double the old 27px', () => {
    expect(buttonStyle()).toBe('width:54px;height:54px');
  });

  test('the non-interactive glyph is not a target, so it keeps its drawn size', () => {
    const html = renderToStaticMarkup(
      <CircularAudioProgressAnimatedSpeakerDisplay size={20} interactive={false} />,
    );
    expect(html).toContain('style="width:20px;height:20px"');
  });
});
