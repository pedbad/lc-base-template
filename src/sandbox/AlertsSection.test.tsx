/**
 * AlertsSection.test.tsx — the sandbox's alert reference shows exactly what lessons
 * render: `Callout`, in four variants, with no styling of the sandbox's own.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Callout from '@/components/shell/Callout';
import AlertsSection from './AlertsSection';
import { ALERT_EXAMPLES } from './sandbox-catalog';

const html = renderToStaticMarkup(<AlertsSection />);

describe('AlertsSection', () => {
  it('is a headed section the in-page nav can reach', () => {
    expect(html).toMatch(/<section[^>]*id="alerts"/);
    expect(html).toMatch(/<section[^>]*aria-labelledby="alerts-heading"/);
    expect(html).toContain('id="alerts-heading"');
  });

  it('shows info, success, warning and danger, in that order', () => {
    expect(ALERT_EXAMPLES.map((example) => example.variant)).toEqual([
      'info',
      'success',
      'warning',
      'danger',
    ]);
  });

  it.each(ALERT_EXAMPLES)('renders $variant exactly as a lesson would', (example) => {
    // The whole point of the page: byte-for-byte the component lessons use. A
    // sandbox-only class or wrapper anywhere inside the alert breaks this.
    const lesson = renderToStaticMarkup(
      <Callout variant={example.variant} title={example.title}>
        {example.body}
      </Callout>,
    );
    expect(html).toContain(lesson);
  });
});
