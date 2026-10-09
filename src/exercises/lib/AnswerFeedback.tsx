/**
 * AnswerFeedback — the line under a wrong typed answer (TODO §D15, maintainer
 * 2026-10-08). The data comes from answer-feedback.ts:
 *   - hint:   an icon and one sentence naming the kind of error, in the UI language.
 *             The answer is NOT shown: the learner tries again first.
 *   - reveal: "Answer:" and the answer in the course language (`lang`), the part that
 *             differs from the attempt in a <mark> (answer-feedback.css: bold, underlined,
 *             tinted). The marking is also said in words (sr-only), and the visible
 *             key shows once per exercise (`showKey`).
 * Replaces the interleaved character diff (TextDiff), which read as one garbled word.
 */
import { Eye, Lightbulb, RotateCcw } from 'lucide-react';
import { resolveLabel, type UiStringKey, type UiStringsOverride } from '@/config/ui-strings';
import type { AnswerFeedback as Feedback, MissReason } from './answer-feedback';
import './answer-feedback.css';

const HINT_LABEL: Record<MissReason, UiStringKey> = {
  accent: 'hintAccent',
  ending: 'hintEnding',
  missing: 'hintMissing',
  close: 'hintClose',
  far: 'hintFar',
};

interface AnswerFeedbackProps {
  feedback: Feedback;
  /** `lang` of the revealed answer (the course language). */
  contentLang: string;
  /** Show the one-line key under this reveal (the first marked one in an exercise). */
  showKey?: boolean;
  /** The exercise's own wording, if it overrides any of the messages. */
  labels?: UiStringsOverride;
}

const LINE = 'mt-1 flex items-start gap-2 text-sm text-foreground';
const ICON = 'mt-0.5 size-4 shrink-0';

export function AnswerFeedback({ feedback, contentLang, showKey, labels }: AnswerFeedbackProps) {
  if (feedback.kind === 'hint') {
    const Icon = feedback.reason === 'far' ? RotateCcw : Lightbulb;
    return (
      <span className={LINE}>
        <Icon className={`${ICON} text-muted-foreground`} aria-hidden="true" />
        <span>{resolveLabel(HINT_LABEL[feedback.reason], labels)}</span>
      </span>
    );
  }

  const marked = feedback.segments.filter((segment) => segment.differs);
  const key = resolveLabel('answerKey', labels);
  return (
    <span className="mt-1 flex flex-col">
      <span className={LINE}>
        <Eye className={`${ICON} text-muted-foreground`} aria-hidden="true" />
        <span>
          {resolveLabel('answerLabel', labels)}{' '}
          <span lang={contentLang} className="font-medium">
            {feedback.segments.map((segment, index) =>
              segment.differs ? (
                <mark key={index} className="answer-diff">
                  {segment.text}
                </mark>
              ) : (
                segment.text
              ),
            )}
          </span>
          {marked.length > 0 ? (
            <span className="sr-only">{` (${key}: ${marked.map((s) => s.text).join(', ')})`}</span>
          ) : null}
        </span>
      </span>
      {showKey && marked.length > 0 ? (
        <span className="ms-6 text-xs text-muted-foreground" aria-hidden="true">
          {key}
        </span>
      ) : null}
    </span>
  );
}
