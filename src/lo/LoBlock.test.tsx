/**
 * LoBlock.test.tsx — one block as the course page renders it: bare when `plain`, in an
 * accordion when `card`. The UI showcase renders through the same component.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlockConfigSchema } from '@/config/lo-schema';
import { LoBlock } from './LoBlock';

const content = { instructions: 'Read this first.', text: ['Body paragraph.'] };

function render(config: unknown): string {
  return renderToStaticMarkup(<LoBlock id="block-01" config={BlockConfigSchema.parse(config)} />);
}

describe('LoBlock', () => {
  it('renders a plain block bare: body and instructions, no accordion', () => {
    const html = render({ type: 'prose', presentation: 'plain', content });
    expect(html).not.toContain('<details');
    expect(html).not.toContain('<h3');
    expect(html).toContain('Read this first.');
    expect(html).toContain('Body paragraph.');
  });

  it('renders a card in an accordion headed by its title, open when asked', () => {
    const html = render({ type: 'prose', title: 'A card', defaultOpen: true, content });
    expect(html).toMatch(/<details[^>]*open/);
    expect(html).toMatch(/<h3[^>]*id="block-01-heading"[^>]*>A card<\/h3>/);
    expect(html).toContain('Read this first.');
    expect(html).toContain('Body paragraph.');
  });

  it('says so visibly when a block type has no renderer', () => {
    const html = render({ type: 'nope', presentation: 'plain', content: {} });
    expect(html).toContain('No renderer registered for block type <code>nope</code>');
  });
});
