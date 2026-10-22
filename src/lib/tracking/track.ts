import type { ConsentChoice } from './consent';
import { newEventId } from './event-id';
import { META_EVENT, pushEvent, type TrackEvent } from './events';
import { pageTitle, pixelAllowed, sanitizePath, sanitizeUrl } from './sanitize';

type TrackWindow = {
  dataLayer?: unknown[];
  fbq?: (...args: unknown[]) => void;
  __vantageConsent?: ConsentChoice | null;
  location: { href: string; pathname: string; search: string; hash: string };
};
export type TrackEnv = {
  window: TrackWindow;
  document: { title: string; referrer: string };
  newId: () => string;
};
const browser = (): TrackEnv => ({
  window: window as unknown as TrackWindow,
  document,
  newId: () => newEventId() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
});

// The dataLayer always gets the event; Meta gets a
// standard event only with marketing consent on a neutral URL.
export function track(e: TrackEvent, env: TrackEnv = browser()) {
  const w = env.window;
  const { eventId } = pushEvent((w.dataLayer ??= []), e, env.newId);
  const meta = META_EVENT[e.event];
  const ready = typeof w.fbq === 'function';
  const sendable = Boolean(w.__vantageConsent?.marketing) && pixelAllowed(w.location, env.document.referrer);
  if (e.event === 'virtual_page_view') pendingMetaPageView = !(ready && sendable);
  if (meta && ready && sendable) {
    w.fbq!('track', meta, {}, { eventID: eventId });
  }
  return eventId;
}

export function currentPage(env: TrackEnv = browser()) {
  const { location } = env.window;
  return {
    location: sanitizeUrl(location.href),
    path: sanitizePath(location.pathname),
    title: pageTitle(location.pathname, env.document.title),
    referrer: sanitizeUrl(env.document.referrer),
  };
}

// A virtual_page_view that Meta could not receive yet (Pixel not loaded) is
// sent once the Pixel loads; one that Meta did receive is never repeated.
let pendingMetaPageView = false;

export function flushMetaPageView(env: TrackEnv = browser()) {
  const w = env.window;
  if (!pendingMetaPageView || typeof w.fbq !== 'function') return false;
  pendingMetaPageView = false;
  if (!w.__vantageConsent?.marketing || !pixelAllowed(w.location, env.document.referrer)) return false;
  w.fbq('track', 'PageView', {}, { eventID: env.newId() });
  return true;
}

// The persistent page context GTM reads for every GA4 hit.
export function pushPage(page: ReturnType<typeof currentPage>, env: TrackEnv = browser()) {
  (env.window.dataLayer ??= []).push({ page });
}
