/**
 * ThemeToggle — the dark-mode control in the header nav (Phase C · Part A, step 6).
 * Uses the Switch primitive (role="switch" + aria-checked) with a fixed
 * aria-label="Dark mode" — NOT a button whose visible label flips (spec §1). The
 * on/off state and the .dark class swap are owned by useTheme.
 */
import { useId } from 'react';
import { MoonIcon, SunIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/useTheme';
import { FOCUS_OUTLINE } from './focus-outline';

export default function ThemeToggle() {
  const { isDark, setTheme } = useTheme();
  // Base UI's Switch always renders a hidden <input> for form participation. It's
  // aria-hidden so AT reads the role="switch" root (aria-label below), but static
  // checkers (WAVE) still flag an unlabelled form control — so we pass a stable id
  // and pair it with a visually-hidden <label>. AT behaviour is unchanged.
  const switchId = useId();

  return (
    <span className="inline-flex items-center gap-1.5">
      <SunIcon className="size-4 text-muted-foreground" aria-hidden="true" />
      <label htmlFor={switchId} className="sr-only">
        Dark mode
      </label>
      <Switch
        id={switchId}
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        aria-label="Dark mode"
        // Header a11y audit (2026-10-06), overriding the vendored Switch here because
        // `src/components/ui/` belongs to the shadcn CLI. Its OFF track (`bg-input`)
        // measured 1.88:1 on the light header and its thumb 1.8:1 on that track, under
        // 1.4.11's 3:1 for a state; `muted-foreground` is 6.3:1 and 6.4:1. Its focus
        // ring is a box-shadow, which forced colours drops, so the shared outline
        // replaces it (`ring-0` keeps the two from stacking).
        className={`data-unchecked:bg-muted-foreground focus-visible:ring-0 ${FOCUS_OUTLINE}`}
      />
      <MoonIcon className="size-4 text-muted-foreground" aria-hidden="true" />
    </span>
  );
}
