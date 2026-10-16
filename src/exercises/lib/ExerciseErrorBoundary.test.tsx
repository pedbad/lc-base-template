/**
 * ExerciseErrorBoundary (TODO §E13b): when an engine's chunk fails to load or the
 * engine throws while rendering, the learner sees a short notice with a way out
 * instead of an empty space. This suite has no DOM, so the boundary's two React
 * hooks are driven directly; e2e/exercise-failure.spec.ts proves it in a browser.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ExerciseErrorBoundary } from './ExerciseErrorBoundary';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ExerciseErrorBoundary', () => {
  test('renders its children while nothing has failed', () => {
    const html = renderToStaticMarkup(
      <ExerciseErrorBoundary>
        <p>engine</p>
      </ExerciseErrorBoundary>,
    );
    expect(html).toBe('<p>engine</p>');
  });

  test('a caught error switches it to the fallback', () => {
    expect(ExerciseErrorBoundary.getDerivedStateFromError()).toEqual({
      failed: true,
    });
  });

  test('the fallback says what happened and offers a reload, as an alert', () => {
    const boundary = new ExerciseErrorBoundary({ children: <p>engine</p> });
    boundary.state = ExerciseErrorBoundary.getDerivedStateFromError();
    const html = renderToStaticMarkup(boundary.render());

    expect(html).toContain('role="alert"');
    expect(html).toContain('This exercise could not load.');
    expect(html).toMatch(/<button[^>]*>(?:(?!<\/button>).)*Reload the page<\/button>/s);
    expect(html).not.toContain('engine');
  });

  test('logs the error rather than swallowing it', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const boundary = new ExerciseErrorBoundary({ children: null });
    const cause = new Error('chunk');
    boundary.componentDidCatch(cause, { componentStack: '\n    at Engine' });

    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('exercise'),
      cause,
      expect.stringContaining('Engine'),
    );
  });

  // An engine that crashes under the learner's focus takes the focused element with
  // it, and focus falls to <body>. Move it to the notice then, so a keyboard or screen
  // reader user lands on what replaced the exercise; never steal it from elsewhere.
  describe('focus after a failure', () => {
    afterEach(() => {
      delete (globalThis as { document?: unknown }).document;
    });

    function failedBoundary(activeIsBody: boolean) {
      const body = {};
      (globalThis as { document?: unknown }).document = {
        body,
        activeElement: activeIsBody ? body : { tagName: 'BUTTON' },
      };
      const boundary = new ExerciseErrorBoundary({ children: null });
      const focus = vi.fn();
      boundary.alertRef = { current: { focus } as unknown as HTMLDivElement };
      boundary.state = { failed: true };
      boundary.componentDidUpdate({ children: null }, { failed: false });
      return focus;
    }

    test('moves focus to the notice when the crash dropped it to the page', () => {
      expect(failedBoundary(true)).toHaveBeenCalledOnce();
    });

    test('leaves focus alone when the learner is elsewhere on the page', () => {
      expect(failedBoundary(false)).not.toHaveBeenCalled();
    });

    test('the notice can take focus from script but is not a Tab stop', () => {
      const boundary = new ExerciseErrorBoundary({ children: null });
      boundary.state = { failed: true };
      expect(renderToStaticMarkup(boundary.render())).toMatch(
        /<div role="alert"[^>]*tabindex="-1"/,
      );
    });
  });
});
