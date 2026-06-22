/**
 * SelectExercise.tsx — engine #1 of 12 (spec §2, §8). The learner fills dropdown
 * blanks `[a|*b|c]` in a sentence (`*` marks the correct option). Scoring family:
 * blank-grading (spec §7).
 *
 * Ported from french-lo-1's SelectExercise.jsx, typed and trimmed to the template's
 * current foundation:
 *   - layoutMode 'rows' (one sentence per row) and 'inline-passage' (sentences flow
 *     as a passage with inline dropdowns) — the two modes the showcase proves (§3).
 *   - shared behavior wired from Phase A/B helpers: prepareChoiceItems (shuffle/sample,
 *     §5.2/§6), scoring (getInitialScoringState/commitCheck, §7), canRevealAnswers
 *     (show-answers gate, §5.3). Reset is always present and re-shuffles when on.
 *   - shared shell pieces: ExerciseFooter (Check/Reset/Show-answers row) and
 *     ResultSlot (far-right tick/cross). The status line (n/total · "Correct!")
 *     stays local — it's engine-specific copy, not shared chrome.
 *   - all chrome text via resolveLabel(key, config.labels) (ui-strings §9).
 *
 * Render shape: the items are walked ONCE during render to build per-blank metadata
 * (`blanksMeta`) + the rendered nodes. french kept that metadata in refs and wrote
 * them during render; here it is a plain render-local value, and the grading
 * handlers close over it — no ref-during-render (react-hooks/refs).
 *
 * Deliberately NOT ported yet (YAGNI; see select-schema.ts): the audio subsystem,
 * rich-HTML content (no DOMPurify), the third inline-choices variant, passage
 * accents.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2, §5, §7, §8.
 */
import { Fragment, useId, useReducer, type ReactNode } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { SelectExerciseConfigSchema, type SelectItem as SelectItemContent } from './select-schema';

/** Trigger placeholder. Engine-specific UI text, not shared chrome — kept local. */
const PLACEHOLDER = 'Select…';

interface SelectState extends ScoringState {
  /** blankIndex → selected option index (as a string, base-ui's value type). */
  values: Record<number, string>;
  /** The items to render after shuffle/sample (re-derived on reset). */
  preparedItems: SelectItemContent[];
  /** RNG seed; bumped on reset so an `options.shuffle` exercise re-shuffles. */
  seed: number;
}

type SelectPatch = Partial<SelectState> | ((state: SelectState) => Partial<SelectState>);

/** Merge reducer: each dispatch is a partial patch (answer fields are interdependent). */
const reducer = (state: SelectState, patch: SelectPatch): SelectState => ({
  ...state,
  ...(typeof patch === 'function' ? patch(state) : patch),
});

const buildState = (
  items: readonly SelectItemContent[],
  options: PrepareChoiceOptions,
  seed: number,
): SelectState => ({
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

export default function SelectExercise({ config }: ExerciseComponentProps) {
  const uid = useId();

  const parsed = SelectExerciseConfigSchema.safeParse(config);
  const items: readonly SelectItemContent[] = parsed.success ? parsed.data.content.items : [];
  const labels: UiStringsOverride | undefined = parsed.success ? parsed.data.labels : undefined;
  const options: ExerciseOptions = ExerciseOptionsSchema.parse(
    parsed.success ? (parsed.data.options ?? {}) : {},
  );

  // Seed from useId: stable across re-renders, distinct per instance (so the two
  // showcase cards shuffle differently). Reset bumps the seed for a fresh order.
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    buildState(items, options, seedFromId(uid)),
  );

  const handleSelectChange = (blankIndex: number, value: string) => {
    dispatch((prev) => {
      const values = { ...prev.values, [blankIndex]: value };
      if (!prev.hasChecked) return { values };
      // A changed answer after checking clears that blank's old verdict.
      const checkedResults = { ...prev.checkedResults };
      delete checkedResults[blankIndex];
      return { values, ...commitCheck(checkedResults) };
    });
  };

  const handleReset = () => {
    dispatch((prev) => buildState(items, options, prev.seed + 1));
  };

  if (!parsed.success) {
    return (
      <p className="text-sm text-destructive">
        Invalid <code>select</code> config: {parsed.error.issues[0]?.message ?? 'parse error'}
      </p>
    );
  }

  const renderBlank = (blankIndex: number, blanksMeta: ChoiceMeta[]): ReactNode => {
    const meta = blanksMeta[blankIndex];
    const value = state.values[blankIndex] ?? '';
    const selectId = `${uid}-blank-${blankIndex}`;

    return (
      <span className="mx-1 inline-flex align-middle" key={selectId}>
        <label className="sr-only" htmlFor={selectId}>{`Answer for blank ${blankIndex + 1}`}</label>
        <Select value={value} onValueChange={(next) => handleSelectChange(blankIndex, next ?? '')}>
          <SelectTrigger id={selectId} className="min-w-32">
            <SelectValue placeholder={PLACEHOLDER}>
              {(v) => (v == null || v === '' ? null : (meta?.options[Number(v)] ?? null))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {meta?.options.map((option, optionIndex) => (
              <SelectItem key={`${selectId}-${optionIndex}`} value={String(optionIndex)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </span>
    );
  };

  // Per-row verdict → a result slot at the far right of each line. The slot's grid
  // column is ALWAYS reserved (fixed width), so toggling the tick/cross on Check or
  // Show-answers never shifts the sentence. One icon per row: correct only when
  // every blank in that row is correct (matches french-lo-1).
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
  // as it goes, then we map each segment to text or a <Select>.
  const blanksMeta: ChoiceMeta[] = [];
  const isPassage = parsed.data.content.layoutMode === 'inline-passage';
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
        renderBlank(segment.blankIndex, blanksMeta)
      ) : (
        <Fragment key={(segment as TextSegment).key}>{(segment as TextSegment).value}</Fragment>
      ),
    );

    // sentence + a fixed-width result column → tick/cross sits far right, no jiggle.
    const grid = (
      <div className="grid grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-2">
        <span className="min-w-0">{nodes}</span>
        {renderResultSlot(rowBlankIndices)}
      </div>
    );

    lines.push(
      isPassage ? (
        <div key={`line-${i}`} className="leading-loose text-foreground">
          {grid}
        </div>
      ) : (
        <div
          key={`row-${i}`}
          className="rounded-lg border border-border/70 bg-card px-4 py-3 leading-relaxed"
        >
          {grid}
        </div>
      ),
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
      {isPassage ? (
        <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="space-y-2">{lines}</div>
        </div>
      ) : (
        <div className="space-y-3">{lines}</div>
      )}

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
