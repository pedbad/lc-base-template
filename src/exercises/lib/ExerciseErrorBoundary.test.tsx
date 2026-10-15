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
});
