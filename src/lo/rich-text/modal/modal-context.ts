/**
 * modal-context.ts — the single place that holds "which modal is open".
 *
 * Context rather than prop-drilling, and ONE open id rather than per-link state, per
 * the carry-forward Component Rendering Architecture rule #3 (modal/dialog state
 * belongs in context). The consequence that matters: a modal linked from three places
 * renders one dialog, not three.
 *
 * No JSX here on purpose — this module is imported by both `ModalLink` and
 * `ModalHost`, and keeping it a `.ts` file avoids the react-refresh lint rule that
 * fires when a `.tsx` module exports non-components.
 *
 * Spec: docs/specs/lo-rich-text-modals.md §7.
 */
import { createContext, useContext } from 'react';
import type { RichTextNode } from '../rich-text-nodes';

/** One modal's assembled content: rich text already parsed, never a raw string. */
export interface ModalContent {
  /** The declared modal id, which `data-modal-target` refers to. */
  readonly id: string;
  /** The dialog's accessible name. Required, so a dialog can never be nameless. */
  readonly title: string;
  /** One entry per paragraph, each a readonly node list. */
  readonly content: readonly (readonly RichTextNode[])[];
  /** Set when the body is target-language content (WCAG 3.1.2). */
  readonly lang?: string;
}

export interface ModalContextValue {
  /** Every modal this LO declares, keyed by id. */
  readonly modals: Readonly<Record<string, ModalContent>>;
  /** The open modal's id, or `null` when the dialog is closed. */
  readonly openId: string | null;
  readonly open: (id: string) => void;
  readonly close: () => void;
}

export const ModalContext = createContext<ModalContextValue | null>(null);

/**
 * Read the modal context.
 *
 * @throws Error when used outside a `ModalProvider` — a modal link with nothing to
 * open is a wiring bug, and failing loudly beats rendering a dead button.
 */
export function useModal(): ModalContextValue {
  const value = useContext(ModalContext);
  if (value === null) {
    throw new Error('useModal must be used inside a <ModalProvider>');
  }
  return value;
}
