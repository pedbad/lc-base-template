/**
 * ThemeToggle — the dark-mode control in the header nav (Phase C · Part A, step 6).
 * Uses the Switch primitive (role="switch" + aria-checked) with a fixed
 * aria-label="Dark mode" — NOT a button whose visible label flips (spec §1). The
 * on/off state and the .dark class swap are owned by useTheme.
 */
import { MoonIcon, SunIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/useTheme';

export default function ThemeToggle() {
  const { isDark, setTheme } = useTheme();

  return (
    <span className="inline-flex items-center gap-1.5">
      <SunIcon className="size-4 text-muted-foreground" aria-hidden="true" />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        aria-label="Dark mode"
      />
      <MoonIcon className="size-4 text-muted-foreground" aria-hidden="true" />
    </span>
  );
}
