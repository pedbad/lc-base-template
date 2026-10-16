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
 * A NATIVE `<select>`: one labelled control with one value, which the browser already
 * makes keyboard- and screen-reader-complete. Its value comes from storage through
 * useSyncExternalStore, whose server snapshot is "As built", so no read happens during
 * a server render.
 */
import { useId, useSyncExternalStore } from 'react';
import { FOCUS_OUTLINE } from '@/components/shell/focus-outline';
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

const currentChoice = () => readChoice(localStorage) ?? AS_BUILT;
const serverChoice = () => AS_BUILT;

export function PresetPicker({ presets, activeCss }: PresetPickerProps) {
  const id = useId();
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
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor={id} className="font-medium">
        Preview preset
      </label>
      <select
        id={id}
        value={value}
        onChange={handleChange}
        className={`rounded-md border border-border bg-card px-2 py-1.5 text-foreground hover:bg-muted ${FOCUS_OUTLINE}`}
      >
        <option value={AS_BUILT}>{asBuilt}</option>
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
    </div>
  );
}
