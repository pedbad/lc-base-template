/**
 * InlineTypedGapExercise.tsx — engine #4 of 12 (spec §2, §8). The learner types into
 * inline blanks `[expected::placeholder]` inside flowing prose. Scoring family:
 * blank-grading (spec §7), but answers are TYPED — compared with normalizeAnswer
 * (accent-strict, apostrophe/whitespace-tolerant) rather than picked from a list.
 *
 * Ported from french-lo-1's InlineTypedGapExercise.jsx, typed and trimmed to the
 * template's foundation:
 *   - parseInputBlank + parseSentence (M1) build per-blank metadata in a render-local
 *     value; grading handlers close over it (no ref-during-render, react-hooks/refs).
 *   - On Check, each filled blank is graded and a character diff (diffChars, M1) is
 *     rendered below the input via <TextDiff> — plain React nodes, no innerHTML.
 *   - shared shell: ExerciseFooter (Check/Reset/Show-answers) + ResultSlot (per-row
 *     tick/cross). canRevealAnswers gates Show-answers (spec §5.3). Reset clears all.
 *   - chrome text via resolveLabel(key, labels) (ui-strings §9).
 *
 * `options.shuffle`/`sampleSize` are N/A for a typed cloze (no choices; prose order
 * is meaningful) — only `allowShowAnswers` applies. Per-item `audio` is accepted by
 * the schema but NOT rendered yet (the audio layer is wired in M4b).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2, §5, §7, §8.
 */
import { Fragment, useId, useReducer, type KeyboardEvent, type ReactNode } from 'react';

import { Input } from '@/components/ui/input';
import AudioManager from '@/audio/AudioManager';
import { ExerciseOptionsSchema, type ExerciseOptions } from '@/config/lo-schema';
import { resolveLabel, type UiStringsOverride } from '@/config/ui-strings';
import { normalizeAnswer } from '@/exercises/lib/answers';
import { diffChars, type DiffPart } from '@/exercises/lib/charDiff';
import { TextDiff } from '@/exercises/lib/TextDiff';
import { canRevealAnswers } from '@/exercises/lib/reveal';
import { commitCheck, getInitialScoringState, type ScoringState } from '@/exercises/lib/scoring';
import {
  parseInputBlank,
  parseSentence,
  type InputMeta,
  type InputSegment,
  type TextSegment,
} from '@/exercises/lib/parsing';
import { ExerciseFooter } from '@/exercises/lib/ExerciseFooter';
import { ResultSlot } from '@/exercises/lib/ResultSlot';
import type { ExerciseComponentProps } from '@/exercises/lazyRegistry';
import { InlineGapExerciseConfigSchema, type InlineGapItem } from './inline-gap-schema';

interface InlineGapState extends ScoringState {
  /** blankIndex → typed text. */
  values: Record<number, string>;
  /** blankIndex → character diff parts (filled on Check / Show-answers). */
  diffs: Record<number, DiffPart[]>;
}

type InlineGapPatch =
  | Partial<InlineGapState>
  | ((state: InlineGapState) => Partial<InlineGapState>);

/** Merge reducer: each dispatch is a partial patch (answer fields are interdependent). */
const reducer = (state: InlineGapState, patch: InlineGapPatch): InlineGapState => ({
  ...state,
  ...(typeof patch === 'function' ? patch(state) : patch),
});

const buildState = (): InlineGapState => ({
  ...getInitialScoringState(),
  values: {},
  diffs: {},
});

export default function InlineTypedGapExercise({ config }: ExerciseComponentProps) {
  const uid = useId();

  const parsed = InlineGapExerciseConfigSchema.safeParse(config);
  const items: readonly InlineGapItem[] = parsed.success ? parsed.data.content.items : [];
  const labels: UiStringsOverride | undefined = parsed.success ? parsed.data.labels : undefined;
  const options: ExerciseOptions = ExerciseOptionsSchema.parse(
    parsed.success ? (parsed.data.options ?? {}) : {},
  );

  const [state, dispatch] = useReducer(reducer, undefined, buildState);

  const inputId = (blankIndex: number) => `${uid}-gap-${blankIndex}`;

  const handleInputChange = (blankIndex: number, value: string) => {
    dispatch((prev) => {
      const values = { ...prev.values, [blankIndex]: value };
      if (!prev.hasChecked) return { values };
      // Editing a blank after checking clears its old verdict + diff.
      const checkedResults = { ...prev.checkedResults };
      const diffs = { ...prev.diffs };
      delete checkedResults[blankIndex];
      delete diffs[blankIndex];
      return { values, diffs, ...commitCheck(checkedResults) };
    });
  };

  // Enter advances to the next blank instead of submitting the whole exercise
  // (submitting on Enter caused accidental early reveal in french-lo-1).
  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>, blankIndex: number) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const next = document.getElementById(inputId(blankIndex + 1));
    if (next instanceof HTMLElement) next.focus();
    else event.currentTarget.blur();
  };

  const handleReset = () => {
    AudioManager.stopAll();
    dispatch(buildState());
  };

  if (!parsed.success) {
    return (
      <p className="text-sm text-destructive">
        Invalid <code>inline-gap</code> config: {parsed.error.issues[0]?.message ?? 'parse error'}
      </p>
    );
  }

  const renderInput = (blankIndex: number, blanksMeta: InputMeta[]): ReactNode => {
    const meta = blanksMeta[blankIndex];
    const value = state.values[blankIndex] ?? '';
    const result = state.checkedResults[blankIndex];
    const diff = state.diffs[blankIndex];
    const isWrong = state.hasChecked && result === false;
    const isRight = state.hasChecked && result === true;
    const id = inputId(blankIndex);

    return (
      <span className="mx-1 inline-flex flex-col align-middle" key={id}>
        <label className="sr-only" htmlFor={id}>{`Answer for blank ${blankIndex + 1}`}</label>
        <Input
          id={id}
          type="text"
          value={value}
          onChange={(event) => handleInputChange(blankIndex, event.target.value)}
          onKeyDown={(event) => handleInputKeyDown(event, blankIndex)}
          placeholder={meta?.placeholder || 'Type…'}
          aria-invalid={isWrong}
          className={`inline-flex h-9 ${isRight ? 'border-success' : ''}`}
          style={{ width: `${meta?.widthCh ?? 8}ch`, maxWidth: '100%' }}
        />
        {state.hasChecked && diff ? (
          <span className="mt-1">
            <TextDiff parts={diff} />
          </span>
        ) : null}
      </span>
    );
  };

  // One verdict per row: correct only when every blank in that row is correct. The
  // result column is fixed-width so toggling the tick/cross never shifts the text.
  const renderResultSlot = (rowBlankIndices: number[]): ReactNode => {
    const results = rowBlankIndices.map((idx) => state.checkedResults[idx]);
    const attempted = rowBlankIndices.some((idx) => (state.values[idx] ?? '').trim() !== '');
    const fullyChecked = rowBlankIndices.length > 0 && results.every((r) => typeof r === 'boolean');
    const hasResult = state.hasChecked && attempted && fullyChecked;
    const isCorrect = hasResult && results.every((r) => r === true);
    return <ResultSlot hasResult={hasResult} isCorrect={isCorrect} />;
  };

  // Walk items once: parseSentence fills `blanksMeta` (expected/placeholder/width per
  // blank) as it goes, then each segment maps to text or an <Input>.
  const blanksMeta: InputMeta[] = [];
  const rows: ReactNode[] = [];
  let blankCursor = 0;

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const { segments, nextBlankIndex } = parseSentence<InputMeta, InputSegment>(item.text, {
      startBlankIndex: blankCursor,
      blanksMeta,
      parseBlank: parseInputBlank,
    });
    blankCursor = nextBlankIndex;

    const rowBlankIndices = segments
      .filter((segment): segment is InputSegment => segment.type === 'input')
      .map((segment) => segment.blankIndex);

    const nodes = segments.map((segment) =>
      segment.type === 'input' ? (
        renderInput(segment.blankIndex, blanksMeta)
      ) : (
        <Fragment key={(segment as TextSegment).key}>{(segment as TextSegment).value}</Fragment>
      ),
    );

    rows.push(
      <div
        key={`row-${i}`}
        className="rounded-lg border border-border/70 bg-card px-4 py-3 leading-loose"
      >
        {item.prompt ? <p className="mb-2 text-sm text-muted-foreground">{item.prompt}</p> : null}
        <div className="grid grid-cols-[minmax(0,1fr)_2.5rem] items-start gap-2">
          <span className="min-w-0 text-foreground">{nodes}</span>
          {renderResultSlot(rowBlankIndices)}
        </div>
      </div>,
    );
  }

  const nToSolve = blankCursor;

  const handleCheck = () => {
    const checkedResults: Record<number, boolean> = {};
    const diffs: Record<number, DiffPart[]> = {};
    for (let i = 0; i < nToSolve; i += 1) {
      const value = state.values[i] ?? '';
      if (value.trim() === '') continue; // grade only blanks the learner filled
      const normalizedAnswer = normalizeAnswer(value);
      const normalizedExpected = normalizeAnswer(blanksMeta[i]?.expected ?? '');
      checkedResults[i] = normalizedAnswer === normalizedExpected;
      diffs[i] = diffChars(normalizedAnswer, normalizedExpected).parts;
    }
    dispatch({ ...commitCheck(checkedResults), diffs });
  };

  const handleShowAnswers = () => {
    const values: Record<number, string> = {};
    const checkedResults: Record<number, boolean> = {};
    const diffs: Record<number, DiffPart[]> = {};
    for (let i = 0; i < nToSolve; i += 1) {
      const expected = blanksMeta[i]?.expected ?? '';
      values[i] = expected;
      checkedResults[i] = true;
      diffs[i] = diffChars(expected, expected).parts; // all 'same'
    }
    dispatch({ values, ...commitCheck(checkedResults), diffs });
  };

  const hasInput = Object.values(state.values).some((v) => v.trim() !== '');
  const allCorrect = state.hasChecked && nToSolve > 0 && state.nCorrect === nToSolve;
  const canReveal = canRevealAnswers({
    allowShowAnswers: options.allowShowAnswers,
    hasAttempted: state.hasChecked,
    total: nToSolve,
    nCorrect: state.nCorrect,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3">{rows}</div>

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
        checkDisabled={!hasInput}
        onReset={handleReset}
        showReset={hasInput || state.hasChecked}
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
