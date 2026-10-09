/**
 * hover-card.ts — the pure parts of a hover card (maintainer, 2026-10-09; TODO §D17):
 * the folder tree drawn from a path, and the open/close rules. View-free, so both are
 * unit-tested without a DOM; HoverTerm.tsx is thin wiring over them.
 *
 * OPEN/CLOSE (WCAG 1.4.13 content on hover or focus, 2.1.1 keyboard): a mouse hover
 * opens it and leaving closes it (after a short delay, so the pointer can cross into
 * the card); keyboard focus opens it and focus leaving closes it; a press (tap, click,
 * Enter, Space) toggles it and PINS it open, so a touch user can read it without a
 * hover; Escape always closes it.
 */

/** One drawn line of a path's folder tree. */
export interface TreeLine {
  readonly text: string;
  readonly isFile: boolean;
}

const BRANCH = '└── ';
const INDENT = '    ';

/**
 * `lo-config/lo-00-example/lo.json` → `lo-config/`, `└── lo-00-example/`,
 * `    └── lo.json`. Folders keep their trailing slash; a path ending in `/` names a
 * folder, so nothing in it is marked as the file.
 */
export function pathTree(path: string): readonly TreeLine[] {
  const isFolderPath = path.endsWith('/');
  const parts = path.split('/').filter((part) => part !== '');
  return parts.map((part, depth) => {
    const isFile = depth === parts.length - 1 && !isFolderPath;
    const prefix = depth === 0 ? '' : `${INDENT.repeat(depth - 1)}${BRANCH}`;
    return { text: `${prefix}${part}${isFile ? '' : '/'}`, isFile };
  });
}

export interface HoverCardState {
  readonly isOpen: boolean;
  /** Opened by a press: stays open when the pointer leaves, until pressed again. */
  readonly isPinned: boolean;
}

export type HoverCardEvent =
  | { readonly type: 'hoverStart' }
  | { readonly type: 'hoverEnd' }
  | { readonly type: 'focus' }
  | { readonly type: 'blur' }
  | { readonly type: 'press' }
  | { readonly type: 'escape' };

export const CLOSED: HoverCardState = { isOpen: false, isPinned: false };
const PINNED: HoverCardState = { isOpen: true, isPinned: true };

export function hoverCardReducer(state: HoverCardState, event: HoverCardEvent): HoverCardState {
  switch (event.type) {
    case 'hoverStart':
    case 'focus':
      return state.isOpen ? state : { isOpen: true, isPinned: false };
    case 'hoverEnd':
      return state.isPinned ? state : CLOSED;
    case 'press':
      return state.isPinned ? CLOSED : PINNED;
    case 'blur':
    case 'escape':
      return CLOSED;
  }
}
