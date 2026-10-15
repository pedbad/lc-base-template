/**
 * statusAfterManagerChange — how a speaker icon's status follows AudioManager. Pure,
 * so it is tested here; useAudioClip only wires it to the subscription.
 */
import { expect, test } from 'vitest';
import { statusAfterManagerChange } from './clipStatus';

const state = (activeId: string | null, isPlaying: boolean) => ({
  activeId,
  isPlaying,
  volume: 1,
});

test('another clip starting stops this one, playing or paused', () => {
  expect(statusAfterManagerChange(state('b', true), 'a', 'playing')).toBe('stopped');
  expect(statusAfterManagerChange(state('b', true), 'a', 'paused')).toBe('stopped');
  expect(statusAfterManagerChange(state(null, false), 'a', 'playing')).toBe('stopped');
});

test('this clip refused to play (a failed resume) shows paused, not playing', () => {
  expect(statusAfterManagerChange(state('a', false), 'a', 'playing')).toBe('paused');
});

test('nothing changes while this clip plays, or for a stopped clip', () => {
  expect(statusAfterManagerChange(state('a', true), 'a', 'playing')).toBeNull();
  expect(statusAfterManagerChange(state('a', false), 'a', 'paused')).toBeNull();
  expect(statusAfterManagerChange(state('b', true), 'a', 'stopped')).toBeNull();
});
