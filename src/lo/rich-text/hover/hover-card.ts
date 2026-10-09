/**
 * hover-card.ts — the pure parts of a hover card (maintainer, 2026-10-09; TODO §D17):
 * the folder tree drawn from a path, and the open/close rules. View-free, so both are
 * unit-tested without a DOM; HoverTerm.tsx is thin wiring over them.
 *
 * OPEN/CLOSE (WCAG 1.4.13 content on hover or focus, 2.1.1 keyboard): a mouse hover
 * opens it and keyboard focus opens it, and it stays open while EITHER trigger remains
 * — the pointer crossing a focused term does not close it, nor does Tab with the
 * pointer still resting on it (leaving is delayed in HoverTerm, so the pointer can
 * cross into the card). A pointer press (tap, click) toggles it and PINS it open, so a
 * touch user can read it without a hover; a tap's own focus opens it first, so the tap
 * pins rather than closes. Enter and Space toggle what the reader sees: on a card focus
 * opened, they close it (the disclosure pattern). Escape always closes it, and it stays
 * closed until a trigger starts again.
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
  /** Opened by a press: stays open when the pointer and focus leave, until pressed again. */
  readonly isPinned: boolean;
  readonly isHovered: boolean;
  readonly isFocused: boolean;
}

export type HoverCardEvent =
  | { readonly type: 'hoverStart' }
  | { readonly type: 'hoverEnd' }
  | { readonly type: 'focus' }
  | { readonly type: 'blur' }
  | { readonly type: 'press'; readonly via: 'pointer' | 'keyboard' }
  | { readonly type: 'escape' };

export const CLOSED: HoverCardState = {
  isOpen: false,
  isPinned: false,
  isHovered: false,
  isFocused: false,
};
/** Open and pinned, no trigger held: the debug pages' `defaultOpen`. */
export const PINNED: HoverCardState = { ...CLOSED, isOpen: true, isPinned: true };

export function hoverCardReducer(state: HoverCardState, event: HoverCardEvent): HoverCardState {
  switch (event.type) {
    case 'hoverStart':
      return { ...state, isHovered: true, isOpen: true };
    case 'focus':
      return { ...state, isFocused: true, isOpen: true };
    case 'hoverEnd':
      return {
        ...state,
        isHovered: false,
        isOpen: state.isOpen && (state.isPinned || state.isFocused),
      };
    case 'blur':
      return {
        ...state,
        isFocused: false,
        isPinned: false,
        isOpen: state.isOpen && state.isHovered,
      };
    case 'press': {
      const isClosing = event.via === 'keyboard' ? state.isOpen : state.isPinned;
      return isClosing
        ? { ...state, isOpen: false, isPinned: false }
        : { ...state, isOpen: true, isPinned: true };
    }
    case 'escape':
      return { ...state, isOpen: false, isPinned: false };
  }
}
