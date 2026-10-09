/**
 * hover-card.test.ts — the pure parts of a hover card (maintainer, 2026-10-09; TODO
 * §D17): the file tree drawn from a path, and the open/close rules. Opens on mouse
 * hover, on keyboard focus and on a tap, so keyboard and touch users get the same
 * content (WCAG 1.4.13, 2.1.1); stays open while the pointer is over it OR the term has
 * focus; Enter and Space toggle what the reader sees; Escape closes it.
 */
import { describe, expect, test } from 'vitest';
import { CLOSED, hoverCardReducer, pathTree, type HoverCardEvent } from './hover-card';

describe('pathTree', () => {
  test('draws one line per folder, the file last, each nested under the one before', () => {
    expect(pathTree('lo-config/lo-00-example/lo.json')).toEqual([
      { text: 'lo-config/', isFile: false },
      { text: '└── lo-00-example/', isFile: false },
      { text: '    └── lo.json', isFile: true },
    ]);
  });

  test('a bare file name is one line', () => {
    expect(pathTree('lo.json')).toEqual([{ text: 'lo.json', isFile: true }]);
  });

  test('a trailing slash means the last part is a folder', () => {
    expect(pathTree('public/images/').at(-1)).toEqual({ text: '└── images/', isFile: false });
  });
});

describe('hoverCardReducer', () => {
  const run = (...events: HoverCardEvent[]) => events.reduce(hoverCardReducer, CLOSED);
  const POINTER_PRESS: HoverCardEvent = { type: 'press', via: 'pointer' };
  const KEY_PRESS: HoverCardEvent = { type: 'press', via: 'keyboard' };

  test('a mouse hover opens it and leaving closes it', () => {
    const open = hoverCardReducer(CLOSED, { type: 'hoverStart' });
    expect(open.isOpen).toBe(true);
    expect(hoverCardReducer(open, { type: 'hoverEnd' }).isOpen).toBe(false);
  });

  test('keyboard focus opens it; focus leaving closes it', () => {
    const open = hoverCardReducer(CLOSED, { type: 'focus' });
    expect(open.isOpen).toBe(true);
    expect(hoverCardReducer(open, { type: 'blur' })).toEqual(CLOSED);
  });

  test('a pointer press (tap, click) toggles it and pins it open', () => {
    const pinned = hoverCardReducer(CLOSED, POINTER_PRESS);
    expect(pinned).toMatchObject({ isOpen: true, isPinned: true });
    // A pinned card survives the pointer leaving…
    expect(hoverCardReducer(pinned, { type: 'hoverEnd' }).isOpen).toBe(true);
    // …and a second press closes it.
    expect(hoverCardReducer(pinned, POINTER_PRESS).isOpen).toBe(false);
  });

  test('a tap on a card its own focus opened pins it rather than closing it', () => {
    // A tap focuses the button (Android, desktop) before its click lands.
    expect(run({ type: 'focus' }, POINTER_PRESS)).toMatchObject({ isOpen: true, isPinned: true });
    expect(run({ type: 'focus' }, POINTER_PRESS, POINTER_PRESS).isOpen).toBe(false);
  });

  test('Enter or Space toggles what the reader sees: a card focus opened closes', () => {
    expect(run({ type: 'focus' }, KEY_PRESS).isOpen).toBe(false);
    expect(run({ type: 'focus' }, KEY_PRESS, KEY_PRESS).isOpen).toBe(true);
  });

  test('while the term has focus, the pointer passing over and away leaves it open', () => {
    expect(run({ type: 'focus' }, { type: 'hoverStart' }, { type: 'hoverEnd' }).isOpen).toBe(true);
  });

  test('while the pointer rests on the term, focus leaving leaves it open', () => {
    const tabbedAway = run({ type: 'hoverStart' }, { type: 'focus' }, { type: 'blur' });
    expect(tabbedAway.isOpen).toBe(true);
    expect(hoverCardReducer(tabbedAway, { type: 'hoverEnd' }).isOpen).toBe(false);
  });

  test('Escape always closes it, and it stays closed until a trigger starts again', () => {
    expect(run(POINTER_PRESS, { type: 'escape' })).toEqual(CLOSED);
    const dismissed = run({ type: 'focus' }, { type: 'hoverStart' }, { type: 'escape' });
    expect(dismissed.isOpen).toBe(false);
    expect(hoverCardReducer(dismissed, { type: 'hoverEnd' }).isOpen).toBe(false);
    expect(hoverCardReducer(dismissed, { type: 'hoverStart' }).isOpen).toBe(true);
  });
});
