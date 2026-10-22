import 'server-only';

import { CONSENT_COOKIE, cookieValue, readConsent } from '@/lib/tracking/consent';

import { runAfterResponse } from './enquiry-notify';
import { sendLeadToCapi } from './tracking-capi';
import { readConsentSettings } from './tracking-service';

export type LeadConversionInput = {
  leadId: string;
  eventId?: string;
  sourcePath?: string;
  email: string;
  phone: string | null;
  cookieHeader: string | undefined;
  ip: string | null;
  userAgent: string;
  now?: Date;
};

// The visitor's address as the rate limiter sees it. Used for matching only; never stored.
export const clientIp = (headers: { get(name: string): string | null }): string | null =>
  headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || null;

// Sends a deduplicated Lead to Meta, but only for a visitor whose current, valid
// consent cookie says marketing is allowed. Never throws: the lead is already saved.
export async function queueLeadConversion(input: LeadConversionInput): Promise<'sent' | 'skipped' | 'failed'> {
  try {
    if (!input.eventId || !input.sourcePath) return 'skipped';
    const now = input.now ?? new Date();
    const consent = await readConsentSettings();
    if (!consent.enabled) return 'skipped';
    const choice = readConsent(
      cookieValue(input.cookieHeader, CONSENT_COOKIE),
      { version: consent.version, months: consent.reconsentMonths },
      now.getTime(),
    );
    if (!choice?.marketing) return 'skipped';
    return await sendLeadToCapi({
      leadId: input.leadId,
      eventId: input.eventId,
      eventTime: now,
      sourcePath: input.sourcePath,
      ip: input.ip,
      userAgent: input.userAgent,
      fbp: cookieValue(input.cookieHeader, '_fbp'),
      fbc: cookieValue(input.cookieHeader, '_fbc'),
      email: input.email,
      phone: input.phone,
    });
  } catch (error) {
    console.warn('[capi] lead conversion failed:', error instanceof Error ? error.name : 'unknown error');
    return 'failed';
  }
}

// After the response (or detached outside a request scope): never slows or fails the enquiry.
export function queueLeadConversionAfterResponse(input: LeadConversionInput): void {
  runAfterResponse(() => queueLeadConversion(input));
}
