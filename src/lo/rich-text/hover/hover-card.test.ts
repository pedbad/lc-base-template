/**
 * hover-card.test.ts — the pure parts of a hover card (maintainer, 2026-10-09; TODO
 * §D17): the file tree drawn from a path, and the open/close rules. Opens on mouse
 * hover, on keyboard focus and on a tap, so keyboard and touch users get the same
 * content (WCAG 1.4.13, 2.1.1); stays open while the pointer is over it; Escape and
 * leaving focus close it.
 */
import { describe, expect, test } from 'vitest';
import { CLOSED, hoverCardReducer, pathTree } from './hover-card';

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

  test('a press (tap, click, Enter) toggles it and pins it open', () => {
    const pinned = hoverCardReducer(CLOSED, { type: 'press' });
    expect(pinned).toEqual({ isOpen: true, isPinned: true });
    // A pinned card survives the pointer leaving…
    expect(hoverCardReducer(pinned, { type: 'hoverEnd' }).isOpen).toBe(true);
    // …and a second press closes it.
    expect(hoverCardReducer(pinned, { type: 'press' })).toEqual(CLOSED);
  });

  test('Escape always closes it', () => {
    const pinned = hoverCardReducer(CLOSED, { type: 'press' });
    expect(hoverCardReducer(pinned, { type: 'escape' })).toEqual(CLOSED);
  });
});
