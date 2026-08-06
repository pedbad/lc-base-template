import { describe, expect, it } from 'vitest';
import { buildPrerenderedHtml, injectRootDiv } from './prerender-html';

/**
 * A stand-in for Vite's BUILT index.html: the hashed asset tags are what the real
 * template contributes, so every case asserts they survive untouched.
 */
const TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/base/favicon.svg" />
    <meta
      name="description"
      content="Stock template description."
    />
    <title>lc-base-template</title>
    <script type="module" crossorigin src="/base/assets/main-DKLXWUsE.js"></script>
    <link rel="stylesheet" crossorigin href="/base/assets/main-B7xQ2p1a.css" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

const input = {
  template: TEMPLATE,
  appHtml: '<main id="content"><h1>Example Learning Object</h1></main>',
  loFolder: 'lo-00-example',
  title: 'Example Learning Object',
  description: 'An example LO.',
};

/**
 * The shared root-div anchor. The dev-server middleware stamps `data-lo-folder`
 * through this same function, so dev and the build cannot disagree about what a
 * mounted LO page looks like — there is one place that knows the anchor.
 */
describe('injectRootDiv', () => {
  it('stamps the LO folder with no markup, for the dev server', () => {
    const html = injectRootDiv(TEMPLATE, { loFolder: 'lo-00-example' });

    expect(html).toContain('<div id="root" data-lo-folder="lo-00-example"></div>');
  });

  it('stamps folder and markup together, for a prerendered page', () => {
    const html = injectRootDiv(TEMPLATE, { loFolder: 'lo-00-example', appHtml: '<main></main>' });

    expect(html).toContain('<div id="root" data-lo-folder="lo-00-example"><main></main></div>');
  });

  it('stamps no folder at all for the landing page', () => {
    const html = injectRootDiv(TEMPLATE, {});

    expect(html).toContain('<div id="root"></div>');
    expect(html).not.toContain('data-lo-folder');
  });

  it('replaces a folder the template already carried', () => {
    const template = TEMPLATE.replace(
      '<div id="root"></div>',
      '<div id="root" data-lo-folder="lo-99-dev"></div>',
    );

    expect(injectRootDiv(template, { loFolder: 'lo-00-example' })).not.toContain('lo-99-dev');
  });

  it('throws naming the anchor when the template has no empty root div', () => {
    const template = TEMPLATE.replace('<div id="root"></div>', '<div id="app"></div>');

    expect(() => injectRootDiv(template, { loFolder: 'lo-00-example' })).toThrow(/id="root"/);
  });

  it('escapes a folder name that carries HTML-significant characters', () => {
    expect(injectRootDiv(TEMPLATE, { loFolder: 'lo-00-"x' })).toContain(
      'data-lo-folder="lo-00-&quot;x"',
    );
  });
});

describe('buildPrerenderedHtml', () => {
  it('keeps the hashed script and stylesheet tags the build emitted', () => {
    const html = buildPrerenderedHtml(input);

    expect(html).toContain('src="/base/assets/main-DKLXWUsE.js"');
    expect(html).toContain('href="/base/assets/main-B7xQ2p1a.css"');
    expect(html).toContain('href="/base/favicon.svg"');
  });

  it('puts the rendered app inside the root div', () => {
    const html = buildPrerenderedHtml(input);

    expect(html).toContain(
      '<div id="root" data-lo-folder="lo-00-example"><main id="content"><h1>Example Learning Object</h1></main></div>',
    );
    expect(html).not.toContain('<div id="root"></div>');
  });

  it('replaces the stock title with the LO title', () => {
    const html = buildPrerenderedHtml(input);

    expect(html).toContain('<title>Example Learning Object</title>');
    expect(html).not.toContain('lc-base-template');
  });

  it('replaces the stock description with the LO description', () => {
    const html = buildPrerenderedHtml(input);

    expect(html).toContain('<meta name="description" content="An example LO." />');
    expect(html).not.toContain('Stock template description.');
  });

  it('drops the description meta entirely when the LO declares none', () => {
    const html = buildPrerenderedHtml({ ...input, description: undefined });

    expect(html).not.toContain('name="description"');
    expect(html).not.toContain('Stock template description.');
  });

  it('escapes HTML-significant characters in the title and description', () => {
    const html = buildPrerenderedHtml({
      ...input,
      title: 'Tu & vous: "formal" <address>',
      description: 'Uses <em> & "quotes".',
    });

    expect(html).toContain('<title>Tu &amp; vous: &quot;formal&quot; &lt;address&gt;</title>');
    expect(html).toContain('content="Uses &lt;em&gt; &amp; &quot;quotes&quot;."');
  });

  it("replaces the template's own data-lo-folder with this page's LO", () => {
    const template = TEMPLATE.replace(
      '<div id="root"></div>',
      '<div id="root" data-lo-folder="lo-99-dev"></div>',
    );

    const html = buildPrerenderedHtml({ ...input, template });

    expect(html).toContain('data-lo-folder="lo-00-example"');
    expect(html).not.toContain('lo-99-dev');
  });

  // The landing page is not an LO: it has no folder to name, and stamping one would
  // make the client entry hydrate a lesson over the course index (Phase D).
  describe('with no loFolder — the course landing page', () => {
    const landing = {
      template: TEMPLATE,
      appHtml: '<main id="content"><h1>Bienvenido</h1></main>',
      title: 'Cambridge Spanish — Level 1',
      description: 'Start your Spanish journey',
    };

    it('mounts the page without stamping a data-lo-folder', () => {
      const html = buildPrerenderedHtml(landing);

      expect(html).toContain('<div id="root"><main id="content"><h1>Bienvenido</h1></main></div>');
      expect(html).not.toContain('data-lo-folder');
    });

    it("drops the template's own data-lo-folder rather than inheriting it", () => {
      const template = TEMPLATE.replace(
        '<div id="root"></div>',
        '<div id="root" data-lo-folder="lo-99-dev"></div>',
      );

      const html = buildPrerenderedHtml({ ...landing, template });

      expect(html).not.toContain('data-lo-folder');
      expect(html).not.toContain('lo-99-dev');
    });

    it('still replaces the title and description, and keeps the hashed assets', () => {
      const html = buildPrerenderedHtml(landing);

      expect(html).toContain('<title>Cambridge Spanish — Level 1</title>');
      expect(html).toContain('content="Start your Spanish journey"');
      expect(html).toContain('src="/base/assets/main-DKLXWUsE.js"');
    });

    it('still throws on a reshaped template', () => {
      const template = TEMPLATE.replace('<div id="root"></div>', '<div id="app"></div>');

      expect(() => buildPrerenderedHtml({ ...landing, template })).toThrow(/id="root"/);
    });
  });

  it('throws naming the missing anchor when the template has no root div', () => {
    const template = TEMPLATE.replace('<div id="root"></div>', '<div id="app"></div>');

    expect(() => buildPrerenderedHtml({ ...input, template })).toThrow(/id="root"/);
  });

  it('throws when the template has no title element', () => {
    const template = TEMPLATE.replace('<title>lc-base-template</title>', '');

    expect(() => buildPrerenderedHtml({ ...input, template })).toThrow(/<title>/);
  });
});
