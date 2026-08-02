/**
 * Tests for the theme resolution logic (Phase C · Part A, step 6). The pure
 * resolveInitialTheme covers the precedence rule (stored choice wins, else OS
 * preference) without needing a DOM. The `.dark` class swap + persistence are
 * verified in the browser (step 7).
 */
import { describe, expect, test } from 'vitest';
import { resolveInitialTheme } from './useTheme';

describe('resolveInitialTheme', () => {
  test('a stored "dark" choice wins over the OS preference', () => {
    expect(resolveInitialTheme('dark', false)).toBe('dark');
  });

  test('a stored "light" choice wins over the OS preference', () => {
    expect(resolveInitialTheme('light', true)).toBe('light');
  });

  test('falls back to the OS preference when nothing is stored', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark');
    expect(resolveInitialTheme(null, false)).toBe('light');
  });

  test('ignores a garbage stored value and uses the OS preference', () => {
    expect(resolveInitialTheme('purple', true)).toBe('dark');
    expect(resolveInitialTheme('', false)).toBe('light');
  });
});
