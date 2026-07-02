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
 * Rendered as a CONNECTED segmented control: a single hairline border wraps the
 * whole group, `divide-x` draws thin separators between segments, and only the
 * outer corners are rounded (overflow-hidden clips the inner squared edges). No
 * per-pill border and no outer card/shadow wrapper — selection reads through the
 * fill colour, not a ring of borders. Focus rings are inset so overflow-hidden
 * doesn't clip them.
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

/**
 * Segment base — layout + inset focus ring (--ring). No border/radius of its own;
 * the container owns the single outer border, rounding, and `divide-x` separators.
 * `focus-visible:z-10` lifts the focused segment so its inset ring sits above the
 * neighbouring divider. State colours are appended per segment.
 */
const PILL_BASE =
  'inline-flex min-h-8 cursor-pointer items-center px-3 py-1 text-sm font-medium transition-colors duration-200 ease-out select-none focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring';

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
      className="inline-flex items-stretch divide-x divide-border overflow-hidden rounded-lg border border-border bg-background align-middle"
      role="radiogroup"
    >
      {options.map((option, optionIndex) => {
        const isSelected = selectedIndex === optionIndex;

        let stateClasses = 'bg-background text-foreground hover:bg-muted';
        if (isSelected && verdict === true) {
          stateClasses = 'bg-success/15 text-foreground';
        } else if (isSelected && verdict === false) {
          stateClasses = 'bg-destructive/15 text-foreground';
        } else if (isSelected) {
          stateClasses = 'bg-primary/10 font-semibold text-primary';
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
