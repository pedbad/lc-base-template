/**
 * useHangUnder — places each blank's feedback line (maintainer, 2026-10-09; TODO §D15).
 * Thin DOM wiring over hang-under.ts: per row (`data-gap-row`), measure every line at
 * its natural width, then set `--gap-hang-max` / `--gap-hang-offset` (inline-gap.css)
 * where placeHangs narrows or moves one. Runs after every Check and again when the
 * exercise's width changes; a height-only resize is its own doing and is skipped, so
 * the observer cannot loop. Feedback exists only after a Check, so nothing here
 * touches the prerendered markup.
 */
import { useLayoutEffect, type RefObject } from 'react';
import { placeHangs } from './hang-under';

function placeRow(row: HTMLElement): void {
  const lines = [...row.querySelectorAll<HTMLElement>('.gap-hang > *')];
  if (lines.length === 0) return;
  for (const line of lines) {
    line.style.removeProperty('--gap-hang-max');
    line.style.removeProperty('--gap-hang-offset');
  }
  const bounds = row.getBoundingClientRect();
  const hangs = lines.map((line) => {
    const rect = line.getBoundingClientRect();
    return { start: rect.left, width: rect.width, top: rect.top };
  });
  placeHangs(hangs, { start: bounds.left, end: bounds.right }).forEach((placement, index) => {
    const line = lines[index];
    if (placement.width < hangs[index].width) {
      line.style.setProperty('--gap-hang-max', `${placement.width}px`);
    }
    if (placement.shift > 0) line.style.setProperty('--gap-hang-offset', `-${placement.shift}px`);
  });
}

/** Re-places the feedback lines under `rootRef` whenever `feedback` changes. */
export function useHangUnder(rootRef: RefObject<HTMLElement | null>, feedback: unknown): void {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const place = () => root.querySelectorAll<HTMLElement>('[data-gap-row]').forEach(placeRow);
    place();
    if (typeof ResizeObserver === 'undefined') return;
    let lastWidth = root.getBoundingClientRect().width;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === lastWidth) return;
      lastWidth = entry.contentRect.width;
      place();
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [rootRef, feedback]);
}
