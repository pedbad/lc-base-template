/**
 * asset-path.test.ts — guard c (buildlist 21).
 *
 * Each `it` that names a violation is a DELIBERATELY BROKEN sample proved to be
 * caught; the two sweeps at the bottom then assert the real repo is clean. A guard
 * whose failure nobody has watched may simply be asleep.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { findRawAssetSinks, findRelativeHeadAssets, guardedSourceFiles } from './asset-path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');

describe('findRawAssetSinks — catches a hand-built asset URL', () => {
  it('flags a JSX src with a bare asset path', () => {
    const found = findRawAssetSinks(`<img src="images/hero.png" alt="" />`);
    expect(found).toHaveLength(1);
    expect(found[0]?.value).toBe('images/hero.png');
  });

  it('flags the brace-and-quote form too', () => {
    expect(findRawAssetSinks(`<source src={'audio/q1.mp3'} />`)).toHaveLength(1);
    expect(findRawAssetSinks('<source src={`audio/q1.mp3`} />')).toHaveLength(1);
  });

  it('flags a root-relative path — leading slash is not the same as base-rooted', () => {
    expect(findRawAssetSinks(`<img src="/images/hero.png" />`)).toHaveLength(1);
  });

  it('flags an href to another page — the LO-slug case', () => {
    expect(findRawAssetSinks(`<a href="example.html">go</a>`)).toHaveLength(1);
  });

  it('flags the runtime playback and fetch sinks', () => {
    expect(findRawAssetSinks(`AudioManager.play('audio/q1.mp3')`)).toHaveLength(1);
    expect(findRawAssetSinks(`new Audio('audio/q1.m4a')`)).toHaveLength(1);
    expect(findRawAssetSinks(`fetch('audio/q1.wav')`)).toHaveLength(1);
  });

  it('reports where it found it, so the failure is actionable', () => {
    const found = findRawAssetSinks(`const a = 1;\n<img src="images/hero.png" />`, 'Thing.tsx');
    expect(found[0]?.file).toBe('Thing.tsx');
    expect(found[0]?.line).toBe(2);
  });
});

describe('findRawAssetSinks — leaves correct and irrelevant code alone', () => {
  // The accept path falls out of the design: a resolveAsset() call is not a string
  // literal, so the literal-matching patterns never see it.
  it('passes a path routed through resolveAsset()', () => {
    expect(findRawAssetSinks(`<img src={resolveAsset(lesson.image)} />`)).toEqual([]);
    expect(findRawAssetSinks(`<a href={resolveAsset(\`\${slug}.html\`)} />`)).toEqual([]);
    expect(findRawAssetSinks(`AudioManager.play(resolveAsset(soundFile))`)).toEqual([]);
  });

  it('passes URLs that must never be rewritten', () => {
    expect(findRawAssetSinks(`<img src="https://cdn.example.com/a.png" />`)).toEqual([]);
    expect(findRawAssetSinks(`<img src="data:image/svg+xml;base64,AAA" />`)).toEqual([]);
    expect(findRawAssetSinks(`<a href="mailto:x@example.ac.uk">mail</a>`)).toEqual([]);
    expect(findRawAssetSinks(`<a href="%BASE_URL%favicon.svg" />`)).toEqual([]);
  });

  // Footer's placeholder links, and in-page anchors. Not assets.
  it('passes fragment and non-asset hrefs', () => {
    expect(findRawAssetSinks(`<a href="#">Accessibility</a>`)).toEqual([]);
    expect(findRawAssetSinks(`<a href="#main-content">Skip</a>`)).toEqual([]);
  });

  // THE FALSE-POSITIVE TRAP. Authored paths in LO JSON and fixtures are DATA and are
  // supposed to be bare — resolveAsset() resolves them at render. A guard that flagged
  // these would fire on every fixture in the repo and be switched off as useless.
  it('passes an authored path sitting in a data key', () => {
    expect(findRawAssetSinks(`{ audio: 'audio/showcase-demo/q1.mp3' }`)).toEqual([]);
    expect(findRawAssetSinks(`{ image: 'images/lo-placeholder.svg' }`)).toEqual([]);
  });

  it('passes a module import, which the bundler owns', () => {
    expect(findRawAssetSinks(`import './word-spot.css';`)).toEqual([]);
  });

  // Nothing in a comment is fetched. This guard's own header quotes the example it
  // warns about, so without stripping it would flag itself.
  it('passes a path inside a comment, including commented-out code', () => {
    expect(findRawAssetSinks(`// bad: <img src="images/hero.png" />`)).toEqual([]);
    expect(findRawAssetSinks(`/* e.g. src="audio/q1.mp3" */`)).toEqual([]);
    expect(findRawAssetSinks(`/**\n * <img src="images/hero.png" />\n */`)).toEqual([]);
  });

  // A naive stripper would treat the `//` in a URL as a comment start and swallow the
  // rest of the line — silently blinding the guard to anything after it.
  it('does not mistake the // inside a URL for a comment', () => {
    const found = findRawAssetSinks(
      `const cdn = "https://x.example/a.png"; <img src="images/hero.png" />`,
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.value).toBe('images/hero.png');
  });
});

describe('findRelativeHeadAssets — static <head> links (anti-pattern #28)', () => {
  // Vite rewrites relative URLs inside PROCESSED assets (JS/CSS) but leaves static
  // <head> hrefs untouched, so a relative favicon resolves against the current page:
  // fine at the base root, 404 on every deeper slug route.
  it('flags a relative <link> href', () => {
    const found = findRelativeHeadAssets(`<link rel="icon" href="favicon.svg" />`);
    expect(found).toHaveLength(1);
    expect(found[0]?.value).toBe('favicon.svg');
  });

  it('flags a root-relative one, which still ignores the base', () => {
    expect(findRelativeHeadAssets(`<link rel="apple-touch-icon" href="/icon.png" />`)).toHaveLength(
      1,
    );
  });

  it('passes a %BASE_URL%-prefixed href', () => {
    expect(findRelativeHeadAssets(`<link rel="icon" href="%BASE_URL%favicon.svg" />`)).toEqual([]);
  });

  it('passes an absolute stylesheet URL', () => {
    expect(
      findRelativeHeadAssets(`<link rel="stylesheet" href="https://fonts.example.com/x.css" />`),
    ).toEqual([]);
  });

  // The module entry IS processed by Vite, which rewrites it against the base.
  it('ignores the script module entry', () => {
    expect(findRelativeHeadAssets(`<script type="module" src="/src/main.tsx"></script>`)).toEqual(
      [],
    );
  });
});

describe('the repo itself obeys guard c', () => {
  it('scans a meaningful number of source files', () => {
    expect(guardedSourceFiles(REPO_ROOT).length).toBeGreaterThan(50);
  });

  it('builds no asset URL by hand in shipped source', () => {
    const violations = guardedSourceFiles(REPO_ROOT).flatMap((file) =>
      findRawAssetSinks(readFileSync(file, 'utf-8'), path.relative(REPO_ROOT, file)),
    );
    expect(
      violations,
      `route these through resolveAsset():\n${violations
        .map((v) => `  ${v.file}:${v.line} → ${v.sink}="${v.value}"`)
        .join('\n')}`,
    ).toEqual([]);
  });

  it('prefixes every static <head> asset with %BASE_URL%', () => {
    const violations = ['index.html', 'exercise-showcase.html', 'debug-sandbox.html'].flatMap(
      (name) => findRelativeHeadAssets(readFileSync(path.join(REPO_ROOT, name), 'utf-8'), name),
    );
    expect(
      violations,
      `prefix with %BASE_URL%:\n${violations.map((v) => `  ${v.file}:${v.line} → "${v.value}"`).join('\n')}`,
    ).toEqual([]);
  });
});
