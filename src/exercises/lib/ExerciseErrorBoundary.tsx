/**
 * ExerciseErrorBoundary — the safety net around one exercise engine (TODO §E13b).
 * An engine is a lazy chunk: a dropped connection or a deploy that replaced the chunk
 * makes its import fail, and an engine can also throw while rendering. Without a
 * boundary either one unmounts the whole page. With it, only that exercise is replaced
 * by a short notice and a reload button; every other exercise keeps working.
 *
 * The notice offers a page reload, not an in-place retry: React.lazy keeps a failed
 * import's rejection, so re-rendering the same engine would fail the same way.
 *
 * If the crash took the learner's focused element with it (focus fell to <body>), focus
 * moves to the notice, so a keyboard or screen-reader user lands on what replaced the
 * exercise; focus anywhere else is left alone.
 *
 * A class, because React has no hook for catching render errors. Wraps ExerciseHost's
 * Suspense; tested in ExerciseErrorBoundary.test.tsx and, in a browser,
 * e2e/exercise-failure.spec.ts.
 */
import { Component, createRef, type ErrorInfo, type ReactNode } from 'react';
import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExerciseErrorBoundaryProps {
  children: ReactNode;
}

interface ExerciseErrorBoundaryState {
  failed: boolean;
}

export class ExerciseErrorBoundary extends Component<
  ExerciseErrorBoundaryProps,
  ExerciseErrorBoundaryState
> {
  state: ExerciseErrorBoundaryState = { failed: false };

  /** The notice, so focus can be moved to it after a crash. */
  alertRef = createRef<HTMLDivElement>();

  static getDerivedStateFromError(): ExerciseErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('An exercise failed to load or render.', error, info.componentStack ?? '');
  }

  componentDidUpdate(
    _prevProps: ExerciseErrorBoundaryProps,
    prevState: ExerciseErrorBoundaryState,
  ): void {
    if (prevState.failed || !this.state.failed) return;
    const active = typeof document === 'undefined' ? null : document.activeElement;
    if (active === null || active === document.body) this.alertRef.current?.focus();
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div ref={this.alertRef} role="alert" tabIndex={-1} className="space-y-3">
        <p className="text-destructive">
          This exercise could not load. Reload the page to try again.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RotateCw aria-hidden="true" />
          Reload the page
        </Button>
      </div>
    );
  }
}
