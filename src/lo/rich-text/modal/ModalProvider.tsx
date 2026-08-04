/**
 * ModalProvider — owns the open-modal id and renders the ONE dialog for the page.
 *
 * Deliberately NOT a document-level click delegation. The carry-forward rule
 * (FUTURE_PROJECTS.md §262 item 6) prescribes a single capture-phase listener that
 * resolves `.modal-link` clicks, but that rule exists BECAUSE the reference injects
 * raw HTML, leaving React unable to own the click. We parse authored HTML into React
 * (spec R1), so the link IS a component: a global listener would be strictly worse
 * here — untyped, harder to test, and re-reading DOM attributes we already decoded.
 * The rule's intent (resolve in one place, never wire per render) is what this
 * provider preserves.
 *
 * Base UI's Dialog supplies the accessible behaviour — focus trap, Escape to close,
 * focus restored to the trigger, `role="dialog"` + `aria-modal` — so none of that is
 * re-implemented here (spec §8).
 *
 * Spec: docs/specs/lo-rich-text-modals.md §7, §8.
 */
import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RichText } from '../RichText';
import { ModalContext, type ModalContent, type ModalContextValue } from './modal-context';

interface ModalProviderProps {
  /** Every modal the LO declares, keyed by id. */
  modals: Readonly<Record<string, ModalContent>>;
  children: ReactNode;
}

/** The dialog body: one `<p>` per authored paragraph, `lang` only on the content. */
function ModalBody({ modal }: { modal: ModalContent }) {
  return (
    <div className="space-y-3" lang={modal.lang}>
      {modal.content.map((paragraph, index) => (
        // Static authored config, never reordered — index is stable.
        <p key={index}>
          <RichText nodes={paragraph} />
        </p>
      ))}
    </div>
  );
}

export function ModalProvider({ modals, children }: ModalProviderProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const open = useCallback((id: string) => setOpenId(id), []);
  const close = useCallback(() => setOpenId(null), []);

  const value = useMemo<ModalContextValue>(
    () => ({ modals, openId, open, close }),
    [modals, openId, open, close],
  );

  const openModal = openId === null ? undefined : modals[openId];

  return (
    <ModalContext.Provider value={value}>
      {children}
      {/* One host for the whole page. `DialogDescription` is required by the
          primitive's a11y contract but the body carries the prose, so it names the
          modal's purpose instead of duplicating content. */}
      <Dialog open={openModal !== undefined} onOpenChange={(next) => !next && close()}>
        {openModal !== undefined && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle lang={openModal.lang}>{openModal.title}</DialogTitle>
              <DialogDescription className="sr-only">
                Extra information about {openModal.title}
              </DialogDescription>
            </DialogHeader>
            <ModalBody modal={openModal} />
          </DialogContent>
        )}
      </Dialog>
    </ModalContext.Provider>
  );
}
