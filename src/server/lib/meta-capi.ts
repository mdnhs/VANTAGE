import 'server-only';

import { createHash } from 'node:crypto';

import { metaSourceUrl } from '@/lib/tracking/sanitize';

// Standard Lead event, no custom_data, no email or phone unless enhanced
// matching is on. The only outbound host is graph.facebook.com.
export const CAPI_VERSION = 'v26.0';
const FB_COOKIE = /^fb\.\d\.\d{10,16}\.[\w.-]{1,200}$/;
const DELAYS = [0, 1000, 4000];
const TIMEOUT_MS = 10_000;

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

// The source path must be a site-relative path (one leading slash) that parses.
export function capiAllowedPath(sourcePath: string): boolean {
  if (!sourcePath.startsWith('/') || /^[/\\]{2}/.test(sourcePath)) return false;
  try {
    new URL(sourcePath, 'http://x');
    return true;
  } catch {
    return false;
  }
}

export type LeadEventInput = {
  leadId: string;
  eventId: string;
  eventTime: Date;
  sourcePath: string;
  siteUrl: string;
  ip: string | null;
  userAgent: string;
  fbp?: string;
  fbc?: string;
  email: string;
  phone: string | null;
  enhancedMatching: boolean;
};

export function buildLeadEvent(i: LeadEventInput) {
  const user_data: Record<string, unknown> = {};
  if (i.ip) user_data.client_ip_address = i.ip;
  if (i.userAgent) user_data.client_user_agent = i.userAgent;
  if (i.fbp && FB_COOKIE.test(i.fbp)) user_data.fbp = i.fbp;
  if (i.fbc && FB_COOKIE.test(i.fbc)) user_data.fbc = i.fbc;
  user_data.external_id = [sha256(i.leadId)];
  if (i.enhancedMatching) {
    user_data.em = [sha256(i.email.trim().toLowerCase())];
    if (i.phone) user_data.ph = [sha256(i.phone.replace(/\D/g, ''))];
  }
  return {
    event_name: 'Lead' as const,
    event_time: Math.floor(i.eventTime.getTime() / 1000),
    event_id: i.eventId,
    action_source: 'website' as const,
    event_source_url: metaSourceUrl(i.sourcePath, i.siteUrl),
    user_data,
  };
}
export type CapiEvent = ReturnType<typeof buildLeadEvent>;

export type CapiResult = { ok: true; status: number } | { ok: false; status: number; message: string };

const MAX_BODY_BYTES = 4096;

// Reads at most ~4 KB of an error body (the stream is cancelled beyond that);
// anything that is not JSON gives null.
async function readErrorBody(res: Response): Promise<{ error?: { message?: unknown } } | null> {
  try {
    const reader = res.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BODY_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.byteLength;
    }
    await reader.cancel().catch(() => undefined);
    const text = new TextDecoder().decode(Buffer.concat(chunks)).slice(0, MAX_BODY_BYTES);
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? (parsed as { error?: { message?: unknown } }) : null;
  } catch {
    return null;
  }
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Retries (0/1000/4000 ms) only on 429, 5xx and network errors. Error text is
// scrubbed of the token and cut to 200 characters.
export async function sendCapi(opts: {
  pixelId: string;
  token: string;
  events: object[];
  testEventCode?: string;
  fetchImpl?: typeof fetch;
  delays?: number[];
  sleep?: (ms: number) => Promise<void>;
}): Promise<CapiResult> {
  const doFetch = opts.fetchImpl ?? fetch;
  const sleep = opts.sleep ?? wait;
  const body = JSON.stringify({
    data: opts.events,
    access_token: opts.token,
    ...(opts.testEventCode ? { test_event_code: opts.testEventCode } : {}),
  });
  const scrub = (text: string) => text.split(opts.token).join('[token]');
  let last: CapiResult = { ok: false, status: 0, message: 'Not sent' };
  for (const delay of opts.delays ?? DELAYS) {
    if (delay > 0) await sleep(delay);
    try {
      const res = await doFetch(`https://graph.facebook.com/${CAPI_VERSION}/${opts.pixelId}/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        // A redirect would send the token somewhere else: treat it as a failure.
        redirect: 'error',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.ok) return { ok: true, status: res.status };
      const payload = await readErrorBody(res);
      const message =
        typeof payload?.error?.message === 'string' ? scrub(payload.error.message).slice(0, 200) : `HTTP ${res.status}`;
      last = { ok: false, status: res.status, message };
      if (res.status !== 429 && res.status < 500) return last;
    } catch {
      last = { ok: false, status: 0, message: 'Meta could not be reached' };
    }
  }
  return last;
}
