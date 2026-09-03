/**
 * build-entries.test.ts — which HTML entries a build emits.
 *
 * The showcase is a debug gallery. Shipping it means a public URL on a deployed
 * course, so the default has to be "not built" and opting in has to be explicit.
 * Every edge below is a way that default could leak.
 */
import { describe, expect, it } from 'vitest';
import { isShowcaseRequested } from './build-entries';

describe('isShowcaseRequested', () => {
  // The deploy case. `bun run build` with nothing set must not emit the showcase.
  it('is off when the flag is absent', () => {
    expect(isShowcaseRequested({})).toBe(false);
    expect(isShowcaseRequested({ SHOWCASE: undefined })).toBe(false);
  });

  it('is on for the documented opt-in values', () => {
    expect(isShowcaseRequested({ SHOWCASE: '1' })).toBe(true);
    expect(isShowcaseRequested({ SHOWCASE: 'true' })).toBe(true);
    expect(isShowcaseRequested({ SHOWCASE: 'TRUE' })).toBe(true);
  });

  // `SHOWCASE=0` is someone explicitly turning it OFF. A plain truthiness check on
  // the string would read '0' as on and ship the gallery — the exact bug this guards.
  it('treats explicit off values as off, not as a non-empty string', () => {
    expect(isShowcaseRequested({ SHOWCASE: '0' })).toBe(false);
    expect(isShowcaseRequested({ SHOWCASE: 'false' })).toBe(false);
    expect(isShowcaseRequested({ SHOWCASE: '' })).toBe(false);
  });

  // Anything unrecognised fails closed: an unbuilt showcase is recoverable, a
  // published one is not.
  it('fails closed on an unrecognised value', () => {
    expect(isShowcaseRequested({ SHOWCASE: 'yes' })).toBe(false);
    expect(isShowcaseRequested({ SHOWCASE: 'please' })).toBe(false);
  });

  it('ignores surrounding whitespace', () => {
    expect(isShowcaseRequested({ SHOWCASE: ' 1 ' })).toBe(true);
    expect(isShowcaseRequested({ SHOWCASE: '  ' })).toBe(false);
  });
});
