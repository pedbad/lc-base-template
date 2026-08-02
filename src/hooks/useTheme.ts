/**
 * useTheme — dark-mode state for the shell (Phase C · Part A, step 6).
 *
 * Contract (handover step 6 + FUTURE_PROJECTS Light/Dark rules):
 *   - toggles the `.dark` CLASS on <html> (document.documentElement) — never
 *     inline style swaps; the token system re-skins entirely off that class.
 *   - persists the choice to localStorage.
 *   - on first load: honour the stored value, else fall back to the OS
 *     prefers-color-scheme.
 *   - no-window-safe: importing/rendering under SSR (renderToStaticMarkup) or a
 *     node test must not throw — it resolves to 'light' when there is no window.
 */
import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'lc-theme';

/**
 * Pure resolution of the initial theme — extracted so it is unit-testable without
 * a DOM. A valid stored choice wins; otherwise the OS preference decides.
 */
export function resolveInitialTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return prefersDark ? 'dark' : 'light';
}

/** Read the initial theme from the environment (no-window-safe). */
function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  let stored: string | null;
  try {
    stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    stored = null; // private-mode / disabled storage — fall through to OS pref
  }
  const prefersDark =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  return resolveInitialTheme(stored, prefersDark);
}

interface UseThemeResult {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

export function useTheme(): UseThemeResult {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  // Apply the class + persist whenever the theme changes. Class-only swap (spec).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore write failures (private mode); the class swap still applied
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, isDark: theme === 'dark', setTheme, toggle };
}
