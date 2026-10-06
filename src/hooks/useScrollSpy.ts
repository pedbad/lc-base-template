/**
 * useScrollSpy — which LO section is on screen, for the header's active link
 * (docs/specs/2026-10-06-header-scroll-spy-design.md).
 *
 * THIN BY DESIGN. It measures and listens; the rules live in `src/lib/sectionInView.ts`
 * and `src/lib/jumpHold.ts`, which are unit-tested. The suite runs in `node` with no
 * DOM, so nothing here could be tested beyond wiring.
 *
 * A PASSIVE SCROLL LISTENER, NOT AN INTERSECTIONOBSERVER (spec §4). The question is
 * positional — which section's top last crossed a line — and an observer answers
 * "does X overlap a region": a line-thin region needs a px bottom margin rebuilt on
 * every resize, and a top crossing the region's edge fires nothing when the section
 * already overlapped it. Browsers fire `scroll` at most once per frame, and each call
 * reads one rect per section.
 *
 * IT NEVER TOUCHES FOCUS, THE HASH OR HISTORY. It only sets state. `PageLayout`'s
 * `hashchange` handler still owns the focus move to a followed section's heading.
 *
 * STARTS AT `''`, ON THE SERVER AND ON THE FIRST CLIENT RENDER ALIKE, so the
 * prerendered markup and the hydrating render agree. The first measurement happens in
 * the effect.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createJumpHold } from '@/lib/jumpHold';
import type { JumpHold } from '@/lib/jumpHold';
import { isScrolledToBottom, pickSectionInView } from '@/lib/sectionInView';

/** Slack below a section's `scroll-margin-top`, so a followed link — which lands the
 *  section's top exactly on its scroll margin — is past the line, sub-pixels and all. */
const TRIGGER_SLACK_PX = 8;

/** The trigger line: where a followed link parks a section, plus slack (spec S3).
 *  Read from CSS (`scroll-mt-*`) rather than restated here, so the two cannot drift. */
function measureTriggerLine(section: HTMLElement): number {
  const scrollMargin = Number.parseFloat(getComputedStyle(section).scrollMarginTop);
  return (Number.isFinite(scrollMargin) ? scrollMargin : 0) + TRIGGER_SLACK_PX;
}

/**
 * @param sectionIdsKey the section ids in page order, space-separated — a string so
 *   the effect's dependency is stable across renders that rebuild the array.
 * @returns the id of the section in view (`''` for none) and `holdSection(id)`, which
 *   marks a followed section active at once and holds it there until scrolling settles.
 */
export function useScrollSpy(sectionIdsKey: string): [string, (id: string) => void] {
  const [activeId, setActiveId] = useState('');
  const jumpRef = useRef<JumpHold | null>(null);

  useEffect(() => {
    const sections = sectionIdsKey
      .split(' ')
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);
    if (sections.length === 0) return;

    const jump = createJumpHold();
    jumpRef.current = jump;
    let triggerLine = measureTriggerLine(sections[0]!);

    function update() {
      // A followed link is still travelling: extend its hold, change nothing.
      if (jump.isHeld()) {
        jump.hold();
        return;
      }
      const tops = sections.map((section) => ({
        id: section.id,
        top: section.getBoundingClientRect().top,
      }));
      const isAtBottom = isScrolledToBottom(
        window.scrollY,
        window.innerHeight,
        document.documentElement.scrollHeight,
      );
      setActiveId(pickSectionInView(tops, triggerLine, isAtBottom) ?? '');
    }

    function handleResize() {
      // rem-based scroll margin follows the reader's font size.
      triggerLine = measureTriggerLine(sections[0]!);
      update();
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', handleResize);
    update();

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', handleResize);
      jump.dispose();
      jumpRef.current = null;
    };
  }, [sectionIdsKey]);

  const holdSection = useCallback((id: string) => {
    setActiveId(id);
    jumpRef.current?.hold();
  }, []);

  return [activeId, holdSection];
}
