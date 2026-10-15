/**
 * Tests for AudioManager's DOM-independent surface — volume clamping, the
 * subscribe/notify contract, and idle state queries. This suite has no DOM, so
 * playback runs against `FakeAudio` below: enough of HTMLAudioElement to model a
 * `play()` that the browser refuses (TODO §E13b). Real playback is checked by hand in
 * the showcase; no browser test plays audio yet (TODO §E12c).
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import AudioManager, { type AudioManagerState } from './AudioManager';

afterEach(() => {
  // Reset shared singleton state between tests.
  AudioManager.setVolume(1);
});

test('AudioManager: idle state — nothing active, not playing', () => {
  expect(AudioManager.getActiveId()).toBeNull();
  expect(AudioManager.isPlaying()).toBe(false);
});

test('AudioManager: setVolume clamps to [0, 1]', () => {
  AudioManager.setVolume(2);
  expect(AudioManager.getVolume()).toBe(1);
  AudioManager.setVolume(-1);
  expect(AudioManager.getVolume()).toBe(0);
  AudioManager.setVolume(0.5);
  expect(AudioManager.getVolume()).toBe(0.5);
});

test('AudioManager: subscribe receives a snapshot on change and unsubscribe stops it', () => {
  const seen: number[] = [];
  const unsubscribe = AudioManager.subscribe((state) => seen.push(state.volume));

  AudioManager.setVolume(0.25);
  expect(seen).toEqual([0.25]);

  unsubscribe();
  AudioManager.setVolume(0.75);
  expect(seen).toEqual([0.25]); // no further notifications after unsubscribe
});

test('AudioManager: snapshot carries activeId, isPlaying and volume', () => {
  const snapshots: AudioManagerState[] = [];
  const unsubscribe = AudioManager.subscribe((state) => snapshots.push(state));
  AudioManager.setVolume(0.4);
  unsubscribe();

  expect(snapshots.at(-1)).toEqual({ activeId: null, isPlaying: false, volume: 0.4 });
});

/**
 * Enough of HTMLAudioElement for play/pause/resume. Like a browser, `play()` clears
 * `paused` at once; a refused play (autoplay policy, a missing file) rejects later and
 * sets `paused` again.
 */
class FakeAudio {
  static refuseNextPlay = false;
  static interruptNextPlay = false;
  paused = true;
  ended = false;
  volume = 1;
  currentTime = 0;
  private listeners = new Map<string, () => void>();
  addEventListener(type: string, listener: () => void) {
    this.listeners.set(type, listener);
  }
  /** Fire a media event, as the browser does for a missing or unplayable file. */
  dispatch(type: string) {
    this.listeners.get(type)?.();
  }
  pause() {
    this.paused = true;
  }
  play(): Promise<void> {
    this.paused = false;
    if (FakeAudio.interruptNextPlay) {
      FakeAudio.interruptNextPlay = false;
      const abort = Object.assign(new Error('interrupted by pause()'), { name: 'AbortError' });
      return Promise.reject(abort);
    }
    if (!FakeAudio.refuseNextPlay) return Promise.resolve();
    FakeAudio.refuseNextPlay = false;
    return Promise.resolve().then(() => {
      this.paused = true;
      throw new Error('NotAllowedError');
    });
  }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('AudioManager when the browser refuses to play', () => {
  afterEach(() => {
    AudioManager.stopAll();
    FakeAudio.refuseNextPlay = false;
    FakeAudio.interruptNextPlay = false;
    delete (globalThis as { Audio?: unknown }).Audio;
    vi.restoreAllMocks();
  });

  function setUp() {
    (globalThis as { Audio?: unknown }).Audio = FakeAudio;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const states: AudioManagerState[] = [];
    const unsubscribe = AudioManager.subscribe((state) => states.push(state));
    return { warn, states, unsubscribe };
  }

  test('a refused resume ends with subscribers told it is not playing, and says why', async () => {
    const { warn, states, unsubscribe } = setUp();
    AudioManager.play('a.mp3', { id: 'a' });
    await settle();
    AudioManager.pause('a');

    FakeAudio.refuseNextPlay = true;
    AudioManager.resume('a');
    await settle();
    unsubscribe();

    expect(states.at(-1)).toMatchObject({ activeId: 'a', isPlaying: false });
    expect(warn).toHaveBeenCalled();
  });

  test('a refused play clears the clip, tells the caller and says why', async () => {
    const { warn, states, unsubscribe } = setUp();
    const onError = vi.fn();
    FakeAudio.refuseNextPlay = true;
    AudioManager.play('a.mp3', { id: 'a', onError });
    await settle();
    unsubscribe();

    expect(states.at(-1)).toMatchObject({ activeId: null, isPlaying: false });
    expect(onError).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalled();
  });

  test('a play interrupted by a pause is not a failure: no onError, no warning', async () => {
    const { warn, unsubscribe } = setUp();
    const onError = vi.fn();
    FakeAudio.interruptNextPlay = true;
    AudioManager.play('a.mp3', { id: 'a', onError });
    await settle();
    unsubscribe();

    expect(onError).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(AudioManager.getActiveId()).toBe('a');
  });

  test('a file that fires error AND refuses to play calls onError once', async () => {
    const { unsubscribe } = setUp();
    const onError = vi.fn();
    FakeAudio.refuseNextPlay = true;
    const audio = AudioManager.play('missing.mp3', { id: 'a', onError }) as unknown as FakeAudio;
    await settle(); // the refusal first: browsers may order the two either way
    audio.dispatch('error');
    unsubscribe();

    expect(onError).toHaveBeenCalledOnce();
  });

  test('a refusal that arrives after another clip took over leaves the new clip alone', async () => {
    const { warn, unsubscribe } = setUp();
    const onError = vi.fn();
    FakeAudio.refuseNextPlay = true;
    AudioManager.play('a.mp3', { id: 'a', onError });
    AudioManager.play('b.mp3', { id: 'b' });
    await settle();
    unsubscribe();

    expect(AudioManager.getActiveId()).toBe('b');
    expect(onError).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });
});
