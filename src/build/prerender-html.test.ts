import { describe, expect, it } from 'vitest';
import { buildPrerenderedHtml } from './prerender-html';

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

  it('throws naming the missing anchor when the template has no root div', () => {
    const template = TEMPLATE.replace('<div id="root"></div>', '<div id="app"></div>');

    expect(() => buildPrerenderedHtml({ ...input, template })).toThrow(/<div id="root"><\/div>/);
  });

  it('throws when the template has no title element', () => {
    const template = TEMPLATE.replace('<title>lc-base-template</title>', '');

    expect(() => buildPrerenderedHtml({ ...input, template })).toThrow(/<title>/);
  });
});
