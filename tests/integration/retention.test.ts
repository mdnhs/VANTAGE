import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/server/db';
import { auditLogs, contactMessages, quoteRequests } from '@/server/db/schema';
import { settingsRepository } from '@/server/repositories/settings-repository';
import { runRetention } from '@/server/services/retention-service';

const NOW = new Date('2026-10-22T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const monthsAgo = (n: number) => {
  const d = new Date(NOW);
  d.setUTCMonth(d.getUTCMonth() - n);
  return d;
};

const quote = (name: string, over: Record<string, unknown> = {}) => ({
  name,
  email: `${name}@example.com`,
  phone: '0871234567',
  ...over,
});
const contact = (name: string, over: Record<string, unknown> = {}) => ({
  firstName: name,
  lastName: 'T',
  email: `${name}@example.com`,
  phone: '0871234567',
  message: `PRIVATE-${name}`,
  ...over,
});

const names = async () => ({
  q: (await db.select({ n: quoteRequests.name }).from(quoteRequests)).map((r) => r.n).sort(),
  c: (await db.select({ n: contactMessages.firstName }).from(contactMessages)).map((r) => r.n).sort(),
});

beforeEach(async () => {
  await db.execute(sql`truncate table settings, revisions, audit_logs, quote_requests, contact_messages`);
  // 12 months / 10 days so the windows are easy to read; defaults would be 24 / 30.
  await settingsRepository.save(
    'privacy',
    { version: 0, value: { enquiryRetentionMonths: 12, spamRetentionDays: 10 } },
    null,
  );
  await db.insert(quoteRequests).values([
    quote('qfresh', { createdAt: daysAgo(1), updatedAt: daysAgo(1) }),
    quote('qold', { createdAt: monthsAgo(13), updatedAt: monthsAgo(13) }),
    quote('qedge', { createdAt: monthsAgo(11), updatedAt: monthsAgo(11) }),
    // closed out long ago -> spam window
    quote('qspam', { status: 'cancelled', createdAt: daysAgo(40), updatedAt: daysAgo(20) }),
    // old row but closed out yesterday -> kept until the spam window passes
    quote('qspamnew', { status: 'archived', createdAt: daysAgo(40), updatedAt: daysAgo(1) }),
    // archived long ago but never "spam"-aged and also young: kept
    quote('qdone', { status: 'completed', createdAt: daysAgo(40), updatedAt: daysAgo(20) }),
  ]);
  await db
    .insert(contactMessages)
    .values([
      contact('cfresh', { createdAt: daysAgo(2), updatedAt: daysAgo(2) }),
      contact('cold', { createdAt: monthsAgo(14), updatedAt: monthsAgo(14) }),
      contact('cspam', { status: 'archived', createdAt: daysAgo(40), updatedAt: daysAgo(15) }),
      contact('creplied', { status: 'replied', createdAt: daysAgo(40), updatedAt: daysAgo(20) }),
    ]);
});

describe('runRetention', () => {
  it('dry run counts but deletes and audits nothing', async () => {
    const r = await runRetention({ dryRun: true, now: NOW });
    expect(r).toMatchObject({
      dryRun: true,
      windows: { enquiryRetentionMonths: 12, spamRetentionDays: 10 },
      quotes: { expired: 1, spam: 1 },
      contacts: { expired: 1, spam: 1 },
    });
    expect((await names()).q).toHaveLength(6);
    expect((await names()).c).toHaveLength(4);
    expect(await db.select().from(auditLogs)).toHaveLength(0);
  });

  it('real run deletes exactly what the dry run counted and audits counts only', async () => {
    const r = await runRetention({ now: NOW });
    expect(r).toMatchObject({ dryRun: false, quotes: { expired: 1, spam: 1 }, contacts: { expired: 1, spam: 1 } });
    expect(await names()).toEqual({
      q: ['qdone', 'qedge', 'qfresh', 'qspamnew'],
      c: ['cfresh', 'creplied'],
    });

    const audit = await db.select().from(auditLogs);
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ action: 'privacy.retention', actorId: null });
    const flat = JSON.stringify(audit[0]);
    expect(flat).not.toMatch(/PRIVATE|example\.com|qold|qspam|cold|cspam/);
    expect(flat).toContain('1 quotes and 1 contact messages');
  });

  it('a second run finds nothing and writes no audit row', async () => {
    await runRetention({ now: NOW });
    await db.execute(sql`truncate table audit_logs`);
    const r = await runRetention({ now: NOW });
    expect(r.quotes).toEqual({ expired: 0, spam: 0 });
    expect(r.contacts).toEqual({ expired: 0, spam: 0 });
    expect(await db.select().from(auditLogs)).toHaveLength(0);
  });

  it('uses the defaults (24 months / 30 days) when privacy was never saved', async () => {
    await db.execute(sql`truncate table settings`);
    const r = await runRetention({ dryRun: true, now: NOW });
    expect(r.windows).toEqual({ enquiryRetentionMonths: 24, spamRetentionDays: 30 });
    // 13/14 months are inside 24; 20/15 days are inside 30.
    expect(r.quotes).toEqual({ expired: 0, spam: 0 });
    expect(r.contacts).toEqual({ expired: 0, spam: 0 });
  });
});
