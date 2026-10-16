/**
 * preset-preview-boot.ts — applies the previewed palette on whatever page loads it
 * (TODO §E18). The preset-preview Vite plugin adds this script to every page in dev
 * and in a `DEBUG=1` build, and to no page of a normal build.
 *
 * On load it reads the choice (preset-choice.ts), injects that preset's CSS and shows
 * the banner. It then follows changes: the sandbox's drop-down and the banner's Reset
 * in this tab (PRESET_CHANGE_EVENT), and a choice made in another tab (`storage`).
 *
 * Outside React's `#root` entirely, so prerendered markup still equals the first client
 * render (AGENTS.md hard constraint 4). The cost is a moment of the default colours
 * before this runs, which a debug preview accepts.
 */
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PresetBanner } from './PresetBanner';
import { PRESET_CHANGE_EVENT, PRESET_STORAGE_KEY, readChoice, writeChoice } from './preset-choice';
import { TOKEN_PRESETS, applyTokenPreset } from './preset-preview';

let bannerRoot: Root | null = null;

function reset() {
  writeChoice(localStorage, null);
  window.dispatchEvent(new Event(PRESET_CHANGE_EVENT));
}

function showBanner(label: string | null) {
  if (label === null) {
    bannerRoot?.unmount();
    bannerRoot = null;
    document.getElementById('preset-banner-root')?.remove();
    return;
  }
  if (!bannerRoot) {
    const host = document.createElement('div');
    host.id = 'preset-banner-root';
    document.body.append(host);
    bannerRoot = createRoot(host);
  }
  bannerRoot.render(createElement(PresetBanner, { label, onReset: reset }));
}

function sync() {
  const id = readChoice(localStorage);
  const preset = TOKEN_PRESETS.find((p) => p.id === id);
  // A remembered preset whose file has since gone: forget it rather than keep asking.
  if (id !== null && !preset) writeChoice(localStorage, null);
  applyTokenPreset(document, preset?.css ?? null);
  showBanner(preset?.label ?? null);
}

sync();
window.addEventListener(PRESET_CHANGE_EVENT, sync);
window.addEventListener('storage', (event) => {
  if (event.key === PRESET_STORAGE_KEY || event.key === null) sync();
});
