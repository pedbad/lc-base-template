/**
 * AudioManager — the single owner of "what is playing right now" (spec §8, audio
 * "ported once"). One module-level instance enforces a global single-active-clip
 * policy: starting any clip stops the others, so two exercises can never play over
 * each other. Components subscribe for reactive state; off-DOM `Audio` elements are
 * created on demand and `<audio>` elements register so they can be stopped too.
 *
 * Ported from french-lo-1's audio/AudioManager.js (typed). It is a deliberate
 * stateful singleton (a store), so internal mutation is expected; every snapshot
 * handed to subscribers is a fresh object.
 */

/** Reactive snapshot delivered to subscribers on every state change. */
export interface AudioManagerState {
  activeId: string | null;
  isPlaying: boolean;
  volume: number;
}

export interface PlayOptions {
  /** Stable id for the clip, so subscribers can tell which clip is active. */
  id?: string | null;
  /** Stop every other clip before starting this one (default true). */
  exclusive?: boolean;
  onEnded?: () => void;
  onError?: () => void;
}

type Listener = (state: AudioManagerState) => void;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

class AudioManager {
  private activeAudio: HTMLAudioElement | null = null;
  private activeId: string | null = null;
  private registeredElements = new Set<HTMLAudioElement>();
  private volume = 1;
  private listeners = new Set<Listener>();

  // --- Playback ------------------------------------------------------------

  play(source: string, { id = null, exclusive = true, onEnded, onError }: PlayOptions = {}) {
    if (exclusive) this.stopAll();

    const audio = new Audio(source);
    audio.volume = this.volume;

    audio.addEventListener(
      'ended',
      () => {
        if (this.activeAudio === audio) this.clearActive();
        onEnded?.();
      },
      { once: true },
    );

    audio.addEventListener(
      'error',
      () => {
        if (this.activeAudio === audio) this.clearActive();
        onError?.();
      },
      { once: true },
    );

    this.activeAudio = audio;
    this.activeId = id;

    // Start playback BEFORE notifying: HTMLMediaElement.play() flips .paused
    // synchronously, so subscribers see isPlaying: true the moment a clip starts.
    audio.play().catch(() => {
      // Only clear if this clip is still active — a stopAll() from rapid switching
      // may already have replaced it, and we must not clobber the new clip.
      if (this.activeAudio === audio) this.clearActive();
    });
    this.notify();
    return audio;
  }

  pause(id: string | null = null) {
    if (id && id !== this.activeId) return;
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.notify();
    }
  }

  /**
   * Resume the current paused clip without creating a new Audio. Stops `<audio>`
   * and registered elements first (they are not the active off-DOM clip).
   */
  resume(id: string | null = null) {
    if (id && id !== this.activeId) return;
    if (!this.activeAudio) return;
    if (typeof document !== 'undefined') {
      document.querySelectorAll('audio').forEach((el) => el.pause());
    }
    this.registeredElements.forEach((el) => el.pause());
    this.activeAudio.play().catch(() => {});
    this.notify();
  }

  stop(id: string | null = null) {
    if (id && id !== this.activeId) return;
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
      this.clearActive();
    }
  }

  /** Stop everything. `except` optionally skips one DOM element (e.g. a native clip
   *  whose own onPlay fired). */
  stopAll({ except = null }: { except?: HTMLAudioElement | null } = {}) {
    if (this.activeAudio && this.activeAudio !== except) {
      this.activeAudio.pause();
      this.activeAudio = null;
      this.activeId = null;
    }
    if (typeof document !== 'undefined') {
      document.querySelectorAll('audio').forEach((el) => {
        if (el !== except) el.pause();
      });
    }
    this.registeredElements.forEach((el) => {
      if (el !== except) el.pause();
    });
    this.notify();
  }

  // --- DOM <audio> registration (used by SequenceAudioController) -----------

  registerElement(audioEl: HTMLAudioElement | null) {
    if (audioEl) this.registeredElements.add(audioEl);
  }

  unregisterElement(audioEl: HTMLAudioElement) {
    this.registeredElements.delete(audioEl);
  }

  // --- Volume --------------------------------------------------------------

  setVolume(value: number) {
    this.volume = clamp01(value);
    if (this.activeAudio) this.activeAudio.volume = this.volume;
    this.registeredElements.forEach((el) => {
      el.volume = this.volume;
    });
    this.notify();
  }

  getVolume(): number {
    return this.volume;
  }

  // --- State query (non-reactive) ------------------------------------------

  getActiveId(): string | null {
    return this.activeId;
  }

  isPlaying(): boolean {
    if (this.activeAudio) return !this.activeAudio.paused && !this.activeAudio.ended;
    for (const el of this.registeredElements) {
      if (!el.paused && !el.ended) return true;
    }
    return false;
  }

  // --- Subscription (used by useAudioClip / useAudio) ----------------------

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private clearActive() {
    this.activeAudio = null;
    this.activeId = null;
    this.notify();
  }

  private notify() {
    const state: AudioManagerState = {
      activeId: this.activeId,
      isPlaying: this.isPlaying(),
      volume: this.volume,
    };
    this.listeners.forEach((fn) => fn(state));
  }
}

/** The shared singleton. Import this default everywhere — never construct another. */
export default new AudioManager();
