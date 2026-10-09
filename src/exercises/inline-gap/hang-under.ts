/**
 * hang-under.ts — where a blank's feedback line sits (maintainer, 2026-10-09; TODO
 * §D15). Pure, so it is tested without a DOM; InlineTypedGapExercise measures and
 * applies it, and inline-gap.css does the rest.
 *
 * The line (a hint, or the revealed answer) hangs under its blank WITHOUT widening it:
 * it was 149–212px under a 62px input, and the blank's box grew to fit, so the rest of
 * the sentence jumped right while feedback showed. It now takes no width from the
 * blank and runs on under the following words, within limits:
 *   - it stays inside the row: past the row end it moves back, and wider than the row
 *     it wraps to the row width;
 *   - on a text line with more than one wrong blank, each line ends short of the next
 *     blank's line, and a later line never moves back under an earlier one — it
 *     wraps instead.
 */

/** Space kept between two feedback lines side by side. */
export const HANG_GAP_PX = 8;
/** Two lines whose tops differ by less than this share a text line. */
const SAME_LINE_PX = 4;

export interface Hang {
  /** Left edge of the line as laid out unplaced, at its natural (capped) width. */
  readonly start: number;
  readonly width: number;
  readonly top: number;
}

export interface RowBounds {
  readonly start: number;
  readonly end: number;
}

export interface HangPlacement {
  /** The width to wrap at. */
  readonly width: number;
  /** How far to move it back toward the row start (only ever to stay inside the row). */
  readonly shift: number;
}

export function placeHangs(hangs: readonly Hang[], row: RowBounds): HangPlacement[] {
  const onSameLine = (a: Hang, b: Hang) => Math.abs(a.top - b.top) < SAME_LINE_PX;
  return hangs.map((hang) => {
    const neighbours = hangs.filter((other) => other !== hang && onSameLine(other, hang));
    const laterStarts = neighbours.filter((o) => o.start > hang.start).map((o) => o.start);
    // A later line on this text line: start under the blank and wrap short of it.
    if (laterStarts.length > 0) {
      const high = Math.min(...laterStarts) - HANG_GAP_PX;
      return { width: Math.min(hang.width, high - hang.start), shift: 0 };
    }
    // Last on its text line: run to the row end, moving back only to stay inside it,
    // and never back under an earlier line.
    const hasEarlier = neighbours.some((other) => other.start < hang.start);
    const low = hasEarlier ? hang.start : row.start;
    const width = Math.min(hang.width, row.end - low);
    return { width, shift: Math.max(0, hang.start + width - row.end) };
  });
}
