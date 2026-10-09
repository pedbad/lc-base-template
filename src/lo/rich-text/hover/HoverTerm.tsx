/**
 * HoverTerm — a term with more to say (maintainer, 2026-10-09; TODO §D17). Authored as
 * `<span class="hover-term" data-hover-target="id">…</span>` in any rich text; the card
 * is `hovers/<id>/hover.json`. One class, `.hover-term`, styles every term the same
 * way (rich-text.css), so future LOs reuse it rather than restyle it.
 *
 * A DISCLOSURE, not a tooltip: a real button (focusable, pressable on touch) with
 * aria-expanded and aria-controls, the card right after it in reading order, so a
 * screen reader reads on into it. Hover, focus and press rules: hover-card.ts. The
 * folder tree is drawn for the eye and hidden from assistive tech; the path is also
 * given in words.
 *
 * Built by hand rather than on Base UI's Popover: that would bring floating-ui into
 * main-*.js (≈12–15 kB, more than the JS headroom). The card is absolutely placed under
 * the term and moved left when it would leave the viewport.
 *
 * Closed on the server and on first render, so the prerendered page equals the first
 * client render (AGENTS.md hard constraint 4). Everything in the card is a <span>: the
 * term sits inside a paragraph.
 */
import { useEffect, useId, useLayoutEffect, useReducer, useRef, type ReactNode } from 'react';
import { RichText } from '../RichText';
import { CLOSED, hoverCardReducer, pathTree, PINNED } from './hover-card';
import { useHoverCard } from './hover-context';

/** Pointer leaves → close after this long, so the pointer can cross into the card. */
const CLOSE_DELAY_MS = 150;
/** The card keeps this far from the viewport's edges. */
const EDGE_GAP_PX = 16;

interface HoverTermProps {
  /** The hover-card id (`data-hover-target`). */
  target: string;
  children: ReactNode;
  /** Render open (debug pages and tests). */
  defaultOpen?: boolean;
}

export function HoverTerm({ target, children, defaultOpen = false }: HoverTermProps) {
  const card = useHoverCard(target);
  const [state, dispatch] = useReducer(hoverCardReducer, defaultOpen ? PINNED : CLOSED);
  const cardId = useId();
  const cardRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Keep the card on screen: nudge it left by however far it would overflow.
  useLayoutEffect(() => {
    const element = cardRef.current;
    if (!state.isOpen || !element) return;
    element.style.insetInlineStart = '';
    const rect = element.getBoundingClientRect();
    // The layout viewport, not innerWidth: a phone zoomed out to show an overflow
    // reports the zoomed width there, and the card would be nudged short of the edge.
    const viewportWidth = document.documentElement.clientWidth;
    const overflow = rect.right - (viewportWidth - EDGE_GAP_PX);
    const shift = Math.min(Math.max(overflow, 0), Math.max(rect.left - EDGE_GAP_PX, 0));
    // Moved by its offset, not a transform: a transformed box still widens the page's
    // scroll area on a phone by its untransformed position.
    if (shift > 0) element.style.insetInlineStart = `-${shift}px`;
  }, [state.isOpen]);

  useLayoutEffect(() => () => clearTimeout(closeTimer.current), []);

  // Escape dismisses an open card wherever focus is: a card opened by hover must close
  // without moving the pointer or focus (WCAG 1.4.13).
  useEffect(() => {
    if (!state.isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch({ type: 'escape' });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.isOpen]);

  // No declared card (lo-rich-text.test.ts guards against it): just the words.
  if (card === undefined) return <>{children}</>;

  return (
    <span
      className="hover-term-wrap"
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') return;
        clearTimeout(closeTimer.current);
        dispatch({ type: 'hoverStart' });
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'mouse') return;
        closeTimer.current = setTimeout(() => dispatch({ type: 'hoverEnd' }), CLOSE_DELAY_MS);
      }}
      onFocus={() => dispatch({ type: 'focus' })}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) dispatch({ type: 'blur' });
      }}
    >
      <button
        type="button"
        className="hover-term"
        aria-expanded={state.isOpen}
        // Only while the card exists: a closed card has no element to point at.
        aria-controls={state.isOpen ? cardId : undefined}
        // detail 0: a click synthesised by Enter or Space rather than a pointer.
        onClick={(event) =>
          dispatch({ type: 'press', via: event.detail === 0 ? 'keyboard' : 'pointer' })
        }
      >
        {children}
      </button>
      {state.isOpen ? (
        <span ref={cardRef} id={cardId} className="hover-card" lang={card.lang}>
          {card.title === undefined ? null : (
            <strong className="hover-card-title">{card.title}</strong>
          )}
          {card.path === undefined ? null : (
            <>
              <span className="hover-card-tree" aria-hidden="true">
                {pathTree(card.path).map((line) => (
                  <span key={line.text} className={line.isFile ? 'hover-card-file' : undefined}>
                    {line.text}
                  </span>
                ))}
              </span>
              <code className="hover-card-path">{card.path}</code>
            </>
          )}
          {card.content.map((nodes, index) => (
            <span key={index} className="hover-card-line">
              <RichText nodes={nodes} />
            </span>
          ))}
        </span>
      ) : null}
    </span>
  );
}
