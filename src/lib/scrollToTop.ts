/**
 * scrollToTop — the reduced-motion-aware jump to the top of the document (§D · D4).
 *
 * WHY THIS IS A MODULE AND NOT AN INLINE HANDLER. Two constraints meet here. The
 * suite runs in the `node` environment (no DOM), and the shell forbids a
 * non-component export from a component file (`react-refresh/only-export-components`
 * — relaxed only for `src/components/ui/**` and the guards). So the one piece of
 * BackToTopButton with a decision in it has to live outside the component to be
 * testable at all, which leaves the button as pure markup.
 *
 * THE DEFECT IT FIXES. The reference called `scrollTo({ behavior: 'smooth' })` with
 * no reduced-motion guard anywhere in the file: a reader who has asked their OS for
 * less motion got a smooth scroll of the whole document. `behavior: 'auto'` is the
 * honest answer — an instant jump.
 *
 * The `prefersReducedMotion()` call happens HERE, inside the handler, never at module
 * scope: a module-scope `matchMedia` read breaks the Bun prerender.
 */
import { prefersReducedMotion } from './prefersReducedMotion';

/** Scroll the window to the document top, instantly if the reader prefers that. */
export function scrollToTop(): void {
  if (typeof window === 'undefined') return;
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}
