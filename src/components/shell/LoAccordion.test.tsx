/**
 * Tests for LoAccordion (Phase C · Part A, step 5 — spec §1/§4). Locks the exact
 * disclosure structure and the native-semantics rules: article>details>summary>h3,
 * the shared heading id, a .details-content panel, the optional instructions slot,
 * and crucially the ABSENCE of aria-expanded / role="region" (§4). The open/close
 * animation itself is verified in the browser (step 7).
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import LoAccordion from './LoAccordion';
import { headingId } from '@/lib/headingId';

describe('LoAccordion', () => {
  test('nests article > details > summary > h3 with the shared heading id', () => {
    const html = renderToStaticMarkup(
      <LoAccordion id="grammar-1" title="Ser vs estar">
        <p>Body</p>
      </LoAccordion>,
    );
    const hid = headingId('grammar-1');
    expect(html).toMatch(new RegExp(`<article[^>]*aria-labelledby="${hid}"`));
    expect(html).toContain('<details');
    expect(html).toContain('<summary');
    expect(html).toMatch(new RegExp(`<h3[^>]*id="${hid}"[^>]*>Ser vs estar`));
  });

  test('renders the .details-content panel wrapping the body', () => {
    const html = renderToStaticMarkup(
      <LoAccordion id="ex-1" title="Exercise">
        <p>Question one</p>
      </LoAccordion>,
    );
    expect(html).toMatch(/class="details-content/);
    expect(html).toContain('Question one');
  });

  test('uses native semantics only — no aria-expanded and no role="region" (§4)', () => {
    const html = renderToStaticMarkup(
      <LoAccordion id="g" title="T">
        <p>x</p>
      </LoAccordion>,
    );
    expect(html).not.toContain('aria-expanded');
    expect(html).not.toContain('role="region"');
    expect(html).not.toContain('aria-controls');
  });

  test('renders the optional accordion-level instructions slot', () => {
    const html = renderToStaticMarkup(
      <LoAccordion id="g" title="T" instructions="Fill each blank.">
        <p>x</p>
      </LoAccordion>,
    );
    expect(html).toMatch(/class="[^"]*instructions/);
    expect(html).toContain('Fill each blank.');
  });

  test('omits the instructions slot when none is provided', () => {
    const html = renderToStaticMarkup(
      <LoAccordion id="g" title="T">
        <p>x</p>
      </LoAccordion>,
    );
    expect(html).not.toMatch(/class="[^"]*instructions/);
  });

  test('defaultOpen renders the details element open (native fallback state)', () => {
    const html = renderToStaticMarkup(
      <LoAccordion id="g" title="T" defaultOpen>
        <p>x</p>
      </LoAccordion>,
    );
    expect(html).toMatch(/<details[^>]*open/);
  });
});
