/**
 * SequenceAudioController — the master playlist player. Plays an ordered list of
 * audio sources as one continuous timeline: a play/pause button, a master scrubber
 * (pointer-driven, mouse + touch), a volume slider, gap-less advance between tracks,
 * and duration preloading so the scrubber length is correct before playback starts.
 * It owns one off-DOM Audio element (registered with AudioManager so a global stop
 * reaches it) and reports progress up via callbacks, so an exercise can highlight the
 * active row.
 *
 * Ported from french-lo-1's SequenceAudioController.jsx (508 lines), typed, with:
 *  - React 19 ref-as-prop + useImperativeHandle (no forwardRef).
 *  - The off-DOM Audio is created in the mount effect, not via a render-time
 *    `new Audio()` (which is SSR-unsafe and a ref-write during render).
 *  - Live-mirror refs (state/props) synced in effects, never during render.
 *  - --footer-background (absent here) mapped to --primary.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §8.
 */
import { useEffect, useImperativeHandle, useReducer, useRef } from 'react';
import type { ChangeEvent, PointerEvent as ReactPointerEvent, Ref } from 'react';
import AudioManager from '@/audio/AudioManager';

type PlayState = 'playing' | 'paused' | 'stopped';

interface ControllerState {
  clipDuration: number;
  clipTime: number; // current track time
  currentIndex: number;
  masterDuration: number;
  masterTime: number; // overall sequence time
  playSequence: boolean;
  playState: PlayState;
  scrubTime: number | null; // transient UI-only master time while scrubbing
}

export interface PlayItemOptions {
  playSequence?: boolean;
  offset?: number;
  autoplay?: boolean;
}

/** The imperative API a parent drives through a ref. */
export interface SequenceAudioControllerHandle {
  toggle: () => void;
  playItem: (index: number, opts?: PlayItemOptions) => void;
}

interface SequenceAudioControllerProps {
  sources: string[];
  /** Silence between tracks when auto-advancing, in seconds. */
  pauseSeconds?: number;
  onPlayStateChange?: (state: PlayState) => void;
  onTrackChange?: (index: number) => void;
  onStopped?: (index: number) => void;
  onTimeUpdate?: (
    index: number,
    clipTime: number,
    clipDuration: number,
    masterTime: number,
    masterDuration: number,
  ) => void;
  ref?: Ref<SequenceAudioControllerHandle>;
}

const INITIAL_STATE: ControllerState = {
  clipDuration: 0,
  clipTime: 0,
  currentIndex: 0,
  masterDuration: 0,
  masterTime: 0,
  playSequence: false,
  playState: 'stopped',
  scrubTime: null,
};

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

/** Format seconds as m:ss for the minimal time readout. */
const formatTime = (seconds: number): string => {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const minutes = Math.floor(safe / SECONDS_PER_MINUTE);
  const secs = Math.floor(safe % SECONDS_PER_MINUTE);
  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

type StatePatch = Partial<ControllerState>;
type Action = StatePatch | ((state: ControllerState) => StatePatch);

/** Mirrors this.setState: accepts a patch object or an updater fn. */
function mergeState(state: ControllerState, action: Action): ControllerState {
  const patch = typeof action === 'function' ? action(state) : action;
  return { ...state, ...patch };
}

export function SequenceAudioController({
  sources,
  pauseSeconds = 0,
  onPlayStateChange,
  onTrackChange,
  onStopped,
  onTimeUpdate,
  ref,
}: SequenceAudioControllerProps) {
  const [state, setState] = useReducer(mergeState, INITIAL_STATE);

  // Live mirrors so the once-attached listeners and imperative methods always read
  // the latest state/props (synced in effects, never written during render).
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const props = {
    sources,
    pauseSeconds,
    onPlayStateChange,
    onTrackChange,
    onStopped,
    onTimeUpdate,
  };
  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  });

  // Off-DOM Audio (created in the mount effect — client-only, SSR-safe).
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Per-track durations; kept out of state to avoid rerenders while filling.
  const durationsRef = useRef<number[]>([]);
  const isScrubbingRef = useRef(false);

  /* ---------- Events up to the parent ---------- */

  const emitPlayState = (value: PlayState) => propsRef.current.onPlayStateChange?.(value);
  const emitTrackChange = (index: number) => propsRef.current.onTrackChange?.(index);
  const emitStopped = () => propsRef.current.onStopped?.(stateRef.current.currentIndex);

  /* ---------- Master timeline helpers ---------- */

  const getMasterTime = (index: number, clipTime: number) => {
    let t = 0;
    for (let i = 0; i < index; i += 1) t += durationsRef.current[i] || 0;
    return t + (clipTime || 0);
  };

  const computeMasterDuration = () => {
    let sum = 0;
    for (let i = 0; i < propsRef.current.sources.length; i += 1)
      sum += durationsRef.current[i] || 0;
    return sum;
  };

  const hasUnknownDurations = () => {
    for (let i = 0; i < propsRef.current.sources.length; i += 1) {
      if (!(durationsRef.current[i] > 0)) return true; // 0, NaN, undefined
    }
    return false;
  };

  /**
   * While any duration is still unknown the raw sum is too small and the scrubber
   * can "hit the end" early — so never shrink masterDuration until all are known.
   */
  const getSafeMasterDuration = () => {
    const sum = computeMasterDuration();
    if (!hasUnknownDurations()) return sum;
    return Math.max(stateRef.current.masterDuration || 0, sum || 0);
  };

  /** Map a master time (seconds) to a track index + offset within it. */
  const locateMasterTime = (masterTime: number): { index: number; offset: number } => {
    const { sources: srcs } = propsRef.current;
    let t = masterTime;
    for (let i = 0; i < srcs.length; i += 1) {
      const d = durationsRef.current[i] || 0;
      if (d <= 0) return { index: i, offset: Math.max(0, t) }; // unknown → current bucket
      if (t <= d || i === srcs.length - 1) {
        return { index: i, offset: Math.max(0, Math.min(t, d)) };
      }
      t -= d;
    }
    return { index: 0, offset: 0 };
  };

  /* ---------- Duration preload ---------- */

  const preloadDurations = () => {
    const { sources: srcs } = propsRef.current;
    if (!srcs.length) return;

    const loads = srcs.map(
      (src, i) =>
        new Promise<number>((resolve) => {
          const a = new Audio();
          a.preload = 'metadata';
          a.src = src;
          const done = () => {
            const d = Number.isFinite(a.duration) ? a.duration : 0;
            durationsRef.current[i] = d;
            resolve(d);
          };
          a.addEventListener('loadedmetadata', done, { once: true });
          a.addEventListener('error', () => resolve(0), { once: true });
        }),
    );

    Promise.all(loads).then(() => {
      const sum = durationsRef.current.reduce((acc, d) => acc + (d || 0), 0);
      // Never let preload shrink an already-better duration.
      setState((prev) => ({ masterDuration: Math.max(prev.masterDuration || 0, sum || 0) }));
    });
  };

  /* ---------- Public API (via ref) ---------- */

  const playItem = (index: number, opts: PlayItemOptions = {}) => {
    const audio = audioRef.current;
    const src = propsRef.current.sources[index];
    if (!audio || !src) return;

    const { playSequence = false, offset = 0, autoplay } = opts;
    audio.src = src;
    audio.load();

    const start = () => {
      try {
        audio.currentTime = offset || 0;
      } catch {
        // Some browsers throw if currentTime is set before metadata; ignore.
      }

      const shouldPlay = autoplay !== false;
      if (shouldPlay) {
        AudioManager.stopAll({ except: audio });
        audio.play().catch(() => {});
      }

      const d = Number.isFinite(audio.duration) ? audio.duration : durationsRef.current[index] || 0;
      durationsRef.current[index] = d;

      const playState: PlayState = shouldPlay ? 'playing' : 'paused';
      setState({
        clipDuration: d,
        clipTime: audio.currentTime,
        currentIndex: index,
        masterDuration: getSafeMasterDuration(),
        masterTime: getMasterTime(index, audio.currentTime),
        playSequence,
        playState,
      });
      emitPlayState(playState);
      emitTrackChange(index);
    };

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      start();
    } else {
      audio.addEventListener('loadedmetadata', start, { once: true });
    }
  };

  /** Seek within the overall sequence. */
  const seekMaster = (masterTime: number) => {
    const { playState } = stateRef.current;
    const { index, offset } = locateMasterTime(masterTime);
    playItem(index, {
      autoplay: playState === 'playing',
      offset,
      playSequence: stateRef.current.playSequence,
    });
  };

  /* ---------- Master control ---------- */

  const toggleMasterPlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const { playState } = stateRef.current;

    if (playState === 'paused') {
      AudioManager.stopAll({ except: audio });
      audio.play().catch(() => {});
      setState({ playSequence: true, playState: 'playing' });
      emitPlayState('playing');
      return;
    }
    if (playState === 'stopped') {
      playItem(0, { playSequence: true });
      return;
    }
    audio.pause();
    setState({ playState: 'paused' });
    emitPlayState('paused');
  };

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const { playState } = stateRef.current;

    if (playState === 'playing') {
      audio.pause();
      setState({ playState: 'paused' });
      emitPlayState('paused');
    } else if (playState === 'paused') {
      AudioManager.stopAll({ except: audio });
      audio.play().catch(() => {});
      setState({ playState: 'playing' });
      emitPlayState('playing');
    } else {
      toggleMasterPlay();
    }
  };

  /* ---------- Internal media handlers ---------- */

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const { currentIndex } = stateRef.current;
    const d = Number.isFinite(audio.duration) ? audio.duration : 0;
    durationsRef.current[currentIndex] = d;
    setState({
      clipDuration: d,
      masterDuration: getSafeMasterDuration(),
      masterTime: getMasterTime(currentIndex, audio.currentTime),
    });
  };

  const handleTimeUpdate = () => {
    if (isScrubbingRef.current) return; // critical: stop flicker + tile jump
    const audio = audioRef.current;
    if (!audio) return;
    const { currentIndex } = stateRef.current;
    const clipTime = audio.currentTime;
    const clipDuration = audio.duration || 0;
    const masterTime = getMasterTime(currentIndex, clipTime);
    const masterDuration = getSafeMasterDuration();
    setState({ clipDuration, clipTime, masterDuration, masterTime });
    propsRef.current.onTimeUpdate?.(
      currentIndex,
      clipTime,
      clipDuration,
      masterTime,
      masterDuration,
    );
  };

  const handleEnded = () => {
    const { pauseSeconds: gap = 0, sources: srcs } = propsRef.current;
    const { currentIndex, playSequence } = stateRef.current;

    if (!playSequence) {
      setState({ playState: 'stopped' });
      emitPlayState('stopped');
      emitStopped();
      return;
    }
    const nextIndex = currentIndex + 1;
    if (nextIndex >= srcs.length) {
      setState({ playState: 'stopped' });
      emitStopped();
      return;
    }
    setTimeout(() => playItem(nextIndex, { playSequence: true }), gap * MS_PER_SECOND);
  };

  /* ---------- Scrubber (pointer events: mouse + touch) ---------- */

  const startScrub = (e: ReactPointerEvent<HTMLInputElement>) => {
    e.stopPropagation();
    isScrubbingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // setPointerCapture can throw if the pointer is already released; ignore.
    }
    setState((prev) => ({ scrubTime: prev.masterTime }));
  };

  const moveScrub = (e: ReactPointerEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  const changeScrub = (e: ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const t = parseFloat(e.target.value);
    if (!Number.isFinite(t)) return;
    setState({ scrubTime: t }); // UI-only while dragging
  };

  const endScrub = (e: ReactPointerEvent<HTMLInputElement>) => {
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore if already released
    }
    isScrubbingRef.current = false;
    const commitTime = stateRef.current.scrubTime;
    setState({ scrubTime: null });
    // Commit after state clears scrubTime.
    queueMicrotask(() => {
      if (commitTime !== null) seekMaster(commitTime);
    });
  };

  /* ---------- Lifecycle ---------- */

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    AudioManager.registerElement(audio);
    preloadDurations();

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      AudioManager.unregisterElement(audio);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
    // Mount-once: handlers read refs, so they never need to re-attach.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({ toggle, playItem }));

  /* ---------- Render ---------- */

  const { masterTime, masterDuration, scrubTime, playState } = state;
  const displayTime = scrubTime !== null ? scrubTime : masterTime;

  return (
    // NB: french-lo-1 put onMouseDown/onTouchStart stopPropagation here to shield the
    // controller from an ancestor drag surface (DraggableFillGaps, engine #9, not yet
    // ported). No current consumer nests it in a draggable, so those handlers are
    // omitted; re-add (with a role + keyboard support) when #9 lands.
    <div className="sequence-audio-controller flex w-full items-center gap-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-foreground">
      <button
        type="button"
        aria-label={playState === 'playing' ? 'Pause audio' : 'Play audio'}
        className="play-pause shrink-0 cursor-pointer leading-none"
        onClick={toggleMasterPlay}
      >
        {playState === 'playing' ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M.682.003H7v19.994H.682ZM13 .003h6.318v19.994H13z" fill="currentColor" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 14 17"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12.8378 7.01827L2.19005 0.21473C1.32492 -0.337792 0 0.198383 0 1.56498V15.1688C0 16.3948 1.23114 17.1337 2.19005 16.519L12.8378 9.71877C13.7876 9.11394 13.7906 7.62311 12.8378 7.01827Z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>

      <input
        aria-label="Audio progress"
        className="play-scrubber min-w-0 flex-1"
        type="range"
        min="0"
        max={masterDuration || 0}
        step="0.01"
        value={displayTime}
        onPointerDown={startScrub}
        onPointerMove={moveScrub}
        onPointerUp={endScrub}
        onChange={changeScrub}
        style={{ accentColor: 'var(--primary)' }}
      />

      <span aria-hidden="true" className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {formatTime(displayTime)} / {formatTime(masterDuration)}
      </span>
    </div>
  );
}
