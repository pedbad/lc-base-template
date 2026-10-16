/**
 * PresetBanner.test.tsx — the label every page of a DEBUG build shows while a palette
 * is previewed, so nobody mistakes the preview for the course's real colours.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PresetBanner } from './PresetBanner';

const html = renderToStaticMarkup(<PresetBanner label="C · Warm Blue" onReset={() => {}} />);

describe('PresetBanner', () => {
  it('is a named landmark of its own', () => {
    expect(html).toMatch(/^<aside[^>]*aria-label="Palette preview"/);
  });

  it('says which palette is previewed', () => {
    expect(html).toMatch(/Previewing palette: <strong>C · Warm Blue<\/strong>/);
  });

  it('offers a Reset button', () => {
    expect(html).toMatch(/<button type="button"[^>]*>Reset<\/button>/);
  });
});
