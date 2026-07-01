/**
 * WordSpotExercise.tsx — engine #8 of 12 (spec §2, §7). Phonetic/spelling
 * recognition: the learner reads each phrase and CLICKS the part-words that carry a
 * target feature. Correct part-words are authored inside `[brackets]`; every other
 * word is a distractor that scores a miss when clicked.
 *
 * Own scoring model (spec §7): no Check button — each click is graded live. State is
 * a single `marks` map (token key → 'hit' | 'miss'); progress, misses and completion
 * are DERIVED from it each render. Unlike french-lo-1's DOM-mutating original this is
 * fully state-driven (no querySelectorAll/classList), and every clickable part-word
 * is a real <button> so keyboard and screen-reader users get the same affordance.
 *
 * Reveal (Show-answers) follows the §5.3 rule in spirit via canRevealAnswers: offered
 * once the learner has attempted and not yet found every target; it marks all targets
 * hit. `options.shuffle`/`sampleSize` are N/A (the phrase order is the content); only
 * `allowShowAnswers` applies.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2, §5.3, §7, §8.
 */
import { useReducer } from 'react';
import { Button } from '@/components/ui/button';
import { AudioClip } from '@/components/audio/AudioClip';
import { ExerciseOptionsSchema } from '@/config/lo-schema';
import { resolveLabel } from '@/config/ui-strings';
import type { ExerciseComponentProps } from '@/exercises/lazyRegistry';
import { decodeHtmlEntities } from '../lib/html';
import { parseSentence, type TextSegment } from '../lib/parsing';
import { canRevealAnswers } from '../lib/reveal';
import { TARGET_LANG } from '@/lib/lang';
import { WordSpotExerciseConfigSchema, type WordSpotContent } from './word-spot-schema';
import './word-spot.css';

type Mark = 'hit' | 'miss';

/** One clickable part-word: its stable state key, display text, and whether it scores. */
interface ClickableToken {
  key: string;
  text: string;
  isTarget: boolean;
}

/** A rendered phrase: optional audio plus an ordered list of spans (clickable or space). */
interface RowModel {
  audio?: string;
  nodes: Array<
    { kind: 'space'; key: string; text: string } | { kind: 'token'; token: ClickableToken }
  >;
}

/** The parser segment a bracketed target yields (the only blank kind word-spot needs). */
interface TargetSegment {
  type: 'target';
  key: string;
  value: string;
}

/**
 * Build the render model + the list of all target keys, in one pass over the items.
 * Bracketed runs become target tokens; plain text is split into word tokens (misses)
 * and whitespace nodes. Keys are namespaced by row so they stay globally unique.
 */
function buildModel(content: WordSpotContent): { rows: RowModel[]; targetKeys: string[] } {
  const rows: RowModel[] = [];
  const targetKeys: string[] = [];
  let blankIndex = 0;

  content.items.forEach((item, rowIndex) => {
    const { segments, nextBlankIndex } = parseSentence<{ value: string }, TargetSegment>(
      item.text,
      {
        startBlankIndex: blankIndex,
        parseBlank: (rawInner, idx) => {
          const value = decodeHtmlEntities(rawInner.trim());
          return { meta: { value }, segment: { type: 'target', key: `t-${idx}`, value } };
        },
      },
    );
    blankIndex = nextBlankIndex;

    const nodes: RowModel['nodes'] = [];
    segments.forEach((segment) => {
      if ((segment as TargetSegment).type === 'target') {
        const target = segment as TargetSegment;
        targetKeys.push(target.key);
        nodes.push({
          kind: 'token',
          token: { key: target.key, text: target.value, isTarget: true },
        });
        return;
      }
      // A literal text run: split into words (clickable misses) and whitespace.
      const text = (segment as TextSegment).value;
      text.split(/(\s+)/).forEach((piece, pieceIndex) => {
        if (!piece) return;
        const key = `r${rowIndex}-${(segment as TextSegment).key}-${pieceIndex}`;
        if (piece.trim() === '') {
          nodes.push({ kind: 'space', key, text: piece });
        } else {
          nodes.push({ kind: 'token', token: { key, text: piece, isTarget: false } });
        }
      });
    });

    rows.push({ audio: item.audio, nodes });
  });

  return { rows, targetKeys };
}

type MarksState = Record<string, Mark>;
type MarksAction =
  | { kind: 'mark'; key: string; mark: Mark }
  | { kind: 'reveal'; targetKeys: string[] }
  | { kind: 'reset' };

function marksReducer(state: MarksState, action: MarksAction): MarksState {
  switch (action.kind) {
    case 'mark':
      if (state[action.key]) return state; // already marked — clicks are one-shot
      return { ...state, [action.key]: action.mark };
    case 'reveal': {
      const next: MarksState = { ...state };
      action.targetKeys.forEach((key) => {
        next[key] = 'hit';
      });
      return next;
    }
    case 'reset':
      return {};
    default:
      return state;
  }
}

export default function WordSpotExercise({ config }: ExerciseComponentProps) {
  const parsed = WordSpotExerciseConfigSchema.safeParse(config);
  const [marks, dispatch] = useReducer(marksReducer, {});

  if (!parsed.success) {
    return (
      <p className="text-sm text-destructive">
        Invalid <code>word-spot</code> config: {parsed.error.issues[0]?.message ?? 'parse error'}
      </p>
    );
  }

  const options = ExerciseOptionsSchema.parse(parsed.data.options ?? {});
  const labels = parsed.data.labels;
  const { rows, targetKeys } = buildModel(parsed.data.content);
  const { footnote } = parsed.data.content;

  const total = targetKeys.length;
  const targetSet = new Set(targetKeys);
  const hits = Object.entries(marks).filter(
    ([key, mark]) => mark === 'hit' && targetSet.has(key),
  ).length;
  const misses = Object.values(marks).filter((mark) => mark === 'miss').length;
  const complete = hits === total;
  const hasAttempted = hits + misses > 0;

  const canReveal = canRevealAnswers({
    allowShowAnswers: options.allowShowAnswers,
    hasAttempted,
    total,
    nCorrect: hits,
  });

  const onTokenClick = (token: ClickableToken) =>
    dispatch({ kind: 'mark', key: token.key, mark: token.isTarget ? 'hit' : 'miss' });

  return (
    <div className="word-spot">
      <ol className="word-spot-lines" aria-label="Spot the target part-words">
        {rows.map((row, rowIndex) => (
          <li className="word-spot-row" key={`row-${rowIndex}`}>
            {row.audio ? (
              <AudioClip className="super-compact-speaker" soundFile={row.audio} inline />
            ) : null}
            <p className="word-spot-line" lang={TARGET_LANG}>
              {row.nodes.map((node) =>
                node.kind === 'space' ? (
                  <span key={node.key}>{node.text}</span>
                ) : (
                  <button
                    type="button"
                    key={node.token.key}
                    className="word-spot-token"
                    data-mark={marks[node.token.key] ?? undefined}
                    aria-pressed={Boolean(marks[node.token.key])}
                    disabled={Boolean(marks[node.token.key]) || complete}
                    onClick={() => onTokenClick(node.token)}
                  >
                    {node.token.text}
                  </button>
                ),
              )}
            </p>
          </li>
        ))}
      </ol>

      <p className="word-spot-status" role="status" aria-live="polite">
        {complete
          ? resolveLabel('correct', labels)
          : `${hits} / ${total}${misses > 0 ? ` · ${misses} ✗` : ''}`}
      </p>

      {footnote ? (
        <p className="word-spot-footnote" lang={TARGET_LANG}>
          {footnote}
        </p>
      ) : null}

      <div className="word-spot-footer">
        {hasAttempted ? (
          <Button variant="outline" onClick={() => dispatch({ kind: 'reset' })}>
            {resolveLabel('reset', labels)}
          </Button>
        ) : null}
        {canReveal ? (
          <Button variant="ghost" onClick={() => dispatch({ kind: 'reveal', targetKeys })}>
            {resolveLabel('showAnswer', labels)}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
