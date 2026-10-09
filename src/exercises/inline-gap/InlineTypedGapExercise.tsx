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
 *   - On Check, each filled blank is graded; a wrong one gets <AnswerFeedback> below
 *     its input — a hint naming the error first, the answer on the second wrong Check
 *     (answer-feedback.ts, TODO §D15). It hangs under the blank without widening it,
 *     so the sentence does not move (inline-gap.css, useHangUnder, hang-under.ts).
 *   - shared shell: ExerciseFooter (Check/Reset/Show-answers) + ResultSlot (per-row
 *     tick/cross). canRevealAnswers gates Show-answers (spec §5.3). Reset clears all.
 *   - chrome text via resolveLabel(key, labels) (ui-strings §9).
 *
 * `options.shuffle`/`sampleSize` are N/A for a typed cloze (no choices; prose order
 * is meaningful) — only `allowShowAnswers` applies. Per-row audio is rendered via
 * useRowAudio: an independent click-to-play clip per row, or — when
 * `content.useSequenceAudioController` is set — one master SequenceAudioController
 * playing every clip as a playlist with each row's speaker driven by it.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2, §5, §7, §8.
 */
import { useId, useReducer, useRef, type KeyboardEvent, type ReactNode } from 'react';

import { Input } from '@/components/ui/input';
import AudioManager from '@/audio/AudioManager';
import { AudioClip } from '@/components/audio/AudioClip';
import { CircularAudioProgressAnimatedSpeakerDisplay } from '@/components/audio/CircularAudioProgressAnimatedSpeakerDisplay';
import {
  SequenceAudioController,
  type SequenceAudioControllerHandle,
} from '@/components/audio/SequenceAudioController';
import { ExerciseOptionsSchema, type ExerciseOptions } from '@/config/lo-schema';
import type { UiStringsOverride } from '@/config/ui-strings';
import { AnswerFeedback } from '@/exercises/lib/AnswerFeedback';
import {
  firstMarkedReveal,
  type AnswerFeedback as Feedback,
} from '@/exercises/lib/answer-feedback';
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
import { createExerciseReducer } from '@/exercises/lib/exerciseScaffold';
import { ProgressMeter } from '@/exercises/lib/ProgressMeter';
import type { ExerciseComponentProps } from '@/exercises/lazyRegistry';
import { TARGET_LANG } from '@/lib/lang';
import { InlineGapExerciseConfigSchema, type InlineGapItem } from './inline-gap-schema';
import { fillInlineGapAnswers, gradeInlineGap } from './inline-gap-grading';
import { useHangUnder } from './useHangUnder';
import { useRowAudio } from './useRowAudio';
import './inline-gap.css';

interface InlineGapState extends ScoringState {
  /** blankIndex → typed text. */
  values: Record<number, string>;
  /** blankIndex → the hint or revealed answer under a wrong answer (answer-feedback). */
  feedback: Record<number, Feedback>;
  /** blankIndex → wrong Checks so far: the first gets a hint, the second the answer. */
  misses: Record<number, number>;
}

/** Shared merge reducer (partial/function patch); answer fields are interdependent. */
const reducer = createExerciseReducer<InlineGapState>();

const buildState = (): InlineGapState => ({
  ...getInitialScoringState(),
  values: {},
  feedback: {},
  misses: {},
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
  const sequenceRef = useRef<SequenceAudioControllerHandle | null>(null);
  const audio = useRowAudio(items, sequenceRef);
  const rootRef = useRef<HTMLDivElement>(null);
  useHangUnder(rootRef, state.feedback);

  const inputId = (blankIndex: number) => `${uid}-gap-${blankIndex}`;

  const handleInputChange = (blankIndex: number, value: string) => {
    dispatch((prev) => {
      const values = { ...prev.values, [blankIndex]: value };
      if (!prev.hasChecked) return { values };
      // Editing a blank after checking clears its old verdict + feedback.
      const checkedResults = { ...prev.checkedResults };
      const feedback = { ...prev.feedback };
      delete checkedResults[blankIndex];
      delete feedback[blankIndex];
      return { values, feedback, ...commitCheck(checkedResults) };
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
    audio.reset();
    dispatch(buildState());
  };

  if (!parsed.success) {
    return (
      <p className="text-sm text-destructive">
        Invalid <code>inline-gap</code> config: {parsed.error.issues[0]?.message ?? 'parse error'}
      </p>
    );
  }

  const {
    useSequenceAudioController = false,
    listenDescriptionText,
    soundFile,
  } = parsed.data.content;
  // Master playlist only when it's switched on AND a row actually carries audio.
  const useMaster = useSequenceAudioController && audio.playlist.length > 0;

  // A row's audio control: in master mode a display driven by the controller (click
  // plays that track); otherwise an independent click-to-play clip.
  const renderRowAudio = (rowIndex: number, item: InlineGapItem): ReactNode => {
    if (!item.audio) return null;
    if (useMaster) {
      const isActive = audio.activeRowIndex === rowIndex;
      const prog = audio.rowProgress[rowIndex] ?? { currentTime: 0, duration: 0 };
      const status = isActive && audio.masterPlayState === 'playing' ? 'playing' : 'stopped';
      return (
        <span className="mr-4 inline-flex -translate-y-px align-middle">
          <CircularAudioProgressAnimatedSpeakerDisplay
            status={status}
            progress={prog.currentTime}
            duration={prog.duration}
            handleClick={() => audio.playRow(rowIndex)}
            title={isActive ? 'Click to pause' : 'Click to play'}
          />
        </span>
      );
    }
    return (
      <span className="mr-4 inline-flex -translate-y-px align-middle">
        <AudioClip
          className="super-compact-speaker"
          id={`${uid}-audio-${rowIndex}`}
          soundFile={item.audio}
          onStatusChange={(status) => audio.setRowStatus(rowIndex, status)}
        />
      </span>
    );
  };

  const renderInput = (blankIndex: number, blanksMeta: InputMeta[]): ReactNode => {
    const meta = blanksMeta[blankIndex];
    const value = state.values[blankIndex] ?? '';
    const result = state.checkedResults[blankIndex];
    const feedback = state.feedback[blankIndex];
    const isWrong = state.hasChecked && result === false;
    const isRight = state.hasChecked && result === true;
    const id = inputId(blankIndex);

    return (
      // `gap-blank` (inline-gap.css): sits on the sentence's baseline.
      <span className="gap-blank mx-1 inline-flex flex-col" key={id}>
        <label className="sr-only" htmlFor={id}>{`Answer for blank ${blankIndex + 1}`}</label>
        <Input
          id={id}
          type="text"
          lang={TARGET_LANG}
          value={value}
          onChange={(event) => handleInputChange(blankIndex, event.target.value)}
          onKeyDown={(event) => handleInputKeyDown(event, blankIndex)}
          placeholder={meta?.placeholder || 'Type…'}
          aria-invalid={isWrong}
          className={`inline-flex h-9 cursor-text transition-colors hover:border-primary/60 hover:bg-muted/40 ${isRight ? 'border-success' : ''}`}
          style={{ width: `${meta?.widthCh ?? 8}ch`, maxWidth: '100%' }}
        />
        {state.hasChecked && feedback ? (
          // Hangs under the blank without widening it (inline-gap.css, useHangUnder).
          <span className="gap-hang">
            <AnswerFeedback
              feedback={feedback}
              contentLang={TARGET_LANG}
              labels={labels}
              showKey={blankIndex === firstMarkedReveal(state.feedback)}
            />
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
        <span key={(segment as TextSegment).key} lang={TARGET_LANG}>
          {(segment as TextSegment).value}
        </span>
      ),
    );

    rows.push(
      <div
        key={`row-${i}`}
        className="rounded-lg border border-border/70 bg-card px-4 py-3 leading-loose"
      >
        {item.prompt ? (
          <p className="mb-2 text-sm text-muted-foreground" lang={TARGET_LANG}>
            {item.prompt}
          </p>
        ) : null}
        <div className="grid grid-cols-[minmax(0,1fr)_2.5rem] items-start gap-2">
          <span className="min-w-0 leading-loose text-foreground" data-gap-row>
            {renderRowAudio(i, item)}
            {nodes}
          </span>
          {renderResultSlot(rowBlankIndices)}
        </div>
      </div>,
    );
  }

  const nToSolve = blankCursor;

  const handleCheck = () => {
    const { checkedResults, feedback, misses } = gradeInlineGap(
      blanksMeta,
      state.values,
      nToSolve,
      state.misses,
      options.caseSensitive,
    );
    dispatch({ ...commitCheck(checkedResults), feedback, misses });
  };

  const handleShowAnswers = () => {
    const { values, checkedResults } = fillInlineGapAnswers(blanksMeta, nToSolve);
    dispatch({ values, ...commitCheck(checkedResults), feedback: {} });
  };

  const hasInput = Object.values(state.values).some((v) => v.trim() !== '');
  const canReveal = canRevealAnswers({
    allowShowAnswers: options.allowShowAnswers,
    hasAttempted: state.hasChecked,
    total: nToSolve,
    nCorrect: state.nCorrect,
  });

  return (
    <div ref={rootRef} className="flex flex-col gap-4">
      {useMaster ? (
        <SequenceAudioController
          ref={sequenceRef}
          sources={audio.playlist.map((entry) => entry.src)}
          pauseSeconds={0.4}
          onPlayStateChange={audio.onMasterPlayStateChange}
          onTrackChange={audio.onMasterTrackChange}
          onStopped={audio.onMasterStopped}
          onTimeUpdate={audio.onMasterTimeUpdate}
        />
      ) : null}

      {listenDescriptionText && soundFile ? (
        // Custom click-to-play speaker (AudioManager plays a *detached* `new Audio()`,
        // never a DOM <audio> element) + a plain label. Matches every other clip in the
        // app and the french LOs: no native <audio controls> in the DOM means nothing for
        // WAVE's "HTML5 video or audio" check to flag. The label is a sibling, not a
        // <label for>, since the speaker is a <button>, not a labelable form control.
        <p className="flex items-center gap-2 text-foreground">
          <AudioClip className="super-compact-speaker" id={`${uid}-listen`} soundFile={soundFile} />
          <span lang={TARGET_LANG}>{listenDescriptionText}</span>
        </p>
      ) : null}

      <div className="space-y-3">{rows}</div>

      <ProgressMeter correct={state.nCorrect} total={nToSolve} labels={labels} />

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
        <p className="text-sm text-muted-foreground" lang={TARGET_LANG}>
          {parsed.data.content.footnote}
        </p>
      ) : null}
    </div>
  );
}
