import 'server-only';

import { parseTracking } from '@/lib/content/globals-marketing';
import { clientEnv } from '@/lib/env';
import { PIXEL_ID, validId } from '@/lib/tracking/ids';
import { buildLeadEvent, capiAllowedPath, sendCapi, type LeadEventInput } from '@/server/lib/meta-capi';
import { notify } from '@/server/lib/notifications/notify';
import { CAPI_TOKEN_PURPOSE, decryptSecret } from '@/server/lib/secrets';
import { settingsRepository } from '@/server/repositories/settings-repository';

// Reads the settings fresh, so a token change or a switch-off applies to the
// very next lead. A failure records the HTTP status only: never the token, the
// payload or the lead.
export async function sendLeadToCapi(
  input: Omit<LeadEventInput, 'siteUrl' | 'enhancedMatching'>,
  deps: { fetchImpl?: typeof fetch } = {},
): Promise<'sent' | 'skipped' | 'failed'> {
  if (!capiAllowedPath(input.sourcePath)) return 'skipped';
  const t = parseTracking((await settingsRepository.get('tracking'))?.value);
  const pixelId = validId(PIXEL_ID, t.metaPixelId);
  if (!t.enabled.capi || !pixelId || !t.capiTokenEncrypted) return 'skipped';
  let token: string | null = null;
  try {
    token = decryptSecret(t.capiTokenEncrypted, CAPI_TOKEN_PURPOSE);
  } catch {
    token = null;
  }
  if (!token) {
    console.warn('[capi] stored token cannot be decrypted; skipped');
    return 'skipped';
  }
  const event = buildLeadEvent({
    ...input,
    siteUrl: clientEnv.NEXT_PUBLIC_APP_URL,
    enhancedMatching: Boolean(t.enhancedMatching.enabled && t.enhancedMatching.acknowledgedAt),
  });
  const result = await sendCapi({
    pixelId,
    token,
    events: [event],
    testEventCode: t.testEventCode || undefined,
    fetchImpl: deps.fetchImpl,
  });
  if (result.ok) return 'sent';
  await notify('capi_failed', { status: result.status || null });
  return 'failed';
}
