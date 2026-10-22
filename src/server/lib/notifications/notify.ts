import 'server-only';
import { db, type DbLike } from '@/server/db';
import { audit } from '@/server/lib/audit';

export const NOTIFY_ACTIONS = {
  capi_failed: 'tracking.capi_failed',
  delivery_failed: 'enquiry.delivery_failed',
} as const;

export type NotifyPayloads = {
  capi_failed: { status: number | null };
  delivery_failed: {
    enquiry: 'quote' | 'contact';
    enquiryId: string;
    channel: 'notification' | 'auto_reply';
  };
};

/**
 * System-event emitter: writes an actor-less audit row that the notifications
 * feed reads by action name. Never throws: a failed notification must not
 * break the flow that raised it.
 */
export async function notify<K extends keyof NotifyPayloads>(
  kind: K,
  payload: NotifyPayloads[K],
  dbLike: DbLike = db,
): Promise<void> {
  try {
    if (kind === 'capi_failed') {
      const { status } = payload as NotifyPayloads['capi_failed'];
      await audit(
        null,
        {
          action: NOTIFY_ACTIONS.capi_failed,
          entityType: 'setting',
          entityId: 'tracking',
          summary: `Meta Conversions API did not accept a Lead event (${status === null ? 'no answer' : `HTTP ${status}`})`,
          diff: null,
        },
        dbLike,
      );
      return;
    }
    const { enquiry, enquiryId, channel } = payload as NotifyPayloads['delivery_failed'];
    await audit(
      null,
      {
        action: NOTIFY_ACTIONS.delivery_failed,
        entityType: enquiry,
        entityId: enquiryId,
        summary:
          channel === 'auto_reply' ? 'The auto-reply to the enquirer failed' : 'The notification to the team failed',
        diff: null,
      },
      dbLike,
    );
  } catch {
    console.error('[notify] failed', kind);
  }
}
