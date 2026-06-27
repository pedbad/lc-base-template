/**
 * LineMatchExercise.tsx — engine #7 of 12 (spec §2, §8). The learner matches each
 * picture to its word. Scoring family: blank-grading (one match per picture).
 *
 * Ported from french-lo-1's LineMatch in two milestones:
 *   - 7a (this file, now): the responsive picture + <Select> dropdown layout —
 *     each picture row picks its matching word. Fully keyboard-accessible and
 *     verifiable. Seeded shuffle (mulberry32): the word bank is always shuffled
 *     (the matching IS the exercise) and Reset re-shuffles via a bumped seed.
 *   - 7b (next): the desktop SVG connector-line layout (click picture-dot →
 *     word-dot draws a curved line; wrong lines recoil) layered on top, chosen by
 *     viewport. The grading + state here are shared by both.
 *
 * A match is correct when the word picked for a picture has the same key as that
 * picture (each item is one picture and one word; `lineMatchItemKey` pairs them).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2, §5, §7, §8.
 */
import { useId, useReducer, type ReactNode } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AudioClip } from '@/components/audio/AudioClip';
import { ExerciseOptionsSchema, type ExerciseOptions } from '@/config/lo-schema';
import { resolveLabel, type UiStringsOverride } from '@/config/ui-strings';
import { canRevealAnswers } from '@/exercises/lib/reveal';
import { commitCheck, getInitialScoringState, type ScoringState } from '@/exercises/lib/scoring';
import { mulberry32, sampleN, shuffle } from '@/exercises/lib/shuffle';
import { ExerciseFooter } from '@/exercises/lib/ExerciseFooter';
import { ResultSlot } from '@/exercises/lib/ResultSlot';
import { resolveAsset } from '@/lib/assets';
import type { ExerciseComponentProps } from '@/exercises/lazyRegistry';
import {
  LineMatchExerciseConfigSchema,
  lineMatchItemKey,
  type LineMatchItem,
} from './line-match-schema';

interface LineMatchState extends ScoringState {
  /** The pictures shown this round (sampled + ordered). */
  sampledItems: LineMatchItem[];
  /** The shuffled word options. */
  wordBank: LineMatchItem[];
  /** pictureKey → selected word key. */
  values: Record<string, string>;
  /** RNG seed; bumped on Reset to re-sample + re-shuffle. */
  seed: number;
}

type LineMatchPatch =
  | Partial<LineMatchState>
  | ((state: LineMatchState) => Partial<LineMatchState>);

const reducer = (state: LineMatchState, patch: LineMatchPatch): LineMatchState => ({
  ...state,
  ...(typeof patch === 'function' ? patch(state) : patch),
});

const buildRound = (
  items: readonly LineMatchItem[],
  sampleSize: number | undefined,
  seed: number,
): LineMatchState => {
  const rng = mulberry32(seed);
  const sampledItems = sampleN(items, sampleSize ?? items.length, rng);
  return {
    ...getInitialScoringState(),
    sampledItems,
    wordBank: shuffle(sampledItems, rng),
    values: {},
    seed,
  };
};

/** FNV-1a hash → a stable numeric seed from the component's useId. */
const seedFromId = (id: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export default function LineMatchExercise({ config }: ExerciseComponentProps) {
  const uid = useId();

  const parsed = LineMatchExerciseConfigSchema.safeParse(config);
  const items: readonly LineMatchItem[] = parsed.success ? parsed.data.content.items : [];
  const labels: UiStringsOverride | undefined = parsed.success ? parsed.data.labels : undefined;
  const options: ExerciseOptions = ExerciseOptionsSchema.parse(
    parsed.success ? (parsed.data.options ?? {}) : {},
  );

  const [state, dispatch] = useReducer(reducer, undefined, () =>
    buildRound(items, options.sampleSize, seedFromId(uid)),
  );

  const handleSelectChange = (pictureKey: string, wordKey: string) => {
    dispatch((prev) => {
      const values = { ...prev.values, [pictureKey]: wordKey };
      if (!prev.hasChecked) return { values };
      const checkedResults = { ...prev.checkedResults };
      delete checkedResults[pictureKey];
      return { values, ...commitCheck(checkedResults) };
    });
  };

  const handleReset = () => {
    dispatch((prev) => buildRound(items, options.sampleSize, prev.seed + 1));
  };

  const handleCheck = () => {
    const checkedResults: Record<string, boolean> = {};
    for (const item of state.sampledItems) {
      const key = lineMatchItemKey(item);
      const picked = state.values[key];
      if (!picked) continue; // grade only answered pictures
      checkedResults[key] = picked === key; // matched its own word
    }
    dispatch(commitCheck(checkedResults));
  };

  const handleShowAnswers = () => {
    const values: Record<string, string> = {};
    const checkedResults: Record<string, boolean> = {};
    for (const item of state.sampledItems) {
      const key = lineMatchItemKey(item);
      values[key] = key;
      checkedResults[key] = true;
    }
    dispatch({ values, ...commitCheck(checkedResults) });
  };

  if (!parsed.success) {
    return (
      <p className="text-sm text-destructive">
        Invalid <code>line-match</code> config: {parsed.error.issues[0]?.message ?? 'parse error'}
      </p>
    );
  }

  // Selected value is a word KEY; the trigger must show that word's label, not the key.
  const wordLabel = (wordKey: string): string =>
    state.wordBank.find((option) => lineMatchItemKey(option) === wordKey)?.label ?? '';

  const renderRow = (item: LineMatchItem): ReactNode => {
    const key = lineMatchItemKey(item);
    const picked = state.values[key] ?? '';
    const result = state.checkedResults[key];
    const hasResult = state.hasChecked && typeof result === 'boolean';
    const isCorrect = result === true;
    const selectId = `${uid}-match-${key}`;

    return (
      <li
        className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3"
        key={`line-match-row-${key}`}
      >
        {item.audio ? (
          <AudioClip
            className="super-compact-speaker"
            id={`${uid}-audio-${key}`}
            soundFile={item.audio}
          />
        ) : null}
        <img
          alt={item.alt ?? item.localLanguage ?? ''}
          className="aspect-square w-16 shrink-0 rounded-lg border border-border bg-background object-contain p-1"
          loading="lazy"
          src={resolveAsset(item.image)}
        />
        <div className="min-w-0 flex-1">
          <label
            className="sr-only"
            htmlFor={selectId}
          >{`Word matching picture: ${item.localLanguage ?? key}`}</label>
          <Select value={picked} onValueChange={(next) => handleSelectChange(key, next ?? '')}>
            <SelectTrigger id={selectId} className="w-full">
              <SelectValue placeholder="Choose the matching word">
                {(value) => (value ? wordLabel(String(value)) : null)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {state.wordBank.map((option) => {
                const optionKey = lineMatchItemKey(option);
                return (
                  <SelectItem key={`${selectId}-${optionKey}`} value={optionKey}>
                    {option.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <ResultSlot hasResult={hasResult} isCorrect={isCorrect} />
      </li>
    );
  };

  const total = state.sampledItems.length;
  const answeredCount = Object.keys(state.values).length;
  const allCorrect = state.hasChecked && total > 0 && state.nCorrect === total;
  const canReveal = canRevealAnswers({
    allowShowAnswers: options.allowShowAnswers,
    hasAttempted: state.hasChecked,
    total,
    nCorrect: state.nCorrect,
  });

  return (
    <div className="flex flex-col gap-4">
      <ol className="space-y-3">{state.sampledItems.map((item) => renderRow(item))}</ol>

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
        checkDisabled={answeredCount === 0}
        onReset={handleReset}
        showReset={answeredCount > 0 || state.hasChecked}
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
