import 'server-only';

import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { GlobalValue } from '@/lib/content/globals';
import { db } from '@/server/db';
import { consentEvents } from '@/server/db/schema';
import { invalid } from '@/server/lib/validator';
import { readEffectiveGlobal } from '@/server/services/globals-service';

export const CONSENT_LIMIT = { limit: 20, windowMs: 10 * 60_000 };

const ConsentEventInput = z.object({
  id: z.string().uuid(),
  v: z.number().int().min(1).max(10_000),
  a: z.boolean(),
  m: z.boolean(),
  action: z.enum(['accept', 'reject', 'custom', 'withdraw']),
});

// What the visitor was shown, computed on the server so a client cannot forge it.
export function bannerHash(c: GlobalValue<'consent'>): string {
  const shown = [
    c.title,
    c.body,
    c.accept,
    c.reject,
    c.customise,
    c.save,
    c.policyLabel,
    c.policyHref,
    c.categories.necessary,
    c.categories.analytics,
    c.categories.marketing,
  ];
  return createHash('sha256').update(JSON.stringify(shown)).digest('hex');
}

export async function recordConsent(body: unknown): Promise<void> {
  const parsed = ConsentEventInput.safeParse(body);
  if (!parsed.success) throw invalid(parsed.error);
  const e = parsed.data;
  const { value } = await readEffectiveGlobal('consent');
  await db.insert(consentEvents).values({
    consentId: e.id,
    analytics: e.a,
    marketing: e.m,
    revision: e.v,
    bannerHash: bannerHash(value),
    action: e.action,
  });
}
