/**
 * TextEntryRuntime.tsx — shared runtime for the typed-response table engines
 * (typed-transform #5, dictation #6; spec §9). Renders a table of rows: optional
 * audio + optional prompt cue + a typed-answer Input with a per-row verdict and a
 * character diff under it. Each engine is a thin wrapper that passes its
 * `comparisonMode`; the only behavioural difference is how answers are normalized.
 *
 * Ported from french-lo-1's TextEntryExerciseRuntime, typed and trimmed:
 *   - phrases tuples → typed `rows` objects (text-entry-schema).
 *   - grading via the M1 answer helpers (strict = normalizeAnswer, dictation =
 *     normalizeForDictation) instead of raw trim-equality.
 *   - diff via diffChars → <TextDiff> (React nodes, no innerHTML / DOMPurify).
 *   - per-row audio via <AudioClip> (independent click-to-play); no master player.
 *   - shared ExerciseFooter + ResultSlot; canRevealAnswers gates Show-answers.
 *   - dropped (YAGNI): htmlContent, Mars/Venus gender-icon header heuristics,
 *     prompt-click delegation, ProgressDots.
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
import { resolveLabel, type UiStringsOverride } from '@/config/ui-strings';
import { type DiffPart } from '@/exercises/lib/charDiff';
import { TextDiff } from '@/exercises/lib/TextDiff';
import { canRevealAnswers } from '@/exercises/lib/reveal';
import { commitCheck, getInitialScoringState, type ScoringState } from '@/exercises/lib/scoring';
import { ExerciseFooter } from '@/exercises/lib/ExerciseFooter';
import { ResultSlot } from '@/exercises/lib/ResultSlot';
import { createExerciseReducer } from '@/exercises/lib/exerciseScaffold';
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
  /** rowIndex → character diff parts (filled on Check / Show-answers). */
  diffs: Record<number, DiffPart[]>;
}

/** Shared merge reducer (partial/function patch); answer fields are interdependent. */
const reducer = createExerciseReducer<TextEntryState>();

const buildState = (): TextEntryState => ({
  ...getInitialScoringState(),
  values: {},
  diffs: {},
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
      const diffs = { ...prev.diffs };
      delete checkedResults[rowIndex];
      delete diffs[rowIndex];
      return { values, diffs, ...commitCheck(checkedResults) };
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
    const { checkedResults, diffs } = gradeTextEntry(rows, state.values, comparisonMode);
    dispatch({ ...commitCheck(checkedResults), diffs });
  };

  const handleShowAnswers = () => {
    const { values, checkedResults, diffs } = fillAnswers(rows, comparisonMode);
    dispatch({ values, ...commitCheck(checkedResults), diffs });
  };

  const handleReset = () => {
    AudioManager.stopAll();
    dispatch(buildState());
  };

  const renderRow = (rowIndex: number): ReactNode => {
    const row = rows[rowIndex];
    const value = state.values[rowIndex] ?? '';
    const result = state.checkedResults[rowIndex];
    const diff = state.diffs[rowIndex];
    const isWrong = state.hasChecked && result === false;
    const isRight = state.hasChecked && result === true;
    const hasResult = state.hasChecked && typeof result === 'boolean';
    const id = answerId(rowIndex);

    return (
      <TableRow key={`row-${rowIndex}`}>
        {hasAudio ? (
          <TableCell className="w-12 align-top">
            {row.audio ? (
              <AudioClip
                className="super-compact-speaker"
                id={`${uid}-audio-${rowIndex}`}
                soundFile={row.audio}
              />
            ) : null}
          </TableCell>
        ) : null}
        {hasPrompt ? (
          <TableCell className="align-top text-foreground" lang={TARGET_LANG}>
            {row.prompt}
          </TableCell>
        ) : null}
        <TableCell className="align-top">
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
          {state.hasChecked && diff ? (
            <div className="mt-1.5" lang={TARGET_LANG}>
              <TextDiff parts={diff} />
            </div>
          ) : null}
        </TableCell>
      </TableRow>
    );
  };

  const hasInput = Object.values(state.values).some((v) => v.trim() !== '');
  const allCorrect = state.hasChecked && total > 0 && state.nCorrect === total;
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

      {state.hasChecked ? (
        <p
          className={`text-sm font-medium ${allCorrect ? 'text-success' : 'text-muted-foreground'}`}
          role="status"
        >
          {allCorrect ? resolveLabel('correct', labels) : `${state.nCorrect} / ${total}`}
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

      {content.footnote ? (
        <p className="text-sm text-muted-foreground" lang={TARGET_LANG}>
          {content.footnote}
        </p>
      ) : null}
    </div>
  );
}
