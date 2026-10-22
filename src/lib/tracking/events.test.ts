import { describe, expect, it } from 'vitest';

import { EVENT_CATALOGUE, META_EVENT, pushEvent } from './events';

const ids = () => {
  let n = 0;
  return () => `id-${++n}`;
};

describe('pushEvent ', () => {
  it('clears the previous params, then pushes the event with an id', () => {
    const dl: unknown[] = [];
    const { eventId } = pushEvent(dl, { event: 'contact_click', params: { method: 'phone' } }, ids());
    expect(eventId).toBe('id-1');
    expect(dl).toEqual([
      { event_params: null },
      {
        event: 'contact_click',
        event_params: { method: 'phone', event_id: 'id-1' },
      },
    ]);
  });

  it("reuses the lead's own event id for generate_lead", () => {
    const dl: unknown[] = [];
    const { eventId } = pushEvent(
      dl,
      {
        event: 'generate_lead',
        params: { lead_source: 'quote_form', form_id: 'estimator' },
        eventId: 'lead-event',
      },
      ids(),
    );
    expect(eventId).toBe('lead-event');
    expect(dl[1]).toEqual({
      event: 'generate_lead',
      event_params: {
        lead_source: 'quote_form',
        form_id: 'estimator',
        event_id: 'lead-event',
      },
    });
  });

  it('caps values at 100 characters', () => {
    const dl: unknown[] = [];
    pushEvent(dl, { event: 'contact_click', params: { method: 'x'.repeat(150) as 'phone' } }, ids());
    const pushed = dl[1] as { event_params: Record<string, string> };
    expect(pushed.event_params.method).toHaveLength(100);
  });
});

describe('EVENT_CATALOGUE', () => {
  it('lists every event with GA4-safe names', () => {
    expect(EVENT_CATALOGUE.map((e) => e.event)).toEqual(['virtual_page_view', 'generate_lead', 'contact_click']);
    for (const e of EVENT_CATALOGUE) expect(e.event.length).toBeLessThanOrEqual(40);
  });
  it('maps to Meta standard events only', () => {
    expect(META_EVENT).toEqual({
      virtual_page_view: 'PageView',
      generate_lead: 'Lead',
      contact_click: 'Contact',
    });
  });
});
