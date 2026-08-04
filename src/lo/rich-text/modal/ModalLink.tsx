/**
 * ModalLink — the inline control that opens a modal from within authored prose.
 *
 * It renders a `<button>`, NOT an `<a>`. The carry-forward Modal-Link Authoring Rule
 * mandates `href="#content"` purely so validators stop reporting a broken same-page
 * fragment — a workaround for having to be an anchor at all. Since we parse authored
 * HTML into React (spec R1) the renderer picks the element, so a real button removes
 * the problem at its source: correct role, no fake href, keyboard behaviour for free.
 * Authors keep writing the familiar `<a class="modal-link" data-modal-target="…">`.
 *
 * Spec: docs/specs/lo-rich-text-modals.md §7, §8.
 */
import type { ReactNode } from 'react';
import { useModal } from './modal-context';

interface ModalLinkProps {
  /** The modal id to open — the authored `data-modal-target`. */
  target: string;
  children: ReactNode;
}

export function ModalLink({ target, children }: ModalLinkProps) {
  const { open } = useModal();

  return (
    <button className="modal-link" onClick={() => open(target)} type="button">
      {children}
    </button>
  );
}
