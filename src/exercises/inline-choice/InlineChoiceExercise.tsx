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
 *   - the radio-pill group itself (ChoicePillGroup): role="radiogroup"/role="radio"
 *     pills with roving tabIndex, arrow-key nav, aria-checked, and state→token
 *     classes. Extracted to lib when radio-quiz #3 became its second consumer; this
 *     engine wraps it in an inline `<span>` so blanks flow inside the sentence.
 *
 * What stays engine-specific here is the inline layout: each blank's pill group sits
 * mid-sentence (no new --ex-* tokens; ChoicePillGroup uses --primary/--success/
 * --destructive/--border/--ring only).
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
import { useId, type ReactNode } from 'react';

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
import { ChoicePillGroup } from '@/exercises/lib/ChoicePillGroup';
import { ExerciseFooter } from '@/exercises/lib/ExerciseFooter';
import { ResultSlot } from '@/exercises/lib/ResultSlot';
import { useExerciseScaffold } from '@/exercises/lib/exerciseScaffold';
import type { ExerciseComponentProps } from '@/exercises/lazyRegistry';
import { TARGET_LANG } from '@/lib/lang';
import {
  InlineChoiceExerciseConfigSchema,
  type InlineChoiceItem as InlineChoiceItemContent,
} from './inline-choice-schema';
import { fillInlineChoiceAnswers, gradeInlineChoice } from './inline-choice-grading';

interface InlineChoiceState extends ScoringState {
  /** blankIndex → selected option index (as a string, mirrors select). */
  values: Record<number, string>;
  /** The items to render after shuffle/sample (re-derived on reset). */
  preparedItems: InlineChoiceItemContent[];
  /** RNG seed; bumped on reset so an `options.shuffle` exercise re-shuffles. */
  seed: number;
}

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

export default function InlineChoiceExercise({ config }: ExerciseComponentProps) {
  const uid = useId();

  const parsed = InlineChoiceExerciseConfigSchema.safeParse(config);
  const items: readonly InlineChoiceItemContent[] = parsed.success ? parsed.data.content.items : [];
  const labels: UiStringsOverride | undefined = parsed.success ? parsed.data.labels : undefined;
  const options: ExerciseOptions = ExerciseOptionsSchema.parse(
    parsed.success ? (parsed.data.options ?? {}) : {},
  );

  // Shared scaffold: seeds from a stable per-instance useId, wires the merge
  // reducer, and gives reset() which rebuilds with seed + 1 for a fresh order.
  const { state, dispatch, reset } = useExerciseScaffold<InlineChoiceState>((seed) =>
    buildState(items, options, seed),
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

  const handleReset = reset;

  if (!parsed.success) {
    return (
      <p className="text-sm text-destructive">
        Invalid <code>inline-choice</code> config:{' '}
        {parsed.error.issues[0]?.message ?? 'parse error'}
      </p>
    );
  }

  // One blank's renderer: the shared ChoicePillGroup wrapped in an inline `<span>`
  // so the pills flow mid-sentence. The verdict (correct/incorrect/ungraded) maps
  // this blank's checkedResults entry onto the group's coloring.
  const renderChoiceGroup = (blankIndex: number, blanksMeta: ChoiceMeta[]): ReactNode => {
    const meta = blanksMeta[blankIndex];
    if (!meta) return null;

    const rawValue = state.values[blankIndex] ?? '';
    const selectedIndex = rawValue === '' ? -1 : Number(rawValue);
    const result = state.checkedResults[blankIndex];
    const verdict = typeof result === 'boolean' ? result : undefined;
    const groupId = `${uid}-blank-${blankIndex}`;

    return (
      <span className="mx-1 inline-flex align-middle" key={groupId}>
        <ChoicePillGroup
          contentLang={TARGET_LANG}
          groupId={groupId}
          groupLabel={`Choose answer for blank ${blankIndex + 1}`}
          onSelect={(optionIndex) => handleChoiceChange(blankIndex, String(optionIndex))}
          options={meta.options}
          selectedIndex={selectedIndex}
          verdict={verdict}
        />
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
        <span key={(segment as TextSegment).key} lang={TARGET_LANG}>
          {(segment as TextSegment).value}
        </span>
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
    dispatch(commitCheck(gradeInlineChoice(blanksMeta, state.values, nToSolve)));
  };

  const handleShowAnswers = () => {
    const { values, checkedResults } = fillInlineChoiceAnswers(blanksMeta, nToSolve);
    dispatch({ values, ...commitCheck(checkedResults) });
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
        <p className="text-sm text-muted-foreground" lang={TARGET_LANG}>
          {parsed.data.content.footnote}
        </p>
      ) : null}
    </div>
  );
}
