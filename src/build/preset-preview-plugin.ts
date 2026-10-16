/**
 * preset-preview-plugin.ts — puts the palette preview on every page in dev and in a
 * `DEBUG=1` build, and on no page of a normal build (TODO §E18).
 *
 * WHAT IT ADDS. One module script, `preset-preview-boot.ts`, to each HTML page Vite
 * transforms: the course landing page (whose built HTML is also the template every LO
 * page is prerendered from, so LO pages carry it too), and the three debug pages. The
 * boot script applies the preset chosen in the sandbox and shows the "Previewing
 * palette" banner.
 *
 * FAIL CLOSED, BY THE SAME FLAG AS THE DEBUG PAGES. A build adds the script only when
 * `isDebugRequested` says yes — one flag, one decision (build-entries.ts). A normal build
 * gets no tag, so Rollup never sees the module, and neither its code nor the preset CSS
 * it reads reaches `dist/`. The dev server always adds it, as it always serves the debug
 * pages.
 *
 * `order: 'pre'`: the tag must be in the HTML before Vite bundles the page's scripts.
 * Added later, a build would ship the source path rather than a bundled chunk.
 *
 * ALIAS-FREE: `vite.config.ts` imports this file, and the config is bundled before its
 * own `resolve.alias` exists.
 */
import type { HtmlTagDescriptor, Plugin } from 'vite';
import { isDebugRequested } from './build-entries';

/** The boot module, as a root-relative source path (as `index.html` names `src/main.tsx`). */
export const PRESET_BOOT_MODULE = '/src/sandbox/preset-preview-boot.ts';

/** The Vite plugin. `env` is a parameter so the fail-closed rule is testable. */
export function presetPreview(env: Record<string, string | undefined> = process.env): Plugin {
  let enabled = false;

  return {
    name: 'lc-preset-preview',
    configResolved(config) {
      enabled = config.command === 'serve' || isDebugRequested(env);
    },
    transformIndexHtml: {
      order: 'pre',
      handler(): HtmlTagDescriptor[] {
        if (!enabled) return [];
        return [
          { tag: 'script', attrs: { type: 'module', src: PRESET_BOOT_MODULE }, injectTo: 'body' },
        ];
      },
    },
  };
}
