/**
 * lo-dev-pages.test.ts — the pure path→folder resolution behind the dev-server
 * middleware. The middleware itself is Vite plumbing (verified in the browser); the
 * decision it makes per request is here, where every edge is cheap to state.
 */
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { devLoFolderForPath, loDevPages } from './lo-dev-pages';

// The plugin reads the folder list from disk; these tests set it per case.
const diskFolders = vi.hoisted(() => ({ list: [] as string[] }));
vi.mock('../lo/lo-folders', () => ({ listLoSlugs: () => diskFolders.list }));

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

  // The dev server runs the build's own check, so a reserved or duplicate slug fails on
  // the first page request instead of only at `bun run build` (review 2026-10-21).
  it('rejects a lesson folder with a reserved slug on any page request', () => {
    const folders = [...FOLDERS, 'lo-02-index'];
    expect(() => devLoFolderForPath('/example.html', folders)).toThrow(/lo-02-index/);
    expect(() => devLoFolderForPath('/', folders)).toThrow(/lo-02-index/);
  });

  it('rejects two lesson folders with the same slug on any page request', () => {
    expect(() => devLoFolderForPath('/example.html', [...FOLDERS, 'lo-07-example'])).toThrow(
      /lo-00-example and lo-config\/lo-07-example/,
    );
  });

  it('leaves asset requests alone even when a folder is wrong', () => {
    expect(devLoFolderForPath('/src/main.tsx', [...FOLDERS, 'lo-02-index'])).toBeUndefined();
  });
});

/** A plugin hook as Vite calls it: the function itself, not an object hook. */
function hook<T>(value: unknown): T {
  return value as T;
}

describe('loDevPages on vite build', () => {
  beforeEach(() => {
    diskFolders.list = ['lo-00-example'];
  });

  function startBuild(command: 'build' | 'serve') {
    const plugin: Plugin = loDevPages();
    hook<(config: object, env: { command: string }) => void>(plugin.config)({}, { command });
    return () => hook<() => void>(plugin.buildStart)();
  }

  it('stops the build before any output when a lesson takes a reserved name', () => {
    diskFolders.list = ['lo-00-example', 'lo-01-index'];
    expect(startBuild('build')).toThrow(/lo-config\/lo-01-index derives the slug "index"/);
  });

  it('lets a build with good lesson names start', () => {
    expect(startBuild('build')).not.toThrow();
  });

  it('leaves the dev server to check per request', () => {
    diskFolders.list = ['lo-01-index'];
    expect(startBuild('serve')).not.toThrow();
  });
});

describe('loDevPages on the dev server', () => {
  type Handler = (req: object, res: object, next: (error?: unknown) => void) => void;

  /** Mounts the middleware on a fake server whose LO reader does what `loadLo` says. */
  function middleware(loadLo: (folder: string) => unknown) {
    let handler: Handler | undefined;
    const transformIndexHtml = vi.fn(async () => '<div id="root"></div>');
    const server = {
      config: { base: '/', root: path.resolve(import.meta.dirname, '../..') },
      middlewares: { use: (fn: Handler) => (handler = fn) },
      ssrLoadModule: vi.fn(async () => ({ loadLo })),
      transformIndexHtml,
    };
    hook<(server: ViteDevServer) => void>(loDevPages().configureServer)(
      server as unknown as ViteDevServer,
    );
    if (!handler) throw new Error('the plugin registered no middleware');
    const serve = handler;

    /** Requests `url`; resolves with what reached `next`, or the body sent. */
    const request = (url: string) =>
      new Promise<{ error?: unknown; body?: string }>((resolve) => {
        const res = {
          statusCode: 0,
          setHeader: () => {},
          end: (body: string) => resolve({ body }),
        };
        serve({ method: 'GET', url }, res, (error) => resolve({ error }));
      });
    return { request, server, transformIndexHtml };
  }

  beforeEach(() => {
    diskFolders.list = ['lo-00-example'];
  });

  it('answers a lesson page that loads, stamped with its folder', async () => {
    const { request, server } = middleware(() => ({}));
    const { body } = await request('/example.html');
    expect(server.ssrLoadModule).toHaveBeenCalledWith('/src/lo/load-lo-disk.ts');
    expect(body).toContain('lo-00-example');
  });

  it('fails a lesson page whose content the Node reader rejects, naming the file', async () => {
    const invalid = new Error(
      'lo-config/lo-00-example/exercises/01-select/exercise.json is invalid',
    );
    const { request, transformIndexHtml } = middleware(() => {
      throw invalid;
    });
    expect((await request('/example.html')).error).toBe(invalid);
    expect(transformIndexHtml).not.toHaveBeenCalled();
  });

  it('fails any page request while a lesson folder takes a reserved name', async () => {
    diskFolders.list = ['lo-00-example', 'lo-02-code-style'];
    const { request, server } = middleware(() => ({}));
    const { error } = await request('/');
    expect(String(error)).toMatch(/lo-02-code-style derives the slug "code-style"/);
    expect(server.ssrLoadModule).not.toHaveBeenCalled();
  });
});
