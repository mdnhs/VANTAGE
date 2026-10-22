import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/server/db';
import { auditLogs } from '@/server/db/schema';
import { notify } from '@/server/lib/notifications/notify';

const rowsFor = (action: string, entityId: string) =>
  db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.entityId, entityId))
    .then((r) => r.filter((x) => x.action === action));

describe('notify', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('records a CAPI failure with the HTTP status', async () => {
    await db.delete(auditLogs).where(eq(auditLogs.action, 'tracking.capi_failed'));
    await notify('capi_failed', { status: 400 });
    const rows = await rowsFor('tracking.capi_failed', 'tracking');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      actorId: null,
      entityType: 'setting',
      entityId: 'tracking',
      summary: 'Meta Conversions API did not accept a Lead event (HTTP 400)',
      diff: null,
    });
  });

  it('says "no answer" when there was no status', async () => {
    await db.delete(auditLogs).where(eq(auditLogs.action, 'tracking.capi_failed'));
    await notify('capi_failed', { status: null });
    const rows = await rowsFor('tracking.capi_failed', 'tracking');
    expect(rows).toHaveLength(1);
    expect(rows[0]!.summary.endsWith('(no answer)')).toBe(true);
  });

  it('records a delivery failure against the enquiry', async () => {
    const id = randomUUID();
    await notify('delivery_failed', { enquiry: 'contact', enquiryId: id, channel: 'auto_reply' });
    const rows = await rowsFor('enquiry.delivery_failed', id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      actorId: null,
      entityType: 'contact',
      entityId: id,
      summary: 'The auto-reply to the enquirer failed',
    });
  });

  it('uses the team copy for the notification channel', async () => {
    const id = randomUUID();
    await notify('delivery_failed', { enquiry: 'quote', enquiryId: id, channel: 'notification' });
    const rows = await rowsFor('enquiry.delivery_failed', id);
    expect(rows[0]).toMatchObject({ entityType: 'quote', summary: 'The notification to the team failed' });
  });

  it('never throws and logs only the kind when the insert fails', async () => {
    vi.spyOn(db, 'insert').mockImplementation(() => {
      throw new Error('boom: secret detail');
    });
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(notify('capi_failed', { status: 500 })).resolves.toBeUndefined();
    expect(err).toHaveBeenCalledWith('[notify] failed', 'capi_failed');
  });
});
