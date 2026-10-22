import type { TrackEvent } from './events';

// Delegated click tracking for phone, email and WhatsApp links. Nothing here
// queries the document for page content.
export function clickEvent(target: Element | null): TrackEvent | null {
  const href = target?.closest('a[href]')?.getAttribute('href') ?? '';
  if (href.startsWith('tel:')) return { event: 'contact_click', params: { method: 'phone' } };
  if (href.startsWith('mailto:')) return { event: 'contact_click', params: { method: 'email' } };
  if (href.startsWith('https://wa.me/') || href.startsWith('https://api.whatsapp.com/'))
    return { event: 'contact_click', params: { method: 'whatsapp' } };
  return null;
}
