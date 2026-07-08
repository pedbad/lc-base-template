/**
 * LineMatchExercise.tsx — engine #7 of 12 (spec §2, §8). The learner matches each
 * picture to its word. Scoring family: blank-grading (one match per picture).
 *
 * Ported from french-lo-1's LineMatch. Two layouts, chosen by viewport:
 *   - mobile (<980px): each picture row picks its word with a <Select> dropdown.
 *   - desktop (≥980px): two columns (pictures | words) with connection dots; click a
 *     picture dot then a word dot to draw a curved SVG connector. Wrong connectors
 *     recoil (animate back to their picture) on Check.
 * Both render (CSS-toggled at 980px); `isDesktopViewport` (JS-measured) decides which
 * input source grades. A match is correct when the connected/selected word shares the
 * picture's key (`lineMatchItemKey`).
 *
 * Browser-coupled by nature: connector positions are measured with
 * getBoundingClientRect (rAF-batched), re-measured via ResizeObserver + window resize,
 * and the recoil is a requestAnimationFrame tween — all SSR-guarded. The word bank is
 * always shuffled (seeded mulberry32); Reset re-shuffles via a bumped seed.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2, §5, §7, §8.
 */
import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AudioClip } from '@/components/audio/AudioClip';
import { ExerciseOptionsSchema, type ExerciseOptions } from '@/config/lo-schema';
import { resolveLabel, type UiStringsOverride } from '@/config/ui-strings';
import { canRevealAnswers } from '@/exercises/lib/reveal';
import { commitCheck, getInitialScoringState, type ScoringState } from '@/exercises/lib/scoring';
import { mulberry32, sampleN, shuffle } from '@/exercises/lib/shuffle';
import { ExerciseFooter } from '@/exercises/lib/ExerciseFooter';
import { ResultSlot } from '@/exercises/lib/ResultSlot';
import { useExerciseScaffold } from '@/exercises/lib/exerciseScaffold';
import { resolveAsset } from '@/lib/assets';
import { TARGET_LANG } from '@/lib/lang';
import type { ExerciseComponentProps } from '@/exercises/lazyRegistry';
import {
  LineMatchConnectors,
  type ConnectorLayout,
  type RecoilingConnection,
} from './LineMatchConnectors';
import {
  LineMatchExerciseConfigSchema,
  lineMatchItemKey,
  type LineMatchItem,
} from './line-match-schema';
import { fillLineMatchAnswers, gradeLineMatch } from './line-match-grading';

const DESKTOP_BREAKPOINT = 980;
const RECOIL_DURATION_MS = 380;

interface LineMatchState extends ScoringState {
  sampledItems: LineMatchItem[];
  wordBank: LineMatchItem[];
  /** Mobile: pictureKey → selected word key. */
  values: Record<string, string>;
  /** Desktop: pictureKey → connected word key. */
  connections: Record<string, string>;
  activeSourceId: string | null;
  activeTargetId: string | null;
  isDesktopViewport: boolean;
  connectorLayout: ConnectorLayout | null;
  recoiling: RecoilingConnection[];
  recoilProgress: number;
  seed: number;
}

const buildRound = (
  items: readonly LineMatchItem[],
  sampleSize: number | undefined,
  seed: number,
  isDesktopViewport: boolean,
): LineMatchState => {
  const rng = mulberry32(seed);
  const sampledItems = sampleN(items, sampleSize ?? items.length, rng);
  return {
    ...getInitialScoringState(),
    sampledItems,
    wordBank: shuffle(sampledItems, rng),
    values: {},
    connections: {},
    activeSourceId: null,
    activeTargetId: null,
    isDesktopViewport,
    connectorLayout: null,
    recoiling: [],
    recoilProgress: 1,
    seed,
  };
};

const isDesktopNow = (): boolean =>
  typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT;

/**
 * Connect `sourceKey` → `targetKey`, enforcing one-to-one: any other picture already
 * connected to that word is disconnected. If already checked, clears the verdict for
 * every affected picture (so editing re-opens grading).
 */
const connectUpdate = (
  sourceKey: string,
  targetKey: string,
  prev: LineMatchState,
): Partial<LineMatchState> => {
  const connections = { ...prev.connections };
  const affected = [sourceKey];
  for (const existingSource of Object.keys(connections)) {
    if (connections[existingSource] === targetKey && existingSource !== sourceKey) {
      delete connections[existingSource];
      affected.push(existingSource);
    }
  }
  connections[sourceKey] = targetKey;

  const base: Partial<LineMatchState> = { activeSourceId: null, activeTargetId: null, connections };
  if (!prev.hasChecked) return base;

  const checkedResults = { ...prev.checkedResults };
  let changed = false;
  for (const key of affected) {
    if (key in checkedResults) {
      delete checkedResults[key];
      changed = true;
    }
  }
  return changed ? { ...base, ...commitCheck(checkedResults) } : base;
};

export default function LineMatchExercise({ config }: ExerciseComponentProps) {
  const uid = useId();

  const parsed = LineMatchExerciseConfigSchema.safeParse(config);
  const items: readonly LineMatchItem[] = parsed.success ? parsed.data.content.items : [];
  const labels: UiStringsOverride | undefined = parsed.success ? parsed.data.labels : undefined;
  const options: ExerciseOptions = ExerciseOptionsSchema.parse(
    parsed.success ? (parsed.data.options ?? {}) : {},
  );

  // Shared scaffold: seeds from a stable per-instance useId and wires the merge
  // reducer (including its null no-op bail-out, which lets the measure-after-render
  // effect settle without looping). reset() rebuilds with seed + 1; viewport is read
  // fresh via isDesktopNow() (kept in sync with state by updateViewport).
  const { state, dispatch, reset } = useExerciseScaffold<LineMatchState>((seed) =>
    buildRound(items, options.sampleSize, seed, isDesktopNow()),
  );

  // View-machinery refs (do not drive rendering directly).
  const stageRef = useRef<HTMLDivElement | null>(null);
  const sourceNodes = useRef(new Map<string, HTMLElement>());
  const targetNodes = useRef(new Map<string, HTMLElement>());
  const measureFrame = useRef<number | null>(null);
  const recoilFrame = useRef<number | null>(null);

  const setSourceNode = (key: string, node: HTMLElement | null) => {
    if (node) sourceNodes.current.set(key, node);
    else sourceNodes.current.delete(key);
  };
  const setTargetNode = (key: string, node: HTMLElement | null) => {
    if (node) targetNodes.current.set(key, node);
    else targetNodes.current.delete(key);
  };

  const measureLayout = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    const round = (n: number) => Math.round(n * 10) / 10;
    const pointsOf = (nodes: Map<string, HTMLElement>) => {
      const points: Record<string, { x: number; y: number }> = {};
      nodes.forEach((node, key) => {
        const r = node.getBoundingClientRect();
        points[key] = {
          x: round(r.left + r.width / 2 - stageRect.left),
          y: round(r.top + r.height / 2 - stageRect.top),
        };
      });
      return points;
    };
    const next: ConnectorLayout = {
      width: Math.round(stageRect.width),
      height: Math.round(stageRect.height),
      sourcePoints: pointsOf(sourceNodes.current),
      targetPoints: pointsOf(targetNodes.current),
    };
    dispatch((prev) =>
      JSON.stringify(prev.connectorLayout) === JSON.stringify(next)
        ? null
        : { connectorLayout: next },
    );
  }, [dispatch]);

  const scheduleMeasure = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (measureFrame.current) window.cancelAnimationFrame(measureFrame.current);
    measureFrame.current = window.requestAnimationFrame(() => {
      measureFrame.current = null;
      measureLayout();
    });
  }, [measureLayout]);

  const updateViewport = useCallback(() => {
    const next = isDesktopNow();
    dispatch((prev) => (prev.isDesktopViewport === next ? null : { isDesktopViewport: next }));
  }, [dispatch]);

  const stopRecoil = useCallback(() => {
    if (typeof window !== 'undefined' && recoilFrame.current) {
      window.cancelAnimationFrame(recoilFrame.current);
    }
    recoilFrame.current = null;
  }, []);

  const startRecoil = useCallback(() => {
    if (typeof window === 'undefined') return;
    stopRecoil();
    const startedAt = window.performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / RECOIL_DURATION_MS);
      dispatch({ recoilProgress: progress });
      if (progress < 1) {
        recoilFrame.current = window.requestAnimationFrame(step);
        return;
      }
      recoilFrame.current = null;
      dispatch({ recoilProgress: 1, recoiling: [] });
    };
    recoilFrame.current = window.requestAnimationFrame(step);
  }, [dispatch, stopRecoil]);

  // Mount: viewport + resize listener + ResizeObserver on the desktop stage.
  useEffect(() => {
    const handleResize = () => {
      updateViewport();
      scheduleMeasure();
    };
    window.addEventListener('resize', handleResize);
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && stageRef.current) {
      observer = new ResizeObserver(() => scheduleMeasure());
      observer.observe(stageRef.current);
    }
    updateViewport();
    scheduleMeasure();
    return () => {
      window.removeEventListener('resize', handleResize);
      observer?.disconnect();
      if (typeof window !== 'undefined' && measureFrame.current) {
        window.cancelAnimationFrame(measureFrame.current);
      }
      stopRecoil();
    };
  }, [scheduleMeasure, updateViewport, stopRecoil]);

  // Re-measure after every committed render (the no-op reducer bail-out stops the loop
  // once the layout is stable). No dep array on purpose.
  useEffect(() => {
    scheduleMeasure();
  });

  const handleSelectChange = (pictureKey: string, wordKey: string) => {
    dispatch((prev) => {
      const values = { ...prev.values, [pictureKey]: wordKey };
      if (!prev.hasChecked) return { values };
      const checkedResults = { ...prev.checkedResults };
      delete checkedResults[pictureKey];
      return { values, ...commitCheck(checkedResults) };
    });
  };

  const handleSourceActivate = (sourceKey: string) => {
    dispatch((prev) =>
      prev.activeTargetId
        ? connectUpdate(sourceKey, prev.activeTargetId, prev)
        : {
            activeSourceId: prev.activeSourceId === sourceKey ? null : sourceKey,
            activeTargetId: null,
          },
    );
  };

  const handleTargetActivate = (targetKey: string) => {
    dispatch((prev) =>
      prev.activeSourceId
        ? connectUpdate(prev.activeSourceId, targetKey, prev)
        : {
            activeSourceId: null,
            activeTargetId: prev.activeTargetId === targetKey ? null : targetKey,
          },
    );
  };

  const handleReset = () => {
    stopRecoil();
    reset();
  };

  const handleCheck = () => {
    const desktop = state.isDesktopViewport;
    const answers = desktop ? state.connections : state.values;
    const { checkedResults, recoiling, keptConnections } = gradeLineMatch(
      state.sampledItems,
      answers,
      desktop,
    );

    if (desktop) {
      dispatch({
        ...commitCheck(checkedResults),
        connections: keptConnections,
        recoiling,
        recoilProgress: recoiling.length > 0 ? 0 : 1,
        activeSourceId: null,
        activeTargetId: null,
      });
      if (recoiling.length > 0) startRecoil();
    } else {
      dispatch(commitCheck(checkedResults));
    }
  };

  const handleShowAnswers = () => {
    stopRecoil();
    const { values, connections, checkedResults } = fillLineMatchAnswers(state.sampledItems);
    dispatch({
      values,
      connections,
      ...commitCheck(checkedResults),
      recoiling: [],
      recoilProgress: 1,
      activeSourceId: null,
      activeTargetId: null,
    });
  };

  if (!parsed.success) {
    return (
      <p className="text-sm text-destructive">
        Invalid <code>line-match</code> config: {parsed.error.issues[0]?.message ?? 'parse error'}
      </p>
    );
  }

  const wordLabel = (wordKey: string): string =>
    state.wordBank.find((option) => lineMatchItemKey(option) === wordKey)?.label ?? '';

  // ---- Mobile layout: picture + <Select> dropdown ----
  const renderMobileRow = (item: LineMatchItem): ReactNode => {
    const key = lineMatchItemKey(item);
    const picked = state.values[key] ?? '';
    const result = state.checkedResults[key];
    const hasResult = state.hasChecked && typeof result === 'boolean';
    const selectId = `${uid}-match-${key}`;

    return (
      <li
        className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3"
        key={`line-match-row-${key}`}
      >
        {item.audio ? (
          <AudioClip
            className="super-compact-speaker"
            id={`${uid}-audio-${key}`}
            soundFile={item.audio}
          />
        ) : null}
        <img
          alt={item.alt ?? item.localLanguage ?? ''}
          className="aspect-square w-16 shrink-0 rounded-lg border border-border bg-background object-contain p-1"
          loading="lazy"
          src={resolveAsset(item.image)}
        />
        <div className="min-w-0 flex-1">
          <label
            className="sr-only"
            htmlFor={selectId}
          >{`Word matching picture: ${item.localLanguage ?? key}`}</label>
          <Select value={picked} onValueChange={(next) => handleSelectChange(key, next ?? '')}>
            <SelectTrigger id={selectId} className="w-full">
              <SelectValue placeholder="Choose the matching word">
                {(value) =>
                  value ? <span lang={TARGET_LANG}>{wordLabel(String(value))}</span> : null
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent lang={TARGET_LANG}>
              {state.wordBank.map((option) => {
                const optionKey = lineMatchItemKey(option);
                return (
                  <SelectItem key={`${selectId}-${optionKey}`} value={optionKey}>
                    {option.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <ResultSlot hasResult={hasResult} isCorrect={result === true} />
      </li>
    );
  };

  // ---- Desktop layout: picture dots (sources) | word dots (targets) + SVG lines ----
  const dotClass = (tone: 'correct' | 'active' | 'connected' | 'idle'): string => {
    const base = 'inline-flex h-5 w-5 shrink-0 rounded-full border-2 transition';
    if (tone === 'correct') return `${base} border-success bg-success`;
    if (tone === 'active') return `${base} border-primary bg-primary/30 ring-2 ring-primary/40`;
    if (tone === 'connected') return `${base} border-primary bg-primary/60`;
    return `${base} border-muted-foreground/60 bg-background`;
  };

  const renderSourceRow = (item: LineMatchItem, index: number): ReactNode => {
    const key = lineMatchItemKey(item);
    const isActive = state.activeSourceId === key;
    const connected = Boolean(state.connections[key]);
    const isCorrect = state.checkedResults[key] === true;
    const tone = isCorrect ? 'correct' : isActive ? 'active' : connected ? 'connected' : 'idle';
    return (
      <li key={`lm-src-${key}`}>
        <button
          type="button"
          aria-label={`Picture ${index + 1}${item.localLanguage ? ` (${item.localLanguage})` : ''}: select to connect`}
          aria-pressed={isActive}
          onClick={() => handleSourceActivate(key)}
          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 transition ${isCorrect ? 'border-success bg-success/10' : isActive ? 'border-primary bg-primary/10' : connected ? 'border-primary/50 bg-card' : 'border-border/70 bg-card hover:bg-accent/40'}`}
        >
          <img
            alt={item.alt ?? item.localLanguage ?? ''}
            className="aspect-square w-16 shrink-0 rounded-lg border border-border bg-background object-contain p-1"
            loading="lazy"
            src={resolveAsset(item.image)}
          />
          <span className="ml-auto" ref={(node) => setSourceNode(key, node)}>
            <span aria-hidden="true" className={dotClass(tone)} />
          </span>
        </button>
      </li>
    );
  };

  const targetSourceMap: Record<string, string> = {};
  for (const [sourceKey, targetKey] of Object.entries(state.connections)) {
    targetSourceMap[targetKey] = sourceKey;
  }

  const renderTargetRow = (item: LineMatchItem): ReactNode => {
    const key = lineMatchItemKey(item);
    const connectedSource = targetSourceMap[key];
    const isCorrect = connectedSource ? state.checkedResults[connectedSource] === true : false;
    const isActive = state.activeTargetId === key;
    const tone = isCorrect
      ? 'correct'
      : isActive
        ? 'active'
        : connectedSource
          ? 'connected'
          : 'idle';
    return (
      <li key={`lm-tgt-${key}`}>
        <button
          type="button"
          aria-label={`Word ${item.label}: select to connect`}
          aria-pressed={isActive}
          onClick={() => handleTargetActivate(key)}
          className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${isCorrect ? 'border-success bg-success/10' : isActive ? 'border-primary bg-primary/10' : connectedSource ? 'border-primary/50 bg-card' : 'border-border/70 bg-card hover:bg-accent/40'}`}
        >
          <span ref={(node) => setTargetNode(key, node)}>
            <span aria-hidden="true" className={dotClass(tone)} />
          </span>
          <strong className="min-w-0 text-foreground" lang={TARGET_LANG}>
            {item.label}
          </strong>
        </button>
      </li>
    );
  };

  const total = state.sampledItems.length;
  const answeredCount = state.isDesktopViewport
    ? Object.keys(state.connections).length
    : Object.keys(state.values).length;
  const allCorrect = state.hasChecked && total > 0 && state.nCorrect === total;
  const canReveal = canRevealAnswers({
    allowShowAnswers: options.allowShowAnswers,
    hasAttempted: state.hasChecked,
    total,
    nCorrect: state.nCorrect,
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile (<980px) */}
      <ol className="space-y-3 min-[980px]:hidden">{state.sampledItems.map(renderMobileRow)}</ol>

      {/* Desktop (≥980px) */}
      <div className="relative hidden min-[980px]:block" ref={stageRef}>
        <LineMatchConnectors
          layout={state.connectorLayout}
          connections={state.connections}
          checkedResults={state.checkedResults}
          recoiling={state.recoiling}
          recoilProgress={state.recoilProgress}
        />
        <div className="relative z-10 grid grid-cols-[minmax(0,1fr)_minmax(14rem,16rem)] gap-8">
          <ol className="space-y-3">{state.sampledItems.map(renderSourceRow)}</ol>
          <ol className="space-y-3">{state.wordBank.map(renderTargetRow)}</ol>
        </div>
      </div>

      {state.hasChecked ? (
        <p
          className={`text-sm font-medium ${allCorrect ? 'text-success' : 'text-muted-foreground'}`}
          role="status"
        >
          {allCorrect ? resolveLabel('correct', labels) : `${state.nCorrect} / ${total}`}
        </p>
      ) : null}

      <ExerciseFooter
        onCheck={handleCheck}
        checkDisabled={answeredCount === 0}
        onReset={handleReset}
        showReset={answeredCount > 0 || state.hasChecked}
        onShowAnswers={handleShowAnswers}
        showAnswers={canReveal}
        labels={labels}
      />

      {parsed.data.content.footnote ? (
        <p className="text-sm text-muted-foreground" lang={TARGET_LANG}>
          {parsed.data.content.footnote}
        </p>
      ) : null}
    </div>
  );
}
