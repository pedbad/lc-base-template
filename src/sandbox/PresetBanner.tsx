/**
 * PresetBanner — the label on every page of a DEBUG build while a palette is previewed
 * (TODO §E18), so a screenshot or a review never mistakes the preview for the course's
 * own colours. Reset returns to `tokens.css`.
 *
 * Mounted by preset-preview-boot.ts in a React root of its own, outside `#root`, so
 * the prerendered page and its hydration never see it. Styled by its own stylesheet,
 * not utilities: the course pages' Tailwind sheet does not scan `src/sandbox/`.
 */
import './preset-banner.css';

interface PresetBannerProps {
  /** The previewed preset's name, e.g. `C · Warm Blue`. */
  readonly label: string;
  readonly onReset: () => void;
}

export function PresetBanner({ label, onReset }: PresetBannerProps) {
  return (
    <aside aria-label="Palette preview" className="preset-banner">
      <p>
        Previewing palette: <strong>{label}</strong>
      </p>
      <button type="button" className="preset-banner-reset" onClick={onReset}>
        Reset
      </button>
    </aside>
  );
}
