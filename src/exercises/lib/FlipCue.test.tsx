/**
 * FlipCue.test.tsx — the "Tap to flip" corner shared by flashcards and memory-match,
 * and its exit once three cards are turned (TODO §E21).
 */
import type { AnimationEvent, ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { FlipCue } from './FlipCue';

const html = renderToStaticMarkup(<FlipCue />);

describe('FlipCue', () => {
  it('is decorative: the card itself carries the accessible name', () => {
    expect(html).toMatch(/^<span class="flip-cue" aria-hidden="true">/);
  });

  it('shows the pointer icon over the words, which can be hidden on their own', () => {
    expect(html).toMatch(
      /<span class="flip-cue-label"><svg[^>]*lucide-spline-pointer[^>]*>[\s\S]*?<\/svg><span class="flip-cue-words">Tap to flip<\/span><\/span>/,
    );
  });

  it('carries no exit until it is told to leave', () => {
    expect(html).not.toContain('data-exit');
    expect(html).not.toContain('flip-cue-sparks');
  });
});

describe('FlipCue leaving', () => {
  it('names its exit and its delay for flip-cue.css', () => {
    const leaving = renderToStaticMarkup(<FlipCue exit="peel" delayMs={320} />);
    expect(leaving).toMatch(
      /^<span class="flip-cue" aria-hidden="true" data-exit="peel" style="--flip-cue-delay:320ms">/,
    );
  });

  it('starts at once when no delay is given', () => {
    expect(renderToStaticMarkup(<FlipCue exit="tuck" />)).toContain('--flip-cue-delay:0ms');
  });

  it('adds five decorative sparkles for the pop, and only the pop', () => {
    const pop = renderToStaticMarkup(<FlipCue exit="pop" />);
    expect(pop).toContain('<span class="flip-cue-sparks" aria-hidden="true"');
    expect(pop.match(/class="flip-cue-spark"/g)).toHaveLength(5);
    for (const exit of ['peel', 'wave', 'tuck', 'shatter'] as const) {
      expect(renderToStaticMarkup(<FlipCue exit={exit} />), exit).not.toContain('flip-cue-sparks');
    }
  });

  it('adds two decorative shards for the shatter, and only the shatter', () => {
    const shatter = renderToStaticMarkup(<FlipCue exit="shatter" delayMs={70} />);
    expect(shatter).toContain(
      '<span class="flip-cue-shards" aria-hidden="true" style="--flip-cue-delay:70ms">',
    );
    expect(shatter.match(/class="flip-cue-shard"/g)).toHaveLength(2);
    for (const exit of ['peel', 'pop', 'fold', 'melt'] as const) {
      expect(renderToStaticMarkup(<FlipCue exit={exit} />), exit).not.toContain('flip-cue-shards');
    }
  });

  it("reports the end of its own exit, not of the pointer's wave inside it", () => {
    const onExitEnd = vi.fn();
    // The element tree, without a DOM: the cue is the fragment's first child.
    const tree = FlipCue({ exit: 'wave', onExitEnd }) as ReactElement<{
      children: ReactElement<{ onAnimationEnd: (event: AnimationEvent) => void }>[];
    }>;
    const cue = tree.props.children[0];
    const self = {};
    cue?.props.onAnimationEnd({ target: {}, currentTarget: self } as unknown as AnimationEvent);
    expect(onExitEnd).not.toHaveBeenCalled();
    cue?.props.onAnimationEnd({ target: self, currentTarget: self } as unknown as AnimationEvent);
    expect(onExitEnd).toHaveBeenCalledOnce();
  });
});
