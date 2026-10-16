/**
 * preset-preview-plugin.test.ts — the palette preview reaches every page in dev and in
 * a `DEBUG=1` build, and NOTHING of it reaches a normal build (TODO §E18; the same
 * fail-closed rule as DEBUG_ENTRY_FILES, AGENTS.md hard constraint 6).
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { HtmlTagDescriptor, IndexHtmlTransformHook, Plugin, ResolvedConfig } from 'vite';
import { describe, expect, test } from 'vitest';
import { PRESET_BOOT_MODULE, presetPreview } from './preset-preview-plugin';

const ROOT = path.resolve(import.meta.dirname, '../..');

/** The tags the plugin adds to a page, for one command and environment. */
function tagsFor(command: 'serve' | 'build', env: Record<string, string | undefined>) {
  const plugin: Plugin = presetPreview(env);
  const configResolved = plugin.configResolved as (config: ResolvedConfig) => void;
  configResolved({ command } as ResolvedConfig);
  const hook = plugin.transformIndexHtml as { order: string; handler: IndexHtmlTransformHook };
  return hook.handler.call(undefined as never, '<html></html>', {} as never) as HtmlTagDescriptor[];
}

describe('presetPreview', () => {
  test('adds nothing to a normal build', () => {
    expect(tagsFor('build', {})).toEqual([]);
  });

  test('adds nothing when the flag is explicitly off', () => {
    expect(tagsFor('build', { DEBUG: '0' })).toEqual([]);
    expect(tagsFor('build', { DEBUG: 'false' })).toEqual([]);
  });

  test('adds the preview script to every page of a DEBUG=1 build', () => {
    expect(tagsFor('build', { DEBUG: '1' })).toEqual([
      {
        tag: 'script',
        attrs: { type: 'module', src: PRESET_BOOT_MODULE },
        injectTo: 'body',
      },
    ]);
  });

  // The dev server already serves every debug page unconditionally (build-entries.ts).
  test('adds it on the dev server, flag or not', () => {
    expect(tagsFor('serve', {})).toHaveLength(1);
  });

  // `pre`: the tag must be in the HTML before Vite bundles the page's scripts, or a
  // build would ship the source path instead of a bundled chunk.
  test('runs before Vite processes the page', () => {
    const hook = presetPreview({}).transformIndexHtml as { order: string };
    expect(hook.order).toBe('pre');
  });

  test('points at a module that exists', () => {
    expect(existsSync(path.join(ROOT, PRESET_BOOT_MODULE))).toBe(true);
  });
});
