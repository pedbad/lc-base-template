/**
 * sandbox-docs.d.ts — types for the `virtual:sandbox-docs` module.
 *
 * The module has no file behind it: `src/build/sandbox-docs-plugin.ts` generates it at
 * dev-server / build time from the markdown docs. TypeScript cannot infer a virtual
 * module, so its shape is declared here and its element type is imported from the
 * renderer, which keeps the two from drifting.
 */
declare module 'virtual:sandbox-docs' {
  import type { SandboxDocPage } from '@/build/docs-markdown';

  export const SANDBOX_DOC_PAGES: readonly SandboxDocPage[];
}
