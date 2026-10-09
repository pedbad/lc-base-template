/**
 * TextEntryRuntime.tsx — shared runtime for the typed-response table engines
 * (typed-transform #5, dictation #6; spec §9). Renders a table of rows: optional
 * audio + optional prompt cue + a typed-answer Input with a per-row verdict and a
 * feedback line under a wrong answer. Each engine is a thin wrapper that passes its
 * `comparisonMode`; the only behavioural difference is how answers are normalized.
 *
 * Ported from french-lo-1's TextEntryExerciseRuntime, typed and trimmed:
 *   - phrases tuples → typed `rows` objects (text-entry-schema).
 *   - grading via the M1 answer helpers (strict = normalizeAnswer, dictation =
 *     normalizeForDictation) instead of raw trim-equality.
 *   - a wrong row gets <AnswerFeedback>: a hint naming the error, then the answer on
 *     the second wrong Check (answer-feedback.ts, TODO §D15).
 *   - per-row audio via <AudioClip> (independent click-to-play); no master player.
 *   - shared ExerciseFooter + ResultSlot; canRevealAnswers gates Show-answers.
 *   - dropped (YAGNI): htmlContent, Mars/Venus gender-icon header heuristics,
 *     prompt-click delegation. (ProgressDots came back as ProgressMeter, 2026-10-09.)
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §7, §8, §9.
 */
import { useId, useReducer, type KeyboardEvent, type ReactNode } from 'react';

import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AudioManager from '@/audio/AudioManager';
import { AudioClip } from '@/components/audio/AudioClip';
import type { ExerciseOptions } from '@/config/lo-schema';
import type { UiStringsOverride } from '@/config/ui-strings';
import { AnswerFeedback } from '@/exercises/lib/AnswerFeedback';
import {
  firstMarkedReveal,
  type AnswerFeedback as Feedback,
} from '@/exercises/lib/answer-feedback';
import { canRevealAnswers } from '@/exercises/lib/reveal';
import {
  commitCheck,
  commitReveal,
  countOwnCorrect,
  getInitialScoringState,
  type ScoringState,
} from '@/exercises/lib/scoring';
import { ExerciseFooter } from '@/exercises/lib/ExerciseFooter';
import { ResultSlot } from '@/exercises/lib/ResultSlot';
import { createExerciseReducer } from '@/exercises/lib/exerciseScaffold';
import { ProgressMeter } from '@/exercises/lib/ProgressMeter';
import { TARGET_LANG } from '@/lib/lang';
import type { TextEntryContent } from './text-entry-schema';
import { fillAnswers, gradeTextEntry, type ComparisonMode } from './text-entry-grading';

export type { ComparisonMode };

interface TextEntryRuntimeProps {
  content: TextEntryContent;
  /** strict (typed-transform) → normalizeAnswer; dictation (#6) → normalizeForDictation. */
  comparisonMode: ComparisonMode;
  labels?: UiStringsOverride;
  options: ExerciseOptions;
}

interface TextEntryState extends ScoringState {
  /** rowIndex → typed text. */
  values: Record<number, string>;
  /** rowIndex → the hint or revealed answer under a wrong answer (answer-feedback). */
  feedback: Record<number, Feedback>;
  /** rowIndex → wrong Checks so far: the first gets a hint, the second the answer. */
  misses: Record<number, number>;
}

/** Shared merge reducer (partial/function patch); answer fields are interdependent. */
const reducer = createExerciseReducer<TextEntryState>();

const buildState = (): TextEntryState => ({
  ...getInitialScoringState(),
  values: {},
  feedback: {},
  misses: {},
});

export function TextEntryRuntime({
  content,
  comparisonMode,
  labels,
  options,
}: TextEntryRuntimeProps) {
  const uid = useId();
  const [state, dispatch] = useReducer(reducer, undefined, buildState);

  const { rows, columns } = content;
  const total = rows.length;

  const answerId = (rowIndex: number) => `${uid}-answer-${rowIndex}`;
  const hasAudio = rows.some((row) => Boolean(row.audio));
  const hasPrompt = rows.some((row) => Boolean(row.prompt));

  const handleInputChange = (rowIndex: number, value: string) => {
    dispatch((prev) => {
      const values = { ...prev.values, [rowIndex]: value };
      if (!prev.hasChecked) return { values };
      const checkedResults = { ...prev.checkedResults };
      const feedback = { ...prev.feedback };
      delete checkedResults[rowIndex];
      delete feedback[rowIndex];
      return { values, feedback, ...commitCheck(checkedResults) };
    });
  };

  // Enter advances to the next answer field rather than submitting the exercise.
  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>, rowIndex: number) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const next = document.getElementById(answerId(rowIndex + 1));
    if (next instanceof HTMLElement) next.focus();
    else event.currentTarget.blur();
  };

  const handleCheck = () => {
    const { checkedResults, feedback, misses } = gradeTextEntry(
      rows,
      state.values,
      comparisonMode,
      state.misses,
      options.caseSensitive,
    );
    dispatch({ ...commitCheck(checkedResults), feedback, misses });
  };

  const handleShowAnswers = () => {
    const { values, checkedResults } = fillAnswers(rows);
    dispatch({ values, ...commitReveal(state, checkedResults), feedback: {} });
  };

  const handleReset = () => {
    AudioManager.stopAll();
    dispatch(buildState());
  };

  // The one-line key under the first revealed answer with something marked.
  const keyIndex = firstMarkedReveal(state.feedback);

  const renderRow = (rowIndex: number): ReactNode => {
    const row = rows[rowIndex];
    const value = state.values[rowIndex] ?? '';
    const result = state.checkedResults[rowIndex];
    const feedback = state.feedback[rowIndex];
    const isWrong = state.hasChecked && result === false;
    const isRight = state.hasChecked && result === true;
    const hasResult = state.hasChecked && typeof result === 'boolean';
    const id = answerId(rowIndex);

    // Cells keep TableCell's align-middle: the 54px speaker is taller than the input,
    // so top-aligned cells left the prompt and input riding high (2026-10-08).
    return (
      <TableRow key={`row-${rowIndex}`}>
        {hasAudio ? (
          <TableCell className="w-12">
            {row.audio ? (
              <AudioClip
                className="super-compact-speaker"
                inline
                id={`${uid}-audio-${rowIndex}`}
                soundFile={row.audio}
              />
            ) : null}
          </TableCell>
        ) : null}
        {hasPrompt ? (
          <TableCell className="text-foreground" lang={TARGET_LANG}>
            {row.prompt}
          </TableCell>
        ) : null}
        <TableCell>
          <div className="grid grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-2">
            <Input
              id={id}
              type="text"
              lang={TARGET_LANG}
              value={value}
              onChange={(event) => handleInputChange(rowIndex, event.target.value)}
              onKeyDown={(event) => handleInputKeyDown(event, rowIndex)}
              placeholder="Type your answer"
              aria-label={`Item ${rowIndex + 1}: type your answer`}
              aria-invalid={isWrong}
              className={isRight ? 'border-success' : ''}
            />
            <ResultSlot hasResult={hasResult} isCorrect={isRight} />
          </div>
          {state.hasChecked && feedback ? (
            <AnswerFeedback
              feedback={feedback}
              contentLang={TARGET_LANG}
              labels={labels}
              showKey={rowIndex === keyIndex}
            />
          ) : null}
        </TableCell>
      </TableRow>
    );
  };

  const hasInput = Object.values(state.values).some((v) => v.trim() !== '');
  const canReveal = canRevealAnswers({
    allowShowAnswers: options.allowShowAnswers,
    hasAttempted: state.hasChecked,
    total,
    nCorrect: state.nCorrect,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <Table>
          {/* Always render column headers so this stays a semantic data table (each
              row = one prompt/answer). When the LO gives no visible column labels we
              still emit sr-only headers — an unheadered table reads as a layout table. */}
          <TableHeader>
            <TableRow>
              {hasAudio ? <TableHead className="w-12 sr-only">Audio</TableHead> : null}
              {hasPrompt ? (
                <TableHead
                  className={columns ? undefined : 'sr-only'}
                  lang={columns ? TARGET_LANG : undefined}
                >
                  {columns ? columns.prompt : 'Prompt'}
                </TableHead>
              ) : null}
              <TableHead
                className={columns ? undefined : 'sr-only'}
                lang={columns ? TARGET_LANG : undefined}
              >
                {columns ? columns.answer : 'Answer'}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{rows.map((_, rowIndex) => renderRow(rowIndex))}</TableBody>
        </Table>
      </div>

      <ProgressMeter correct={countOwnCorrect(state)} total={total} labels={labels} />

      <ExerciseFooter
        onCheck={handleCheck}
        checkDisabled={!hasInput}
        onReset={handleReset}
        showReset={hasInput || state.hasChecked}
        onShowAnswers={handleShowAnswers}
        showAnswers={canReveal}
        labels={labels}
      />

      {content.footnote ? (
        <p className="text-sm text-muted-foreground" lang={TARGET_LANG}>
          {content.footnote}
        </p>
      ) : null}
    </div>
  );
}
