/**
 * Tests for the debounced hold a followed link puts on the scroll-spy
 * (header scroll-spy spec §3, S5).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { SETTLE_MS, createJumpHold } from './jumpHold';

describe('createJumpHold', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('is not held until hold() is called', () => {
    const jump = createJumpHold();
    expect(jump.isHeld()).toBe(false);
    jump.hold();
    expect(jump.isHeld()).toBe(true);
  });

  test('releases once SETTLE_MS pass with no further hold()', () => {
    const jump = createJumpHold();
    jump.hold();
    vi.advanceTimersByTime(SETTLE_MS - 1);
    expect(jump.isHeld()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(jump.isHeld()).toBe(false);
  });

  test('a hold() inside the window restarts it (each scroll event extends the hold)', () => {
    const jump = createJumpHold();
    jump.hold();
    vi.advanceTimersByTime(SETTLE_MS - 10);
    jump.hold();
    vi.advanceTimersByTime(SETTLE_MS - 10);
    expect(jump.isHeld()).toBe(true);
    vi.advanceTimersByTime(10);
    expect(jump.isHeld()).toBe(false);
  });

  test('dispose() releases at once and leaves no timer behind', () => {
    const jump = createJumpHold();
    jump.hold();
    jump.dispose();
    expect(jump.isHeld()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});
