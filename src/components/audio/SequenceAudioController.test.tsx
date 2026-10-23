// @vitest-environment happy-dom
/**
 * SequenceAudioController.test.tsx — the master scrubber's drag, replayed event by event
 * (TODO §E23). The suite's only DOM test: a drag is pointer and `input` events in an
 * order that differs between browsers, which static markup cannot show. The component is
 * mounted for real on happy-dom's audio, whose clips are given the lengths below. The
 * playlist's gap between clips is replayed the same way, on fake timers (review
 * 2026-10-21): pause, resume, a track switch and an unmount during the gap, and the end.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AudioManager from '@/audio/AudioManager';
import {
  SequenceAudioController,
  type SequenceAudioControllerHandle,
} from './SequenceAudioController';

/** Unequal on purpose: a seek that credits one clip with another's length shows up. */
const CLIP_SECONDS: Record<string, number> = { 'q1.wav': 10, 'q2.wav': 20, 'q3.wav': 30 };
const SOURCES = Object.keys(CLIP_SECONDS);

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let created: HTMLAudioElement[];
let loading: Set<HTMLMediaElement>;
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  created = [];
  const Base = window.Audio;
  vi.stubGlobal(
    'Audio',
    class extends Base {
      constructor() {
        super();
        created.push(this);
      }
    },
  );
  // As in a browser, load() forgets the length until the new clip's metadata arrives.
  loading = new Set();
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    loading.add(this);
  });
  vi.spyOn(HTMLMediaElement.prototype, 'duration', 'get').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    const clip = SOURCES.find((src) => this.src.endsWith(src));
    return loading.has(this) || !clip ? NaN : CLIP_SECONDS[clip];
  });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

type ControllerProps = Omit<Parameters<typeof SequenceAudioController>[0], 'sources'>;

/** Mounts the controller and lets the clip lengths load, so the scrubber has a range. */
async function mount(props: ControllerProps = {}) {
  await act(async () => root.render(<SequenceAudioController sources={SOURCES} {...props} />));
  // created[0] is the player; the rest are the preload probes, one per clip.
  await act(async () => {
    for (const probe of created.slice(1)) probe.dispatchEvent(new Event('loadedmetadata'));
  });
  const slider = container.querySelector<HTMLInputElement>('input[type="range"]');
  const readout = container.querySelector('span');
  if (!slider || !readout) throw new Error('the controller rendered no scrubber');
  return { audio: created[0], slider, readout };
}

/** What a browser does when the thumb moves: sets the value, then fires `input`. */
function input(slider: HTMLInputElement, value: number) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setValue?.call(slider, String(value));
  slider.dispatchEvent(new Event('input', { bubbles: true }));
}

function pointer(slider: HTMLInputElement, type: 'pointerdown' | 'pointerup') {
  slider.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1 }));
}

/** A drag as Chromium sends it: pointerdown, input, pointerup. */
async function drag(slider: HTMLInputElement, to: number) {
  await act(async () => pointer(slider, 'pointerdown'));
  await act(async () => input(slider, to));
  await act(async () => pointer(slider, 'pointerup'));
}

/** The clip a seek loaded has its metadata: the seek waiting on it goes ahead. */
async function metadataArrives(audio: HTMLAudioElement) {
  await act(async () => {
    loading.delete(audio);
    audio.dispatchEvent(new Event('loadedmetadata'));
  });
}

/** The audio reaches `clipTime` in its clip and reports it. */
async function playsTo(audio: HTMLAudioElement, clipTime: number) {
  await act(async () => {
    audio.currentTime = clipTime;
    audio.dispatchEvent(new Event('timeupdate'));
  });
}

describe('SequenceAudioController scrubber', () => {
  it('follows the audio after a drag that Firefox ends with a late input event', async () => {
    const { audio, slider, readout } = await mount();
    expect(slider.max).toBe('60');

    // Firefox's order: pointerdown, input…, pointerup, lostpointercapture, input, change.
    await drag(slider, 12);
    await act(async () => {
      input(slider, 12);
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await metadataArrives(audio);

    // The drop at 12 s lands two seconds into the second clip.
    expect(audio.currentTime).toBe(2);
    expect(readout.textContent).toBe('0:12 / 1:00');

    // The audio plays on three seconds: the scrubber goes with it.
    await playsTo(audio, 5);
    expect(slider.value).toBe('15');
    expect(readout.textContent).toBe('0:15 / 1:00');
  });

  it('follows the second of two drags made before the first one has loaded', async () => {
    const { audio, slider, readout } = await mount();

    // 12 s is in the second clip; 35 s is five seconds into the third. The first seek's
    // clip never loads: the second seek replaces it before its metadata comes.
    await drag(slider, 12);
    await drag(slider, 35);
    await metadataArrives(audio);

    expect(audio.src).toMatch(/q3\.wav$/);
    expect(audio.currentTime).toBe(5);
    await playsTo(audio, 8);
    expect(slider.value).toBe('38');
    expect(readout.textContent).toBe('0:38 / 1:00');
  });

  it('seeks from the keyboard, which moves the thumb with no pointer down', async () => {
    const { audio, slider, readout } = await mount();

    // An arrow key, Home or End (or assistive tech) sets the value and fires `input`.
    await act(async () => input(slider, 12));
    await metadataArrives(audio);

    expect(audio.currentTime).toBe(2);
    expect(readout.textContent).toBe('0:12 / 1:00');
    // `any`, not a fixed step: an arrow key then moves 1% of the timeline, not 10 ms.
    expect(slider.step).toBe('any');
  });
});

describe('SequenceAudioController play button', () => {
  function playButton() {
    const button = container.querySelector('button');
    if (!button) throw new Error('the controller rendered no play button');
    return button;
  }

  /** Clicks play and lets the first clip load, so its play() call runs. */
  async function clickPlay(audio: HTMLAudioElement) {
    await act(async () => playButton().click());
    await metadataArrives(audio);
  }

  it('offers play again when the browser blocks playback', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(
      new DOMException('play() needs a user gesture', 'NotAllowedError'),
    );
    const { audio } = await mount();

    await clickPlay(audio);

    expect(playButton().getAttribute('aria-label')).toBe('Play audio');
  });

  it('follows a pause and a resume that came from outside the controller', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const { audio } = await mount();
    await clickPlay(audio);
    expect(playButton().getAttribute('aria-label')).toBe('Pause audio');

    // A media key. (Another player stopping this one calls its pause through AudioManager.)
    await act(async () => audio.dispatchEvent(new Event('pause')));
    expect(playButton().getAttribute('aria-label')).toBe('Play audio');

    await act(async () => audio.dispatchEvent(new Event('play')));
    expect(playButton().getAttribute('aria-label')).toBe('Pause audio');
  });

  it('stays on pause through the pause a browser fires as each clip ends', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const { audio } = await mount();
    await clickPlay(audio);

    // At a clip's end the element fires `pause`, then `ended`; the next clip follows.
    vi.spyOn(HTMLMediaElement.prototype, 'ended', 'get').mockReturnValue(true);
    await act(async () => audio.dispatchEvent(new Event('pause')));

    expect(playButton().getAttribute('aria-label')).toBe('Pause audio');
  });
});

// Review 2026-10-21, concern 3: the gap between clips was an untracked setTimeout, so a
// pause during it did not stop the next clip, and the last clip ending told the parent
// nothing, leaving it on "playing".
describe('SequenceAudioController playlist lifecycle', () => {
  const GAP_SECONDS = 2;
  const GAP_MS = GAP_SECONDS * 1000;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function playButton() {
    const button = container.querySelector('button');
    if (!button) throw new Error('the controller rendered no play button');
    return button;
  }

  /** Mounts with a gap, presses play and lets the first clip load. */
  async function playingFirstClip() {
    const onPlayStateChange = vi.fn();
    const onTrackChange = vi.fn();
    const { audio } = await mount({ pauseSeconds: GAP_SECONDS, onPlayStateChange, onTrackChange });
    await act(async () => playButton().click());
    await metadataArrives(audio);
    return { audio, onPlayStateChange, onTrackChange };
  }

  /** The clip playing ends, as a browser reports it: the gap timer starts. */
  async function clipEnds(audio: HTMLAudioElement) {
    await act(async () => audio.dispatchEvent(new Event('ended')));
  }

  async function advance(ms: number) {
    await act(async () => {
      vi.advanceTimersByTime(ms);
    });
  }

  it('keeps the next clip silent when paused during the gap', async () => {
    const { audio, onTrackChange } = await playingFirstClip();
    await clipEnds(audio);

    await act(async () => playButton().click());
    await advance(GAP_MS * 2);

    expect(audio.src).toMatch(/q1\.wav$/);
    expect(onTrackChange).toHaveBeenLastCalledWith(0);
    expect(playButton().getAttribute('aria-label')).toBe('Play audio');
  });

  it('plays the next clip once when resumed after a pause in the gap', async () => {
    const { audio, onTrackChange } = await playingFirstClip();
    await clipEnds(audio);
    await act(async () => playButton().click());

    await act(async () => playButton().click());
    await metadataArrives(audio);
    await advance(GAP_MS * 2);

    expect(audio.src).toMatch(/q2\.wav$/);
    expect(onTrackChange.mock.calls.map(([index]) => index)).toEqual([0, 1]);
    expect(playButton().getAttribute('aria-label')).toBe('Pause audio');
  });

  it('schedules one advance however many times the clip reports its end', async () => {
    const { audio, onTrackChange } = await playingFirstClip();
    const load = vi.mocked(HTMLMediaElement.prototype.load);
    const loadsBefore = load.mock.calls.length;
    await clipEnds(audio);
    await clipEnds(audio);
    await advance(GAP_MS);
    await metadataArrives(audio);
    await advance(GAP_MS * 2);

    // One timer, so the next clip is loaded once, not once per `ended`.
    expect(load.mock.calls.length - loadsBefore).toBe(1);
    expect(onTrackChange.mock.calls.map(([index]) => index)).toEqual([0, 1]);
  });

  it('reports stopped to the parent when the last clip finishes', async () => {
    const onStopped = vi.fn();
    const onPlayStateChange = vi.fn();
    const { audio } = await mount({ onPlayStateChange, onStopped });
    await act(async () => playButton().click());
    await metadataArrives(audio);
    // Play through to the last clip: each one but the last ends and the next loads.
    for (let clip = 1; clip < SOURCES.length; clip += 1) {
      await clipEnds(audio);
      await advance(0);
      await metadataArrives(audio);
    }
    expect(audio.src).toMatch(/q3\.wav$/);

    await clipEnds(audio);

    expect(onPlayStateChange).toHaveBeenLastCalledWith('stopped');
    expect(onStopped).toHaveBeenCalledWith(SOURCES.length - 1);
    expect(playButton().getAttribute('aria-label')).toBe('Play audio');
  });

  it('starts nothing stale when the parent switches track during the gap', async () => {
    const ref = { current: null as SequenceAudioControllerHandle | null };
    const onTrackChange = vi.fn();
    const { audio } = await mount({ pauseSeconds: GAP_SECONDS, onTrackChange, ref });
    await act(async () => playButton().click());
    await metadataArrives(audio);
    await clipEnds(audio);

    await act(async () => ref.current?.playItem(2));
    await metadataArrives(audio);
    await advance(GAP_MS * 2);

    expect(audio.src).toMatch(/q3\.wav$/);
    expect(onTrackChange.mock.calls.map(([index]) => index)).toEqual([0, 2]);
  });

  it('starts nothing once unmounted during the gap', async () => {
    const { audio, onTrackChange } = await playingFirstClip();
    await clipEnds(audio);
    const load = vi.mocked(HTMLMediaElement.prototype.load);
    const loadsBefore = load.mock.calls.length;

    act(() => root.unmount());
    root = createRoot(container);
    await advance(GAP_MS * 2);

    expect(load.mock.calls.length).toBe(loadsBefore);
    expect(onTrackChange).toHaveBeenLastCalledWith(0);
  });
});

// Audit 2026-10-23 (TODO §E34): a Pause pressed while the next track loaded did not hold,
// because the track played when its metadata arrived; nor did a global stop during the
// gap between tracks. What the learner asked for last now decides, whenever a track is ready.
describe('SequenceAudioController cancelling playback', () => {
  const GAP_SECONDS = 2;
  const GAP_MS = GAP_SECONDS * 1000;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function playButton() {
    const button = container.querySelector('button');
    if (!button) throw new Error('the controller rendered no play button');
    return button;
  }

  const label = () => playButton().getAttribute('aria-label');
  const playCalls = () => vi.mocked(HTMLMediaElement.prototype.play).mock.calls.length;

  /** Mounts with a gap and a ref, presses play and lets the first clip load. */
  async function playingFirstClip() {
    const ref = { current: null as SequenceAudioControllerHandle | null };
    const onTrackChange = vi.fn();
    const { audio } = await mount({ pauseSeconds: GAP_SECONDS, onTrackChange, ref });
    await act(async () => playButton().click());
    await metadataArrives(audio);
    return { audio, ref, onTrackChange };
  }

  /** A row's speaker asks for its track; the track's metadata has not arrived yet. */
  async function requestTrack(ref: { current: SequenceAudioControllerHandle | null }, i: number) {
    await act(async () => ref.current?.playItem(i));
  }

  async function clickPlayButton() {
    await act(async () => playButton().click());
  }

  it('starts nothing when paused while the next track loads', async () => {
    const { audio, ref } = await playingFirstClip();
    await requestTrack(ref, 1);
    const before = playCalls();

    await clickPlayButton();
    expect(label()).toBe('Play audio');
    await metadataArrives(audio);

    expect(playCalls() - before).toBe(0);
    expect(label()).toBe('Play audio');
  });

  it('plays once when resumed after the paused track has loaded', async () => {
    const { audio, ref } = await playingFirstClip();
    await requestTrack(ref, 1);
    await clickPlayButton();
    await metadataArrives(audio);
    const before = playCalls();

    await clickPlayButton();

    expect(playCalls() - before).toBe(1);
    expect(audio.src).toMatch(/q2\.wav$/);
    expect(label()).toBe('Pause audio');
  });

  it('plays once when resumed before the paused track has loaded', async () => {
    const { audio, ref } = await playingFirstClip();
    await requestTrack(ref, 1);
    await clickPlayButton();
    const before = playCalls();

    await clickPlayButton();
    await metadataArrives(audio);

    expect(playCalls() - before).toBe(1);
    expect(audio.src).toMatch(/q2\.wav$/);
    expect(label()).toBe('Pause audio');
  });

  it('starts nothing once unmounted while a track loads', async () => {
    const { audio, ref } = await playingFirstClip();
    await requestTrack(ref, 1);
    const before = playCalls();

    act(() => root.unmount());
    root = createRoot(container);
    await act(async () => audio.dispatchEvent(new Event('loadedmetadata')));

    expect(playCalls() - before).toBe(0);
  });

  it('stays silent when another player starts during the gap', async () => {
    const { audio, onTrackChange } = await playingFirstClip();
    await act(async () => audio.dispatchEvent(new Event('ended')));

    await act(async () => AudioManager.stopAll());
    await act(async () => {
      vi.advanceTimersByTime(GAP_MS * 2);
    });

    expect(audio.src).toMatch(/q1\.wav$/);
    expect(onTrackChange).toHaveBeenLastCalledWith(0);
    expect(label()).toBe('Play audio');
  });

  it('starts nothing when stopped globally while a track loads', async () => {
    const { audio, ref } = await playingFirstClip();
    await requestTrack(ref, 1);
    const before = playCalls();

    await act(async () => AudioManager.stopAll());
    await metadataArrives(audio);

    expect(playCalls() - before).toBe(0);
    expect(label()).toBe('Play audio');
  });

  it('stays stopped when another player starts before this one has played', async () => {
    const onPlayStateChange = vi.fn();
    const { audio } = await mount({ onPlayStateChange });

    // An intro clip above the exercise plays, which stops every other player.
    await act(async () => AudioManager.stopAll());
    expect(onPlayStateChange).not.toHaveBeenCalled();

    await clickPlayButton();
    await metadataArrives(audio);
    expect(audio.src).toMatch(/q1\.wav$/);
    expect(label()).toBe('Pause audio');
  });

  it('follows a play key pressed while a paused track loads', async () => {
    const { audio, ref } = await playingFirstClip();
    await requestTrack(ref, 1);
    await clickPlayButton();

    await act(async () => audio.dispatchEvent(new Event('play')));
    await metadataArrives(audio);

    expect(label()).toBe('Pause audio');
  });

  it('offers play again when a resumed track fails to load', async () => {
    const { audio, ref } = await playingFirstClip();
    await requestTrack(ref, 1);
    await clickPlayButton();
    await clickPlayButton();
    expect(label()).toBe('Pause audio');

    await act(async () => audio.dispatchEvent(new Event('error')));

    expect(label()).toBe('Play audio');
  });

  it('offers play, not cancel, after a pause from outside while a track loads', async () => {
    const { audio, ref } = await playingFirstClip();
    await requestTrack(ref, 1);

    await act(async () => audio.dispatchEvent(new Event('pause')));

    expect(label()).toBe('Play audio');
  });

  // E35: the first play waits for the first clip's metadata. The button showed Play
  // throughout, so a second press asked to play again instead of cancelling.
  describe('while the first clip loads', () => {
    async function pressPlayOnce(props: ControllerProps = {}) {
      const mounted = await mount(props);
      await clickPlayButton();
      return mounted;
    }

    it('offers to cancel, and tells the parent nothing is playing yet', async () => {
      const onPlayStateChange = vi.fn();
      await pressPlayOnce({ onPlayStateChange });

      expect(label()).toBe('Cancel playback');
      expect(onPlayStateChange).not.toHaveBeenCalled();
      expect(playCalls()).toBe(0);
    });

    it('starts nothing when cancelled before the metadata arrives, and stays stopped', async () => {
      const onPlayStateChange = vi.fn();
      const onTrackChange = vi.fn();
      const { audio } = await pressPlayOnce({ onPlayStateChange, onTrackChange });

      await clickPlayButton();
      expect(label()).toBe('Play audio');
      await metadataArrives(audio);

      expect(playCalls()).toBe(0);
      expect(label()).toBe('Play audio');
      // Nothing played, so the parent highlights no row and hears no pause.
      expect(onPlayStateChange).not.toHaveBeenCalled();
      expect(onTrackChange).not.toHaveBeenCalled();
    });

    it('keeps the play when the scrubber moves before the metadata arrives', async () => {
      const { audio, slider } = await pressPlayOnce();

      await act(async () => input(slider, 15));
      expect(label()).toBe('Cancel playback');
      await metadataArrives(audio);

      expect(playCalls()).toBe(1);
      expect(audio.src).toMatch(/q2\.wav$/);
      expect(label()).toBe('Pause audio');
    });

    it('plays once when started again after a cancel', async () => {
      const { audio } = await pressPlayOnce();
      await clickPlayButton();
      await metadataArrives(audio);

      // Stopped again, so the play loads its clip afresh.
      await clickPlayButton();
      await metadataArrives(audio);

      expect(playCalls()).toBe(1);
      expect(audio.src).toMatch(/q1\.wav$/);
      expect(label()).toBe('Pause audio');
    });

    it('plays once when cancelled and started again before the metadata arrives', async () => {
      const { audio } = await pressPlayOnce();
      await clickPlayButton();
      await clickPlayButton();
      expect(label()).toBe('Cancel playback');

      await metadataArrives(audio);

      expect(playCalls()).toBe(1);
      expect(label()).toBe('Pause audio');
    });

    it('starts nothing when stopped globally', async () => {
      const { audio } = await pressPlayOnce();

      await act(async () => AudioManager.stopAll());
      expect(label()).toBe('Play audio');
      await metadataArrives(audio);

      expect(playCalls()).toBe(0);
      expect(label()).toBe('Play audio');
    });

    it('starts nothing once unmounted', async () => {
      const { audio } = await pressPlayOnce();

      act(() => root.unmount());
      root = createRoot(container);
      await metadataArrives(audio);

      expect(playCalls()).toBe(0);
    });

    it('offers play again when the clip fails to load, and plays on a retry', async () => {
      const { audio } = await pressPlayOnce();

      await act(async () => audio.dispatchEvent(new Event('error')));
      expect(label()).toBe('Play audio');

      await clickPlayButton();
      expect(label()).toBe('Cancel playback');
      await metadataArrives(audio);

      expect(playCalls()).toBe(1);
      expect(label()).toBe('Pause audio');
    });
  });

  it('plays on from the next clip when restarted after a stop in the gap', async () => {
    const { audio, onTrackChange } = await playingFirstClip();
    await act(async () => audio.dispatchEvent(new Event('ended')));
    await act(async () => AudioManager.stopAll());

    await clickPlayButton();
    await metadataArrives(audio);

    expect(audio.src).toMatch(/q2\.wav$/);
    expect(onTrackChange.mock.calls.map(([index]) => index)).toEqual([0, 1]);
    expect(label()).toBe('Pause audio');
  });
});
