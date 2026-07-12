/**
 * Tests for AudioManager's DOM-independent surface — volume clamping, the
 * subscribe/notify contract, and idle state queries. Playback (`play`/`stop`)
 * needs a real HTMLAudioElement, which `bun test` has no DOM for, so those are
 * verified in the showcase instead.
 */
import { afterEach, expect, test } from 'vitest';
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
