/**
 * lo-dev-pages.test.ts — the pure path→folder resolution behind the dev-server
 * middleware. The middleware itself is Vite plumbing (verified in the browser); the
 * decision it makes per request is here, where every edge is cheap to state.
 */
import { describe, expect, it } from 'vitest';
import { devLoFolderForPath } from './lo-dev-pages';

const FOLDERS = ['lo-00-example', 'lo-01-going-to-a-cafe'];

describe('devLoFolderForPath', () => {
  it('resolves an LO page URL to the folder that renders it', () => {
    expect(devLoFolderForPath('/example.html', FOLDERS)).toBe('lo-00-example');
    expect(devLoFolderForPath('/going-to-a-cafe.html', FOLDERS)).toBe('lo-01-going-to-a-cafe');
  });

  // The landing page is Vite's own index.html — the middleware must not claim it, or
  // `/` would render an LO again, which is the bug this whole phase removed.
  it('declines the site root', () => {
    expect(devLoFolderForPath('/', FOLDERS)).toBeUndefined();
    expect(devLoFolderForPath('/index.html', FOLDERS)).toBeUndefined();
  });

  // Declining hands the request back to Vite, whose SPA fallback answers an unknown
  // `.html` with the landing page. Not this module's call to make — but worth knowing
  // that a typo'd slug in dev looks like the landing page, not a 404.
  it('declines a slug no LO folder derives', () => {
    expect(devLoFolderForPath('/greetings.html', FOLDERS)).toBeUndefined();
  });

  // Other entries and real assets must reach the middlewares that own them.
  it('declines other pages and asset paths', () => {
    expect(devLoFolderForPath('/exercise-showcase.html', FOLDERS)).toBeUndefined();
    expect(devLoFolderForPath('/images/lo-placeholder.svg', FOLDERS)).toBeUndefined();
    expect(devLoFolderForPath('/src/main.tsx', FOLDERS)).toBeUndefined();
  });

  // A page lives at the root, so a nested lookalike is not that page.
  it('declines a nested path that ends in a known slug', () => {
    expect(devLoFolderForPath('/nested/example.html', FOLDERS)).toBeUndefined();
  });

  it('declines an extensionless path — LO pages are .html', () => {
    expect(devLoFolderForPath('/example', FOLDERS)).toBeUndefined();
  });

  it('is empty-course safe', () => {
    expect(devLoFolderForPath('/example.html', [])).toBeUndefined();
  });

  // Fail fast and loud: a malformed folder name is a build error waiting to happen,
  // and the dev server is where an author will meet it first.
  it('propagates a malformed folder name', () => {
    expect(() => devLoFolderForPath('/example.html', ['stray'])).toThrow(/stray/);
  });
});
