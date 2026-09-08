/**
 * sandbox-docs-plugin.test.ts — the virtual module that carries the rendered docs into
 * the sandbox bundle (buildlist 18, spec §14).
 *
 * The plugin is thin, and each of the three things it does is a way the single-source
 * promise could break: resolve a name nothing else owns, emit a module that really
 * contains the rendered docs, and register the `.md` files as watched inputs so a saved
 * doc is not stale until someone restarts the dev server.
 */
import { describe, expect, it, vi } from 'vitest';
import { SANDBOX_DOCS_MODULE_ID, sandboxDocs } from './sandbox-docs-plugin';

/** The plugin's hooks are declared as object properties; call them with a `this`. */
const plugin = sandboxDocs();
const resolveId = (id: string) =>
  (plugin.resolveId as (this: unknown, id: string) => string | undefined).call({}, id);

describe('sandboxDocs plugin', () => {
  it('resolves only its own module id', () => {
    expect(resolveId(SANDBOX_DOCS_MODULE_ID)).toBe(`\0${SANDBOX_DOCS_MODULE_ID}`);
    expect(resolveId('virtual:something-else')).toBeUndefined();
    expect(resolveId('./Sandbox')).toBeUndefined();
  });

  it('loads nothing for any other id', () => {
    const load = plugin.load as (this: unknown, id: string) => string | undefined;
    expect(load.call({ addWatchFile: vi.fn() }, 'virtual:other')).toBeUndefined();
  });

  it('emits a module holding every rendered doc', () => {
    const load = plugin.load as (this: unknown, id: string) => string;
    const code = load.call({ addWatchFile: vi.fn() }, `\0${SANDBOX_DOCS_MODULE_ID}`);

    expect(code).toContain('export const SANDBOX_DOC_PAGES');
    // Rendered HTML, not markdown: proof the render ran rather than the file being
    // handed through raw.
    expect(code).toContain('designer--');
    expect(code).not.toContain('## Job 1');
  });

  // Without this, editing DESIGNER.md leaves the sandbox showing the previous version
  // until the dev server is restarted — a stale copy of a single source, which is the
  // failure §14 exists to prevent.
  it('registers every doc as a watched file', () => {
    const addWatchFile = vi.fn();
    const load = plugin.load as (this: unknown, id: string) => string;
    load.call({ addWatchFile }, `\0${SANDBOX_DOCS_MODULE_ID}`);

    const watched = addWatchFile.mock.calls.map((call) => String(call[0]));
    expect(watched).toHaveLength(4);
    expect(watched.some((file) => file.endsWith('DESIGNER.md'))).toBe(true);
    expect(watched.some((file) => file.endsWith('AGENTS.md'))).toBe(true);
  });
});
