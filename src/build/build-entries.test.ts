/**
 * build-entries.test.ts — which HTML entries a build emits.
 *
 * The showcase and the debug sandbox are both debug artifacts. Shipping either means
 * a public URL on a deployed course, so the default has to be "not built" and opting
 * in has to be explicit. Every edge below is a way that default could leak.
 */
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEBUG_ENTRY_FILES, debugEntries, isDebugRequested } from './build-entries';

describe('isDebugRequested', () => {
  // The deploy case. `bun run build` with nothing set must emit neither debug page.
  it('is off when no flag is set', () => {
    expect(isDebugRequested({})).toBe(false);
    expect(isDebugRequested({ DEBUG: undefined, SHOWCASE: undefined })).toBe(false);
  });

  it('is on for the documented opt-in values', () => {
    expect(isDebugRequested({ DEBUG: '1' })).toBe(true);
    expect(isDebugRequested({ DEBUG: 'true' })).toBe(true);
    expect(isDebugRequested({ DEBUG: 'TRUE' })).toBe(true);
  });

  // `SHOWCASE=1` predates the sandbox and is documented in dated handover records.
  // It stays recognised so none of those records becomes a lie.
  it('still honours the legacy SHOWCASE alias', () => {
    expect(isDebugRequested({ SHOWCASE: '1' })).toBe(true);
    expect(isDebugRequested({ SHOWCASE: 'true' })).toBe(true);
  });

  // `DEBUG=0` is someone explicitly turning it OFF. A plain truthiness check on the
  // string would read '0' as on and ship the gallery — the exact bug this guards.
  it('treats explicit off values as off, not as a non-empty string', () => {
    expect(isDebugRequested({ DEBUG: '0' })).toBe(false);
    expect(isDebugRequested({ DEBUG: 'false' })).toBe(false);
    expect(isDebugRequested({ DEBUG: '' })).toBe(false);
    expect(isDebugRequested({ SHOWCASE: '0' })).toBe(false);
  });

  // Anything unrecognised fails closed: an unbuilt debug page is recoverable, a
  // published one is not.
  it('fails closed on an unrecognised value', () => {
    expect(isDebugRequested({ DEBUG: 'yes' })).toBe(false);
    expect(isDebugRequested({ DEBUG: 'please' })).toBe(false);
  });

  it('ignores surrounding whitespace', () => {
    expect(isDebugRequested({ DEBUG: ' 1 ' })).toBe(true);
    expect(isDebugRequested({ DEBUG: '  ' })).toBe(false);
  });

  // One flag, both pages: either recognised name turning on is enough, and an
  // explicit off on one name does not veto an on from the other.
  it('is on when any recognised name is on', () => {
    expect(isDebugRequested({ DEBUG: '0', SHOWCASE: '1' })).toBe(true);
    expect(isDebugRequested({ DEBUG: '1', SHOWCASE: '0' })).toBe(true);
  });
});

describe('debugEntries', () => {
  const root = '/repo';

  it('adds nothing to the input map by default', () => {
    expect(debugEntries({}, root)).toEqual({});
  });

  // Both debug pages ship together or not at all — one flag, one decision. The dev
  // server serves both regardless, so a partial debug deploy has no use case.
  it('adds every debug entry when the flag is on', () => {
    expect(debugEntries({ DEBUG: '1' }, root)).toEqual({
      showcase: path.resolve(root, 'exercise-showcase.html'),
      sandbox: path.resolve(root, 'debug-sandbox.html'),
    });
  });

  it('names one root-level html file per entry', () => {
    expect(Object.values(DEBUG_ENTRY_FILES).every((file) => file.endsWith('.html'))).toBe(true);
    expect(Object.keys(DEBUG_ENTRY_FILES)).toEqual(['showcase', 'sandbox']);
  });
});
