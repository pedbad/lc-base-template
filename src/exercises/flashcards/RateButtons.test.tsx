/**
 * RateButtons.test.tsx — the two rating buttons under a flipped card (maintainer,
 * 2026-10-09): the same sad and happy faces the progress circles draw for Again and
 * Got it, so a rating and its circle read as one thing.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { RateButtons } from './RateButtons';

describe('RateButtons', () => {
  const html = renderToStaticMarkup(<RateButtons onRate={() => {}} />);

  test('Again carries the sad face, decorative', () => {
    expect(html).toMatch(/<svg[^>]*lucide-frown[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/svg>Again</);
  });

  test('Got it carries the happy face, decorative', () => {
    expect(html).toMatch(
      /<svg[^>]*lucide-smile[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/svg>Got it</,
    );
  });
});
