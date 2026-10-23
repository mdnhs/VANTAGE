// The typed dataLayer. Pushing is always allowed; GTM gates tags by
// consent. Never put personal or health data in params.
export type TrackEvent =
  | {
      event: 'virtual_page_view';
      params: { page_location: string; page_path: string; page_title: string };
    }
  | {
      event: 'generate_lead';
      params: {
        lead_source: 'quote_form' | 'contact_form';
        form_id: 'quote' | 'estimator' | 'contact';
      };
      // Omitted when the browser cannot make one; a fresh id is used for the dataLayer then.
      eventId?: string;
    }
  | {
      event: 'contact_click';
      params: { method: 'phone' | 'email' | 'whatsapp' };
    };

export type TrackEventName = TrackEvent['event'];

export const EVENT_CATALOGUE = [
  {
    event: 'virtual_page_view',
    firesWhen: 'each pathname change',
    params: ['page_location', 'page_path', 'page_title'],
    ga4: 'page_view',
    meta: 'PageView (allowlisted routes)',
  },
  {
    event: 'generate_lead',
    firesWhen: 'the API accepted a quote or contact enquiry',
    params: ['lead_source', 'form_id', 'event_id'],
    ga4: 'generate_lead (key event)',
    meta: 'Lead, deduplicated with CAPI via event_id',
  },
  {
    event: 'contact_click',
    firesWhen: 'phone, email or WhatsApp links',
    params: ['method', 'event_id'],
    ga4: 'custom',
    meta: 'Contact',
  },
] as const satisfies readonly {
  event: TrackEventName;
  firesWhen: string;
  params: readonly string[];
  ga4: string;
  meta: string;
}[];

export const META_EVENT = {
  virtual_page_view: 'PageView',
  generate_lead: 'Lead',
  contact_click: 'Contact',
} as const satisfies Record<TrackEventName, string>;

const MAX_VALUE = 100;
const cap = (params: Record<string, string>) =>
  Object.fromEntries(Object.entries(params).map(([k, v]) => [k, v.slice(0, MAX_VALUE)]));

export function pushEvent(dataLayer: unknown[], e: TrackEvent, newId: () => string): { eventId: string } {
  const eventId = (e.event === 'generate_lead' ? e.eventId : undefined) ?? newId();
  dataLayer.push({ event_params: null });
  dataLayer.push({
    event: e.event,
    event_params: {
      ...cap(e.params as Record<string, string>),
      event_id: eventId,
    },
  });
  return { eventId };
}
