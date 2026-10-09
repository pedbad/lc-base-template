/**
 * progress-text.ts — the progress line's wording (ProgressMeter). Kept apart from the
 * component so the component file exports only a component (react-refresh).
 */

/** Fills `{correct}` and `{total}` in the progress wording (`progressCorrect`). */
export function progressText(template: string, correct: number, total: number): string {
  return template.replaceAll('{correct}', String(correct)).replaceAll('{total}', String(total));
}
