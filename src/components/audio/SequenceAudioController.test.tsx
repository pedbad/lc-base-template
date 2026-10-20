// @vitest-environment happy-dom
/**
 * SequenceAudioController.test.tsx — the master scrubber's drag, replayed event by event
 * (TODO §E23). The suite's only DOM test: a drag is pointer and `input` events in an
 * order that differs between browsers, which static markup cannot show. The component is
 * mounted for real on happy-dom's audio, whose clips are given the lengths below.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SequenceAudioController } from './SequenceAudioController';

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

/** Mounts the controller and lets the clip lengths load, so the scrubber has a range. */
async function mount() {
  await act(async () => root.render(<SequenceAudioController sources={SOURCES} />));
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
});
