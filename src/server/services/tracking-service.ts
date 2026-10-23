import 'server-only';

import { randomUUID } from 'node:crypto';

import { desc, eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { topLevelDiff } from '@/lib/audit/top-level-diff';
import { parseTracking, TrackingSettings, type TrackingValue } from '@/lib/content/globals-marketing';
import { clientEnv } from '@/lib/env';
import { GA4_ID, GTM_ID, PIXEL_ID, validId } from '@/lib/tracking/ids';
import { db, type DbLike } from '@/server/db';
import { auditLogs, settings } from '@/server/db/schema';
import { audit } from '@/server/lib/audit';
import type { Actor } from '@/server/lib/auth/actor';
import { settingTag } from '@/server/lib/cache/settings-tags';
import { conflictCurrent, conflictError } from '@/server/lib/conflict';
import { ApiError, ERROR_CODES } from '@/server/lib/errors';
import { sendCapi, sha256 } from '@/server/lib/meta-capi';
import {
  CAPI_TOKEN_PURPOSE,
  decryptSecret,
  encryptSecret,
  SecretKeyInvalidError,
  SecretKeyMissingError,
  secretsAvailable,
} from '@/server/lib/secrets';
import { invalid } from '@/server/lib/validator';
import { settingsRepository } from '@/server/repositories/settings-repository';
import type { TrackingUpdate } from '@/validations/tracking-schema';

import { readEffectiveGlobal } from './globals-service';

export type ChannelStatus =
  | 'off'
  | 'ready'
  | 'missing-id'
  | 'needs-gtm'
  | 'needs-banner'
  | 'needs-pixel'
  | 'no-token'
  | 'no-key'
  | 'unreadable-token';

const KEY = 'tracking';

const NO_KEY_MESSAGE =
  "The server has no APP_ENCRYPTION_KEY, so the token can't be stored safely. Ask your developer to set it.";

const fieldErrors = (causes: Record<string, string[]>, message = 'Validation failed') =>
  new ApiError(ERROR_CODES.VALIDATION_ERROR, message, 422, causes);

// Uncached reads for writes and for CAPI (which must see the latest consent and
// token). Rendering uses the cached readers instead.
export async function readTrackingSettings(): Promise<TrackingValue> {
  return parseTracking((await settingsRepository.get(KEY))?.value);
}
export async function readConsentSettings() {
  return (await readEffectiveGlobal('consent')).value;
}

// The one place the stored token is decrypted. Null when none is stored or it
// cannot be read (wrong or missing key): a bad key never breaks the caller.
export function readCapiToken(t: Pick<TrackingValue, 'capiTokenEncrypted'>): string | null {
  if (!t.capiTokenEncrypted) return null;
  try {
    return decryptSecret(t.capiTokenEncrypted, CAPI_TOKEN_PURPOSE);
  } catch {
    return null;
  }
}

function readable(encrypted: string | null): boolean | null {
  if (!encrypted) return null;
  return readCapiToken({ capiTokenEncrypted: encrypted }) !== null;
}

function channelStatus(t: TrackingValue, bannerOn: boolean) {
  const gtmOk = t.enabled.gtm && Boolean(validId(GTM_ID, t.gtmId));
  const pixel = validId(PIXEL_ID, t.metaPixelId);
  const tokenReadable = readable(t.capiTokenEncrypted);
  const gate = (s: ChannelStatus): ChannelStatus => (s === 'ready' && !bannerOn ? 'needs-banner' : s);
  return {
    gtm: !t.enabled.gtm ? 'off' : !validId(GTM_ID, t.gtmId) ? 'missing-id' : gate('ready'),
    ga4: !t.enabled.ga4 ? 'off' : !validId(GA4_ID, t.ga4Id) ? 'missing-id' : !gtmOk ? 'needs-gtm' : gate('ready'),
    meta: !t.enabled.meta ? 'off' : !pixel ? 'missing-id' : gate('ready'),
    capi: !t.enabled.capi
      ? 'off'
      : !pixel
        ? 'needs-pixel'
        : !t.capiTokenEncrypted
          ? 'no-token'
          : !secretsAvailable()
            ? 'no-key'
            : tokenReadable === false
              ? 'unreadable-token'
              : gate('ready'),
  } satisfies Record<string, ChannelStatus>;
}

export async function getTrackingAdmin() {
  const row = await settingsRepository.get(KEY);
  const t = parseTracking(row?.value);
  const consent = await readConsentSettings();
  const [failure] = await db
    .select({ at: auditLogs.createdAt, summary: auditLogs.summary })
    .from(auditLogs)
    .where(eq(auditLogs.action, 'tracking.capi_failed'))
    .orderBy(desc(auditLogs.createdAt))
    .limit(1);
  // Write-only: the response says whether a token is stored, never any part of it.
  const { capiTokenEncrypted, ...value } = t;
  return {
    version: row?.version ?? 0,
    value,
    capiToken: { configured: Boolean(capiTokenEncrypted), readable: readable(capiTokenEncrypted) },
    keyAvailable: secretsAvailable(),
    status: channelStatus(t, consent.enabled),
    lastCapiFailure: failure ? { at: failure.at.toISOString(), summary: failure.summary } : null,
  };
}
export type TrackingAdmin = Awaited<ReturnType<typeof getTrackingAdmin>>;

async function lockRow(tx: DbLike) {
  const [row] = await tx.select().from(settings).where(eq(settings.key, KEY)).limit(1).for('update');
  return row ?? null;
}

const redact = (v: TrackingValue) => ({ ...v, capiTokenEncrypted: undefined });

// No revision row: a snapshot would hold the token ciphertext.
export async function saveTracking(actor: Actor, input: TrackingUpdate): Promise<TrackingAdmin> {
  await db.transaction(async (tx) => {
    const before = await lockRow(tx);
    if ((before?.version ?? 0) !== input.version) throw conflictError(await conflictCurrent(tx, before));
    const current = parseTracking(before?.value);

    let capiTokenEncrypted = current.capiTokenEncrypted;
    if (input.capiToken === null) capiTokenEncrypted = null;
    else if (typeof input.capiToken === 'string') {
      const noKey = fieldErrors({ capiToken: [NO_KEY_MESSAGE] });
      if (!secretsAvailable()) throw noKey;
      try {
        capiTokenEncrypted = encryptSecret(input.capiToken, CAPI_TOKEN_PURPOSE);
      } catch (error) {
        if (error instanceof SecretKeyMissingError || error instanceof SecretKeyInvalidError) throw noKey;
        throw error;
      }
    }

    let enhancedMatching = current.enhancedMatching;
    let matchingAudit: string | null = null;
    const wanted = input.enhancedMatching;
    if (wanted && wanted.enabled !== current.enhancedMatching.enabled) {
      if (!actor.roles.includes('owner')) throw ApiError.forbidden('Only an owner can change enhanced matching');
      if (wanted.enabled) {
        if (wanted.acknowledge !== true) {
          throw fieldErrors({ 'enhancedMatching.acknowledge': ['Confirm the legal acknowledgement first'] });
        }
        enhancedMatching = { enabled: true, acknowledgedAt: new Date().toISOString(), acknowledgedBy: actor.email };
        matchingAudit = 'Turned on enhanced matching and acknowledged the legal basis';
      } else {
        enhancedMatching = { enabled: false, acknowledgedAt: null, acknowledgedBy: null };
        matchingAudit = 'Turned off enhanced matching';
      }
    }

    const parsed = TrackingSettings.safeParse({ ...input.value, capiTokenEncrypted, enhancedMatching });
    if (!parsed.success) throw invalid(parsed.error);
    const value = parsed.data;

    if (before) {
      await tx
        .update(settings)
        .set({ value, version: before.version + 1, updatedBy: actor.userId, updatedAt: new Date() })
        .where(eq(settings.key, KEY));
    } else {
      const inserted = await tx
        .insert(settings)
        .values({ key: KEY, value, version: 1, updatedBy: actor.userId })
        .onConflictDoNothing()
        .returning();
      if (inserted.length === 0) {
        const [winner] = await tx.select().from(settings).where(eq(settings.key, KEY)).limit(1);
        throw conflictError(await conflictCurrent(tx, winner ?? null));
      }
    }

    // The ciphertext never enters the log: only configured / replaced / removed.
    const diff = topLevelDiff(redact(current), redact(value));
    delete diff.capiTokenEncrypted;
    if (capiTokenEncrypted !== current.capiTokenEncrypted) {
      diff.capiToken = {
        from: current.capiTokenEncrypted ? 'configured' : 'none',
        to: capiTokenEncrypted ? 'replaced' : 'removed',
      };
    }
    await audit(
      actor,
      { action: 'tracking.update', entityType: 'setting', entityId: KEY, summary: 'Updated tracking settings', diff },
      tx,
    );
    if (matchingAudit) {
      await audit(
        actor,
        { action: 'tracking.enhanced_matching', entityType: 'setting', entityId: KEY, summary: matchingAudit },
        tx,
      );
    }
  });
  revalidateTag(settingTag(KEY), { expire: 0 });
  return getTrackingAdmin();
}

export async function sendTestEvent(actor: Actor, deps: { fetchImpl?: typeof fetch } = {}) {
  const t = await readTrackingSettings();
  const pixelId = validId(PIXEL_ID, t.metaPixelId);
  const token = readCapiToken(t);
  const errors: Record<string, string[]> = {};
  if (!pixelId) errors.metaPixelId = ['Add the Pixel ID first'];
  if (!token) errors.capiToken = ['Add a readable access token first'];
  if (!t.testEventCode) errors.testEventCode = ['Add the test event code from Events Manager first'];
  if (Object.keys(errors).length) throw fieldErrors(errors);
  // A neutral PageView: Meta processes test events too.
  const result = await sendCapi({
    pixelId: pixelId!,
    token: token!,
    testEventCode: t.testEventCode,
    delays: [0],
    fetchImpl: deps.fetchImpl,
    events: [
      {
        event_name: 'PageView',
        event_time: Math.floor(Date.now() / 1000),
        event_id: randomUUID(),
        action_source: 'website',
        event_source_url: new URL('/', clientEnv.NEXT_PUBLIC_APP_URL).href,
        user_data: { client_user_agent: 'admin-test-event', external_id: [sha256('admin-test-event')] },
      },
    ],
  });
  await audit(actor, {
    action: 'tracking.test_event',
    entityType: 'setting',
    entityId: KEY,
    summary: result.ok ? 'Sent a CAPI test event' : `CAPI test event failed (${result.status})`,
  });
  return result.ok
    ? { ok: true as const, status: result.status, message: 'Meta received the test event' }
    : { ok: false as const, status: result.status, message: result.message };
}
