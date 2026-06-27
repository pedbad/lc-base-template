/**
 * useRowAudio — audio orchestration for the inline-gap rows (M4b). Keeps the engine
 * focused on typed grading by owning the audio concern here.
 *
 * Two modes, chosen by `useSequenceAudioController`:
 *  - master playlist: a SequenceAudioController plays every row's clip as one
 *    timeline; each row's speaker becomes a DISPLAY driven by the controller (the
 *    active row highlights, its ring tracks progress). Clicking a row plays/toggles
 *    that track on the controller.
 *  - independent: each row with audio is a standalone click-to-play clip; this hook
 *    just supplies the resolved playlist and a per-row status map.
 *
 * The single-active-clip policy (AudioManager) holds in both modes.
 */
import { useReducer } from 'react';
import type { RefObject } from 'react';
import type { ClipStatus } from '@/audio/useAudioClip';
import { resolveAsset } from '@/lib/assets';
import type {
  PlayItemOptions,
  SequenceAudioControllerHandle,
} from '@/components/audio/SequenceAudioController';
import type { InlineGapItem } from './inline-gap-schema';

type MasterPlayState = 'playing' | 'paused' | 'stopped';

interface RowProgress {
  currentTime: number;
  duration: number;
}

interface RowAudioState {
  /** Row currently active in the master playlist, or -1. */
  activeRowIndex: number;
  masterPlayState: MasterPlayState;
  /** rowIndex → playback progress (master mode). */
  rowProgress: Record<number, RowProgress>;
  /** rowIndex → clip status (independent mode, from each AudioClip). */
  rowAudioStatus: Record<number, ClipStatus>;
}

const INITIAL: RowAudioState = {
  activeRowIndex: -1,
  masterPlayState: 'stopped',
  rowProgress: {},
  rowAudioStatus: {},
};

type Patch = Partial<RowAudioState> | ((s: RowAudioState) => Partial<RowAudioState>);
const merge = (state: RowAudioState, patch: Patch): RowAudioState => ({
  ...state,
  ...(typeof patch === 'function' ? patch(state) : patch),
});

/** One playable row: which row it is and its resolved source URL. */
export interface PlaylistEntry {
  rowIndex: number;
  src: string;
}

export interface RowAudioApi extends RowAudioState {
  /** Resolved sources, in row order, for rows that carry audio. */
  playlist: PlaylistEntry[];
  /** rowIndex → index within `playlist` (undefined if the row has no audio). */
  rowToPlaylistIndex: Record<number, number>;
  /** Callbacks for the master <SequenceAudioController>. */
  onMasterPlayStateChange: (state: MasterPlayState) => void;
  onMasterTrackChange: (playlistIndex: number) => void;
  onMasterStopped: (playlistIndex: number) => void;
  onMasterTimeUpdate: (playlistIndex: number, clipTime: number, clipDuration: number) => void;
  /** Click a row's speaker: play/toggle that track on the master controller. */
  playRow: (rowIndex: number) => void;
  /** Independent mode: a row clip reported a status change. */
  setRowStatus: (rowIndex: number, status: ClipStatus) => void;
  /** Clear all audio state (called on exercise Reset). */
  reset: () => void;
}

export function useRowAudio(
  items: readonly InlineGapItem[],
  sequenceRef: RefObject<SequenceAudioControllerHandle | null>,
): RowAudioApi {
  const [state, dispatch] = useReducer(merge, INITIAL);

  // Cheap to recompute each render (items is a fresh ref from the config parse);
  // no useMemo, which would just re-run on every new items reference anyway.
  const playlist: PlaylistEntry[] = [];
  const rowToPlaylistIndex: Record<number, number> = {};
  items.forEach((item, rowIndex) => {
    if (!item.audio) return;
    rowToPlaylistIndex[rowIndex] = playlist.length;
    playlist.push({ rowIndex, src: resolveAsset(item.audio) });
  });

  const onMasterPlayStateChange = (next: MasterPlayState) => dispatch({ masterPlayState: next });

  const onMasterTrackChange = (playlistIndex: number) =>
    dispatch({ activeRowIndex: playlist[playlistIndex]?.rowIndex ?? -1 });

  const onMasterStopped = (playlistIndex: number) => {
    const rowIndex = playlist[playlistIndex]?.rowIndex;
    dispatch((prev) => ({
      activeRowIndex: prev.activeRowIndex === rowIndex ? -1 : prev.activeRowIndex,
    }));
  };

  const onMasterTimeUpdate = (playlistIndex: number, clipTime: number, clipDuration: number) => {
    const rowIndex = playlist[playlistIndex]?.rowIndex;
    if (rowIndex === undefined) return;
    dispatch((prev) => ({
      rowProgress: {
        ...prev.rowProgress,
        [rowIndex]: { currentTime: clipTime, duration: clipDuration },
      },
    }));
  };

  const playRow = (rowIndex: number) => {
    const playlistIndex = rowToPlaylistIndex[rowIndex];
    if (playlistIndex === undefined) return;
    if (state.activeRowIndex === rowIndex) {
      sequenceRef.current?.toggle();
      return;
    }
    const opts: PlayItemOptions = { playSequence: false };
    sequenceRef.current?.playItem(playlistIndex, opts);
  };

  const setRowStatus = (rowIndex: number, status: ClipStatus) =>
    dispatch((prev) => ({ rowAudioStatus: { ...prev.rowAudioStatus, [rowIndex]: status } }));

  const reset = () => dispatch(INITIAL);

  return {
    ...state,
    playlist,
    rowToPlaylistIndex,
    onMasterPlayStateChange,
    onMasterTrackChange,
    onMasterStopped,
    onMasterTimeUpdate,
    playRow,
    setRowStatus,
    reset,
  };
}
