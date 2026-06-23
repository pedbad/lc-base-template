/**
 * InlineChoiceExercise.tsx — engine #2 of 12 (spec §2, §8). The learner picks from
 * an inline radio-pill group for each blank `[a|*b|c]` embedded in a sentence
 * (`*` marks the correct option). Scoring family: blank-grading (spec §7) — the
 * SAME family as select; the two engines differ only in how a blank renders
 * (dropdown vs inline pills).
 *
 * Ported from french-lo-1's InlineChoiceGroup.jsx, typed and trimmed to the
 * template's foundation. Shared parts come from the exercise shell extracted for
 * engine #2:
 *   - prepareChoiceItems (shuffle/sample, §5.2/§6), scoring helpers (§7),
 *     canRevealAnswers (show-answers gate, §5.3). Reset re-shuffles when on.
 *   - ExerciseFooter (Check/Reset/Show-answers) + ResultSlot (far-right tick/cross),
 *     and the same `grid-cols-[minmax(0,1fr)_2.5rem]` no-jiggle row select uses.
 *   - all chrome text via resolveLabel(key, config.labels) (ui-strings §9).
 *
 * The ONLY engine-specific UI is the radio-pill group: a `role="radiogroup"` of
 * `role="radio"` buttons with roving tabIndex, arrow-key navigation
 * (Left/Right/Up/Down/Home/End), and `aria-checked`. Pill states
 * (selected/correct/incorrect/hover) map onto the existing design tokens
 * (--primary, --success, --destructive, --muted, --border, --ring) — no new tokens.
 *
 * Render shape mirrors select: items are walked ONCE during render to build
 * per-blank metadata (`blanksMeta`) + the rendered nodes; grading handlers close
 * over that render-local value (no ref-during-render). No layoutMode — blanks
 * always flow inline; the status line (n/total · "Correct!") stays local, matching
 * select (french-lo-1's ProgressDots is skipped, YAGNI).
 *
 * Deliberately NOT ported yet (YAGNI; see inline-choice-schema.ts): the audio
 * subsystem, rich-HTML content (no DOMPurify), per-row click-to-play.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2, §5, §7, §8.
 */
import { Fragment, useId, useReducer, type KeyboardEvent, type ReactNode } from 'react';

import { ExerciseOptionsSchema, type ExerciseOptions } from '@/config/lo-schema';
import { resolveLabel, type UiStringsOverride } from '@/config/ui-strings';
import { canRevealAnswers } from '@/exercises/lib/reveal';
import { commitCheck, getInitialScoringState, type ScoringState } from '@/exercises/lib/scoring';
import { mulberry32 } from '@/exercises/lib/shuffle';
import {
  parseChoiceBlank,
  parseSentence,
  type ChoiceMeta,
  type ChoiceSegment,
  type TextSegment,
} from '@/exercises/lib/parsing';
import { prepareChoiceItems, type PrepareChoiceOptions } from '@/exercises/lib/prepareChoiceItems';
import { ExerciseFooter } from '@/exercises/lib/ExerciseFooter';
import { ResultSlot } from '@/exercises/lib/ResultSlot';
import type { ExerciseComponentProps } from '@/exercises/lazyRegistry';
import {
  InlineChoiceExerciseConfigSchema,
  type InlineChoiceItem as InlineChoiceItemContent,
} from './inline-choice-schema';

interface InlineChoiceState extends ScoringState {
  /** blankIndex → selected option index (as a string, mirrors select). */
  values: Record<number, string>;
  /** The items to render after shuffle/sample (re-derived on reset). */
  preparedItems: InlineChoiceItemContent[];
  /** RNG seed; bumped on reset so an `options.shuffle` exercise re-shuffles. */
  seed: number;
}

type InlineChoicePatch =
  | Partial<InlineChoiceState>
  | ((state: InlineChoiceState) => Partial<InlineChoiceState>);

/** Merge reducer: each dispatch is a partial patch (answer fields are interdependent). */
const reducer = (state: InlineChoiceState, patch: InlineChoicePatch): InlineChoiceState => ({
  ...state,
  ...(typeof patch === 'function' ? patch(state) : patch),
});

const buildState = (
  items: readonly InlineChoiceItemContent[],
  options: PrepareChoiceOptions,
  seed: number,
): InlineChoiceState => ({
  ...getInitialScoringState(),
  values: {},
  preparedItems: prepareChoiceItems(items, options, mulberry32(seed)),
  seed,
});

/** FNV-1a hash → a stable numeric seed from the component's useId (pure; no Math.random). */
const seedFromId = (id: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/** Pill base — layout + focus ring (--ring); state colors are appended per pill. */
const PILL_BASE =
  'inline-flex min-h-8 cursor-pointer items-center rounded-lg border px-2.5 py-1 text-sm font-medium transition-colors duration-200 ease-out select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function InlineChoiceExercise({ config }: ExerciseComponentProps) {
  const uid = useId();

  const parsed = InlineChoiceExerciseConfigSchema.safeParse(config);
  const items: readonly InlineChoiceItemContent[] = parsed.success ? parsed.data.content.items : [];
  const labels: UiStringsOverride | undefined = parsed.success ? parsed.data.labels : undefined;
  const options: ExerciseOptions = ExerciseOptionsSchema.parse(
    parsed.success ? (parsed.data.options ?? {}) : {},
  );

  // Seed from useId: stable across re-renders, distinct per instance. Reset bumps
  // the seed for a fresh order.
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    buildState(items, options, seedFromId(uid)),
  );

  const handleChoiceChange = (blankIndex: number, value: string) => {
    dispatch((prev) => {
      const values = { ...prev.values, [blankIndex]: value };
      if (!prev.hasChecked) return { values };
      // A changed answer after checking clears that blank's old verdict.
      const checkedResults = { ...prev.checkedResults };
      delete checkedResults[blankIndex];
      return { values, ...commitCheck(checkedResults) };
    });
  };

  // Arrow keys move the selection within a radio group (roving focus); Space/Enter
  // re-commit the focused pill. Ported from french-lo-1's handleChoiceKeyDown.
  const handleChoiceKeyDown = (
    blankIndex: number,
    currentOptionIndex: number,
    optionsLength: number,
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
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
    handleChoiceChange(blankIndex, String(nextIndex));
  };

  const handleReset = () => {
    dispatch((prev) => buildState(items, options, prev.seed + 1));
  };

  if (!parsed.success) {
    return (
      <p className="text-sm text-destructive">
        Invalid <code>inline-choice</code> config:{' '}
        {parsed.error.issues[0]?.message ?? 'parse error'}
      </p>
    );
  }

  // The engine-specific renderer: an inline radio-pill group for one blank. Pill
  // state classes use existing tokens only (no new --ex-* tokens).
  const renderChoiceGroup = (blankIndex: number, blanksMeta: ChoiceMeta[]): ReactNode => {
    const meta = blanksMeta[blankIndex];
    if (!meta) return null;

    const rawValue = state.values[blankIndex] ?? '';
    const selectedIndex = rawValue === '' ? -1 : Number(rawValue);
    const isCorrectSelection = state.checkedResults[blankIndex] === true;
    const isIncorrectSelection = state.hasChecked && state.checkedResults[blankIndex] === false;
    const groupId = `${uid}-blank-${blankIndex}`;

    return (
      <span className="mx-1 inline-flex align-middle" key={groupId}>
        <div
          aria-label={`Choose answer for blank ${blankIndex + 1}`}
          className="inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-border/70 bg-card/70 p-1.5 shadow-sm"
          role="radiogroup"
        >
          {meta.options.map((option, optionIndex) => {
            const isSelected = selectedIndex === optionIndex;

            let stateClasses =
              'border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted';
            if (isSelected && isCorrectSelection) {
              stateClasses = 'border-success bg-success/15 text-foreground';
            } else if (isSelected && isIncorrectSelection) {
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
                onClick={() => handleChoiceChange(blankIndex, String(optionIndex))}
                onKeyDown={(event) =>
                  handleChoiceKeyDown(blankIndex, optionIndex, meta.options.length, event)
                }
                role="radio"
                tabIndex={isTabStop ? 0 : -1}
                type="button"
              >
                {option}
              </button>
            );
          })}
        </div>
      </span>
    );
  };

  // Per-row verdict → a fixed-width result slot at the far right of each line, so
  // toggling the tick/cross on Check or Show-answers never shifts the sentence. One
  // icon per row: correct only when every blank in that row is correct.
  const renderResultSlot = (rowBlankIndices: number[]): ReactNode => {
    const results = rowBlankIndices.map((idx) => state.checkedResults[idx]);
    const attempted = rowBlankIndices.some((idx) => {
      const v = state.values[idx];
      return v !== undefined && v !== '';
    });
    const fullyChecked = rowBlankIndices.length > 0 && results.every((r) => typeof r === 'boolean');
    const hasResult = state.hasChecked && attempted && fullyChecked;
    const isCorrect = hasResult && results.every((r) => r === true);

    return <ResultSlot hasResult={hasResult} isCorrect={isCorrect} />;
  };

  // Walk the items once: parseSentence fills `blanksMeta` (winner/options per blank)
  // as it goes, then we map each segment to text or a radio-pill group.
  const blanksMeta: ChoiceMeta[] = [];
  const lines: ReactNode[] = [];
  let blankCursor = 0;

  for (let i = 0; i < state.preparedItems.length; i += 1) {
    const { segments, nextBlankIndex } = parseSentence<ChoiceMeta, ChoiceSegment>(
      state.preparedItems[i].text,
      { startBlankIndex: blankCursor, blanksMeta, parseBlank: parseChoiceBlank },
    );
    blankCursor = nextBlankIndex;

    const rowBlankIndices = segments
      .filter((segment): segment is ChoiceSegment => segment.type === 'choice')
      .map((segment) => segment.blankIndex);

    const nodes = segments.map((segment) =>
      segment.type === 'choice' ? (
        renderChoiceGroup(segment.blankIndex, blanksMeta)
      ) : (
        <Fragment key={(segment as TextSegment).key}>{(segment as TextSegment).value}</Fragment>
      ),
    );

    // sentence + a fixed-width result column → tick/cross sits far right, no jiggle.
    lines.push(
      <div
        key={`row-${i}`}
        className="rounded-lg border border-border/70 bg-card px-4 py-3 leading-relaxed"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-2">
          <span className="min-w-0">{nodes}</span>
          {renderResultSlot(rowBlankIndices)}
        </div>
      </div>,
    );
  }

  const nToSolve = blankCursor;

  const handleCheck = () => {
    const checkedResults: Record<number, boolean> = {};
    for (let i = 0; i < nToSolve; i += 1) {
      const value = state.values[i];
      if (value === undefined || value === '') continue;
      checkedResults[i] = Number(value) === blanksMeta[i]?.winner;
    }
    dispatch(commitCheck(checkedResults));
  };

  const handleShowAnswers = () => {
    const values: Record<number, string> = {};
    const checkedResults: Record<number, boolean> = {};
    for (let i = 0; i < nToSolve; i += 1) {
      values[i] = String(blanksMeta[i]?.winner ?? -1);
      checkedResults[i] = true;
    }
    dispatch({ values, checkedResults, hasChecked: true, nCorrect: nToSolve });
  };

  const hasSelections = Object.keys(state.values).length > 0;
  const allCorrect = state.hasChecked && nToSolve > 0 && state.nCorrect === nToSolve;
  const canReveal = canRevealAnswers({
    allowShowAnswers: options.allowShowAnswers,
    hasAttempted: state.hasChecked,
    total: nToSolve,
    nCorrect: state.nCorrect,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3">{lines}</div>

      {state.hasChecked ? (
        <p
          className={`text-sm font-medium ${allCorrect ? 'text-success' : 'text-muted-foreground'}`}
          role="status"
        >
          {allCorrect ? resolveLabel('correct', labels) : `${state.nCorrect} / ${nToSolve}`}
        </p>
      ) : null}

      <ExerciseFooter
        onCheck={handleCheck}
        checkDisabled={!hasSelections}
        onReset={handleReset}
        showReset={hasSelections || state.hasChecked}
        onShowAnswers={handleShowAnswers}
        showAnswers={canReveal}
        labels={labels}
      />

      {parsed.data.content.footnote ? (
        <p className="text-sm text-muted-foreground">{parsed.data.content.footnote}</p>
      ) : null}
    </div>
  );
}
