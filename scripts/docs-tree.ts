/**
 * docs-tree.ts — CLI for `bun run docs:tree`. Writes the generated folder tree into
 * STRUCTURE.md between its `docs:tree` markers (buildlist 30, spec §14).
 *
 * A thin wrapper on purpose. All logic — and the reasoning behind the design, including
 * why the committed tree is checked by a TEST rather than a hook — lives in
 * `src/docs/docs-tree.ts`, next to `src/docs/docs-tree.test.ts` that proves it. Vitest
 * only collects tests under `src/`, so logic placed here would be untestable.
 *
 * Node-side, run by bun after the alias-free rule in `src/docs/docs-tree.ts` — it
 * imports nothing from the app and touches no Vite-only syntax.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { STRUCTURE_PATH, currentTree, spliceTree } from '@/docs/docs-tree';

const before = readFileSync(STRUCTURE_PATH, 'utf8');
const after = spliceTree(before, currentTree());

if (before === after) {
  console.log('docs:tree — STRUCTURE.md already up to date');
} else {
  writeFileSync(STRUCTURE_PATH, after);
  console.log(`docs:tree — wrote ${STRUCTURE_PATH}`);
}
