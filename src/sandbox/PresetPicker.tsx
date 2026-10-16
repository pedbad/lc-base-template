/**
 * PresetPicker — the sandbox header's preset drop-down (TODO §E18). Choosing a preset
 * recolours every page of a DEBUG build, light and dark, for this viewer until they
 * reset it; "As built" puts `tokens.css` back. How it works, and why it is preview
 * only: preset-preview.ts.
 *
 * It only RECORDS the choice (preset-choice.ts) and announces it; preset-preview-boot.ts,
 * on every page, does the recolouring. One code path for "chosen here" and "chosen on
 * another page", and the banner's Reset moves this select back too.
 *
 * A LIVE SAMPLE below it (§E18 follow-up): presets differ only in the primary and ring
 * colours, which most of the page does not show, so a small primary "button", a chip
 * ringed in `--ring` and four icon-only buttons in the variants lessons use repaint where
 * you click. Decorative, so hidden from screen readers and built of spans, never
 * buttons, so nothing in it takes focus; the hint, which says what a preset changes, is
 * the select's description.
 *
 * A NARROW COLUMN (maintainer, 2026-10-16): label above the drop-down, samples and hint
 * below, so the header's top row has room for the theme switch at its right end.
 *
 * A NATIVE `<select>`: one labelled control with one value, which the browser already
 * makes keyboard- and screen-reader-complete. Its value comes from storage through
 * useSyncExternalStore, whose server snapshot is "As built", so no read happens during
 * a server render.
 */
import { useId, useSyncExternalStore } from 'react';
import { CheckIcon, RotateCcw, Volume2, XIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FOCUS_OUTLINE } from '@/components/shell/focus-outline';
import { buttonVariants } from '@/components/ui/button';
import { PRESET_CHANGE_EVENT, readChoice, writeChoice } from './preset-choice';
import { matchingPreset, type TokenPreset } from './preset-preview';

interface PresetPickerProps {
  readonly presets: readonly TokenPreset[];
  /** The text of `tokens.css`, to name the preset it was copied from. */
  readonly activeCss: string;
}

/** The value of the "As built" option: no preview, `tokens.css` as it is. */
const AS_BUILT = '';

function subscribe(onChange: () => void) {
  window.addEventListener(PRESET_CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(PRESET_CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** The icon-only samples: one per variant that carries a colour, each with a lesson icon. */
const ICON_SAMPLES: readonly {
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  Icon: LucideIcon;
}[] = [
  { variant: 'default', Icon: Volume2 },
  { variant: 'secondary', Icon: CheckIcon },
  { variant: 'outline', Icon: RotateCcw },
  { variant: 'destructive', Icon: XIcon },
];

const currentChoice = () => readChoice(localStorage) ?? AS_BUILT;
const serverChoice = () => AS_BUILT;

export function PresetPicker({ presets, activeCss }: PresetPickerProps) {
  const id = useId();
  const hintId = useId();
  const stored = useSyncExternalStore(subscribe, currentChoice, serverChoice);
  // A remembered id whose file has gone reads as "As built", as the boot script treats it.
  const value = presets.some((p) => p.id === stored) ? stored : AS_BUILT;
  const active = matchingPreset(activeCss, presets);
  const asBuilt = active ? `As built (tokens.css = ${active.label})` : 'As built (tokens.css)';

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    writeChoice(localStorage, event.target.value || null);
    window.dispatchEvent(new Event(PRESET_CHANGE_EVENT));
  };

  return (
    <div className="flex w-full flex-col gap-1.5 text-sm sm:w-72">
      <label htmlFor={id} className="font-medium">
        Preview preset
      </label>
      <select
        id={id}
        value={value}
        onChange={handleChange}
        aria-describedby={hintId}
        className={`w-full rounded-md border border-border bg-card px-2 py-1.5 text-foreground hover:bg-muted ${FOCUS_OUTLINE}`}
      >
        <option value={AS_BUILT}>{asBuilt}</option>
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
      <span
        data-slot="preset-sample"
        aria-hidden="true"
        className="flex flex-wrap items-center gap-2"
      >
        <span className="size-5 rounded-full border border-border bg-primary ring-2 ring-ring ring-offset-1 ring-offset-card" />
        <span className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
          Button
        </span>
        {ICON_SAMPLES.map(({ variant, Icon }) => (
          <span
            key={variant}
            data-slot="preset-icon-sample"
            className={buttonVariants({ variant, size: 'icon-sm' })}
          >
            <Icon />
          </span>
        ))}
      </span>
      <p id={hintId} className="text-xs text-muted-foreground">
        Presets change the button and focus-ring colours; compare in light mode.
      </p>
    </div>
  );
}
