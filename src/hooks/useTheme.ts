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
 *
 * HYDRATION (Part D): prerendered HTML cannot know the reader's stored choice, so
 * the first CLIENT render must match the server's — otherwise the toggle's
 * aria-checked mismatches and React discards the markup. The real theme is adopted
 * in a mount effect instead. That costs nothing visually for the PAGE, because
 * index.html's pre-hydration script has already stamped the `.dark` class before
 * first paint; the only cost is that the switch itself renders in its off position
 * for one frame after hydration on a dark-theme page. Accepted: an inline script
 * cannot import this module (it must run synchronously, pre-paint), so the two
 * resolution rules are deliberately mirrored — keep them in sync.
 */
import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'lc-theme';

/** What renders with no window — and therefore what the first client render must be. */
const SSR_THEME: Theme = 'light';

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

/**
 * The theme lives OUTSIDE React — localStorage plus the `.dark` class are the truth,
 * and both are already set before React boots (index.html's pre-hydration script).
 * So it is read with `useSyncExternalStore`, the API built for exactly this: a
 * separate server snapshot makes the first client render match prerendered markup,
 * and React re-reads the real value itself, with no setState-in-an-effect.
 */
const listeners = new Set<() => void>();

/** Persist + apply a theme, then notify every mounted consumer. */
function writeTheme(next: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // ignore write failures (private mode); the class swap below still applies
  }
  // Class-only swap (spec) — the token system re-skins entirely off this class.
  document.documentElement.classList.toggle('dark', next === 'dark');
  listeners.forEach((notify) => notify());
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

interface UseThemeResult {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

export function useTheme(): UseThemeResult {
  const theme = useSyncExternalStore(subscribe, readInitialTheme, () => SSR_THEME);

  const setTheme = useCallback((next: Theme) => writeTheme(next), []);
  const toggle = useCallback(() => writeTheme(theme === 'dark' ? 'light' : 'dark'), [theme]);

  return { theme, isDark: theme === 'dark', setTheme, toggle };
}
