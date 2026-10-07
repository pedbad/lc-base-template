/**
 * AlertsSection.test.tsx — the sandbox's alert reference: four variants, each with its
 * icon, its own colour token, and its meaning carried in words, not colour alone.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AlertsSection from './AlertsSection';
import { ALERT_VARIANTS } from './sandbox-catalog';

const html = renderToStaticMarkup(<AlertsSection />);

/** Every rendered alert, as the markup of one `data-slot="alert"` element. */
const alerts = html.split('data-slot="alert"').slice(1);

describe('AlertsSection', () => {
  it('is a headed section the in-page nav can reach', () => {
    expect(html).toMatch(/<section[^>]*id="alerts"/);
    expect(html).toMatch(/<section[^>]*aria-labelledby="alerts-heading"/);
    expect(html).toContain('id="alerts-heading"');
  });

  it('shows info, success, warning and danger, in that order', () => {
    expect(ALERT_VARIANTS.map((variant) => variant.id)).toEqual([
      'info',
      'success',
      'warning',
      'danger',
    ]);
    expect(alerts).toHaveLength(4);
  });

  it('colours each variant with its own token', () => {
    const tokens = ['primary', 'success', 'warning', 'destructive'];
    alerts.forEach((alert, index) => {
      expect(alert).toContain(`border-${tokens[index]}`);
      expect(alert).toContain(`text-${tokens[index]}`);
    });
  });

  it('gives every alert a decorative icon and a written title', () => {
    alerts.forEach((alert, index) => {
      // The title says what colour only suggests (WCAG 1.4.1); the icon repeats it.
      expect(alert).toMatch(/<svg[^>]*aria-hidden="true"/);
      expect(alert).toContain(`>${ALERT_VARIANTS[index]?.title}<`);
    });
  });

  it('marks the examples as notes, not live alerts that interrupt on load', () => {
    expect(html).not.toContain('role="alert"');
    expect(html.match(/role="note"/g)).toHaveLength(4);
  });
});
