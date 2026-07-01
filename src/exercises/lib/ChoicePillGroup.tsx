/**
 * ChoicePillGroup.tsx — the shared radio-pill widget for the choice engines
 * (spec §8, "ported once"). A `role="radiogroup"` of `role="radio"` pill buttons:
 * pick one, the rest deselect. Owns the fiddly, a11y-critical parts every choice
 * engine needs identically:
 *   - `aria-checked` per pill + a single `aria-label` on the group,
 *   - arrow-key navigation (Left/Right/Up/Down wrap, Home/End jump; Space/Enter
 *     re-commit the focused pill),
 *   - roving tabIndex (only the selected pill is Tab-reachable; with nothing
 *     selected the first pill is the tab stop),
 *   - state → token classes: neutral / selected (--primary) / correct (--success) /
 *     incorrect (--destructive). Existing tokens only — no new --ex-* tokens.
 *
 * Extracted from inline-choice #2's inlined `renderChoiceGroup` + `handleChoiceKeyDown`
 * when radio-quiz #3 became the second consumer of the exact same widget. Each engine
 * keeps what differs: the OUTER wrapper (inline-choice wraps this in an inline `<span>`
 * for sentence flow; radio-quiz places it block-level beside a stem) and the
 * value/verdict source (passed in as `selectedIndex` + `verdict`).
 *
 * Presentational + self-contained interaction: the group reports a chosen option
 * index via `onSelect`; the caller owns the state and decides what a change means
 * (e.g. clearing a stale verdict after a Check).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §5, §7, §8.
 */
import { type KeyboardEvent } from 'react';

interface ChoicePillGroupProps {
  /** The option labels, in render order. */
  options: readonly string[];
  /** Currently selected option index, or -1 when nothing is selected. */
  selectedIndex: number;
  /**
   * Grading verdict for the selected option: `undefined` = not graded yet,
   * `true` = the selection is correct (green), `false` = incorrect (red).
   */
  verdict?: boolean;
  /** Stable id prefix for React keys (one group instance per caller blank/question). */
  groupId: string;
  /** Accessible label for the radiogroup (e.g. "Choose answer for question 1"). */
  groupLabel: string;
  /** Called with the chosen option index when a pill is clicked or keyed. */
  onSelect: (optionIndex: number) => void;
  /**
   * `lang` for each pill's option TEXT only (WCAG 3.1.2) — never applied to the
   * radiogroup's `aria-label`, which is course-author English chrome.
   */
  contentLang?: string;
}

/** Pill base — layout + focus ring (--ring); state colors are appended per pill. */
const PILL_BASE =
  'inline-flex min-h-8 cursor-pointer items-center rounded-lg border px-2.5 py-1 text-sm font-medium transition-colors duration-200 ease-out select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export function ChoicePillGroup({
  options,
  selectedIndex,
  verdict,
  groupId,
  groupLabel,
  onSelect,
  contentLang,
}: ChoicePillGroupProps) {
  // Arrow keys move the selection within the group (roving focus); Space/Enter
  // re-commit the focused pill. Ported from inline-choice's handleChoiceKeyDown.
  const handleKeyDown = (currentOptionIndex: number, event: KeyboardEvent<HTMLButtonElement>) => {
    const optionsLength = options.length;
    if (optionsLength <= 0) return;
    // Every non-default branch assigns nextIndex; default returns. TS proves it's
    // definitely a number after the switch, so no initializer is needed.
    let nextIndex: number;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentOptionIndex + 1) % optionsLength;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentOptionIndex - 1 + optionsLength) % optionsLength;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = optionsLength - 1;
        break;
      case ' ':
      case 'Enter':
        nextIndex = currentOptionIndex;
        break;
      default:
        return;
    }

    event.preventDefault();
    onSelect(nextIndex);
  };

  return (
    <div
      aria-label={groupLabel}
      className="inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-border/70 bg-card/70 p-1.5 shadow-sm"
      role="radiogroup"
    >
      {options.map((option, optionIndex) => {
        const isSelected = selectedIndex === optionIndex;

        let stateClasses =
          'border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted';
        if (isSelected && verdict === true) {
          stateClasses = 'border-success bg-success/15 text-foreground';
        } else if (isSelected && verdict === false) {
          stateClasses = 'border-destructive bg-destructive/15 text-foreground';
        } else if (isSelected) {
          stateClasses = 'border-primary bg-primary/10 font-semibold text-foreground';
        }

        // Roving tabIndex: the selected pill is tabbable; with nothing selected,
        // the first pill is the tab stop.
        const isTabStop = isSelected || (selectedIndex === -1 && optionIndex === 0);

        return (
          <button
            aria-checked={isSelected}
            className={`${PILL_BASE} ${stateClasses}`}
            key={`${groupId}-${optionIndex}`}
            onClick={() => onSelect(optionIndex)}
            onKeyDown={(event) => handleKeyDown(optionIndex, event)}
            role="radio"
            tabIndex={isTabStop ? 0 : -1}
            type="button"
          >
            <span lang={contentLang}>{option}</span>
          </button>
        );
      })}
    </div>
  );
}
